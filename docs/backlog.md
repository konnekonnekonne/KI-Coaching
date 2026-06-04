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

## Forschung / Dokumentation

### B-11 — Datenschutz-Gap Voice (DSGVO)
**Priorität:** Bekannt, bewusst akzeptiert im Forschungsrahmen
**Status:** Dokumentiert in `docs/05_voice-architektur.md`

Audio-Daten laufen über OpenAI-Infrastruktur ohne garantierte EU-Datenspeicherung. Im Forschungskontext mit informierter Einwilligung akzeptabel. Für eine kommerzielle Weiterentwicklung zwingend zu lösen: OpenAI Enterprise oder Wechsel zu Gemini Live (Vertex AI).

---

### B-14 — Abschlussarbeit: Kapitelstruktur klären
**Priorität:** Mittel
**Status:** Offen

Drei offene Punkte zur Struktur der Abschlussarbeit:

1. **„x"-Kapitel-Entscheidung:** Das Kapitel „Technische Umsetzung der Plattform" (aktuell mit Platzhalter „x" nummeriert) ist als Legacy markiert. Entscheiden: entfernen, in Kapitel 3 integrieren oder als eigenständiges Kapitel weiterführen.
2. **Fußnotenformat:** Der Abschnitt „Von der Instruktion zur Architektur" in Kapitel 3 verwendet `¹` (Hochzahl), während das restliche Kapitel `[1]`, `[2]` etc. verwendet. Der Querverweis auf die RLHF-Problematik sollte als `[3]` inline gesetzt werden (entspricht der arXiv-Quelle aus Kapitel 2).
3. **Folgekapitel:** Nach Kapitel 3 fehlen noch Evaluation/Diskussion und Fazit. Strukturplanung steht aus.

---

*Zuletzt aktualisiert: Juni 2026*
