/**
 * Session-Umgebung (B-23): persistente Anker, die unabhängig vom Modus
 * (Text/Voice) sichtbar bleiben — Coachingfrage, Skalierungswerte,
 * Tool-Artefakte (z. B. Bodenanker). Siehe docs/backlog.md B-23.
 *
 * Mechanismus: natives Anthropic Tool-Use. KICO ruft set_anchor auf, wenn es
 * einen Wert erfasst hat, der als Anker persistiert werden soll. Funktioniert
 * identisch in Text- und Voice-Modus, weil es auf Ebene des Anthropic-
 * Gesprächs passiert, nicht auf der UI-Transportschicht.
 */

export const SET_ANCHOR_TOOL = {
  name: 'set_anchor',
  description:
    'Speichert einen wichtigen Wert als persistenten, für den Coachee sichtbaren Anker ' +
    'für den Rest der Session — z. B. die Coachingfrage, einen Skalierungswert, oder ein ' +
    'Ergebnis aus einem Methodenwerkzeug (z. B. Bodenanker). Rufe dieses Tool auf, sobald ' +
    'ein solcher Wert im Gespräch klar geworden ist. Wiederholtes Aufrufen mit demselben key ' +
    'aktualisiert den bestehenden Anker.',
  input_schema: {
    type: 'object' as const,
    properties: {
      key: {
        type: 'string',
        description:
          "Stabiler Bezeichner, z. B. 'coaching_question', 'scaling_ziel', 'bodenanker_1'.",
      },
      label: {
        type: 'string',
        description: 'Kurzer, für den Coachee verständlicher Anzeigename, z. B. "Deine Coachingfrage".',
      },
      kind: {
        type: 'string',
        enum: ['text', 'number', 'list', 'checkbox'],
        description: 'Datentyp des Werts.',
      },
      value: {
        description: 'Der eigentliche Wert — String, Zahl, Liste oder Boolean, passend zu kind.',
      },
    },
    required: ['key', 'label', 'kind', 'value'],
  },
}

export interface AnchorToolInput {
  key: string
  label: string
  kind: 'text' | 'number' | 'list' | 'checkbox'
  value: unknown
}
