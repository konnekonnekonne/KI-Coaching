# 11 — Umsetzung: Cascaded Voice-Architektur

*Dokumentationsstand: 28. Juli 2026 — Status: Deployed, Kernfunktion live, Erweiterungen offen*

---

## Zweck

Dieses Dokument hält die tatsächliche Umsetzung der in [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md) beschlossenen Cascaded-Architektur fest — was gebaut wurde, welche konkreten technischen Stolpersteine dabei auftraten, und was für die nächste Session offen bleibt. Es ergänzt die Entscheidungsdokumentation um die Bauebene, wie es der Dokumentationsstandard aus [00_uebersicht.md](00_uebersicht.md) vorsieht.

---

## Realisierte Architektur

```
Browser (VoiceSession.tsx)
   │  @pipecat-ai/client-js + @pipecat-ai/daily-transport
   ▼
Next.js /api/voice/start          ← prüft Auth + Session-Ownership,
   │  (Netlify)                     liest profiles.voice_gender
   │  PIPECAT_API_KEY (Bearer)
   ▼
Pipecat Cloud (Region: eu-central / Frankfurt)
   │  Agent "kico", Secret-Set "kico"
   ▼
voice-agent/bot.py
   ├── Deepgram STT  (api.eu.deepgram.com, Sprache: Deutsch, Modell nova-3)
   ├── Silero VAD    (stop_secs = 2.0 — siehe unten)
   ├── Claude Sonnet (COACHING_MODEL, Systemprompt aus system_prompt.py)
   ├── Deepgram TTS  (Aura-2, aurelia-de / fabian-de je nach voice_gender)
   └── TranscriptWriter → Supabase messages-Tabelle (service_role-Key)
```

Agenten-Map aus der Planung (siehe Konversationsverlauf) — Umsetzungsstand:

