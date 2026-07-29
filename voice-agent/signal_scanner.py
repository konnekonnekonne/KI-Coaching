"""
Python-Spiegel von lib/signal-scanner.ts -- siehe dort für die Begründung
(deterministischer Scanner, fünf Risikolevel statt binärer Krisenerkennung,
kein LLM-Call). Gleiche Synchronisations-Einschränkung wie system_prompt.py/
models.py: manuell abgleichen, falls sich die Wortlisten ändern.
"""

import re
from dataclasses import dataclass, field

RiskLevel = str  # "keine" | "niedrig" | "mittel" | "hoch" | "akut"

SIGNAL_TERMS: dict[str, list[str]] = {
    "akut": [
        "suizid", "selbstmord", "mich umbringen", "nicht mehr leben",
        "nicht mehr leben wollen", "lieber tot", "selbstverletzung", "ritzen",
        "mir etwas antun", "jemanden verletzen", "jemandem wehtun",
    ],
    "hoch": [
        "missbrauch", "gewalt", "geschlagen", "trauma", "panikattacke",
        "schwere depression", "essstörung", "sucht", "abhängig von",
    ],
    "mittel": [
        "depression", "depressiv", "therapie", "therapeut", "psychotherapie",
        "scheidung", "trennung", "burnout", "angststörung", "antidepressiva",
    ],
    "niedrig": [
        "stress", "überfordert", "überforderung", "konflikt", "trauer",
        "unsicher", "erschöpft", "erschöpfung", "einsam", "einsamkeit",
    ],
}

_LEVEL_ORDER = ["keine", "niedrig", "mittel", "hoch", "akut"]


@dataclass
class SignalScanResult:
    level: RiskLevel
    matched_terms: list[str] = field(default_factory=list)


def _contains_term(text: str, term: str) -> bool:
    # Nur führende Wortgrenze -- siehe lib/signal-scanner.ts für die
    # Begründung (deutsche Komposita wie "Suizidgedanken" wurden mit
    # beidseitiger Wortgrenze nicht erkannt; in Produktion aufgefallen).
    pattern = r"\b" + re.escape(term)
    return re.search(pattern, text, re.IGNORECASE) is not None


def scan_for_signals(text: str) -> SignalScanResult:
    matched: list[str] = []
    highest = "keine"
    for level in ("akut", "hoch", "mittel", "niedrig"):
        for term in SIGNAL_TERMS[level]:
            if _contains_term(text, term):
                matched.append(term)
                if _LEVEL_ORDER.index(level) > _LEVEL_ORDER.index(highest):
                    highest = level
    return SignalScanResult(level=highest, matched_terms=matched)


# Kanonischer Krisen-Antworttext -- deckungsgleich mit lib/signal-scanner.ts.
# Bewusst warm statt buerokratisch formuliert (Revision nach Nutzertest,
# Juli 2026, siehe docs/backlog.md B-05b) -- nicht klinisch gegengelesen,
# offene Anforderung vor Einsatz ausserhalb des Forschungsrahmens.
CRISIS_RESPONSE_TEXT = (
    "Ich höre dich, und das, was du gerade sagst, ist wichtig. Danke, dass du es aussprichst. "
    "Ich bin als KI-Coach nicht der richtige Ort dafür — aber es gibt Menschen, die genau jetzt für dich da sein können. "
    "Die Telefonseelsorge erreichst du rund um die Uhr, kostenlos, unter 0800 111 0 111. Du musst da nicht alleine durch. "
    "Ich pausiere unser Coaching an dieser Stelle — nicht, weil ich dich alleine lasse, sondern weil du gerade mehr brauchst, als ich dir geben kann."
)
