# KICO — Technische Dokumentation

*Begleitdokumentation zur wissenschaftlichen Abschlussarbeit über KI-gestütztes Coaching*

---

## Zweck dieses Dokuments

Diese Dokumentation beschreibt den Aufbau der KICO-Plattform (KI-Coach) als technischen Anhang zur Abschlussarbeit „KI-gestütztes systemisches Coaching". Sie richtet sich an Leserinnen und Leser mit technischem Grundverständnis und soll nachvollziehbar machen, wie die in der Arbeit beschriebenen Architekturprinzipien in eine lauffähige Software übersetzt wurden.

Die Dokumentation wächst iterativ mit der Plattform und spiegelt den tatsächlichen Bauprozess wider — einschließlich Entscheidungen, Abwägungen und Korrekturen.

---

## Kapitelstruktur

| Datei | Inhalt |
|-------|--------|
| [01_architektur.md](01_architektur.md) | Systemarchitektur, Tech-Stack, Begründung der Technologieauswahl |
| [02_datenbankschema.md](02_datenbankschema.md) | Supabase-Schema, Tabellen, Row Level Security |
| [03_systemprompt.md](03_systemprompt.md) | Aufbau und Begründung des KICO-Systemprompts |
| [04_design-system.md](04_design-system.md) | Design-Tokens, Typografie, Komponenten-API |
| [05_voice-architektur.md](05_voice-architektur.md) | Voice-Implementierung: WebRTC, Realtime API, Entscheidungslog |
| [06_deployment.md](06_deployment.md) | Netlify-Deployment, Umgebungsvariablen, CI/CD |
| [07_informationsarchitektur.md](07_informationsarchitektur.md) | Verarbeitungsebenen: Live-Reaktion, Rohtranskript, Feldnotiz, Memory-Injektion |
| [08_kapitel-schweige-problem.md](08_kapitel-schweige-problem.md) | Gesprächsrhythmik als methodologischer Widerspruch (Voice-KI vs. systemisches Coaching) |
| [09_anforderungsabgleich.md](09_anforderungsabgleich.md) | Abgleich Anforderungskatalog (Kapitel 2 Abschlussarbeit) vs. Umsetzungsstand — Vorarbeit für Kapitel 3 |
| [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md) | Entscheidung: Wechsel von Speech-to-Speech zu Cascaded Voice-Architektur — Kontext und Begründung |
| [11_voice-cascaded-umsetzung.md](11_voice-cascaded-umsetzung.md) | Umsetzung der Cascaded-Architektur: Agenten-Map, technische Stolpersteine, Betriebsdetails, offene Punkte |
| [tools.md](tools.md) | Methodenkorpus: ~30 INA-CCW-Werkzeuge mit Prinzip, Trigger, Kernprozess, U-Modell-Phase, Visualisierungstyp |
| [rahmen.md](rahmen.md) | Sessioneinstieg, Auftragsklärung, Coachingfrage, Rolle des Coachs — Rahmenmaterial aus dem INA-CCW-Curriculum |
| [backlog.md](backlog.md) | Laufende Aufgabenliste: offene Lücken, Priorisierung, Status je Punkt |

---

## Projekteckdaten

| Merkmal | Wert |
|---------|------|
| Plattformname | KICO (KI-Coach) |
| Domain | kico.pro |
| Repository | github.com/konnekonnekonne/KI-Coaching |
| Methodische Grundlage | INA CCW-Curriculum (ECA-zertifiziert) |
| KI-Modell Text & Voice | Anthropic Claude (claude-sonnet-5), einheitlich für beide Modi seit der Cascaded-Migration |
| Voice-Architektur | Cascaded: Deepgram STT/TTS (EU-Endpoint) → Claude → Deepgram TTS, gehostet auf Pipecat Cloud (Region eu-central/Frankfurt). Siehe [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md) und [11_voice-cascaded-umsetzung.md](11_voice-cascaded-umsetzung.md) |
| Zielgruppe | Einzelpersonen im beruflichen Kontext (Forschungsrahmen) |
| Sprache der Plattform | Deutsch |
| Dokumentationsstand | 30. Juli 2026 |

---

## Bauweise

Die Plattform wurde von Henrike Thomsen und Konstantin Escher in direkter Zusammenarbeit mit Claude (Anthropic) entwickelt. Alle Architekturentscheidungen wurden gemeinsam besprochen und dokumentiert. Der Quellcode ist im Repository öffentlich einsehbar und spiegelt die in dieser Dokumentation beschriebenen Prinzipien direkt wider.

---

## Dokumentationsstandard

Jede relevante technische Entscheidung wird dokumentiert. Dieser Standard gilt verbindlich für die gesamte Entwicklung.

**Was dokumentiert wird:**
- Architekturentscheidungen und ihre Begründung
- Was geprüft und verworfen wurde — und warum
- Technische Grenzen und benannte Lücken
- Abweichungen zwischen Forschungsimplementierung und kommerziellem Standard

**Wie dokumentiert wird:**
- In vollständigen deutschen Sätzen, nicht in Stichpunkten oder Code-Kommentaren
- Auf einem Niveau, das ohne Programmierkenntnisse lesbar ist
- Mit explizitem Bezug auf die Kapitel der Abschlussarbeit, wenn ein Zusammenhang besteht
- Einschließlich Datum und Kontextstand (z. B. „Stand Juni 2026")
- **Kuratiert, nicht transkribiert:** Festgehalten werden Entscheidungen, Begründungen und Grenzen — nicht jede Zwischenüberlegung oder Diskussion, die zu ihnen geführt hat.

**Kadenz:**
Die Dokumentation wird nicht fortlaufend während der Arbeit an einer Funktion nachgezogen, sondern pro Release reviewed und aktualisiert. Am Ende eines zusammenhängenden Arbeitsabschnitts wird geprüft, ob neue Entscheidungen festzuhalten sind und ob bestehende Kapitel noch den aktuellen Code-Stand widerspiegeln (siehe z. B. Backlog B-16 — ein Fall, in dem genau das versäumt wurde).

**Wozu:**
Die Dokumentation ist nicht Begleitmaterial zur Plattform — sie ist primäre Grundlage für den technischen Anhang der Abschlussarbeit **und** die Übergabegrundlage für eine zukünftige Generation, die Arbeit und Plattform ohne Vorwissen nahtlos weiterführen soll. Code und Dokumentation entstehen gleichzeitig, nicht nacheinander.
