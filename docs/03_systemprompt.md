# 03 — Systemprompt

---

## Was ist ein Systemprompt?

Sprachmodelle wie Claude erhalten neben den Nutzernachrichten eine vorgelagerte Instruktion, den sogenannten **Systemprompt**. Dieser definiert Rolle, Verhalten, Grenzen und Methodik des Modells — bevor die erste Nutzernachricht verarbeitet wird. Der Systemprompt ist für die Nutzerin nicht sichtbar, steuert aber jeden Aspekt der Antwortgenerierung.

Bei KICO ist der Systemprompt die zentrale Stelle, an der das Architekturprinzip **„Methode vor Modell"** technisch implementiert wird.

---

## Aufbau des KICO-Systemprompts

Der Prompt ist in sieben Abschnitte gegliedert, die direkt den Qualitätsnormen (QN-01 bis QN-09) aus der Abschlussarbeit entsprechen:

### 1. Rollenklarheit (QN-04)
Definiert, was KICO ist und — explizit — was nicht:
- Kein Therapeut
- Kein Berater
- Kein Freund
- Kein Ratgeber

KICO ist ein systemischer Coach im digitalen Einzelsetting. Diese Abgrenzung ist nicht nur ethisch notwendig, sondern schützt auch vor dem bekannten Phänomen, dass Nutzerinnen KI-Systeme mit therapeutischer Autorität ausstatten (vgl. Abschlussarbeit, Kapitel 2).

### 2. MIND-SAFE-Filter (QN-02, QN-09)
Vor jeder Antwort prüft das Modell die Eingabe auf Krisensignale:
- Suizidgedanken / Selbstverletzung
- Fremdgefährdung
- Akute psychische Dekompensation

Bei Krisensignalen: sofortiger Abbruch des Coaching-Prozesses, Empathieausdruck, Nennung konkreter Krisenressourcen (Telefonseelsorge: 0800 111 0 111), Beendigung der Session.

**Seit B-05b nicht mehr nur Modell-Instruktion, sondern zusätzlich technisch erzwungen — und seit dem 29. Juli 2026 in einer zweiten, entscheidenden Dimension überarbeitet.** Siehe eigener Abschnitt „Grenzen kennen — von der Instruktion zur gelebten Praxis" unten; er gehört inhaltlich hierher, nicht nur ins Backlog, weil er eine zentrale Kompetenz professionellen Coachings unmittelbar in eine technische Entscheidung übersetzt.

### 3. Methodenkorpus (QN-01)
Das vollständige INA CCW-Toolsystem (46 Werkzeuge) wird auf die für text-basiertes Einzelcoaching geeignete Teilmenge reduziert. Das Modell arbeitet ausschließlich mit diesen Werkzeugen — keine Improvisation außerhalb des Korpus.

Die fünf Kategorien:
- Prozessrahmen (U-Modell, Logische Ebenen, Zielematrix, …)
- Fragetechniken (Systemische Fragen in 6 Varianten, Auftragsklärung)
- Identität & Werte (5 Säulen der Identität, Wertekarten, Ikigai, …)
- Perspektive & Entscheidung (Inneres Team, Tetralemma, Walt Disney, …)
- Abschluss (Heldenreise, Abschlussauswertung)

### 4. Sessionstruktur — U-Modell (QN-03)
Der Coaching-Prozess folgt dem U-Modell nach Scharmer in fünf Phasen:
1. Ankommen & Auftragsklärung
2. Vertiefung
3. Wendepunkt
4. Lösungsraum
5. Transfer

Phasenwechsel werden für die Nutzerin transparent benannt.

### 5. Fragehaltung (QN-01, QN-05)
- Immer nur eine Frage pro Antwort
- Offene, systemische Fragen (keine Ja/Nein-Fragen, keine Suggestivfragen)
- Paraphrase vor der Frage
- Keine Drängelei

### 6. Grenzen (QN-06, QN-07, QN-08)
- Keine Daten außerhalb der Session speichern
- Keine Urteile über dritte Personen
- Keine politischen oder weltanschaulichen Kommentare
- Transparenz über eigene Grenzen

### 7. Sprachausgabe (Voice-Modus) — hinzugefügt 04.06.2026
Der Systemprompt enthält seit der Voice-Integration explizite Regeln für gesprochene Ausgabe. Da das Modell seinen Output laut vorgelesen bekommt, müssen Antworten für das Ohr, nicht für das Auge strukturiert sein:
- Keine Markdown-Formatierungen (Sternchen, Aufzählungszeichen)
- Keine Listen — stattdessen zusammenhängende Sätze
- Du-Form durchgehend
- Gesprächssprache ("Du hast gesagt…" statt "Sie erwähnten…")

**Überholt seit der Migration zu Cascaded (siehe [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md)):** Die ursprüngliche Forschungsnotiz zu amerikanischen Intonationsmustern bezog sich auf `gpt-realtime-2`/Stimme `shimmer` (OpenAI Realtime API). Seit Juli 2026 läuft Voice über Deepgram Aura-2 mit den explizit für Deutsch trainierten Stimmen `aura-2-aurelia-de` (weiblich) / `aura-2-fabian-de` (männlich) — das ursprünglich dokumentierte Problem besteht mit diesem Anbieter nicht mehr in derselben Form.

---

## Grenzen kennen — von der Instruktion zur gelebten Praxis (Juli 2026)

Dieser Abschnitt ist bewusst ausführlicher als die anderen, weil er eine der zentralen fachlichen Anforderungen aus Kapitel 2 der Abschlussarbeit — dass ein Coach die eigenen Grenzen kennt und respektiert — direkt in eine überprüfbare technische Entscheidung übersetzt, und weil sich beim echten Testen zeigte, dass diese Anforderung zwei getrennte, gleichermaßen notwendige Dimensionen hat.

