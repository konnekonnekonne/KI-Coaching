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

**Forschungsnotiz:** Das verwendete Sprachmodell (`gpt-realtime-2`) ist primär englischsprachig trainiert. Obwohl es korrektes Deutsch produziert, trägt die Stimme teilweise amerikanische Intonationsmuster. Dieser Effekt ist technisch nicht durch den Systemprompt steuerbar — er ist eine Eigenschaft des TTS-Layers (Stimme: `shimmer`), nicht des Sprachmodells. Er wird als bekannte Limitation dokumentiert.

---

## Implementierung

Der Systemprompt liegt in `lib/system-prompt.ts` und wird als Konstante in beide API-Routen importiert:
- `/api/chat` — für Text-Sessions (Claude claude-opus-4-5)
- `/api/voice/session` — für Voice-Sessions (gpt-realtime-2)

Er ist versioniert (Git) und damit vollständig nachvollziehbar.

---

## Grenzen des Systemprompts

Ein Systemprompt ist keine technische Sperre, sondern eine Instruktion. Moderne Sprachmodelle befolgen Instruktionen mit hoher Zuverlässigkeit, aber nicht mit absoluter Garantie. Die Abschlussarbeit diskutiert diese Limitation ausführlich (Kapitel 2, RLHF-Konflikt-Problem). KICO begegnet ihr durch:

1. Wahl eines instruktionstreuen Modells (Claude)
2. Klare, widerspruchsfreie Instruktionen
3. Kein Nutzer-Input, der den Systemprompt überschreiben kann (kein „Ignore previous instructions"-Vektor durch UI-Design)
