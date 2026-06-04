# 07 — Informationsarchitektur

*Wie KICO Informationen verarbeitet — von der ersten Nachricht bis zur übernächsten Session.*

---

## Übersicht: Die vier Verarbeitungsebenen

```
┌─────────────────────────────────────────────────────────────────┐
│  EBENE 1 — Live-Reaktion          (während des Gesprächs)       │
│  EBENE 2 — Rohtranskript          (während des Gesprächs)       │
│  EBENE 3 — Feldnotiz              (Ende der Session)            │
│  EBENE 4 — Memory-Injektion       (Beginn der nächsten Session) │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ebene 1 — Live-Reaktion

**Wann:** Bei jeder einzelnen Nachricht des Coachees, vor jeder Antwort von KICO.  
**Wer:** Das Sprachmodell (Claude), gesteuert durch den Systemprompt.  
**Wie:** Implizite Analyse im Kontext des laufenden Gesprächs — kein separater Prozess, sondern Teil der Inferenz.

### Was wird analysiert?

**Sicherheits-Trigger (MIND-SAFE) — höchste Priorität**
Jede Nachricht wird vor allem anderen geprüft auf:
- Suizidgedanken, Selbstverletzung, Fremdgefährdung
- Akute psychische Dekompensation
- Hinweise auf Gewalt oder Missbrauch

→ Bei Treffer: sofortiger Abbruch des Coaching-Prozesses, Krisenressourcen nennen, Session beenden.

**Kontextdrift — Fragen außerhalb des Coaching-Rahmens**
Erkennt, wenn der Coachee KICO für etwas anderes einsetzen will:
- Ratschläge, Empfehlungen, Entscheidungen abnehmen
- Recherche, technische Hilfe, allgemeine Fragen
- Therapieähnliche Anfragen ("Was ist mit mir nicht in Ordnung?")
- Metafragen über das System ("Bist du ein Mensch?", "Kannst du meinen Text prüfen?")

→ Sanfte Rückführung in den Coaching-Rahmen, transparente Rollenklärung.

**Prozessüberwachung — laufende Gesprächsqualität**
- Abdriften vom Thema / von der Leitfrage → expliziter Reconnect
- Phasenlage: Ist die aktuelle Phase abgeschlossen? Bereitschaft für Übergang?
- Emotionale Intensität: Verlangsamung und Präsenz statt Weiterfragen
- Widerstand oder Intellektualisieren → Musterbenennung
- Doppelfrage-Risiko, generische-Antwort-Risiko → Methodenkorpus aufrufen

**Voice-spezifische Trigger**
- Unverständliches Transkript → Nachfrage
- Sehr kurze Antworten ("ja", "weiß nicht") → Hypothese anbieten
- Schweigen → Raum lassen, nicht füllen

### Status
✓ Implementiert — durch aktuellen Systemprompt abgedeckt (mit Lücken, siehe Backlog B-01, B-02, B-03).

---

## Ebene 2 — Rohtranskript

**Wann:** Kontinuierlich, parallel zum Gespräch.  
**Wer:** Server (Next.js API Route), gespeichert in Supabase.  
**Wie:** Jede Nachricht — User und KICO — wird unmittelbar nach Eingang/Generierung in die `messages`-Tabelle geschrieben.

### Was wird gespeichert?

| Feld | Inhalt |
|------|--------|
| `session_id` | Zuordnung zur Session |
| `role` | `user` oder `assistant` |
| `content` | Vollständiger, unbearbeiteter Text |
| `created_at` | Zeitstempel |

**Für Voice-Sessions:** Das Whisper-Transkript der Sprachäußerung wird als `content` gespeichert — nicht das Audio selbst (Audio wird nicht gespeichert, siehe `docs/05_voice-architektur.md`).

### Prinzip
Das Rohtranskript ist vollständig und unberührt. Kein Inhalt wird gefiltert, gekürzt oder interpretiert. Es ist das einzige Archiv des tatsächlichen Gesprächs.

### Verwendung
- Basis für Ebene 3 (Feldnotiz-Generierung)
- Theoretisch zugänglich als Protokoll für den Coachee (noch nicht umgesetzt, siehe Backlog B-08)
- Forschungsdatenbasis

### Status
✓ Implementiert.

---

## Ebene 3 — Feldnotiz

**Wann:** Am Ende einer Session — ausgelöst durch einen expliziten Abschluss-Trigger.  
**Wer:** Separater Claude-API-Call mit einem dedizierten Meta-Prompt.  
**Wie:** Das vollständige Rohtranskript der Session wird an Claude übergeben mit der Aufgabe, eine strukturierte Feldnotiz zu generieren — kein Fazit, kein Insight-Extrakt, sondern eine Aufnahme dessen, was noch trägt.

### Was wird generiert?

```
Feldnotiz — Session [n] — [Datum]

Was der Coachee mitbrachte:
[Anliegen, emotionale Ausgangslage, Widersprüche, die bereits in der Eingangsschilderung
 sichtbar waren]

Was im Gespräch sichtbar wurde:
[Muster, Spannungsfelder, Momente von Bewegung, Momente von Widerstand — nicht aufgelöst,
 sondern beobachtet]

Was sich verändert hat:
[Minimale oder deutliche Verschiebungen — auch halbe Bewegungen zählen]

Was offen bleibt:
[Unbearbeitete Themen, wiederholt aufgetauchte Begriffe, offene Fragen — das ist der
 wichtigste Teil für Folgesessions]

Leitfrage der Session:
[Sofern formuliert]

Eingesetzte Methode(n):
[Welche INA CCW-Tools wurden verwendet]

