"""
Python-Spiegel von lib/models.ts — siehe dort für die Begründung
(ein Ort für die Modellwahl, damit ein Wechsel Text+Voice gleichzeitig betrifft).
Gleiche Synchronisations-Einschränkung wie system_prompt.py: manuell abgleichen.
"""

COACHING_MODEL = "claude-sonnet-5"
SUPPORT_MODEL = "claude-haiku-4-5-20251001"
CONSISTENCY_MODEL = "claude-sonnet-5"

# Vom Nutzer im Deepgram-Playground ausgewählt (Aura-2, Deutsch).
VOICE_WEIBLICH = "aura-2-aurelia-de"
VOICE_MAENNLICH = "aura-2-fabian-de"
