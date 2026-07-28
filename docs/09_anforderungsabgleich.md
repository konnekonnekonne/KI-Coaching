# 09 — Anforderungsabgleich: Kapitel 2 vs. Umsetzungsstand

*Dokumentationsstand: Juli 2026*

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
| INA CCW-Methodenkorpus als verbindlicher Rahmen | ~ | Alle ~20 Werkzeuge sind im Prompt *benannt* (Prozessrahmen, Fragetechniken, Identität & Werte, Perspektive & Entscheidung, Abschluss). Sie sind aber nicht *beschrieben* — das Modell kennt Namen, nicht Anwendungslogik. Offen als Backlog B-01 (Werkzeugbeschreibungen) und B-02 (Auswahllogik, wann welches Tool). Ohne diese Beschreibungen fällt das Modell nachweislich auf generisches Coaching-Verhalten zurück. |
| Keine Diagnose/Therapie/medizinische Empfehlung | ✓ | Rollenklarheit (QN-04) im Prompt: explizite Abgrenzung "kein Therapeut, kein Berater, kein Freund". |
| Systemische Fragetechniken | ✓ | Sechs Varianten im Methodenkorpus benannt und im Fragehaltungs-Abschnitt operationalisiert. |
| Umgang mit Widerstand/Intellektualisieren | ⬜ | Keine Instruktion im Prompt (Backlog B-05). |
| Umgang mit emotionalen Momenten (Weinen, Überwältigung) | ⬜ | Nicht adressiert (Backlog B-03) — methodisch eine eigene Situation (Verlangsamung statt Weiterfragen), die vom Krisenprotokoll zu unterscheiden ist, aber im Prompt fehlt. |
| Sessionabschluss / Transfer-Phase | ⬜ | Phase 5 ist benannt, aber nicht ausgeführt (Backlog B-04). Kein Abschluss-Button in der UI (B-07) — Sessions enden durch Navigation, nicht durch bewussten Abschluss. |

## 2.X.3 Ethische Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Krisenerkennung und -eskalation (MIND-SAFE) | ~ | Vollständig als Prompt-Instruktion umgesetzt (Krisenressourcen, sofortiger Abbruch). **Strukturelle Einschränkung:** Dies ist ausschließlich eine Instruktion — keine technische Sperre. Der in der Abschlussarbeit (Kapitel 3) und in Backlog B-05b geforderte deterministische Code-Filter *vor* dem LLM-Call (Wortlisten-Check, unabhängig vom Modellverhalten) existiert nicht. Damit hängt die Sicherheit vollständig an der Zuverlässigkeit des Modells — genau das RLHF-Konflikt-Problem, das Kapitel 1.2 der Arbeit als bekannte Limitation beschreibt, ist damit auf Plattformebene ungemindert vorhanden. |
| KI-Transparenz (keine Simulation menschlicher Präsenz) | ✓ | Im Prompt verankert (QN-06), keine dedizierte Prüfung, aber die Rollenklarheits-Instruktion deckt dies inhaltlich ab. Login-Seite zeigt zudem "Forschungsprototyp" als Subline — sichtbare Kennzeichnung. |
| Keine übermäßige Bestätigung (Sycophancy) | ~ | Siehe 2.1.1 — Prompt-Instruktion vorhanden, kein Post-Check. |
| Bias-Erkennung / konsistente Prinzipien unabhängig von Nutzer-Merkmalen | ⬜ | Keine gezielte Maßnahme, kein Test. Nicht evaluiert. |

## 2.X.4 Rechtliche Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Datenminimierung, Zweckbindung | ✓ | Datenbankschema ist bewusst minimal (`profiles`, `sessions`, `messages`) — keine Pflicht-Demografiefelder, keine Analytics/Tracking-Pixel (siehe [02_datenbankschema.md](02_datenbankschema.md)). |
| RLS / Zugriffsschutz | ✓ | Vollständig umgesetzt für alle drei Tabellen ([supabase/migrations/001_initial.sql](../supabase/migrations/001_initial.sql)). |
| DSGVO-konforme Verarbeitung biometrischer Daten (Voice, Art. 9) | ⚠ | **Bewusste, dokumentierte Abweichung.** Audio läuft über OpenAI-Infrastruktur ohne garantierte EU-Datenspeicherung. Im Forschungsrahmen mit informierter Einwilligung vertretbar, für eine kommerzielle Plattform nicht ausreichend. Ausführlich begründet in [05_voice-architektur.md](05_voice-architektur.md), Abschnitt "Forschungsrahmen und Datenschutz". |
| EU AI Act Art. 5 (Emotionsinferenz aus biometrischen Daten) | ✓ | Dieser Anforderung wird durch eine Auswahlentscheidung entsprochen, nicht durch technische Kontrolle: Hume EVI wurde explizit deshalb ausgeschlossen (Entscheidungslog in [05_voice-architektur.md](05_voice-architektur.md)). |
| Löschkonzept / Datenexport | ⬜ | Nicht umgesetzt. Nachrichten werden dauerhaft gespeichert, eine Löschfunktion nach Zeitraum ist als Zukunftsfeature vorgesehen ([02_datenbankschema.md](02_datenbankschema.md)), aber nicht terminiert. |
| Einwilligungsmanagement | ⬜ | Kein Consent-Screen in der UI. Der in Backlog B-17 beschriebene Auftrags-Screen ("Der Auftrag (A) wurde bereits durch die Benutzeroberfläche eingeholt") ist im Systemprompt vorausgesetzt, aber die UI dafür existiert nicht — KICO startet direkt mit der Zielfrage, ohne dass eine bewusste Einwilligung eingeholt wurde. |

