# 09 — Anforderungsabgleich: Kapitel 2 vs. Umsetzungsstand

*Dokumentationsstand: 30. Juli 2026 — aktualisiert nach Cascaded-Migration, B-05b, Methodenkorpus/Rahmenmaterial, Session-Anchors*

---

## Zweck

Dieses Dokument stellt den in Kapitel 2 der Abschlussarbeit formulierten Anforderungskatalog dem tatsächlichen Umsetzungsstand der Plattform gegenüber. Es ist die laufende Vorarbeit für das finale Kapitel 3 ("Technische Umsetzung") — dort soll herausgearbeitet werden, welche Architektur- und Implementierungsentscheidungen getroffen wurden und wo der Anforderungskatalog aufgrund technischer Limitierung nicht vollständig erfüllt werden konnte.

**Kadenz:** Dieses Dokument wird pro Release reviewed und aktualisiert, nicht bei jeder einzelnen Änderung. Es hält Entscheidungen und Begründungen fest, nicht den Diskussionsverlauf dahinter.

**Statuslegende:**

| Symbol | Bedeutung |
|--------|-----------|
| ✓ | Erfüllt |
| ~ | Teilweise erfüllt oder bewusst anders gelöst (mit Begründung) |
| ⬜ | Offen — geplant, nicht umgesetzt (siehe `backlog.md`) |
| ⚠ | Strukturelle Grenze — mit heutigem Stand der Technologie nicht vollständig lösbar |

---

## 2.1.1 Coachingqualität

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Reflexionsfragen statt Ratschläge, eine Frage pro Antwort | ✓ | Systemprompt (QN-01, QN-05): explizites Verbot von Ratschlägen, Liste verbotener generischer Fragen, Fragehaltung mit Paraphrase-vor-Frage. Siehe [lib/system-prompt.ts](../lib/system-prompt.ts). |
| Anti-Sycophantie (keine unreflektierte Bestätigung) | ~ | Als Instruktion im Systemprompt verankert (QN-02), aber ausschließlich modellseitig — kein serverseitiger Prüfmechanismus, der eine Antwort vor Auslieferung auf Sycophantie prüft. Die in der Abschlussarbeit (Kapitel 3, Fassung B) beschriebene "Antwortgenerierung mit ethischem Filter" (Post-Generation-Check) ist nicht gebaut. |
| Strukturierter Prozess (U-Modell) | ✓ | Vollständig im Systemprompt abgebildet: 5 Phasen, ZF-Struktur als Einstieg, Leitfrage als roter Faden. |
| Konsistenz über Sessions hinweg | ⬜ | Architektonisch als "Kontext statt Sitzung" gefordert (Prinzip 3, Kapitel 3 Fassung B), technisch aber nicht umgesetzt: kein Server-State für Phasenlage, keine Memory-Injektion (siehe Ebene 3/4 unten). Jede Session startet für das Modell faktisch "kalt" bis auf das reine Nachrichten-Array. |

## 2.1.2 Funktionalität

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| 24/7 verfügbar, niedrige Zugangshürde | ✓ | Passwortloser Login (Magic-Link/OTP via Supabase, [app/(auth)/login/page.tsx](../app/(auth)/login/page.tsx)) — kein separater Registrierungsschritt, `/signup` leitet auf `/login` um. |
| Schnelle Antwortzeiten | ✓ | SSE-Streaming im Textmodus (Wort-für-Wort), WebRTC im Voice-Modus für niedrige Latenz. |
| Geräteübergreifend | ✓ | Next.js Web-App, responsive Layout (siehe `VoiceSession.tsx`, `md:`-Breakpoints). |
| Mehrsprachig | ⬜ | Plattform ist ausschließlich Deutsch (Systemprompt erzwingt Deutsch explizit). Für den Forschungsrahmen bewusst so entschieden, nicht als Lücke dokumentiert, aber real. |
| Transparenz, Datenkontrolle | ~ | RLS sorgt für Datenisolation zwischen Nutzerinnen; ein Nutzer-Interface zum Einsehen/Exportieren/Löschen eigener Daten existiert nicht (vgl. Backlog B-08 — keine Protokollansicht). |

