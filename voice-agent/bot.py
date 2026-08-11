#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

"""kico-voice-agent - KICO Voice-Agent (Cascaded: Deepgram STT -> Claude Sonnet -> Deepgram TTS)

Basiert auf dem von `pipecat init` erzeugten Grundgerüst, gegen die tatsächlich
installierte pipecat-ai-Version (1.6.0) verifiziert. Deckt Task 5 ab
(STT/TTS/Hauptagent) -- die Parallel-Agents (Sentiment, Konsistenzcheck,
QN-Selbstprüfung, Signal-Scanner) folgen in Task 6.

Erforderliche Secrets (liegen im Pipecat-Cloud Secret-Set "kico"):
- DEEPGRAM_API_KEY, DEEPGRAM_VOICE_ID
- ANTHROPIC_API_KEY
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Run: uv run bot.py
"""

import asyncio
import os

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import Frame, LLMRunFrame, TextFrame, TTSSpeakFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.services.llm_service import FunctionCallParams
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.transports.base_transport import BaseTransport
from pipecat.transports.daily.transport import DailyParams
from pipecat.transcriptions.language import Language
from pipecat.workers.runner import WorkerRunner

from system_prompt import SYSTEM_PROMPT
from models import COACHING_MODEL, VOICE_WEIBLICH, VOICE_MAENNLICH
from supabase_client import write_message, upsert_anchor, request_anchor_input
from anthropic_fix import SafeAnthropicLLMService
from signal_scanner import scan_for_signals, CRISIS_RESPONSE_TEXT

load_dotenv(override=True)

# Deepgram EU-Endpoint -- schliesst einen Teil der DSGVO-Luecke aus B-11
# (siehe docs/10_architekturentscheidung-voice-cascaded.md). Verifiziert:
# base_url ist ein echter Konstruktorparameter in der installierten Version.
DEEPGRAM_EU_STT_URL = "api.eu.deepgram.com"
DEEPGRAM_EU_TTS_URL = "wss://api.eu.deepgram.com"

# Kern des Architekturwechsels zu Cascaded (siehe
# docs/10_architekturentscheidung-voice-cascaded.md): stop_secs ist bei
# Silero VAD frei konfigurierbar, anders als bei OpenAIs Speech-to-Speech
# (dort fuehrte genau dieser fehlende Zugriff zum "Schweige-Problem",
# docs/08_kapitel-schweige-problem.md). Standard waere 0.2s -- viel zu kurz
# fuer Denkpausen im Coaching. Startwert 2.0s, im Betrieb nachzujustieren.
COACHING_VAD_STOP_SECS = 2.0


class TranscriptWriter(FrameProcessor):
    """Schreibt jede vorbeifliessende Text-Aeusserung nach Supabase, in
    dieselbe messages-Tabelle wie der Textmodus. Zweimal in der Pipeline
    platziert (nach STT fuer die Nutzer-Seite, nach dem LLM fuer KICOs
    Antworten), weil jede Instanz nur die Frames sieht, die an ihrer Position
    vorbeikommen.

    Fuer role="user" zusaetzlich deterministischer Krisen-Pre-Filter (B-05b,
    docs/backlog.md): bei "akut" wird der Frame NICHT weitergereicht (das LLM
    bekommt diesen Turn nie zu sehen). Die Reaktion selbst wird NICHT sofort
    gesprochen -- ein Nutzertest zeigte, dass sofortiges Antworten sich wie
    Dazwischenreden anfuehlt, wenn der Coachee nach einer normalen VAD-Pause
    (2s) eigentlich noch weitersprechen wollte. Stattdessen wartet
    CRISIS_GRACE_SECS zusaetzlich; jede weitere Aeusserung waehrend dieser
    Wartezeit wird angehaengt und die Wartezeit neu gestartet, statt zu
    unterbrechen. Der Trigger selbst bleibt hart: einmal erkannt, wird immer
    reagiert, auch wenn der Coachee danach abwiegelt (bewusst so, siehe
    docs/backlog.md B-05b -- ein "ist schon okay" direkt nach einer
    Krisenaeusserung ist selbst ein bekanntes Risikomuster)."""

    CRISIS_GRACE_SECS = 4.0

    def __init__(self, session_id: str, user_id: str, role: str):
        super().__init__()
        self.session_id = session_id
        self.user_id = user_id
        self.role = role
        self._pending_crisis_timer: asyncio.Task | None = None

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        if isinstance(frame, TextFrame) and frame.text.strip():
            if self.role == "user":
                signal = scan_for_signals(frame.text)
                write_message(
                    self.session_id, self.user_id, self.role, frame.text,
                    risk_level=signal.level, risk_terms=signal.matched_terms,
                )
                if signal.level == "akut" or self._pending_crisis_timer is not None:
                    if self._pending_crisis_timer is not None:
                        self._pending_crisis_timer.cancel()
                    self._pending_crisis_timer = asyncio.create_task(
                        self._deliver_crisis_response(direction)
                    )
                    return  # Original-Frame nicht weiterreichen -- kein LLM-Call fuer diesen Turn
            else:
                write_message(self.session_id, self.user_id, self.role, frame.text)

        await self.push_frame(frame, direction)

    async def _deliver_crisis_response(self, direction: FrameDirection) -> None:
        try:
            await asyncio.sleep(self.CRISIS_GRACE_SECS)
        except asyncio.CancelledError:
            return  # Coachee hat weitergesprochen -- neuer Timer laeuft bereits
        self._pending_crisis_timer = None
        write_message(self.session_id, self.user_id, "assistant", CRISIS_RESPONSE_TEXT)
        await self.push_frame(
            TTSSpeakFrame(text=CRISIS_RESPONSE_TEXT, append_to_context=False),
            direction,
        )


