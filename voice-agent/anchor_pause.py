"""
Pause-Mechanismus fuer offene Anker-Karten (request_anchor_input) im
Voice-Modus (30. Juli 2026, siehe docs/backlog.md B-23).

Hintergrund: Bittet KICO den Coachee, etwas selbst schriftlich festzuhalten
(allen voran die Coachingfrage), darf KICO nicht einfach mit der naechsten
inhaltlichen Frage weitermachen -- das nimmt dem Coachee die Zeit zum
Formulieren und untergraebt die eigentliche methodische Absicht (Prozess-
statt Inhaltsverantwortung, siehe docs/03_systemprompt.md, Abschnitt
"Aktivierende Coachingfrage"). Anders als beim Krisenfilter (B-05b) ist die
Unterscheidung zwischen "lautes Formulieren" und "richtet sich an mich"
keine Wortlisten-Frage, sondern eine Bedeutungsfrage -- dafuer reicht ein
deterministischer Filter nicht, es braucht ein schnelles, guenstiges
Modellurteil.

Kein Timeout: Auf ausdruecklichen Wunsch (Konversation 30. Juli 2026) gibt es
bewusst KEINEN automatischen Ausstieg, der KICO die Formulierung fuer den
Coachee uebernehmen liesse -- das widerspraeche demselben Prinzip. Die Pause
haelt an, bis die Karte tatsaechlich abgeschickt wird (siehe
supabase_client.watch_anchor_submissions fuer die Realtime-Bridge dazu).
"""

import anthropic

from models import SUPPORT_MODEL

_anthropic_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic()
    return _anthropic_client


class AnchorPauseState:
    """Haelt fest, ob gerade eine Anker-Karte auf das Abschicken wartet.
    Eine Instanz pro Session, geteilt zwischen dem request_anchor_input-
    Tool-Handler (setzt die Pause), dem TranscriptWriter der Nutzer-Seite
    (prueft/gated Aeusserungen waehrend der Pause) und dem Realtime-Watcher
    (hebt die Pause auf, sobald wirklich abgeschickt wurde)."""

    def __init__(self) -> None:
        self.paused_key: str | None = None
        self.label: str | None = None

    def pause(self, key: str, label: str) -> None:
        self.paused_key = key
        self.label = label

    def resume(self, key: str) -> None:
        if self.paused_key == key:
            self.paused_key = None
            self.label = None

    @property
    def is_paused(self) -> bool:
        return self.paused_key is not None


async def is_addressed_to_coach(text: str) -> bool:
    """Schnelle Klassifikation per Haiku: Ist die Aeusserung eine direkt an
    den Coach gerichtete Frage/Aussage, oder lautes Nachdenken/Formulieren
    fuer die schriftliche Antwort? Bewusst knapp gehalten (max_tokens=5) --
    laeuft waehrend einer ohnehin schon wartenden Pause und darf selbst
    keine spuerbare Zusatzverzoegerung erzeugen."""
    response = await _get_client().messages.create(
        model=SUPPORT_MODEL,
        max_tokens=5,
        messages=[
            {
                "role": "user",
                "content": (
                    "Ein Coachee soll gerade schriftlich eine Frage formulieren und denkt dabei "
                    "eventuell laut nach. Ist die folgende Äußerung eine direkt an den Coach "
                    "gerichtete Frage oder Aussage -- oder eher lautes Nachdenken/Ausprobieren "
                    "von Formulierungen? Antworte NUR mit einem Wort: 'adressiert' oder "
                    "'nachdenken'.\n\n"
                    f'Äußerung: "{text}"'
                ),
            }
        ],
    )
    answer = "".join(
        block.text for block in response.content if hasattr(block, "text")
    ).strip().lower()
    return "adressiert" in answer