## 2.2 Fachliche Coaching-Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| INA CCW-Methodenkorpus als verbindlicher Rahmen | ~ | `docs/tools.md` beschreibt ~30 Werkzeuge (Kurzprinzip, Trigger, Kernprozess, U-Modell-Phase, Visualisierungstyp); `docs/rahmen.md` ergänzt Sessioneinstieg, Auftragsklärung und Rolle des Coachs aus dem INA-CCW-Curriculum (M2, M6, C03). Der Systemprompt ist danach phasenweise neu aufgebaut. Verbleibend offen: Die Tool-Auswahllogik (B-02) ist ein "erster, noch grober Baustein" — kein server-seitiger Auswahlmechanismus, das Modell wählt weiterhin selbst aus der phasenweisen Liste. |
| Keine Diagnose/Therapie/medizinische Empfehlung | ✓ | Rollenklarheit (QN-04) im Prompt: explizite Abgrenzung "kein Therapeut, kein Berater, kein Freund". |
| Systemische Fragetechniken | ✓ | Sechs Varianten im Methodenkorpus benannt und im Fragehaltungs-Abschnitt operationalisiert. |
| Umgang mit Widerstand/Intellektualisieren | ⬜ | Keine Instruktion im Prompt (Backlog B-05). |
| Umgang mit emotionalen Momenten (Weinen, Überwältigung) | ⬜ | Nicht adressiert (Backlog B-03) — methodisch eine eigene Situation (Verlangsamung statt Weiterfragen), die vom Krisenprotokoll zu unterscheiden ist, aber im Prompt fehlt. |
| Sessionabschluss / Transfer-Phase | ⬜ | Phase 5 ist benannt, aber nicht ausgeführt (Backlog B-04). Kein Abschluss-Button in der UI (B-07) — Sessions enden durch Navigation, nicht durch bewussten Abschluss. |

## 2.X.3 Ethische Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Krisenerkennung und -eskalation (MIND-SAFE) | ✓ | Deterministischer Pre-Filter vor jedem LLM-Call (`lib/signal-scanner.ts`/`voice-agent/signal_scanner.py`, Wortlisten, kein Modell) — bei Level "akut" wird der LLM-Call übersprungen, die Krisenreaktion ist fest verdrahtet. Läuft identisch in Text- und Voice-Modus. Ton und Timing der Reaktion wurden nach einem Live-Test überarbeitet (Begründung inkl. Bezug zu professioneller Coaching-Ethik in `docs/03_systemprompt.md`, Abschnitt "Grenzen kennen"). Damit ist die Sicherheit nicht mehr ausschließlich modellabhängig — die in Kapitel 1.2 beschriebene RLHF-Konflikt-Problematik bleibt für das Modellverhalten selbst gültig, ist aber für diesen einen, kritischsten Fall durch die Architektur abgefangen. |
| KI-Transparenz (keine Simulation menschlicher Präsenz) | ✓ | Im Prompt verankert (QN-06), keine dedizierte Prüfung, aber die Rollenklarheits-Instruktion deckt dies inhaltlich ab. Login-Seite zeigt zudem "Forschungsprototyp" als Subline — sichtbare Kennzeichnung. |
| Keine übermäßige Bestätigung (Sycophancy) | ~ | Siehe 2.1.1 — Prompt-Instruktion vorhanden, kein Post-Check. |
| Bias-Erkennung / konsistente Prinzipien unabhängig von Nutzer-Merkmalen | ⬜ | Keine gezielte Maßnahme, kein Test. Nicht evaluiert. |

## 2.X.4 Rechtliche Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Datenminimierung, Zweckbindung | ✓ | Datenbankschema ist bewusst minimal (`profiles`, `sessions`, `messages`) — keine Pflicht-Demografiefelder, keine Analytics/Tracking-Pixel (siehe [02_datenbankschema.md](02_datenbankschema.md)). |
| RLS / Zugriffsschutz | ✓ | Vollständig umgesetzt für alle drei Tabellen ([supabase/migrations/001_initial.sql](../supabase/migrations/001_initial.sql)). |
| DSGVO-konforme Verarbeitung biometrischer Daten (Voice, Art. 9) | ~ | Teilweise verbessert seit der Cascaded-Migration: Deepgram (STT/TTS) läuft über `api.eu.deepgram.com`, Hosting über Pipecat Cloud in `eu-central` (Frankfurt). Offen bleibt Anthropics eigene Datenresidenz für die Voice-Pipeline — nicht geprüft. Für den Forschungsrahmen mit informierter Einwilligung vertretbar, für eine kommerzielle Weiterentwicklung zwingend zu klären (Backlog B-11). |
| EU AI Act Art. 5 (Emotionsinferenz aus biometrischen Daten) | ✓ | Dieser Anforderung wird durch eine Auswahlentscheidung entsprochen, nicht durch technische Kontrolle: Hume EVI wurde explizit deshalb ausgeschlossen (Entscheidungslog in [05_voice-architektur.md](05_voice-architektur.md)). |
| Löschkonzept / Datenexport | ⬜ | Nicht umgesetzt. Nachrichten werden dauerhaft gespeichert, eine Löschfunktion nach Zeitraum ist als Zukunftsfeature vorgesehen ([02_datenbankschema.md](02_datenbankschema.md)), aber nicht terminiert. |
| Einwilligungsmanagement | ⬜ | Kein Consent-Screen in der UI (Backlog B-17, unverändert offen). Die zugrunde liegende Annahme wurde jedoch korrigiert: `docs/rahmen.md` zeigt, dass die *coaching-fachliche* Kontextklärung ohnehin dialogisch in Phase 1a des Gesprächs gehört, nicht in eine vorgelagerte UI — nur die *organisatorische* Einwilligung (wer, warum, welcher Rahmen) bleibt ein echter UI-Fall und ist weiterhin ungebaut. |

