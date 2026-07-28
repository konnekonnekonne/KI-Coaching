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

import os

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.frames.frames import Frame, LLMRunFrame, TextFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.anthropic.llm import AnthropicLLMService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.deepgram.tts import DeepgramTTSService
from pipecat.transports.base_transport import BaseTransport
from pipecat.transports.daily.transport import DailyParams
from pipecat.transcriptions.language import Language
from pipecat.workers.runner import WorkerRunner

from system_prompt import SYSTEM_PROMPT
from models import COACHING_MODEL, VOICE_WEIBLICH, VOICE_MAENNLICH
from supabase_client import write_message

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
    dieselbe messages-Tabelle wie der Textmodus. Reines Beobachten -- laesst
    alle Frames unveraendert durch. Zweimal in der Pipeline platziert (nach
    STT fuer die Nutzer-Seite, nach dem LLM fuer KICOs Antworten), weil jede
    Instanz nur die Frames sieht, die an ihrer Position vorbeikommen."""

    def __init__(self, session_id: str, user_id: str, role: str):
        super().__init__()
        self.session_id = session_id
        self.user_id = user_id
        self.role = role

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if isinstance(frame, TextFrame) and frame.text.strip():
            write_message(self.session_id, self.user_id, self.role, frame.text)
        await self.push_frame(frame, direction)


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

    llm = AnthropicLLMService(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
        settings=AnthropicLLMService.Settings(
            model=COACHING_MODEL,
            system_instruction=SYSTEM_PROMPT,
        ),
    )

    context = LLMContext()
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
