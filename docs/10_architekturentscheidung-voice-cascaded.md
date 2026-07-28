# 10 — Architekturentscheidung: Wechsel zu Cascaded Voice-Architektur

*Dokumentationsstand: Juli 2026 — Status: Entschieden, Implementierung ausstehend*

---

## Zusammenfassung

Die Plattform wechselt von einer nativen Speech-to-Speech-Architektur (OpenAI `gpt-realtime-2`/`2.1`, WebRTC, Ephemeral Key) zu einer **Cascaded-Architektur** (STT → Text/Datenbank → Claude → TTS). Supabase bleibt die Datenbankschicht. Die Planung der Umsetzung beginnt am Einstiegspunkt Account-Erstellung; alle weiteren Schritte (Provider-Wahl für STT/TTS, Turn-Detector, Pipeline-Framework, konkrete Datenflüsse) sind zum Zeitpunkt dieser Entscheidung noch offen und werden in Folgedokumenten behandelt.

Dieses Dokument hält die Ausgangslage, die geprüften Optionen und die Begründung der Entscheidung fest — als Grundlage für das spätere Arbeitskapitel zur technischen Umsetzung in Kapitel 3 der Abschlussarbeit.

---

## Ausgangslage

Die ursprüngliche Voice-Architektur (dokumentiert in [05_voice-architektur.md](05_voice-architektur.md)) nutzte OpenAI `gpt-realtime-2` nativ über WebRTC. Im Betrieb zeigte sich das in [08_kapitel-schweige-problem.md](08_kapitel-schweige-problem.md) ausführlich dokumentierte Problem: Turn-Detection unterbrach den Coachee bei Denkpausen, alle drei getesteten Konfigurationspfade zur Deaktivierung oder Verlangsamung scheiterten. Als Notlösung wurde manuelles Push-to-Talk implementiert (Mikrofon-Button statt automatischer Spracherkennung des Gesprächsendes) — technisch funktional, aber eine UX-Verschlechterung gegenüber dem ursprünglichen Ziel eines freien Gesprächsflusses.

Diese Notlösung war der Stand, an dem die vorherige Explorationsphase endete.

---

## Erneute Prüfung: Was hat sich am Markt verändert?

Mit einigen Wochen Abstand wurde geprüft, ob neuere Modelle das Turn-Taking-Problem lösen:

- **`gpt-realtime-2.1`** (OpenAI, 6. Juli 2026) verbessert Latenz und Semantic-VAD-Verhalten explizit im Bereich Stille-/Pausenerkennung. Zusätzlich zeigte die Recherche, dass der ursprüngliche `unknown_parameter`-Fehler beim Versuch, `turn_detection` zu konfigurieren, möglicherweise auf einem falschen Feldpfad beruhte (`session.turn_detection` statt korrekt `session.audio.input.turn_detection`) — nicht zwingend auf einer echten Modellgrenze.
- Trotzdem bleiben zwei strukturelle Eigenschaften der OpenAI Realtime API unabhängig von der Modellversion bestehen, die für eine Coaching-Plattform mit mehrteiligen, potenziell langen Sessions besonders schwer wiegen:
  1. **Keine native Session-Resumption.** Ein Verbindungsabbruch erzeugt immer eine neue Session; jeglicher modellseitige Kontext geht verloren. Die Anwendung muss Historie selbst persistieren und nach Reconnect erneut einspielen.
  2. **Harter Sessiondeckel von 60 Minuten.** Jede längere Coaching-Session erreicht diesen Deckel zwangsläufig — Reconnect-mit-Kontextverlust ist damit kein Randfall, sondern ein garantiert wiederkehrendes Ereignis.

Diese zwei Eigenschaften gelten unabhängig davon, ob das Turn-Taking-Problem durch `2.1` gelöst wird oder nicht.

---

## Die drei entscheidenden Fragen

Im Rahmen der Diskussion wurden drei Fragen aufgeworfen, die über das reine Turn-Taking-Problem hinausgehen und sich als eigentlich ausschlaggebend erwiesen haben:

1. **Session-Kontinuität:** Behält das Modell historischen Kontext bei einem Abbruch? — Nein, grundsätzlich nicht (siehe oben). Kontinuität ist ausschließlich Aufgabe der Anwendung, nicht des Modells, und zwar unabhängig von der gewählten Speech-Architektur.
2. **U-Modell-Sequenzierung:** Kann die Plattform den Coachee ohne verlässliche Transkripte sequenziell durch die fünf Phasen führen? — Nein. Server-seitiges Phasentracking (Backlog B-05c) setzt einen verlässlichen, vollständigen Text-Datensatz der Session voraus. Ohne ihn schätzt das Modell die Phase weiterhin nur implizit aus dem laufenden Kontext — und verliert dieses implizite Wissen bei jedem erzwungenen Reconnect vollständig.
3. **Visualisierung, Zusammenfassung, Transfer-Vereinbarung:** Ebene 3 der Informationsarchitektur ([07_informationsarchitektur.md](07_informationsarchitektur.md), Feldnotiz-Generierung) benötigt das vollständige Rohtranskript als Eingabe für einen separaten Claude-Meta-Prompt-Call. Kein Speech-to-Speech-Modell liefert das als eingebautes Feature.