## 2.X.5 Funktionale Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Session starten/fortsetzen, Historie | ✓ | Dashboard lädt bisherige Sessions inkl. Preview, `/session/[id]` lädt vollständige Nachrichtenhistorie. |
| Text- und Voice-Modus im selben Gespräch | ✓ | `SessionShell` erlaubt nahtlosen Wechsel, beide Modi schreiben in dieselbe `messages`-Tabelle. |
| Mitschrift / Protokollansicht | ⬜ | Rohtranskript wird gespeichert, aber keine Read-only-Ansicht dafür (Backlog B-08). |
| Zieldefinition, Fortschrittskontrolle über Sessions | ⬜ | Nicht umgesetzt — hängt an Memory-Architektur (siehe Ebene 3/4 unten). |
| Vorname-Onboarding | ✓ | Einmalige Abfrage beim ersten Login ([components/dashboard/Dashboard.tsx](../components/dashboard/Dashboard.tsx)). |
| Persistente Session-Artefakte (z. B. Coachingfrage) | ✓ | `session_anchors`-Tabelle + zwei Tool-Mechanismen: `set_anchor` (KICO legt einen Wert fest) und `request_anchor_input` (KICO öffnet eine leere Karte, der Coachee füllt sie selbst — methodisch näher an physischer Coaching-Praxis als eine vom Modell paraphrasierte Zusammenfassung). Läuft identisch in Text- und Voice-Modus, live per Supabase Realtime. Kein Anforderungspunkt aus Kapitel 2 benennt das explizit — ergänzt "Berücksichtigung des bisherigen Gesprächsverlaufs" (2.1.1) um eine sichtbare, coachee-autorierte Komponente. |

## 2.6 Nichtfunktionale Anforderungen

### KI-Architektur / Wissensmanagement

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Konfigurierbarer, versionierter Systemprompt | ✓ | `lib/system-prompt.ts`, als Konstante versioniert, gemeinsam für Text- und Voice-Route genutzt. |
| Memory über Sessions (Ebene 3: Feldnotiz, Ebene 4: Injektion) | ⬜ | Architektonisch vollständig konzipiert ([07_informationsarchitektur.md](07_informationsarchitektur.md)), technisch nicht gebaut. Fehlend: `sessions.field_note`, `profiles.coaching_notes`, Meta-Prompt für Feldnotiz-Generierung, Injection-Logik. Größte offene Architekturlücke der Plattform (Backlog B-12, B-13). |
| RAG-Integration für Methodenwissen | ⬜ | In der Abschlussarbeit (Kapitel 3, Fassung B) als Verarbeitungsschicht 4 beschrieben, im Code nicht vorhanden — der Methodenkorpus liegt vollständig als Freitext im Systemprompt, nicht als abrufbare Wissensbasis. |
| Server-seitiges Phasentracking | ⬜ | Modell schätzt die U-Modell-Phase selbst aus dem Gesprächsverlauf. Kein `sessions.current_phase`-Feld (Backlog B-05c). Bei langen/unstrukturierten Gesprächen unzuverlässig. |

### Informationssicherheit

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Kein clientseitiger API-Key | ✓ | Anthropic-, Deepgram- und Pipecat-Secrets verlassen den Server/die Pipecat-Cloud-Secret-Verwaltung nie; der Client erhält ausschließlich einen scoped `PIPECAT_API_KEY` (öffentlicher Schlüssel, `pk_...`) zum Verbindungsaufbau. |
| TLS, sichere Authentifizierung | ✓ | Netlify (TLS), Supabase Auth mit OTP statt Passwort (kein Passwort-Diebstahlrisiko). |
| Server Components für sensible Routen | ✓ | `/session` und `/session/[id]` sind React Server Components mit serverseitiger Auth-Prüfung. |