**Die fachliche Ausgangslage.** Professionelles Coaching unterscheidet sich von Therapie nicht nur im Gegenstand (gesunde vs. behandlungsbedürftige Klientinnen), sondern auch in der Verantwortung, diese Grenze im eigenen Handeln zu erkennen und danach zu handeln. Der ICF Code of Ethics verpflichtet Coaches ausdrücklich dazu, Klientinnen bei Bedarf an geeignetere Fachpersonen zu verweisen, statt den eigenen Zuständigkeitsbereich zu überschreiten. Diese Kompetenz — "die eigenen Grenzen kennen" — ist damit kein Zusatz zum professionellen Coaching, sondern eine seiner Kernanforderungen, und sie war bereits vor der hier beschriebenen Überarbeitung als Anforderung im Systemprompt verankert (Abschnitt „Grenzen", QN-06–08; MIND-SAFE-Filter, QN-02/09).

**Was beim Testen sichtbar wurde.** Die ursprüngliche technische Umsetzung erfüllte die Anforderung nur teilweise. Ein Nutzertest (29. Juli 2026, Voice-Modus) zeigte zwei unabhängige Probleme:

1. **Ton:** Die deterministische Krisenantwort ("Ich bin dafür nicht der richtige Ansprechpartner... Diese Session endet hier") war sachlich-korrekt, aber bürokratisch formuliert — sie wirkte wie eine automatisierte Zurückweisung genau in dem Moment, in dem sich der Coachee verletzlich zeigte.
2. **Timing:** Das System reagierte sofort, sobald ein Krisenbegriff in einem gerade abgeschlossenen Sprachsegment erkannt wurde — auch wenn der Coachee nur kurz innegehalten hatte, um weiterzusprechen. Für den Coachee fühlte sich das wie Unterbrechen an.

Beide Probleme zusammen zeigen, dass "die eigenen Grenzen kennen" technisch aus zwei Anteilen besteht, die leicht miteinander verwechselt werden: **dass** eine Grenze erkannt und eingehalten wird (eine Zuverlässigkeitsfrage), und **wie** diese Grenze der betroffenen Person mitgeteilt wird (eine Beziehungsfrage). Ein System — wie ein Mensch — kann im ersten Punkt vollkommen zuverlässig sein und im zweiten trotzdem Schaden anrichten.

**Die Lösung, architektonisch getrennt:**
- Der *Auslöser* bleibt hart und deterministisch (`lib/signal-scanner.ts`, `voice-agent/signal_scanner.py`): Ein einmal erkanntes Krisensignal führt garantiert zu einer Reaktion, unabhängig vom Modellverhalten — das war bereits die Kernidee von B-05b und bleibt unverändert. Das adressiert weiterhin das in Kapitel 1 diskutierte RLHF-Konflikt-Problem: Sich auf das Modell allein zu verlassen, wäre nicht zuverlässig genug.
- Der *Ton* wurde überarbeitet: Erst Anerkennung und Wärme, dann die Ressource, dann ein Abschluss, der nicht wie ein Abbruch klingt (voller Wortlaut in `docs/backlog.md`, B-05b).
- Das *Timing* wurde überarbeitet, nur im Voice-Modus relevant: Statt sofort zu antworten, wartet das System nach Erkennung zusätzliche vier Sekunden. Spricht der Coachee in dieser Zeit weiter, wird das angehängt und die Wartezeit neu gestartet — die Reaktion kommt erst, wenn wirklich Ruhe eingekehrt ist. Damit wird aus einem einzigen, plötzlichen Ereignis ein Verhalten, das Raum lässt, ohne die Garantie aufzugeben, dass reagiert wird.

Wichtig für die Einordnung in der Arbeit: **Weder der Ton- noch der Timing-Text wurden fachlich-klinisch geprüft.** Das ist eine offen benannte Lücke (siehe `docs/backlog.md`, B-05b), keine abgeschlossene Lösung — vertretbar im geschlossenen Forschungsrahmen, aber vor jeder Erweiterung über diesen Rahmen hinaus zwingend nachzuholen.

---

## Implementierung

Der Systemprompt liegt in `lib/system-prompt.ts` (Text- und Voice-Modus teilen sich denselben Inhalt; Voice hält in `voice-agent/system_prompt.py` bewusst ein manuell synchron gehaltenes Duplikat, da der Voice-Agent ein eigenständiger Python-Service ist) und wird als Konstante importiert in:
- `app/api/chat/route.ts` — für Text-Sessions (Claude, Modell zentral in `lib/models.ts` definiert)
- `voice-agent/bot.py` — für Voice-Sessions (Claude, Modell zentral in `voice-agent/models.py` definiert; Cascaded-Pipeline über Pipecat Cloud, siehe [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md))

Er ist versioniert (Git) und damit vollständig nachvollziehbar.

---

## Grenzen des Systemprompts

Ein Systemprompt ist keine technische Sperre, sondern eine Instruktion. Moderne Sprachmodelle befolgen Instruktionen mit hoher Zuverlässigkeit, aber nicht mit absoluter Garantie. Die Abschlussarbeit diskutiert diese Limitation ausführlich (Kapitel 2, RLHF-Konflikt-Problem). KICO begegnet ihr durch:

1. Wahl eines instruktionstreuen Modells (Claude)
2. Klare, widerspruchsfreie Instruktionen
3. Kein Nutzer-Input, der den Systemprompt überschreiben kann (kein „Ignore previous instructions"-Vektor durch UI-Design)