Vereinbarung / Transfer:
[Was hat der Coachee mitgenommen — inkl. Qualität der Vereinbarung: klar / zögernd / offen]
```

### Wichtiges Designprinzip
Die Feldnotiz bewahrt Widersprüche und Wirrungen. Sie versucht nicht, Komplexität aufzulösen. Ein Coachee, der in Session 2 noch keine Antwort hat, soll in Session 3 nicht so behandelt werden, als hätte er sie.

### Trigger-Optionen
- **Explizit:** "Session beenden"-Button in der UI (Backlog B-07) — methodisch sauberste Lösung
- **Automatisch:** Beim Start der nächsten Session wird die vorherige automatisch verarbeitet
- **Inaktivität:** Nach X Minuten ohne Aktivität (unzuverlässig, nicht empfohlen)

### Speicherort
Neues Datenbankfeld: `sessions.field_note text`

### Status
⬜ Noch nicht implementiert. Abhängig von B-07 (Abschluss-Button).

---

## Ebene 4 — Memory-Injektion

**Wann:** Beim Start einer neuen Session, vor der ersten Nachricht.  
**Wer:** Server (`/api/chat`), bevor der Systemprompt an Claude übergeben wird.  
**Wie:** Feldnotizen der letzten Sessions + Coaching-Profil werden als zusätzlicher Block an den Systemprompt angehängt.

### Was wird geladen?

**Feldnotizen** (aus `sessions.field_note`)
- Alle vorhandenen Feldnotizen, älteste zuerst
- Tiering bei vielen Sessions: letzte 3–5 vollständig, ältere kondensiert
- Maximales Volumen: ~3.000 Wörter (ca. 4.000 Tokens) — skalierbar

**Coaching-Profil** (aus `profiles.coaching_notes`)
Ein persistentes, nach jeder Session aktualisiertes Kurzprofil:
```
Wiederkehrende Themen: [...]
Bisher eingesetzte Methoden: [...]
Bisherige Leitfragen: [...]
Entwicklungsbogen: [Beobachtete Veränderung über Sessions hinweg]
Offene Fäden: [Was noch wartet]
```

### Wie beeinflusst das den Prompt?

Der injizierte Block wird dem Systemprompt als neue Sektion vorangestellt:

```
## Gedächtnis — bisherige Sessions ([n])

[Coaching-Profil]

[Feldnotiz Session 1]
[Feldnotiz Session 2]
...
```

Das Modell behandelt diesen Block als Wissen über den Menschen, mit dem es spricht. Es kann:
- An früheren Erkenntnissen anknüpfen ("Du hast in einer früheren Session erwähnt…")
- Wiederkehrende Muster benennen
- Entwicklungen sichtbar machen ("Ich bemerke, dass sich deine Frage verändert hat…")
- Unbearbeitete Themen aufgreifen, wenn sie relevant werden

### Was Memory nicht darf
- Nicht: automatisch Themen aus alten Sessions einführen, ohne dass der Coachee sie heute mitbringt
- Nicht: Entwicklungen bewerten oder als abgeschlossen behandeln
- Nicht: den Coachee mit eigenem Gesprächsarchiv konfrontieren ("In Session 2 hast du gesagt…" wirkt kontrollierend)

Der Memory-Block ist stilles Hintergrundwissen — er ermöglicht Resonanz, erzwingt sie nicht.

### Status
⬜ Noch nicht implementiert. Abhängig von Ebene 3.

---

## Gesamtbild: Datenfluss

```
Coachee schreibt/spricht
         │
         ▼
┌─────────────────────┐
│   EBENE 1           │  ← Systemprompt: Live-Analyse, Trigger, Prozesssteuerung
│   Live-Reaktion     │    Ergebnis: KICO antwortet
└─────────────────────┘
         │
         ▼ (parallel)
┌─────────────────────┐
│   EBENE 2           │  ← Server: jede Nachricht → Supabase messages-Tabelle
│   Rohtranskript     │    Vollständig, unberührt
└─────────────────────┘
         │
         ▼ (Session-Ende)
┌─────────────────────┐
│   EBENE 3           │  ← Claude Meta-Prompt: Rohtranskript → Feldnotiz
│   Feldnotiz         │    Speicherort: sessions.field_note
└─────────────────────┘    Coaching-Profil Update: profiles.coaching_notes
         │
         ▼ (nächste Session startet)
┌─────────────────────┐
│   EBENE 4           │  ← Server: Feldnotizen + Profil → Systemprompt-Injektion
│   Memory-Injektion  │    Beeinflusst: alle Antworten der neuen Session
└─────────────────────┘
```

---

## Offene Designfragen

**F-01 — Transparenz gegenüber dem Coachee**
Soll der Coachee wissen, dass ein Coaching-Profil geführt wird? Soll er es sehen oder korrigieren können? Forschungsethisch relevant.

**F-02 — Memory-Qualität hängt an Feldnotiz-Qualität**
Die Feldnotiz wird von Claude generiert — mit einem Meta-Prompt, der noch nicht existiert. Die Güte des Gedächtnisses steht und fällt mit diesem Prompt. Separate Entwicklungsaufgabe.

**F-03 — Erste Session ohne Memory**
Session 1 läuft ohne Gedächtnis-Block. Das ist korrekt und gewollt. Der Systemprompt bleibt unverändert. Erst ab Session 2 wird Memory injiziert.

**F-04 — Wie weit zurück geht das Gedächtnis?**
Bei 10+ Sessions: Tiering notwendig (vollständig / kondensiert / nur Profil). Noch nicht definiert.
