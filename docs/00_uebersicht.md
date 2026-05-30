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
| [04_authentifizierung.md](04_authentifizierung.md) | Auth-Flow, Session-Management, Sicherheit |
| [05_coaching_session.md](05_coaching_session.md) | Sessionstruktur, Streaming-Architektur, U-Modell-Mapping |
| [06_deployment.md](06_deployment.md) | Netlify-Deployment, Umgebungsvariablen, CI/CD |

---

## Projekteckdaten

| Merkmal | Wert |
|---------|------|
| Plattformname | KICO (KI-Coach) |
| Domain | kico.pro |
| Repository | github.com/konnekonnekonne/KI-Coaching |
| Methodische Grundlage | INA CCW-Curriculum (ECA-zertifiziert) |
| KI-Modell | Anthropic Claude (claude-opus-4-5) |
| Zielgruppe | Einzelpersonen im beruflichen Kontext |
| Sprache der Plattform | Deutsch |

---

## Bauweise

Die Plattform wurde in direkter Zusammenarbeit zwischen der Autorin und Claude (Anthropic) entwickelt. Alle Architekturentscheidungen wurden gemeinsam besprochen und dokumentiert. Der Quellcode ist im Repository öffentlich einsehbar und spiegelt die in dieser Dokumentation beschriebenen Prinzipien direkt wider.
