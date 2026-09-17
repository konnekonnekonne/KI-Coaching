# KICO — KI-gestütztes systemisches Coaching

KICO ist eine Forschungsplattform für KI-gestütztes Coaching, entstanden im Rahmen der Abschlussarbeit **„KI im Coaching: Anforderungen an einen KI-Coach und kritische Abwägung gegenüber menschlichem Coaching"** von **Henrike Thomsen** und **Konstantin Escher** (Systemischer Master Business Coach, INA CCW / bbw Bildungswerk, eingereicht 14. September 2026).

📄 [Die vollständige Abschlussarbeit lesen (PDF)](public/abschlussarbeit-ki-im-coaching.pdf) · 🌐 [Live-Demo: kico.pro](https://kico.pro)

Kein kommerzielles Produkt, sondern ein Forschungsprototyp: KICO führt Coachees per Text oder Sprache durch ein Gespräch, das methodisch dem INA-CCW-Curriculum folgt (U-Modell nach Scharmer, systemische Fragetechniken, Auftragsklärung) — statt sich auf das freie, unstrukturierte Verhalten eines allgemeinen Sprachmodells zu verlassen. Code und Dokumentation sind offen einsehbar, damit sowohl die Argumentation der Arbeit als auch die tatsächliche Umsetzung nachvollziehbar bleiben — auch für Leser:innen ohne eigenen Zugriff auf die Plattform.

---

## Die Idee dahinter: Methode vor Modell

Ein Sprachmodell wie Claude ist von Haus aus ein Allzwecksystem — kein Coach. Es hat keine Phasenstruktur, keine eingebaute Krisenerkennung, keine Vorstellung davon, wo im Gespräch es gerade steht. KICOs Grundprinzip ist deshalb, die Coaching-Methodik nicht dem Modell zu überlassen, sondern sie als eigenständige Architektur *um* das Modell herum zu bauen:

- **Sicherheit vor dem Modell** — ein regelbasierter Filter prüft jede Eingabe auf Krisensignale, bevor das Sprachmodell sie überhaupt sieht.
- **Methode vor Modell** — ein aus dem realen INA-CCW-Ausbildungsmaterial abgeleiteter Methodenkorpus (`docs/tools.md`, `docs/rahmen.md`) strukturiert den Systemprompt, statt dass das Modell improvisiert.
- **Kontext statt Sitzung** — Gespräche sollen sich über mehrere Sessions hinweg erinnern (Ausbaustufe, siehe `docs/backlog.md`).
- **Gateway statt Endpunkt** — KICO ersetzt kein menschliches Coaching, sondern ist als strukturierter Einstieg konzipiert.

Die vollständige Begründung, inklusive verworfener Ansätze und offener Lücken, steht in [`docs/`](docs/00_uebersicht.md) — dort wird jede nicht-triviale Entscheidung dokumentiert, nicht nur das Ergebnis.

---

## Technischer Überblick

| Bereich | Umsetzung |
|---|---|
| Web-Plattform | Next.js (App Router), TypeScript, Tailwind v4 |
| Datenbank & Auth | Supabase (Postgres, Row Level Security, passwortloser Login) |
| Text-Coaching | Anthropic Claude, serverseitig via `app/api/chat` |
| Voice-Coaching | Cascaded-Pipeline: Deepgram (STT/TTS, EU) → Claude → Deepgram, gehostet auf Pipecat Cloud |
| Hosting | Netlify (Web), Pipecat Cloud (Voice-Agent) |

Für die vollständige Architektur, jede Design-Entscheidung und den aktuellen Umsetzungsstand siehe [`docs/00_uebersicht.md`](docs/00_uebersicht.md) — dem Einstiegspunkt der technischen Dokumentation.

---

## Lokal starten

**Voraussetzungen:** Node.js 20+, ein eigenes Supabase-Projekt, ein Anthropic-API-Key.

```bash
npm install
cp .env.example .env.local   # eigene Supabase-/Anthropic-Werte eintragen
npm run dev
```

Die App läuft dann unter [http://localhost:3000](http://localhost:3000). Ohne gültige Supabase-Werte in `.env.local` startet der Server zwar, aber Login und Datenbankzugriffe schlagen fehl.

**Voice-Agent** (separater Python-Service, nicht Teil des Next.js-Prozesses):

```bash
cd voice-agent
uv sync
uv run bot.py
```

Details zu Secrets, Deployment und Betrieb: [`docs/06_deployment.md`](docs/06_deployment.md) und [`docs/11_voice-cascaded-umsetzung.md`](docs/11_voice-cascaded-umsetzung.md).

---

## Projektstruktur

```
app/            Next.js-Routen (App Router)
components/     UI- und Coaching-Komponenten
lib/            Systemprompt, Modellwahl, Signal-Scanner, Anker-Tools
supabase/       Datenbank-Migrationen
voice-agent/    Python-Voice-Pipeline (Pipecat Cloud)
docs/           Vollständige technische Dokumentation — hier anfangen
public/         Statische Dateien, u.a. die Abschlussarbeit als PDF
```

---

## Status

Die Abschlussarbeit ist eingereicht (14. September 2026), die Plattform bleibt ein aktiver Forschungsprototyp — kein kommerzielles Produkt und kein Ersatz für menschliches Coaching oder therapeutische Hilfe. Bei akuten Krisen verweist KICO an die Telefonseelsorge (0800 111 0 111, kostenlos, 24/7).

Der aktuelle Betrieb ist ein geschlossener Pilot für einen begrenzten Teilnehmendenkreis. Code und Dokumentation sind bewusst offen gehalten, damit künftige INA-CCW-Kohorten die Plattform kritisch prüfen und weiterentwickeln können — offene Lücken gegenüber dem Anforderungskatalog der Arbeit sind dafür ehrlich in [`docs/09_anforderungsabgleich.md`](docs/09_anforderungsabgleich.md) und [`docs/backlog.md`](docs/backlog.md) festgehalten, statt verschwiegen zu werden.