### Monitoring / Qualitätssicherung

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Feedbackschleife, aggregierte Qualitätsmetadaten | ⬜ | In der Arbeit als Verarbeitungsschicht 6 beschrieben ("Clinical Oversight Loop"), im Code nicht vorhanden. Keine Metrik erfasst, ob Sessions methodisch sauber verlaufen. |
| Prompt-Versionierung | ✓ | Git-versioniert, da Teil des Quellcodes. Kein separates Änderungsprotokoll über den Git-Log hinaus. |

---

## Voice-spezifischer Abgleich: QN-12 (Gesprächsrhythmik)

**Aktueller Stand (Cascaded-Architektur, live getestet 29. Juli 2026):** Automatisches, konfigurierbares Turn-Taking über Silero VAD (`voice-agent/bot.py`, Parameter `stop_secs = 2.0` statt Standardwert 0.2). Kein Push-to-Talk mehr nötig — der Coachee spricht frei, Denkpausen bis 2 Sekunden werden nicht als Gesprächsende gewertet. Damit ist QN-12 erstmals durch einen echten Funktionstest belegt, nicht nur behauptet (Details in [11_voice-cascaded-umsetzung.md](11_voice-cascaded-umsetzung.md)).

**Kurz zur Einordnung, warum dieser Weg gewählt wurde:** Die ursprüngliche Speech-to-Speech-Architektur (OpenAI `gpt-realtime-2`) bot keinen konfigurierbaren Zugriff auf die Turn-Detection — jede getestete Konfiguration scheiterte, siehe [08_kapitel-schweige-problem.md](08_kapitel-schweige-problem.md). Die Cascaded-Architektur löst das nicht, weil Turn-Detection dort grundsätzlich anders funktioniert, sondern weil sie eine austauschbare, frei konfigurierbare Komponente (Silero VAD) an die Stelle einer geschlossenen Anbieter-Blackbox setzt. Der dort dokumentierte *feldweite* Befund — aktuelle Sprach-KI ist strukturell auf Gesprächsfluss statt Gesprächsraum optimiert — bleibt als Forschungserkenntnis unabhängig davon gültig; für diese Plattform ist er durch die Architekturwahl umgangen, nicht aufgelöst.

**Für die Dokumentation:** `docs/05_voice-architektur.md` und `docs/08_kapitel-schweige-problem.md` beschreiben noch die inzwischen verworfene Speech-to-Speech-Zwischenlösung (Semantic VAD, dann Push-to-Talk) und sind damit historisches Material, kein aktueller Zielzustand (Backlog B-16).

---

## Zusammenfassung: Größte offene Architekturlücken

Priorisiert nach Auswirkung auf die Kernthese "Methode vor Modell":

1. **Keine Memory-Architektur** (B-12, B-13) — "Kontext statt Sitzung" ist ein zentrales Architekturprinzip der Arbeit, aber technisch nicht existent. Jede Session ist faktisch eigenständig. Größte verbleibende Lücke.
2. **Kein server-seitiges Phasentracking** (B-05c) — Prozessverantwortung liegt vollständig beim Modell, nicht bei einer verlässlichen Datenstruktur.
3. **Tool-Auswahllogik nur grob umgesetzt** (B-02) — der Methodenkorpus ist inzwischen beschrieben (`docs/tools.md`), die Auswahl im Gespräch bleibt aber Modellermessen, kein server-seitiger Mechanismus.
4. **Voice/DSGVO-Gap, reduziert** (~, strukturell) — Deepgram/Pipecat laufen in der EU, Anthropics Datenresidenz ist ungeprüft. Für den Forschungsrahmen akzeptabel, für jede Weiterentwicklung zu klären.
5. **Kein Einwilligungs-/Consent-Screen** (B-17) — organisatorische Auftragsklärung fehlt weiterhin als UI-Baustein.

**Nicht mehr auf dieser Liste:** Der deterministische Sicherheits-Pre-Filter (B-05b) ist umgesetzt und getestet — vormals Punkt 1 dieser Liste. Das zeigt, dass die verbleibenden Punkte 1–3 keine technischen Grenzen im engeren Sinne sind, sondern noch nicht gebaute, aber baubare Bausteine, während 4 und das Schweige-Problem (siehe oben) tatsächliche Grenzen des aktuellen Technologiestands bzw. echte regulatorische Fragen sind.