| Agent | Geplant | Umgesetzt |
|---|---|---|
| Transkription | Deepgram Nova-3 | ✓ |
| Signal-Scanner | Wortlisten, kein LLM | ✓ als `lib/signal-scanner.ts` — **noch nicht in die Voice-Pipeline eingebaut** (siehe „Offen" unten) |
| Sentiment-Check | Haiku | ⬜ Task 6 |
| Konsistenzcheck | Sonnet | ⬜ Task 6 |
| Hauptagent | Sonnet, geteilte Konstante | ✓ |
| QN-Selbstprüfung | Haiku, separater Pass | ⬜ Task 6 |
| TTS | Deepgram Aura | ✓, inkl. Stimmwahl weiblich/männlich |
| Phasentracking | Async-Update, Sync-Read | ⬜ Task 7 (Tabelle `phase_signals` existiert bereits) |
| Feldnotiz / Memory | Claude, Sessionende | ⬜ unverändert offen (B-12/B-13) |

---

## Kernentscheidung bestätigt: Turn-Detection ist jetzt konfigurierbar

Der eigentliche Auslöser des gesamten Architekturwechsels war das Schweige-Problem (docs/08) — bei OpenAIs Speech-to-Speech-Modell war die Turn-Detection nicht zugänglich konfigurierbar. Bei der Umsetzung wurde verifiziert (direkt im installierten Quellcode, nicht nur in der Dokumentation): Silero VAD, das Pipecat für die Turn-Detection nutzt, hat einen Parameter `stop_secs` (Sekunden Stille, bevor ein Redebeitrag als beendet gilt). Standardwert: **0.2 Sekunden** — für ein Konversationssystem gedacht, für Coaching-Denkpausen deutlich zu kurz.

Umgesetzt: `stop_secs = 2.0` in `voice-agent/bot.py`. Das ist ein Startwert, kein endgültig kalibrierter — die Anpassung nach echtem Nutzertest (Task 10) ist der nächste sinnvolle Schritt, um zu prüfen, ob 2 Sekunden zu kurz, zu lang oder passend sind.

**Konsequenz für die Abschlussarbeit:** QN-12 (Gesprächsrhythmik, Backlog B-15) lässt sich damit erstmals tatsächlich erfüllen — nicht nur behauptet, sondern im Code nachweisbar konfigurierbar. Der Funktionstest, den B-15 explizit fordert („Konfigurierbarkeit muss durch Funktionstest verifiziert werden"), steht mit Task 10 noch aus.

---

## Technische Stolpersteine bei der Umsetzung (für Kapitel 3 relevant)

Diese vier Punkte sind exemplarisch dafür, dass Dokumentation und tatsächliches Verhalten von Software-Bibliotheken auseinanderfallen können — ein wiederkehrendes Muster in diesem Projekt (vgl. B-21, Supabase-Migrationslücke):

1. **pipecat-ai-Version:** Recherche vor der Umsetzung deutete auf Version 0.0.105 hin. Tatsächlich installiert (und für die Umsetzung verwendet): **1.6.0** — ein deutlich reiferer, aber auch API-unterschiedlicher Stand. Die Lehre daraus: Bei einer sich schnell entwickelnden Bibliothek wurde nicht gegen die vermutete Version programmiert, sondern der Code wurde nach der Installation gegen den tatsächlich installierten Quellcode verifiziert (Konstruktor-Signaturen direkt in `site-packages` nachgelesen), bevor er als fertig galt.
2. **Dockerfile kopierte nur `bot.py`:** Das von `pipecat init` generierte Dockerfile geht vom Ein-Datei-Muster des Quickstarts aus (`COPY ./bot.py bot.py`). Da unser Bot in mehrere Module aufgeteilt ist (`system_prompt.py`, `models.py`, `supabase_client.py`), scheiterte der erste Deploy mit `ModuleNotFoundError` — der Agent baute erfolgreich, startete aber nie. Zunächst behoben durch explizites Auflisten aller Dateien im Dockerfile — das brach beim nächsten neu hinzugefügten Modul (`anthropic_fix.py`, siehe Punkt 6) erneut auf dieselbe Weise. Endgültig behoben mit `COPY ./*.py ./` statt einzelner Dateinamen, damit neue Module künftig automatisch mitkommen.
3. **Regionsmismatch beim Deploy:** Der erste erfolgreiche Build scheiterte beim Rollout, weil `pipecat cloud deploy` ohne `--region`-Flag die Organisations-Standardregion (`us-west`) verwendete, während das Secret-Set „kico" in `eu-central` (Frankfurt) angelegt war. Secrets und Service müssen in derselben Region liegen. Behoben durch explizites `--region eu-central`.
4. **Deepgram EU-Endpoint:** `api.eu.deepgram.com` für STT und TTS bestätigt nutzbar (Parameter `base_url`, im Quellcode verifiziert) — schließt einen Teil der in Backlog B-11 dokumentierten DSGVO-Lücke des Voice-Modus. Anthropics eigene Datenresidenz wurde dabei nicht geprüft — bleibt offen.
5. **Fehlendes `<audio>`-Element:** Beim Umbau von der alten, manuellen WebRTC-Implementierung (OpenAI) auf `@pipecat-ai/client-js` + `@pipecat-ai/daily-transport` ging die explizite Audio-Wiedergabe verloren. Anders als erwartet erzeugt Daily/Pipecat kein eigenes `<audio>`-Element automatisch — der erste echte Sprachtest (mit Mikrofon) zeigte, dass STT, LLM und TTS serverseitig einwandfrei liefen und auch die Client-Events (`onBotTtsStarted`) korrekt ankamen, aber nichts zu hören war. Behoben durch einen `onTrackStarted`-Callback, der das Audio-Track des Bot-Teilnehmers (nicht das eigene Mikrofon) manuell an ein `<audio>`-Element hängt — exakt das Muster, das die alte Implementierung schon hatte, beim Umbau aber nicht mitübertragen wurde.
6. **Bekannter, offener Pipecat-Bug (Issue [#4992](https://github.com/pipecat-ai/pipecat/issues/4992)):** Nach zwei Gesprächswechseln brach die Verbindung mit `AnthropicLLMAdapter: KeyError 'role'` ab. Ursache: `AnthropicLLMService` sendet unconditional den Beta-Header `interleaved-thinking-2025-05-14`; Claude Sonnet 5 kann dabei "Denk"-Blöcke mit leerem `text` und/oder fehlender `signature` liefern, die Pipecats Adapter unverändert als rohes Dict ohne `role`-Feld weiterreicht. Kein Konfigurationsflag verfügbar, um das zu unterdrücken. Workaround (empfohlen von der Bug-Meldung selbst, hier umgesetzt in `voice-agent/anthropic_fix.py`): ein Adapter-Subklasse filtert kaputte Denk-Blöcke heraus, bevor sie serialisiert werden. Mit Unit-Test verifiziert (`_is_malformed_thought`), nicht nur behauptet.

---

## Betriebsdetails

- **Agent-Name:** `kico`, Organisation `content-woodpecker-blush-603`, Region `eu-central`
- **Secret-Set „kico"** (in Pipecat Cloud, nicht im Repo): `DEEPGRAM_API_KEY`, `ANTHROPIC_API_KEY` (eigener Key, getrennt vom Netlify-Key), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Scaling:** Min 0 / Max 5 Agents (Minimalbudget-Vorgabe — kein dauerhaft laufender, kostender Prozess)
- **Netlify-Umgebungsvariable:** `PIPECAT_API_KEY` (Public API Key, `pk_...`, separat von den Pipecat-internen Secrets)
- **Stimmen:** `aura-2-aurelia-de` (weiblich, Standard), `aura-2-fabian-de` (männlich) — Auswahl über `profiles.voice_gender`, vom Nutzer im Deepgram-Playground ausgesucht

---

## Was für die nächste Session offen ist

1. **Task 6 — Parallel-Agents:** Sentiment-Check, Konsistenzcheck, QN-Selbstprüfung sind konzipiert (siehe Agenten-Map), aber noch nicht in `bot.py` eingebaut. Die Signal-Scanner-Logik existiert bereits als TypeScript (`lib/signal-scanner.ts`) für den Textmodus, aber noch nicht als Python-Äquivalent für die Voice-Pipeline.
2. **Task 7 — Phasentracking:** Die Tabelle `phase_signals` existiert (Migration 003), wird aber noch von niemandem beschrieben oder gelesen.
3. **Task 9 — Diese Dokumentation** ist hiermit erledigt; laufende Pflege bei weiteren Änderungen nicht vergessen (siehe Dokumentationsstandard).
4. **Task 10 — End-to-End-Test im Browser:** Noch nicht durchgeführt. Das ist der wichtigste nächste Schritt — bislang wurde nur der Import/Build/Deploy verifiziert, nicht ein tatsächliches Gespräch. Insbesondere zu prüfen: funktioniert `stop_secs=2.0` im echten Gebrauch, kommt Audio in beiden Richtungen an, landen Nachrichten korrekt in Supabase.
5. **Bekannte Lücke, im Code als TODO markiert:** Der Text→Voice-Übergabe-Mechanismus (`priorMessages`) wird von der Next.js-Seite an den Agent durchgereicht, aber `bot.py` lädt ihn noch nicht in den `LLMContext` vor — ein Moduswechsel mitten in der Session verliert aktuell den bisherigen Gesprächskontext auf der Voice-Seite.
6. **Anthropic-Datenresidenz** für den DSGVO-Teil der Voice-Architektur wurde nicht geprüft (nur Deepgram und Pipecat-Region).
