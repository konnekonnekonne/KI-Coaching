"""
Workaround fuer Pipecat-Issue #4992 (offen seit 09.07.2026, Stand pipecat-ai 1.6.0):
https://github.com/pipecat-ai/pipecat/issues/4992

AnthropicLLMService sendet unconditional den Beta-Header
"interleaved-thinking-2025-05-14" (siehe services/anthropic/llm.py), auch
ohne dass thinking explizit angefordert wird. Claude Sonnet 5 kann dabei
"thought"-Bloecke mit leerem text und/oder fehlender signature liefern.
Pipecats Adapter (_from_anthropic_specific_message) reicht solche
Bloecke unveraendert als rohes Dict ohne "role"-Feld weiter -- das crasht
beim naechsten API-Call mit `KeyError: 'role'` (empirisch bestaetigt: nach
zwei Gespraechswechseln im Live-Test, siehe docs/11).

Kein Konfigurationsflag verfuegbar, um den Beta-Header zu unterdruecken --
daher dieser Preprocessing-Filter, exakt wie im Issue vorgeschlagen.
"""

from pipecat.adapters.services.anthropic_adapter import AnthropicLLMAdapter
from pipecat.processors.aggregators.llm_context import LLMSpecificMessage
from pipecat.services.anthropic.llm import AnthropicLLMService


def _is_malformed_thought(message) -> bool:
    if not isinstance(message, LLMSpecificMessage):
        return False
    msg = message.message
    if not isinstance(msg, dict) or msg.get("type") != "thought":
        return False
    return not msg.get("text") or not msg.get("signature")


class SafeAnthropicLLMAdapter(AnthropicLLMAdapter):
    def _from_universal_context_messages(self, universal_context_messages, *, system_instruction=None):
        filtered = [m for m in universal_context_messages if not _is_malformed_thought(m)]
        return super()._from_universal_context_messages(
            filtered, system_instruction=system_instruction
        )


class SafeAnthropicLLMService(AnthropicLLMService):
    """Drop-in-Ersatz fuer AnthropicLLMService mit obigem Filter."""

    adapter_class = SafeAnthropicLLMAdapter
