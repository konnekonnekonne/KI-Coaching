/**
 * Deterministischer Signal-Scanner — kein LLM-Call, reine Wortlisten-Logik.
 *
 * Ersetzt die binäre Krisenerkennung (Krise/keine Krise) durch die in
 * Kapitel 3 (Fassung B) der Abschlussarbeit beschriebenen fünf Risikolevel.
 * Läuft vor jedem Hauptagent-Call auf der User-Nachricht (siehe
 * docs/10_architekturentscheidung-voice-cascaded.md, Agent 2).
 *
 * Diese Wortlisten sind ein erster Arbeitsstand, kein klinisch geprüfter
 * Katalog — sie sollten vor produktivem Einsatz fachlich gegengelesen
 * werden (vgl. Backlog). "akut" deckt sich bewusst mit den im Systemprompt
 * (MIND-SAFE) bereits verwendeten Krisenbegriffen.
 */

export type RiskLevel = 'keine' | 'niedrig' | 'mittel' | 'hoch' | 'akut'

const SIGNAL_TERMS: Record<Exclude<RiskLevel, 'keine'>, string[]> = {
  akut: [
    'suizid', 'selbstmord', 'mich umbringen', 'nicht mehr leben',
    'nicht mehr leben wollen', 'lieber tot', 'selbstverletzung', 'ritzen',
    'mir etwas antun', 'jemanden verletzen', 'jemandem wehtun',
  ],
  hoch: [
    'missbrauch', 'gewalt', 'geschlagen', 'trauma', 'panikattacke',
    'schwere depression', 'essstörung', 'sucht', 'abhängig von',
  ],
  mittel: [
    'depression', 'depressiv', 'therapie', 'therapeut', 'psychotherapie',
    'scheidung', 'trennung', 'burnout', 'angststörung', 'antidepressiva',
  ],
  niedrig: [
    'stress', 'überfordert', 'überforderung', 'konflikt', 'trauer',
    'unsicher', 'erschöpft', 'erschöpfung', 'einsam', 'einsamkeit',
  ],
}

export interface SignalScanResult {
  level: RiskLevel
  matchedTerms: string[]
}

/**
 * Kanonischer Krisen-Antworttext (B-05b) — wird zurückgegeben, wenn der
 * deterministische Pre-Filter "akut" meldet, statt einen LLM-Call
 * auszuführen. Inhaltlich deckungsgleich mit der MIND-SAFE-Instruktion im
 * Systemprompt (lib/system-prompt.ts), aber hier fest verdrahtet, damit sie
 * unabhängig vom Modellverhalten garantiert ausgeliefert wird.
 */
export const CRISIS_RESPONSE_TEXT =
  'Was du gerade beschreibst, klingt sehr ernst — und das nehme ich ernst. ' +
  'Ich bin dafür nicht der richtige Ansprechpartner. Bitte wende dich jetzt an Menschen, ' +
  'die dir wirklich helfen können: Die Telefonseelsorge ist kostenlos und rund um die Uhr erreichbar ' +
  'unter 0800 111 0 111. Diese Session endet hier.'

const LEVEL_ORDER: RiskLevel[] = ['keine', 'niedrig', 'mittel', 'hoch', 'akut']

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTerm(text: string, term: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i')
  return pattern.test(text)
}

export function scanForSignals(text: string): SignalScanResult {
  const matchedTerms: string[] = []
  let highestLevel: RiskLevel = 'keine'

  for (const level of (['akut', 'hoch', 'mittel', 'niedrig'] as const)) {
    for (const term of SIGNAL_TERMS[level]) {
      if (containsTerm(text, term)) {
        matchedTerms.push(term)
        if (LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(highestLevel)) {
          highestLevel = level
        }
      }
    }
  }

  return { level: highestLevel, matchedTerms }
}
