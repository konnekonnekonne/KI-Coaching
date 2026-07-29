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
 * auszuführen. Inhaltlich an die MIND-SAFE-Instruktion im Systemprompt
 * (lib/system-prompt.ts) angelehnt, aber hier fest verdrahtet, damit sie
 * unabhängig vom Modellverhalten garantiert ausgeliefert wird.
 *
 * Bewusst warm statt bürokratisch formuliert (Revision nach Nutzertest,
 * Juli 2026, siehe docs/backlog.md B-05b): Die erste Fassung wirkte wie eine
 * automatisierte Zurückweisung genau in dem Moment, in dem sich jemand
 * verletzlich zeigt — das ist real erlebbar bei einem Fehlalarm des
 * Wortlisten-Scanners genauso wie bei einer echten Krise. Diese Formulierung
 * wurde nicht klinisch/fachlich gegengelesen — das bleibt eine offene
 * Anforderung, bevor die Plattform über den geschlossenen Forschungsrahmen
 * hinausgeht.
 */
export const CRISIS_RESPONSE_TEXT =
  'Ich höre dich, und das, was du gerade sagst, ist wichtig. Danke, dass du es aussprichst. ' +
  'Ich bin als KI-Coach nicht der richtige Ort dafür — aber es gibt Menschen, die genau jetzt für dich da sein können. ' +
  'Die Telefonseelsorge erreichst du rund um die Uhr, kostenlos, unter 0800 111 0 111. Du musst da nicht alleine durch. ' +
  'Ich pausiere unser Coaching an dieser Stelle — nicht, weil ich dich alleine lasse, sondern weil du gerade mehr brauchst, als ich dir geben kann.'

const LEVEL_ORDER: RiskLevel[] = ['keine', 'niedrig', 'mittel', 'hoch', 'akut']

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function containsTerm(text: string, term: string): boolean {
  // Nur führende Wortgrenze, keine nachfolgende: deutsche Komposita hängen
  // Suffixe direkt an ("Suizidgedanken", "Selbstmordabsicht") — ein
  // \bterm\b-Muster verpasst diese Fälle vollständig (in Produktion
  // gefunden: "Suizidgedanken" wurde nicht erkannt). Die führende Grenze
  // bleibt wichtig, damit z.B. "sucht" nicht in "versucht"/"besuchte"
  // anschlägt. Verbleibende Lücke: Komposita, in denen der Begriff als
  // Suffix auftritt (z.B. "Erschöpfungsdepression"), werden weiterhin nicht
  // erkannt — siehe Datei-Kommentar zum vorläufigen Charakter der Liste.
  const pattern = new RegExp(`\\b${escapeRegExp(term)}`, 'i')
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