## 2.X.5 Funktionale Anforderungen

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Session starten/fortsetzen, Historie | ✓ | Dashboard lädt bisherige Sessions inkl. Preview, `/session/[id]` lädt vollständige Nachrichtenhistorie. |
| Text- und Voice-Modus im selben Gespräch | ✓ | `SessionShell` erlaubt nahtlosen Wechsel, beide Modi schreiben in dieselbe `messages`-Tabelle. |
| Mitschrift / Protokollansicht | ⬜ | Rohtranskript wird gespeichert, aber keine Read-only-Ansicht dafür (Backlog B-08). |
| Zieldefinition, Fortschrittskontrolle über Sessions | ⬜ | Nicht umgesetzt — hängt an Memory-Architektur (siehe Ebene 3/4 unten). |
| Vorname-Onboarding | ✓ | Einmalige Abfrage beim ersten Login ([components/dashboard/Dashboard.tsx](../components/dashboard/Dashboard.tsx)). |

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
| Kein clientseitiger API-Key | ✓ | Anthropic- und OpenAI-Keys verlassen den Server nie; Voice nutzt Ephemeral Keys für WebRTC. |
| TLS, sichere Authentifizierung | ✓ | Netlify (TLS), Supabase Auth mit OTP statt Passwort (kein Passwort-Diebstahlrisiko). |
| Server Components für sensible Routen | ✓ | `/session` und `/session/[id]` sind React Server Components mit serverseitiger Auth-Prüfung. |

### Monitoring / Qualitätssicherung

| Anforderung | Status | Umsetzung / Begründung |
|---|:---:|---|
| Feedbackschleife, aggregierte Qualitätsmetadaten | ⬜ | In der Arbeit als Verarbeitungsschicht 6 beschrieben ("Clinical Oversight Loop"), im Code nicht vorhanden. Keine Metrik erfasst, ob Sessions methodisch sauber verlaufen. |
| Prompt-Versionierung | ✓ | Git-versioniert, da Teil des Quellcodes. Kein separates Änderungsprotokoll über den Git-Log hinaus. |

---

## Voice-spezifischer Abgleich: QN-12 (Gesprächsrhythmik)

> **Update Juli 2026:** Die Analyse in diesem Abschnitt bezieht sich auf die zum Zeitpunkt der Erstellung implementierte Push-to-Talk-Lösung. Im Anschluss wurde entschieden, die Voice-Architektur grundsätzlich von Speech-to-Speech auf Cascaded umzustellen — Begründung und Kontext in [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md). Die folgende Einordnung bleibt als Momentaufnahme der Umsetzung zum Zeitpunkt vor dieser Entscheidung gültig, beschreibt aber nicht mehr den aktuellen Planungsstand.

Dieser Abschnitt verdient eine gesonderte Behandlung, weil sich der Umsetzungsstand seit `08_kapitel-schweige-problem.md` faktisch verändert hat, ohne dass die bestehende Dokumentation das nachvollzieht.

**Ausgangslage laut Doku:** `08_kapitel-schweige-problem.md` dokumentiert drei getestete Konfigurationspfade für `turn_detection` auf `gpt-realtime-2` (alle gescheitert) und schließt: *"Einen vierten Pfad gibt es nicht."* Die empfohlene Konsequenz war ein rein methodischer Umgang mit dem Limit (phasenbezogener Voice-Einsatz, Transparenz), nicht eine technische Lösung.