# Session-Umgebung (B-23, docs/backlog.md): set_anchor-Tool, identisch zu
# lib/anchors.ts fuer den Textmodus -- funktioniert hier ueber Pipecats
# native Function-Calling-Unterstuetzung (register_function), die den
# Tool-Result-Roundtrip automatisch uebernimmt.
SET_ANCHOR_SCHEMA = FunctionSchema(
    name="set_anchor",
    description=(
        "Speichert einen wichtigen Wert als persistenten, fuer den Coachee sichtbaren Anker "
        "fuer den Rest der Session -- z. B. die Coachingfrage, einen Skalierungswert, oder ein "
        "Ergebnis aus einem Methodenwerkzeug (z. B. Bodenanker). Rufe dieses Tool auf, sobald "
        "ein solcher Wert im Gespraech klar geworden ist. Wiederholtes Aufrufen mit demselben "
        "key aktualisiert den bestehenden Anker."
    ),
    properties={
        "key": {
            "type": "string",
            "description": "Stabiler Bezeichner, z. B. 'coaching_question', 'scaling_ziel'.",
        },
        "label": {
            "type": "string",
            "description": 'Kurzer, fuer den Coachee verstaendlicher Anzeigename, z. B. "Deine Coachingfrage".',
        },
        "kind": {
            "type": "string",
            "enum": ["text", "number", "list", "checkbox"],
            "description": "Datentyp des Werts.",
        },
        "value": {"description": "Der eigentliche Wert -- String, Zahl, Liste oder Boolean."},
    },
    required=["key", "label", "kind", "value"],
)


def make_set_anchor_handler(session_id: str, user_id: str):
    async def handle_set_anchor(params: FunctionCallParams) -> None:
        args = params.arguments
        upsert_anchor(
            session_id, user_id,
            key=args["key"], label=args["label"], kind=args["kind"], value=args["value"],
        )
        await params.result_callback({"status": "gespeichert"})

    return handle_set_anchor


# Erweiterung von B-23 (29./30. Juli 2026): manche Anker soll der COACHEE
# selbst schreiben statt KICO -- allen voran die Coachingfrage (siehe
# docs/rahmen.md, AZF). Identisch zu REQUEST_ANCHOR_INPUT_TOOL in
# lib/anchors.ts. Der Handler kehrt sofort zurueck (kein Warten auf die
# Coachee-Eingabe) -- das Gespraech laeuft ueber den normalen Audio-Kanal
# unveraendert weiter, siehe docs/backlog.md B-23 fuer die bewusste Grenze:
# die getippte Antwort selbst fliesst hier (noch) nicht live in den
# laufenden LLM-Kontext zurueck, nur die Karte persistiert korrekt.
REQUEST_ANCHOR_INPUT_SCHEMA = FunctionSchema(
    name="request_anchor_input",
    description=(
        "Oeffnet eine leere, persistente Karte, die der COACHEE SELBST mit eigenem Text "
        "fuellt -- im Unterschied zu set_anchor, wo KICO den Wert vorgibt. Nutze dies, wenn "
        "es methodisch wichtig ist, dass der Coachee etwas in eigenen Worten festhaelt (z. B. "
        "die Coachingfrage), statt dass KICO es fuer ihn paraphrasiert. Das Gespraech laeuft "
        "normal weiter -- warte nicht auf das Ausfuellen der Karte, bevor du fortfaehrst."
    ),
    properties={
        "key": {
            "type": "string",
            "description": "Stabiler Bezeichner, z. B. 'coaching_question'.",
        },
        "label": {
            "type": "string",
            "description": 'Kurzer, fuer den Coachee verstaendlicher Anzeigename, z. B. "Deine Coachingfrage".',
        },
        "prompt": {
            "type": "string",
            "description": (
                "Konkrete Aufforderung an den Coachee, angezeigt ueber dem Eingabefeld, z. B. "
                '"Schreib deine Frage fuer heute in einem Satz auf."'
            ),
        },
    },
    required=["key", "label", "prompt"],
)


