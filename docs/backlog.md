# Backlog — Offene Punkte & identifizierte Lücken

*Dieses Dokument sammelt Themen, die erkannt und bewertet wurden, aber noch nicht umgesetzt sind. Kein Issue-Tracker — eher ein ehrliches Gedächtnis des Projekts.*

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

### B-09 — Voice-Transkript-Speicherung noch nicht auf neuem Supabase-Projekt bestätigt
**Priorität:** Hoch
**Status:** Ungetestet

Nach der Supabase-Migration wurde der user_id-Fix für Voice-Transkripte committed, aber nicht live getestet. Es ist unklar, ob Voice-Nachrichten korrekt in der neuen Datenbank landen.

---

### B-10 — Schweige-Signal im Voice-Modus
**Priorität:** Niedrig
**Status:** Bewusst zurückgestellt

Ein nicht-sprachliches Präsenzsignal bei längerem Schweigen (z.B. sanftes Ton-Signal nach 8 Sekunden ohne Sprache) wäre methodisch wertvoll — Stille als Werkzeug, nicht als Leere. Technisch möglich über DataChannel-Events, aber noch nicht konzipiert.

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

### B-15 — QN-12 Gesprächsrhythmik formal in Qualitätsnormen aufnehmen
**Priorität:** Hoch
**Status:** Beschlossen, noch nicht eingetragen

Das Schweige-Problem ist als Forschungsbefund dokumentiert und als QN-12 angekündigt. Die Norm muss noch formal in `qualitaetsnormen.md` eingetragen werden.

Standard: Jede Voice-Komponente, die für diese Plattform evaluiert wird, muss nachweislich konfigurierbare oder deaktivierbare Turn Detection unterstützen. Die Konfigurierbarkeit muss durch Funktionstest verifiziert werden, nicht durch Herstellerdokumentation allein.

---

### B-16 — Voice-Architektur-Dokumentation bereinigen
**Priorität:** Mittel
**Status:** Offen

`docs/05_voice-architektur.md` enthält in der Semantic-VAD-Sektion noch:
- `silence_duration_ms: 1800` als geplante Konfiguration
- `threshold: 0.8` als geplante Konfiguration

Beide Parameter wurden nie wirksam. Die vollständige Testdokumentation liegt in `docs/08_kapitel-schweige-problem.md`. Die technische Architektur-Dokumentation sollte mit diesem Stand synchronisiert werden.

---

### B-17 — Auftrag-UI-Screen (A in AZF)
**Priorität:** Mittel
**Status:** Konzipiert, nicht gebaut

Das System-Prompt formuliert: "Der Auftrag (A) wurde bereits durch die Benutzeroberfläche eingeholt." Diese UI existiert noch nicht. Derzeit startet KICO direkt mit der Ziel-Frage, ohne dass der Coachee bewusst zugestimmt hat.

Vorschlag: Ein einfacher Zwischenscreen vor dem eigentlichen Session-Start. Fragt nach dem Anliegen (1–2 Sätze, formfrei) und holt die informierte Einwilligung ein. Übergibt das Anliegen dann als Kontext an KICO, ohne dass KICO nochmals danach fragt.

Abhängigkeit: Kein Blocker, kann unabhängig umgesetzt werden.

---

### B-18 — Coaching-Frage als persistenter Anker
**Priorität:** Mittel
**Status:** Konzipiert, nicht gebaut

Der System-Prompt beschreibt die Coaching-Frage als "roten Faden", den KICO wörtlich zurückspiegelt und durch die Session trägt. Methodisch wäre es stärker, wenn die Frage auch visuell präsent bleibt: einmalig vom Coachee formuliert, dann fixiert am oberen Rand des Chat-Fensters sichtbar.

Umsetzung: Nach Erkennung der Coachingfrage (Pattern im KICO-Output oder explizites DB-Feld) wird sie aus dem Chat-Verlauf extrahiert und als `sessions.coaching_question` gespeichert. Die Session-UI zeigt sie fixiert über dem Chat.

---

## Forschung / Dokumentation

### B-11 — Datenschutz-Gap Voice (DSGVO)
**Priorität:** Bekannt, bewusst akzeptiert im Forschungsrahmen
**Status:** Dokumentiert in `docs/05_voice-architektur.md`

Audio-Daten laufen über OpenAI-Infrastruktur ohne garantierte EU-Datenspeicherung. Im Forschungskontext mit informierter Einwilligung akzeptabel. Für eine kommerzielle Weiterentwicklung zwingend zu lösen: OpenAI Enterprise oder Wechsel zu Gemini Live (Vertex AI).

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

*Zuletzt aktualisiert: Juni 2026*
