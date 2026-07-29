# Backlog — Offene Punkte & identifizierte Lücken

*Dieses Dokument sammelt Themen, die erkannt und bewertet wurden, aber noch nicht umgesetzt sind. Kein Issue-Tracker — eher ein ehrliches Gedächtnis des Projekts.*

---

## MVP — Priorisierte Reihenfolge (Stand 29. Juli 2026)

*Produktmanagement-Perspektive statt reiner Aufgabenliste: Was ist die kleinste Plattform, die (a) mit echten Pilot-Teilnehmenden ethisch vertretbar ist, (b) tatsächlich zeigt, was die Arbeit behauptet ("Methode vor Modell", nicht generischer Chatbot mit Coaching-Anstrich), und (c) eine vollständige, auswertbare Coaching-Session liefert? Alles andere folgt nach dem MVP, siehe die jeweiligen Einzeleinträge unten.*

1. **B-05b** — Deterministischer Krisen-Pre-Filter. Ethische Untergrenze für echte Teilnehmende, unabhängig von allem anderen umsetzbar (kann parallel zu #2 laufen).
2. **B-23** — Session-Umgebung: persistente Anker + punktueller strukturierter Input. Voraussetzung dafür, dass #3 und #4 tatsächlich gut werden — deshalb vor beiden eingeordnet, nicht danach.
3. **B-01 + B-02** — Werkzeugbeschreibungen + Tool-Auswahllogik. Größter Einzelposten, aber die methodische Kernthese der gesamten Arbeit — ohne das ist "Methode vor Modell" eine Behauptung ohne Substanz.
4. **B-17** — Auftrag/Consent-Screen. Der Systemprompt behauptet aktuell wörtlich, das sei schon eingeholt — ist es nicht. Baut auf #2 auf (Checkbox-Bestätigung, persistente Anzeige).
5. **B-04 + B-07** — Sessionabschluss + Beenden-Button. Ohne definiertes Ende ist eine Session methodisch keine vollständige, auswertbare Einheit.
6. **Stimmwahl-UI im Dashboard** — Backend/DB steht (siehe B-20), Oberfläche zur tatsächlichen Auswahl fehlt noch.

**Bewusst zurückgestellt (Post-MVP):** B-12/B-13 (Memory-Architektur — eine einzelne Session ist auch ohne Cross-Session-Gedächtnis vollständig auswertbar), Task 6/7 (Parallel-Agents, Phasentracking — Qualitätssicherung obendrauf, keine Voraussetzung für einen ersten Pilotdurchlauf), B-03/B-05 (emotionale Momente, Widerstand — methodische Politur, kein Blocker), B-08 (Protokollansicht), B-06 (leere Sessions — Aufräumen), B-11 (Anthropic-Datenresidenz bleibt dokumentierte Forschungs-Limitation, wie bei Deepgram/OpenAI bereits entschieden).

---

## Systemprompt

### B-01 — Werkzeugbeschreibungen fehlen
**Priorität:** Hoch
**Status:** Offen

Die ~20 INA CCW-Tools sind im Prompt namentlich aufgeführt, aber nicht beschrieben. Das Modell kennt die Namen, nicht die Logik. Für jeden Tool fehlt:
- Zweck (was bewirkt dieses Werkzeug im Gespräch?)
- Kernfragen (3–4 Schlüsselfragen, die durch das Tool führen)
- Abschlussindikator (woran merke ich, dass das Tool abgeschlossen ist?)

Ohne diese Beschreibungen fällt das Modell auf generisches Coaching-Verhalten zurück, statt methodisch zu arbeiten.

*Bezug zu B-23:* Mehrere Tools (Inneres Team, Perspektivenrad, Bodenanker-artige Techniken) brauchen strukturierte, persistent sichtbare Artefakte, nicht nur Fließtext. Ohne die Session-Umgebung aus B-23 lässt sich die inhaltliche Beschreibung dieser Tools nicht vollständig in echtes Verhalten übersetzen.

**Aufwand:** Hoch — erfordert inhaltliche Durcharbeitung jedes einzelnen Tools.

---

### B-02 — Tool-Auswahllogik fehlt
**Priorität:** Hoch
**Status:** Offen — hängt von B-01 ab

Es gibt keine Guidance, wann welches Tool eingesetzt wird. Das Modell kann nicht eigenständig zwischen Tetralemma, Innerem Team, Logischen Ebenen oder Perspektivenrad wählen, weil keine Indikationskriterien definiert sind.

Benötigt wird eine Entscheidungslogik, z.B.:
- Zwei explizite Optionen → Tetralemma
- Werte oder Identitätsfragen → Logische Ebenen / 5 Säulen
- Feststecken in einer Perspektive → Perspektivenrad / Erweiterter Perspektivwechsel
- Innere Konflikte, mehrere Stimmen → Inneres Team
- Ziel vorhanden, kein Weg → Wege zum Ziel
- Breites, unklares Anliegen → Skalierung oder Zielematrix

**Aufwand:** Mittel — sobald B-01 gelöst ist, relativ schnell umsetzbar.

---

### B-03 — Emotionale Momente nicht adressiert
**Priorität:** Mittel
**Status:** Offen

Der Prompt schweigt dazu, was KICO tut, wenn jemand emotional wird: Weinen, Scham, Wut, Überwältigung, plötzliches Schweigen aus Betroffenheit. Das ist kein Krisenfall (dafür gibt es MIND-SAFE), aber methodisch eine eigene Situation, die Verlangsamung statt Weiterfragen erfordert.

Benötigt: kurze Guidance für emotionale Präsenz — Anerkennen, Verlangsamen, Raum lassen, erst dann fortführen.

---

### B-04 — Sessionabschluss nicht beschrieben
**Priorität:** Mittel
**Status:** Offen

Die Transfer-Phase (Phase 5) ist im Prompt benannt, aber nicht ausgeführt. Was macht einen guten Abschluss aus? Vorschlag:
- Eine konkrete Vereinbarung mit dem Coachee (nicht Aufgabe, sondern Intention)
- Eine Abschlussreflexion: „Was nimmst du aus dieser Session mit?"
- Ein würdigendes Schlusswort von KICO

Derzeit gibt es kein Abschlussritual — Sessions enden einfach irgendwo.

---

### B-05 — Kein expliziter Umgang mit Widerstand / Intellektualisieren
**Priorität:** Niedrig
**Status:** Offen

Wenn der Coachee ausweicht, rationalisiert oder das Gespräch auf eine Meta-Ebene zieht ("ich weiß schon genau, warum ich das mache"), hat KICO keine Instruktion, wie damit umzugehen ist. Systemisches Arbeiten erfordert hier oft eine sanfte Konfrontation oder Musterbenennung — das fehlt.

---

### B-05b — Serverseitiger Code-Filter vor dem LLM-Call (MIND-SAFE Hardening)
**Priorität:** Hoch
**Status:** Offen

Aktuell ist MIND-SAFE ausschließlich eine Instruktion im Systemprompt — keine technische Sperre. Das Modell befolgt die Instruktion mit hoher, aber nicht absoluter Verlässlichkeit. Für einen Coaching-Kontext mit potentiell vulnerablen Personen ist das ein architektonisches Risiko.

Ergänzung: Vor jedem LLM-Call prüft ein deterministischer Code-Filter (kein Modell, kein Ermessensspielraum) die User-Nachricht auf explizite Krisenbegriffe (Wortliste). Bei Treffer wird der LLM-Call nicht ausgeführt — stattdessen wird die Krisenressource direkt vom Server zurückgegeben.

Das löst nicht das Problem subtiler Krisensignale, setzt aber eine harte Untergrenze: bestimmte Muster lösen den Sicherheitsprotokoll immer aus, unabhängig vom Modellverhalten.

**Aufwand:** Mittel — Wortliste definieren, Pre-Check in `/api/chat/route.ts` einbauen, Response-Logik ergänzen.

---

### B-05c — Server-seitiger Session-State (Phasentracking)
**Priorität:** Mittel
**Status:** Offen

Aktuell schätzt das Modell selbst, in welcher Phase des U-Modells sich das Gespräch befindet — aus dem Gesprächsverlauf. Das ist unzuverlässig. Bei langen oder unstrukturierten Gesprächen verliert das Modell die Phasenorientierung.

Ergänzung: Der Server verfolgt die aktuelle Phase als expliziten State (`sessions.current_phase`). Bei jedem API-Call wird die aktuelle Phase in den Systemprompt injiziert: „Du befindest dich in Phase 2 — Vertiefung." Das Modell rät nicht mehr — es weiß.

Längerfristig ermöglicht das: Phasenübergänge erfordern explizite Bestätigung, Mindestanforderungen pro Phase werden serverseitig erzwungen.

**Aufwand:** Mittel — neues DB-Feld, State-Update-Logik, Injection in API-Route.

---

## Session-Umgebung (Text + Voice)

*Bislang zwei getrennte UI-Pfade (ChatWindow, VoiceSession). Diese drei Punkte gehören zusammen, weil sie alle dieselbe zugrundeliegende Lücke beschreiben: ein System für persistente Anker und punktuellen strukturierten Input, das unabhängig vom Gesprächsmodus funktioniert.*

### B-23 — Session-Umgebung: Persistente Anker + punktueller strukturierter Input
**Priorität:** Hoch (MVP-Voraussetzung für B-01/B-02, B-17)
**Status:** Offen — konzeptionell benannt (29. Juli 2026), noch nicht designt

Text und Voice sind aktuell zwei komplett getrennte UI-Pfade. Die Realität des Coachings braucht aber unabhängig vom Gesprächsmodus:
- **Persistente Anker:** Elemente, die während der gesamten Session sichtbar bleiben müssen — die Coachingfrage (B-18), Skalierungswerte, Ergebnisse aus Tools mit räumlicher/struktureller Komponente (z. B. Bodenanker im Inneren Team oder Perspektivenrad).
- **Punktueller strukturierter Input:** Manche Momente brauchen mehr als freien Text-/Sprachfluss — z. B. eine explizite Checkbox-Bestätigung des Auftrags (B-17), nachdem der Bot danach gefragt hat, oder ein bewusst festgelegter Skalierungswert statt einer beiläufig erwähnten Zahl.

Zwei denkbare Mechanismen, noch nicht entschieden:
1. Punktuelle strukturierte Eingabe-Elemente (Checkbox, Slider, Kurztext), die auch mitten in einer Voice-Session erscheinen können, ohne den Sprachfluss zu brechen.
2. KICO erfasst den Wert im natürlichen Gespräch (Text oder Sprache), ein Extraktionsschritt liest ihn strukturiert heraus, die Oberfläche zeigt ihn danach als bestätigten Anker an.

Ohne dieses System bleiben B-01 (viele INA-CCW-Tools brauchen genau solche Artefakte) und B-17 (Auftrag-Bestätigung) nur unvollständig umsetzbar — deshalb vor bzw. parallel zu beiden eingeordnet, nicht danach.

**Aufwand:** Hoch — echte Session-UI-Architektur-Frage, betrifft ChatWindow und VoiceSession gleichermaßen. Welcher Mechanismus (oder welche Kombination) zum Einsatz kommt, ist eine offene Design-Entscheidung, bewusst nicht in diesem Eintrag vorweggenommen.

---

### B-17 — Auftrag-UI-Screen (A in AZF)
**Priorität:** Mittel (MVP)
**Status:** Konzipiert, nicht gebaut

Das System-Prompt formuliert: "Der Auftrag (A) wurde bereits durch die Benutzeroberfläche eingeholt." Diese UI existiert noch nicht. Derzeit startet KICO direkt mit der Ziel-Frage, ohne dass der Coachee bewusst zugestimmt hat.

Vorschlag: Ein einfacher Zwischenscreen vor dem eigentlichen Session-Start. Fragt nach dem Anliegen (1–2 Sätze, formfrei) und holt die informierte Einwilligung ein. Übergibt das Anliegen dann als Kontext an KICO, ohne dass KICO nochmals danach fragt.

*Bezug zu B-23:* Die vorgeschlagene explizite Checkbox-Bestätigung (statt nur eines Freitextfelds) und die Frage, ob/wie der Auftrag danach persistent sichtbar bleibt, sind Spezialfälle des allgemeineren Anker-/Input-Systems aus B-23 — beide Punkte sollten zusammen entworfen werden, nicht getrennt.

---

### B-18 — Coaching-Frage als persistenter Anker
**Priorität:** Mittel (MVP, Teilmenge von B-23)
**Status:** Konzipiert, nicht gebaut

Der System-Prompt beschreibt die Coaching-Frage als "roten Faden", den KICO wörtlich zurückspiegelt und durch die Session trägt. Methodisch wäre es stärker, wenn die Frage auch visuell präsent bleibt: einmalig vom Coachee formuliert, dann fixiert sichtbar — im Text- **und** im Voice-Modus, nicht nur "am oberen Rand des Chat-Fensters".

Umsetzung: Nach Erkennung der Coachingfrage (Pattern im KICO-Output oder explizites DB-Feld) wird sie aus dem Gesprächsverlauf extrahiert und als `sessions.coaching_question` gespeichert. Die Session-UI zeigt sie fixiert an — unabhängig vom Modus.

*Bezug zu B-23:* Dies ist der am konkretesten ausgearbeitete Einzelfall des allgemeinen Anker-Systems — beim Design von B-23 als erstes Referenzbeispiel nutzen.

---

## Plattform / Features

### B-06 — Leere Sessions in der Sessionliste
**Priorität:** Niedrig
**Status:** Offen

Sessions, die gestartet aber ohne Nachrichten verlassen wurden, erscheinen in der Dashboard-Liste. Sie haben keine Preview, wirken wie Fehler. Lösung: Sessions mit 0 Nachrichten aus der Liste filtern oder nach einer Stunde ohne Aktivität automatisch entfernen.

---

### B-07 — Kein Abschluss-Button in der Session-UI
**Priorität:** Mittel
**Status:** Offen

Es gibt keinen expliziten "Session beenden"-Button im Text-Modus (nur im Voice-Modus). Der Coachee kann das Gespräch nur durch Navigieren verlassen. Ein bewusster Abschluss-Moment wäre methodisch sinnvoll — und würde die Transfer-Phase (B-04) aktivieren.

---

### B-08 — Keine Protokollansicht
**Priorität:** Niedrig
**Status:** Offen

Im Dashboard ist "Zugriff auf Protokolle" als Feature geplant, aber nicht umgesetzt. Sessions sind in der DB gespeichert — die Ansicht einer Einzelsession mit vollem Transkript fehlt noch. (Die Session-Seite `/session/[id]` lädt die Session, aber zeigt nur das aktive Chat-Interface, nicht ein Read-only-Protokoll.)

---

### B-22 — Netlify zeigte auf falsches (altes) Supabase-Projekt
**Priorität:** Hoch
**Status:** Behoben (29. Juli 2026)

Beim ersten End-to-End-Test der Cascaded-Voice-Architektur (Task 10) zeigte sich: `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` in Netlify zeigten weiterhin auf das alte Projekt `ejxiboybvwpeknghlvar.supabase.co`, obwohl die gesamte Migrations- und MCP-Arbeit dieser und der vorherigen Session bereits gegen das neue Projekt `rccugewhmscysohzewfw.supabase.co` lief (siehe B-21, B-09). Die Live-Seite hat demnach seit dem eigentlichen Projektwechsel durchgehend die alte Datenbank benutzt — Sessions wurden dort angelegt, während der neue Voice-Agent (mit korrekt konfiguriertem `SUPABASE_URL`-Secret) gegen das neue Projekt schrieb. Das führte zu einem Fremdschlüssel-Fehler beim Schreiben des Transkripts (`session_id` existierte nur im alten Projekt).

Entdeckt durch Verifikation des tatsächlich im Client-Bundle ausgelieferten Supabase-Hosts (nicht nur durch Doku-Abgleich) — ein weiterer Beleg dafür, dass Live-Verifikation nötig ist, wo Dokumentation und Konfiguration auseinanderlaufen können (vgl. B-21).

Behoben durch Aktualisierung der Netlify-Umgebungsvariablen auf das neue Projekt, gefolgt von einem erzwungenen Rebuild (`NEXT_PUBLIC_*`-Variablen werden zur Build-Zeit eingebacken, ein reines Speichern der Variable reicht nicht). Altes Projekt bleibt bestehen, ist aber von der Live-Seite aus nicht mehr referenziert — enthielt laut Stichprobe nur Sessions vom 8./9. Juni (vermutlich frühe Tests, keine bekannten produktiven Nutzerdaten).

---

### B-21 — Migration 002 fehlte live, Onboarding defekt
**Priorität:** Hoch
**Status:** Behoben (Juli 2026)

Per Supabase-MCP-Zugriff verifiziert: `002_add_firstname.sql` war auf dem aktuellen Supabase-Projekt (`rccugewhmscysohzewfw`) nie ausgeführt worden — `profiles.first_name` und `sessions.message_count` fehlten live, obwohl beide Migrationsdateien im Repo vorhanden sind. Supabase's eigene Migrationshistorie (`list_migrations`) war leer, was darauf hindeutet, dass SQL bisher per Copy-Paste im SQL-Editor statt über die CLI ausgeführt wurde. Die fehlende `first_name`-Spalte machte den Vorname-Onboarding-Flow ([Dashboard.tsx](../components/dashboard/Dashboard.tsx)) faktisch unbenutzbar: Jeder neue Account blieb am Onboarding-Screen hängen, weil das Update gegen eine nicht existierende Spalte fehlschlug. Migration wurde per `apply_migration`-Tool nachgezogen und ist jetzt getrackt. Details: [02_datenbankschema.md](02_datenbankschema.md).

Diese Klasse von Fehlern (Doku/Migration vs. Live-Realität) ist ein Argument dafür, den Live-Schema-Stand künftig regelmäßig per Supabase-MCP zu verifizieren statt sich auf Migrationsdateien allein zu verlassen — besonders relevant, da die Cascaded-Voice-Migration (B-20) neue Tabellen/Spalten einführen wird.

---

### B-09 — Voice-Transkript-Speicherung noch nicht auf neuem Supabase-Projekt bestätigt
**Priorität:** Hoch
**Status:** Ungetestet — durch B-20 in der bisherigen Form hinfällig

Nach der Supabase-Migration wurde der user_id-Fix für Voice-Transkripte committed, aber nicht live getestet. Es ist unklar, ob Voice-Nachrichten korrekt in der neuen Datenbank landen. *Update Juli 2026:* Die veraltete Projekt-Referenz in `docs/06_deployment.md` (`ejxiboybvwpeknghlvar` statt `rccugewhmscysohzewfw`) ist korrigiert — das war die Doku-Seite dieser Migration, die tatsächliche Datenlage in der neuen DB ist damit aber weiterhin ungetestet. *Bezug zu B-20:* Betrifft die Whisper-Workaround-Speicherung der Speech-to-Speech-Architektur, die im Zuge der Migration ersetzt wird — die Transkript-Speicherung wird in der Cascaded-Architektur neu aufgebaut, nicht mehr repariert.

---

### B-10 — Schweige-Signal im Voice-Modus
**Priorität:** Niedrig
**Status:** Bewusst zurückgestellt

Ein nicht-sprachliches Präsenzsignal bei längerem Schweigen (z.B. sanftes Ton-Signal nach 8 Sekunden ohne Sprache) wäre methodisch wertvoll — Stille als Werkzeug, nicht als Leere. Technisch möglich über DataChannel-Events, aber noch nicht konzipiert. *Bezug zu B-20:* In der Cascaded-Architektur an die Wahl des Turn-Detectors gekoppelt — bei der Neuplanung mitzudenken, nicht mehr an OpenAI-DataChannel-Events gebunden.

---

### B-12 — Memory-Architektur: Ebenen 3 und 4 implementieren
**Priorität:** Hoch
**Status:** Konzipiert, nicht gebaut (siehe `docs/07_informationsarchitektur.md`)

Ebene 3 (Feldnotiz-Generierung am Session-Ende) und Ebene 4 (Memory-Injektion zu Beginn einer neuen Session) sind architektonisch beschrieben aber nicht implementiert. Benötigt:
- Neues DB-Feld `sessions.field_note text`
- Neues DB-Feld `profiles.coaching_notes text`
- Summarization-Endpunkt oder automatischer Trigger
- Injection-Logik in `/api/chat/route.ts`

Abhängigkeit: B-07 (Abschluss-Button) als natürlicher Trigger für Feldnotiz-Generierung.

---

### B-13 — Feldnotiz-Meta-Prompt entwickeln
**Priorität:** Hoch
**Status:** Offen — hängt von B-12 ab

Der Prompt, der aus einem Rohtranskript eine Feldnotiz generiert, ist eine eigenständige Entwicklungsaufgabe. Anderer Zweck als der Coaching-Prompt: kein Dialog, sondern strukturierte Beobachtung. Kernprinzip: keine Auflösung von Widersprüchen, keine Interpretation — nur was noch trägt. Abschnitte: Was mitgebracht wurde / Was sichtbar wurde / Was sich verändert hat / Was offen bleibt / Leitfrage / Methode / Vereinbarung.

---

## Voice-Architektur

### B-20 — Migration zu Cascaded Voice-Architektur
**Priorität:** Hoch
**Status:** Kernfunktion deployed und live (28. Juli 2026), Erweiterungen offen

Wechsel von Speech-to-Speech (OpenAI `gpt-realtime`) zu Cascaded (Deepgram STT/TTS → Claude Sonnet) umgesetzt und auf Pipecat Cloud deployed (Agent `kico`, Region eu-central). Begründung: [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md). Umsetzungsdetails, Stolpersteine und offene Punkte: [11_voice-cascaded-umsetzung.md](11_voice-cascaded-umsetzung.md).

End-to-End-Test im Browser: bestanden (29. Juli 2026, siehe B-15). Noch offen: Parallel-Agents (Sentiment/Konsistenz/QN-Prüfung, Post-MVP), Phasentracking-Logik (Post-MVP), Text→Voice-Kontextübergabe, Stimmwahl-UI im Dashboard (MVP, siehe oben).

---

### B-15 — QN-12 Gesprächsrhythmik formal in Qualitätsnormen aufnehmen
**Priorität:** Hoch
**Status:** Funktionstest bestanden (29. Juli 2026) — formale Eintragung in Qualitätsnormen-Dokument noch offen

Das Schweige-Problem ist als Forschungsbefund dokumentiert und als QN-12 angekündigt. Die Norm muss noch formal in `qualitaetsnormen.md` eingetragen werden.

Standard: Jede Voice-Komponente, die für diese Plattform evaluiert wird, muss nachweislich konfigurierbare oder deaktivierbare Turn Detection unterstützen. Die Konfigurierbarkeit muss durch Funktionstest verifiziert werden, nicht durch Herstellerdokumentation allein.

*Bezug zu B-20:* Umgesetzt — Silero VAD (`stop_secs=2.0` statt Standard 0.2s) in `voice-agent/bot.py`, direkt im installierten Quellcode verifiziert. Der von dieser Norm geforderte Funktionstest ("muss durch Funktionstest verifiziert werden") wurde am 29. Juli 2026 erbracht: mehrere Gesprächswechsel über echtes Mikrofon, `stop_secs=2.0` fühlte sich im Gebrauch angemessen an. Details: [11_voice-cascaded-umsetzung.md](11_voice-cascaded-umsetzung.md). Verbleibend offen: die formale Eintragung von QN-12 in ein eigenständiges Qualitätsnormen-Dokument (`qualitaetsnormen.md` existiert noch nicht als Datei).

---

### B-16 — Voice-Architektur-Dokumentation bereinigen
**Priorität:** Erledigt durch Migration
**Status:** Durch B-20 überholt

`docs/05_voice-architektur.md` enthielt veraltete, nie wirksame Semantic-VAD-Parameter (`silence_duration_ms: 1800`, `threshold: 0.8`). Statt die alte Dokumentation zu synchronisieren, wurde sie im Zuge von B-20 als historisches Dokument markiert (Banner in `05_voice-architektur.md`) — eine Synchronisation ist damit hinfällig, die Zielarchitektur wird stattdessen unter `10_` und folgenden neu dokumentiert.

---

## Forschung / Dokumentation

### B-11 — Datenschutz-Gap Voice (DSGVO)
**Priorität:** Bekannt, bewusst akzeptiert im Forschungsrahmen
**Status:** Dokumentiert in `docs/05_voice-architektur.md`

Audio-Daten laufen über OpenAI-Infrastruktur ohne garantierte EU-Datenspeicherung. Im Forschungskontext mit informierter Einwilligung akzeptabel. Für eine kommerzielle Weiterentwicklung zwingend zu lösen: OpenAI Enterprise oder Wechsel zu Gemini Live (Vertex AI). *Bezug zu B-20:* Teilweise gelöst — Deepgram (STT/TTS) läuft jetzt über `api.eu.deepgram.com`, Pipecat Cloud in Region eu-central (Frankfurt). Anthropics eigene Datenresidenz für die Voice-Pipeline wurde noch nicht geprüft — verbleibt offen.

---

### B-14 — Abschlussarbeit: Kapitelstruktur klären
**Priorität:** Mittel
**Status:** Teilweise offen

Drei offene Punkte zur Struktur der Abschlussarbeit:

1. **„x"-Kapitel-Entscheidung:** Das Kapitel „Technische Umsetzung der Plattform" (aktuell mit Platzhalter „x" nummeriert) ist als Legacy markiert. Entscheiden: entfernen, in Kapitel 3 integrieren oder als eigenständiges Kapitel weiterführen.
2. **Fußnotenformat:** Der Abschnitt „Von der Instruktion zur Architektur" in Kapitel 3 verwendet `¹` (Hochzahl), während das restliche Kapitel `[1]`, `[2]` etc. verwendet. Der Querverweis auf die RLHF-Problematik sollte als `[3]` inline gesetzt werden (entspricht der arXiv-Quelle aus Kapitel 2).
3. **Folgekapitel:** Nach Kapitel 3 fehlen noch Evaluation/Diskussion und Fazit. Strukturplanung steht aus.
4. **Kapitel [X] einordnen:** Das Schweige-Problem-Kapitel (`docs/08_kapitel-schweige-problem.md`) muss in die Kapitelstruktur der Arbeit eingegliedert werden. Möglichkeiten: als Unterkapitel von Kapitel 3 (nach der Voice-Architektur-Sektion), oder als eigenständiges Kapitel 4 vor der Evaluation.

---

### B-19 — Abschlussarbeit: Drei neue akademische Quellen einarbeiten
**Priorität:** Hoch
**Status:** Offen

Die Recherche für das Schweige-Problem-Kapitel hat drei Quellen identifiziert, die auch für Kapitel 2 relevant sind und dort zitiert werden könnten:

- **Sedlakova & Trachsel (2026)** — Bestätigt die Stille-Problematik für KI-Gesprächssysteme generell; ergänzt die Diskussion über strukturelle Grenzen von KI im therapeutischen/Coaching-Kontext (passt zu Kapitel 2, Abschnitt "Was KI nicht kann").
- **Jiang et al. (CHI 2026), arXiv:2602.06134** — Taxonomie von fünf Stille-Typen im Coaching; empirische Belege für den Wert von Pacing. Direkt anwendbar auf die Evaluation in Kapitel 5/6.
- **Kasner et al. (2025), arXiv:2510.22610** — 37,1 % unberechtigte Unterbrechungsrate bei Voice-KI; konkreter Messwert für den Methodenmangel.

---

*Zuletzt aktualisiert: 29. Juli 2026 — MVP-Priorisierung ergänzt*