**Kernerkenntnis:** Alle drei Fragen sind keine Turn-Taking-Fragen. Sie zeigen, dass die Plattform unabhängig vom Ausgang der Turn-Taking-Diskussion eine lückenlose, latenzarme Text-Transkript-Schicht als Fundament braucht, weil das Modell nachweislich keinen Zustand über eine Verbindungsgrenze hinweg trägt.

---

## Architekturvergleich (Kurzfassung)

| | Speech-to-Speech (bisher) | Cascaded (Entscheidung) |
|---|---|---|
| Transkript | Nebenpfad nötig (Whisper-Workaround für Nutzerseite, mit Latenz und Zuverlässigkeitslücken) | Ist der native Zwischenschritt — kein Nebenpfad nötig |
| Modellwahl | An OpenAI gebunden (Konsistenzlücke zu Claude im Textmodus) | Frei wählbar — Claude einheitlich für Text und Voice möglich |
| Turn-Detection | Blackbox im Modell, historisch schwer/nicht konfigurierbar | Eigener, austauschbarer Baustein (z. B. dedizierte kontextbewusste Turn-Detector-Modelle) |
| Session-Kontinuität | Muss die Anwendung ohnehin selbst lösen (siehe oben) | Gleiche Anforderung, aber Transkript entsteht als Abfallprodukt des normalen Betriebs statt als Zusatzaufwand |
| Paralinguistik (Tonfall, Zögern als Klang) | Bleibt erhalten | Geht beim Transkribieren verloren — dokumentierter Qualitätsverlust |
| Latenz | Niedrigste erreichbare | Höher, aber mit modernen Komponenten deutlich reduzierbar gegenüber früheren Benchmarks |

Der Ausschlag für Cascaded kam nicht primär aus dem Latenz- oder Qualitätsvergleich, sondern aus der Erkenntnis, dass die drei oben genannten Fragen so oder so eine robuste Transkript- und State-Schicht erfordern — und diese bei Cascaded natürlicher Bestandteil der Architektur ist, statt dauerhaft zusätzlich gewartete Infrastruktur obendrauf zu sein.

---

## Entscheidung

1. **Voice-Architektur:** Wechsel zu Cascaded (STT → Text → Claude → TTS).
2. **Datenbank:** Supabase bleibt unverändert die Datenschicht für Profile, Sessions und Nachrichten.
3. **Planungsstart:** Die Neuplanung beginnt am Einstiegspunkt der Nutzerreise — Account-Erstellung — und arbeitet sich von dort schrittweise durch den Coaching-Flow. Dieser Ansatz wurde bewusst gewählt, um die Migration nicht als isolierten Voice-Umbau zu behandeln, sondern als Gelegenheit, den gesamten Ablauf (inkl. der in Backlog B-17 offenen Auftrags-/Consent-UI) konsistent neu zu durchdenken.
4. **Noch offen (bewusst nicht Teil dieser Entscheidung):** Wahl von STT-Anbieter, TTS-Anbieter, Turn-Detector-Komponente und Orchestrierungs-Framework; konkrete Datenflüsse zwischen den neuen Komponenten und der bestehenden `messages`-Tabelle; datenschutzrechtliche Neubewertung, da neue Anbieter andere Datenflüsse als OpenAI erzeugen werden. Diese Punkte werden in gesonderten Diskussionen und Folgedokumenten entschieden.

---

## Einordnung gegenüber dem Schweige-Problem (Kapitel 08)

Diese Entscheidung löst das in [08_kapitel-schweige-problem.md](08_kapitel-schweige-problem.md) beschriebene, feldweite Problem **nicht auf** — sie umgeht es für diese Plattform. Der dort dokumentierte Befund (aktuelle Voice-KI ist strukturell auf Gesprächsfluss optimiert, nicht auf Gesprächsraum) bleibt als Forschungserkenntnis unverändert gültig und bleibt eigenständig zitierfähig. Die Cascaded-Architektur ermöglicht lediglich, einen dedizierten, kontextbewussten Turn-Detector als austauschbare Komponente einzusetzen, statt auf die Turn-Detection-Blackbox eines einzelnen Anbieters angewiesen zu sein — das ist eine architektonische Antwort auf ein Symptom, nicht eine Auflösung des zugrundeliegenden Widerspruchs zwischen Industrieoptimierung auf Gesprächsfluss und coaching-methodischem Bedarf an Gesprächsraum.

---

## Bezug zur Abschlussarbeit

Diese Entscheidung inklusive ihrer Begründung ist zentrales Rohmaterial für das finale Kapitel 3 ("Technische Umsetzung"): Sie zeigt exemplarisch, wie eine zunächst pragmatisch getroffene Architekturentscheidung (Speech-to-Speech, dokumentiert in Kapitel 05) im Licht neuer Anforderungen (Session-Kontinuität, Phasentracking, Feldnotiz-Fähigkeit) revidiert wurde — und wie diese Revision explizit von Anforderungen aus Kapitel 2 der Arbeit (Prozessqualität, Datenarchitektur) und nicht von reiner Modellverfügbarkeit getrieben ist.