def make_request_anchor_input_handler(session_id: str, user_id: str):
    async def handle_request_anchor_input(params: FunctionCallParams) -> None:
        args = params.arguments
        request_anchor_input(
            session_id, user_id,
            key=args["key"], label=args["label"], prompt=args["prompt"],
        )
        await params.result_callback({"status": "Eingabekarte geoeffnet"})

    return handle_request_anchor_input


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments) -> None:
    """Baut und startet die Pipeline fuer eine einzelne Voice-Session.

    session_id/user_id kommen als Custom-Data im Request-Body, den unser
    Next.js-Server beim Start der Session mitschickt (Task 8).
    """
    logger.info("Starting KICO voice bot")

    body = runner_args.body or {}
    session_id = body.get("session_id")
    user_id = body.get("user_id")
    if not session_id or not user_id:
        raise ValueError("session_id und user_id muessen beim Sessionstart mitgegeben werden")

    # Stimmwahl kommt aus profiles.voice_gender, vom Next.js-Server beim
    # Sessionstart mitgegeben (Task 8). Default "weiblich", falls nicht gesetzt.
    voice_gender = body.get("voice_gender", "weiblich")
    voice_id = VOICE_MAENNLICH if voice_gender == "maennlich" else VOICE_WEIBLICH

    stt = DeepgramSTTService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        base_url=DEEPGRAM_EU_STT_URL,
        settings=DeepgramSTTService.Settings(language=Language.DE, model="nova-3"),
    )

    tts = DeepgramTTSService(
        api_key=os.getenv("DEEPGRAM_API_KEY"),
        base_url=DEEPGRAM_EU_TTS_URL,
        settings=DeepgramTTSService.Settings(
            voice=voice_id,
            language=Language.DE,
        ),
    )

    llm = SafeAnthropicLLMService(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        settings=SafeAnthropicLLMService.Settings(
            model=COACHING_MODEL,
            system_instruction=SYSTEM_PROMPT,
            # Ohne Caching wird der komplette Systemprompt (~4k Tokens seit dem
            # Ausbau um Methodenkorpus/Rahmenmaterial) bei JEDEM Call neu
            # prozessiert -- inklusive der ersten Begruessung. Live-Test
            # 30. Juli 2026 zeigte spuerbare Verzoegerung schon vor dem ersten
            # Wort und wachsend ueber die Session. enable_prompt_caching laesst
            # Anthropic den statischen Anteil (System-Prompt, aeltere Historie)
            # serverseitig cachen.
            enable_prompt_caching=True,
        ),
    )
    llm.register_function("set_anchor", make_set_anchor_handler(session_id, user_id))
    llm.register_function(
        "request_anchor_input", make_request_anchor_input_handler(session_id, user_id)
    )

    context = LLMContext(tools=[SET_ANCHOR_SCHEMA, REQUEST_ANCHOR_INPUT_SCHEMA])
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(
            vad_analyzer=SileroVADAnalyzer(
                params=VADParams(stop_secs=COACHING_VAD_STOP_SECS)
            )
        ),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            TranscriptWriter(session_id, user_id, role="user"),
            user_aggregator,
            llm,
            TranscriptWriter(session_id, user_id, role="assistant"),
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        observers=[],
    )

    @worker.rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        # KICO eroeffnet das Gespraech proaktiv -- passend zur Begruessung
        # im Textmodus (app/api/chat/route.ts, isGreeting).
        context.add_message(
            {"role": "developer", "content": "Bitte eröffne das Gespräch."}
        )
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_connected")
    async def on_client_connected(transport, client):
        logger.info(f"Client connected: session={session_id}")

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(transport, client):
        logger.info("Client disconnected")
        await worker.cancel()

    runner = WorkerRunner(handle_sigint=False)
    await runner.add_workers(worker)
    await runner.run()


async def bot(runner_args: RunnerArguments):
    """Haupt-Einstiegspunkt, den Pipecat Clouds Runner beim Sessionstart aufruft."""
    transport_params = {
        "daily": lambda: DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
    }
    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)


if __name__ == "__main__":
    from pipecat.runner.run import main

    main()
