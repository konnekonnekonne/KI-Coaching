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

/**
 * Erweiterung von B-23 (29./30. Juli 2026): manche Anker soll nicht KICO im
 * Namen des Coachee formulieren, sondern der Coachee selbst schreiben --
 * allen voran die Coachingfrage (siehe docs/rahmen.md, AZF). request_anchor_input
 * legt eine "offene Karte" an (value=null, awaiting_input=true); die UI zeigt
 * an dieser Stelle ein Eingabefeld statt eines fertigen Werts. KICO hört die
 * Antwort weiterhin ganz normal über den Gesprächskanal mit (Text/Sprache) --
 * dieses Tool blockiert das Gespräch nicht, es schafft nur den persistenten,
 * selbst-verfassten Anker zusätzlich zum laufenden Dialog.
 */
export const REQUEST_ANCHOR_INPUT_TOOL = {
  name: 'request_anchor_input',
  description:
    'Öffnet eine leere, persistente Karte, die der COACHEE SELBST mit eigenem Text füllt -- ' +
    'im Unterschied zu set_anchor, wo KICO den Wert vorgibt. Nutze dies, wenn es methodisch ' +
    'wichtig ist, dass der Coachee etwas in den eigenen Worten festhält (z. B. die ' +
    'Coachingfrage), statt dass KICO es für ihn paraphrasiert. Das Gespräch läuft normal ' +
    'weiter -- warte nicht auf das Ausfüllen der Karte, bevor du fortfährst.',
  input_schema: {
    type: 'object' as const,
    properties: {
      key: {
        type: 'string',
        description: "Stabiler Bezeichner, z. B. 'coaching_question'.",
      },
      label: {
        type: 'string',
        description: 'Kurzer, für den Coachee verständlicher Anzeigename, z. B. "Deine Coachingfrage".',
      },
      prompt: {
        type: 'string',
        description:
          'Konkrete Aufforderung an den Coachee, angezeigt über dem Eingabefeld, z. B. ' +
          '"Schreib deine Frage für heute in einem Satz auf."',
      },
    },
    required: ['key', 'label', 'prompt'],
  },
}

export interface RequestAnchorInputToolInput {
  key: string
  label: string
  prompt: string
}
