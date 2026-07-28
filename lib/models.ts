/**
 * Zentrale Modellkonfiguration — ein Ort für alle Claude-Modellwahlen.
 *
 * Text- und Voice-Hauptagent teilen sich COACHING_MODEL bewusst (siehe
 * docs/10_architekturentscheidung-voice-cascaded.md) — ein späterer Wechsel
 * z. B. auf Opus ist damit eine Ein-Zeilen-Änderung, die beide Modi
 * gleichzeitig betrifft, statt sie wieder auseinanderlaufen zu lassen.
 */

export const COACHING_MODEL = 'claude-sonnet-5'
export const SUPPORT_MODEL = 'claude-haiku-4-5-20251001'
export const CONSISTENCY_MODEL = 'claude-sonnet-5'