**Tatsächlicher Code-Stand:** [components/chat/VoiceSession.tsx](../components/chat/VoiceSession.tsx) implementiert **kein VAD-basiertes Turn-Taking mehr**, sondern manuelles Push-to-Talk: Das Mikrofon-Audiotrack ist standardmäßig deaktiviert (`enabled = false`), der Coachee öffnet es per Klick, spricht, und schließt es per Klick wieder — erst dann werden `input_audio_buffer.commit` und `response.create` explizit gesendet. Da kein kontinuierlicher Audiostream an das Modell geht, hat automatische Turn-Detection nichts zu interpretieren; Denkpausen innerhalb eines geöffneten Mikrofonfensters werden nie als Gesprächsende missverstanden.

**Einordnung — kein vierter Konfigurationspfad, sondern eine Umgehung:** Dies löst das in Kapitel 3 der Abschlussarbeit beschriebene Problem nicht auf der Ebene der Turn-Detection-Konfiguration (die bleibt unkonfigurierbar), sondern durch einen Architekturwechsel, der Turn-Detection für diesen Anwendungsfall überflüssig macht. Das erfüllt den Kern von QN-12 (Kontrolle über den Gesprächsrhythmus liegt beim Coachee, nicht beim Modell) — aber um den Preis, dass die in `docs/05_voice-architektur.md` ursprünglich formulierte Motivation für Voice ("sprachliche Spontaneität ... ohne Kompression") teilweise unterlaufen wird: Der Coachee muss jede Sprechabsicht durch einen expliziten Mikrofon-Klick markieren, bevor er sprechen kann — ein sprunghafteres Interaktionsmodell als freies Gespräch, aber eines, das dem Coachee statt dem Modell die Kontrolle über den Zeitpunkt gibt.

**Konsequenz für diese Dokumentation:** `docs/05_voice-architektur.md` und `docs/08_kapitel-schweige-problem.md` beschreiben beide noch die zuvor evaluierte, verworfene Semantic-VAD-Konfiguration (`silence_duration_ms: 1800`, `threshold: 0.8`) als wären sie die aktuelle Zielarchitektur. Das ist bereits in Backlog B-16 als Lücke vermerkt. Dieser Abgleich bestätigt zusätzlich: Es fehlt nicht nur die Synchronisation der Parameter-Werte, sondern die Dokumentation des grundsätzlichen Architekturwechsels von VAD-basiertem zu PTT-basiertem Turn-Taking. Empfehlung: `05_voice-architektur.md` (Abschnitt "Semantic VAD") und `08_kapitel-schweige-problem.md` (Abschnitt 8, "Konsequenzen für diese Plattform") um die PTT-Lösung als tatsächlich umgesetzte Antwort auf QN-12 ergänzen, bei gleichzeitiger Klarstellung, dass das übergeordnete Feldproblem (Abschnitt 9 der Arbeit) davon unberührt bleibt — PTT ist eine plattformspezifische Umgehung, keine Lösung des strukturellen Widerspruchs zwischen Gesprächsfluss-Optimierung und Coaching-Gesprächsraum.

---

## Zusammenfassung: Größte offene Architekturlücken

Priorisiert nach Auswirkung auf die Kernthese "Methode vor Modell":

1. **Kein deterministischer Sicherheits-Pre-Filter** (B-05b) — MIND-SAFE ist vollständig modellabhängig, das RLHF-Konflikt-Problem aus Kapitel 1 der Arbeit ist auf Plattformebene ungemindert vorhanden.
2. **Keine Memory-Architektur** (B-12, B-13) — "Kontext statt Sitzung" ist ein zentrales Architekturprinzip der Arbeit, aber technisch nicht existent. Jede Session ist faktisch eigenständig.
3. **Werkzeugbeschreibungen und Auswahllogik fehlen** (B-01, B-02) — der Methodenkorpus ist benannt, nicht operationalisiert. Größtes Risiko für Rückfall in generisches Coaching-Verhalten.
4. **Kein Server-seitiges Phasentracking** (B-05c) — Prozessverantwortung liegt vollständig beim Modell, nicht bei einer verlässlichen Datenstruktur.
5. **Voice/DSGVO-Gap** (⚠, strukturell) — im Forschungsrahmen akzeptiert, für jede Weiterentwicklung über den Forschungsrahmen hinaus zwingend zu lösen.

Diese fünf Punkte sind der wahrscheinlichste Kern des Abschnitts "wo den Anforderungen aus technischer Limitierung nicht entsprochen werden konnte" im finalen Kapitel 3 — mit der Einschränkung, dass 1–4 keine technischen Grenzen im engeren Sinne sind, sondern schlicht noch nicht gebaute, aber baubare Bausteine. Nur Punkt 5 und das Schweige-Problem (siehe oben) sind tatsächliche Grenzen des aktuellen Technologiestands.
