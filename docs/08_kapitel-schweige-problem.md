# Kapitel [X] — Das Schweige-Problem
## Gesprächsrhythmus als methodologischer Widerspruch zwischen verfügbarer Sprach-KI und systemischem Coaching

*Dokumentiert im Rahmen des Plattform-Entwicklungsprozesses, Juni 2026*

---

## Vorbemerkung: Wie dieser Befund entstand

Manche Erkenntnisse entstehen nicht im Voraus, sondern im Betrieb. Der in diesem Kapitel dokumentierte Widerspruch trat im Verlauf der Implementierung des Voice-Modus dieser Plattform empirisch auf und wurde anschließend technisch systematisch untersucht sowie durch eine gezielte Markt- und Literaturrecherche kontextualisiert. Er erhält einen eigenen Abschnitt in dieser Arbeit, weil er sich nicht auf eine ungenügende Implementierung zurückführen lässt — und weil er zeigt, dass das Problem nicht nur hier besteht, sondern im gesamten Feld der Sprach-KI für reflexive Gesprächsanwendungen noch ungelöst ist.

Der Ausgangspunkt war ein konkreter Moment während eines Testgesprächs im Voice-Modus: Ein Coachee sagte „hmmm…" — pausierte kurz — und wurde von der KI unterbrochen, bevor er seinen Gedanken formuliert hatte. Die KI hatte die Pause als Gesprächsende interpretiert und antwortete sofort. Was als engagiertes Coaching gedacht war, wurde zur Unterbrechung.

---

## 1. Stille als Coaching-Werkzeug

Im systemischen Coaching ist Stille kein Kommunikationsausfall. Sie ist ein methodisch relevantes Ereignis.

Wenn ein Coach eine tiefe Frage stellt — „Woran würdest du erkennen, dass du dieses Ziel erreicht hast?" oder „Was würde dein zukünftiges Selbst dir raten?" — ist die anschließende Pause des Coachees kein Zeichen von Ratlosigkeit. Sie ist Zeichen aktiver Verarbeitung. In diesen Sekunden findet häufig die wichtigste kognitive Bewegung der gesamten Session statt: Der Coachee verlässt die Oberfläche des Problems und beginnt, echte eigene Antworten zu suchen.

Die Fähigkeit, diese Stille auszuhalten, gilt im systemischen Coaching als eine der anspruchsvollsten professionellen Fertigkeiten. Sie erfordert auf Seiten des Coaches die Fähigkeit, Präsenz zu zeigen ohne zu sprechen — Interesse zu signalisieren ohne zu drängen — Raum zu halten ohne ihn zu füllen. Das INA CCW-Curriculum formuliert dies strukturell: Der Coach ist rein prozessverantwortlich. Er verantwortet den Rahmen des Gesprächs, nicht seinen Inhalt. Zum Rahmen gehört ausdrücklich: keine Unterbrechung, wenn der Coachee nachdenkt.

Dies ist keine Stilfrage. Es ist methodisch begründet: Jede vorzeitige Unterbrechung einer Denkpause verschiebt den Fokus zurück auf die Sprachoberfläche, bevor die tiefere Schicht erreicht ist. Der Coachee antwortet auf das zuletzt Gehörte — statt auf das, was er gerade zu verstehen im Begriff war. Die systemische Wirkung der Frage entfaltet sich nicht.

Eine Pause von drei bis acht Sekunden nach einer kraftvollen Frage ist im professionellen systemischen Coaching nicht ungewöhnlich. Sie ist häufig der Moment, in dem Coaching passiert. Das Aushalten dieser Pause ist Können — nicht Versäumnis.

---

## 2. Semantic VAD: Was das Modell tut

gpt-realtime-2 verwendet eine Technologie namens Semantic Voice Activity Detection (Semantic VAD). Im Unterschied zur einfachen energiebasierten VAD — die schlicht Stille als Gesprächsende interpretiert — bewertet Semantic VAD, ob eine Äußerung **semantisch abgeschlossen** ist. Das ist eine genuine Verbesserung gegenüber früheren Systemen: Ein „ähm…" oder ein Gedankenabbruch wird nicht als Gesprächsende gewertet, wenn der Satz semantisch unvollständig geblieben ist.

Das Problem liegt nicht in der Technologie an sich, sondern in den Trainingsdaten, auf denen das Modell semantische Vollständigkeit gelernt hat. gpt-realtime-2 ist auf konversationellen Dialogen trainiert — Kundengesprächen, Assistenz-Interaktionen, Frage-Antwort-Sequenzen. In diesen Kontexten gilt: Ein „hmmm…" gefolgt von zwei Sekunden Stille signalisiert, dass der Sprecher seinen Redebeitrag beendet hat. Das Modell hat gelernt, diese Sequenz als Übergabepunkt zu behandeln.

Im Coaching-Kontext ist dieselbe Sequenz keine Übergabe. Sie ist Denken. Das „hmmm" ist kein Abschluss — es ist ein prosodisches Zeichen der Auseinandersetzung. Das Modell hat keine Möglichkeit, diesen Unterschied zu erkennen. Es verarbeitet keine Intentionen, keine Kontextklassen, keine Methodenphasen. Es sieht: semantisch vollständige Lautäußerung + Stille = Turn beendet. Es antwortet.

---

## 3. Technische Untersuchung: Alle drei Konfigurationspfade getestet

Die Beobachtung dieses Verhaltens führte zu einer systematischen Untersuchung aller verfügbaren Konfigurationsmöglichkeiten. Alle drei wurden vollständig ausgetestet.

**Pfad 1 — Konfiguration beim Verbindungsaufbau (`client_secrets`):**
Der `client_secrets`-Endpunkt der OpenAI Realtime API, über den Session-Parameter serverseitig gesetzt werden, erlaubt keine Konfiguration des `turn_detection`-Felds. Ein expliziter Versuch — `turn_detection: { type: 'none' }` im Session-Body — führt zu einem `400 Bad Request`. Der Endpunkt lehnt die Konfiguration ab.

**Pfad 2 — Nachträgliche Deaktivierung (`session.update`, `type: 'none'`):**
Der WebRTC-DataChannel erlaubt es, nach dem Verbindungsaufbau ein `session.update`-Event zu senden. Eine Nachricht mit `turn_detection: { type: 'none' }` wird von der API kommentarlos entgegengenommen — kein Fehler, kein Hinweis. Aber sie hat keinen Effekt. Das Modell setzt sein automatisches Verhalten fort, als hätte das Event nicht stattgefunden.

**Pfad 3 — Verlangsamung statt Deaktivierung (`session.update`, `type: 'semantic_vad'`, `eagerness: 'low'`):**
Dieser Pfad wurde zuletzt getestet, weil er konzeptionell von Pfad 2 verschieden ist: Er fragt nicht nach vollständiger Deaktivierung der VAD, sondern nach Verlangsamung innerhalb des bestehenden Mechanismus. OpenAI dokumentiert den Parameter `eagerness: 'low'` für `gpt-4o-realtime` via WebSocket. Der Versuch, ihn via `session.update` auf gpt-realtime-2 zu setzen, ergab folgende Fehlermeldung:

```
{
  "type": "invalid_request_error",
  "code": "unknown_parameter",
  "message": "Unknown parameter: 'session.turn_detection'.",
  "param": "session.turn_detection"
}
```

Das ist das eindeutigste Ergebnis aller drei Tests: Das Feld `turn_detection` existiert auf gpt-realtime-2 nicht. Es ist kein falsch konfiguriertes Feld — es ist ein nicht vorhandenes Feld. Das WebRTC-Endpunkt-Modell und das WebSocket-Modell teilen nicht dieselbe API-Oberfläche.

**Zusammenfassung der Testergebnisse:**

| Pfad | Aktion | Ergebnis |
|------|--------|----------|
| 1 | `client_secrets` + `turn_detection: { type: 'none' }` | `400 Bad Request` |
| 2 | `session.update` + `turn_detection: { type: 'none' }` | Silently ignored |
| 3 | `session.update` + `turn_detection: { type: 'semantic_vad', eagerness: 'low' }` | `unknown_parameter` |

Das Verhalten ist auf diesem Modell und Endpunkt nicht konfigurierbar. Es gibt keinen vierten Pfad.

---

## 4. Das Referenzprodukt hat keine Voice-Lösung

Kapitel 2 dieser Arbeit stellte Sherlock AI als das einzige dokumentierte Beispiel einer KI-Plattform vor, die von Grund auf als Coaching-System konzipiert wurde. Die Plattform wurde zwischen 2022 und 2024 von erfahrenen Coaches entwickelt, ohne auf generische vortrainierte Datensätze zurückzugreifen. Jedes Coaching-Modul nahm bis zu acht Monate in der Entwicklung. Die methodische Sorgfalt dieser Architektur ist im Feld ohne Vergleich.

Diese Plattform bietet zum Stand Juni 2026 **keinen Voice-Modus**. Die Architektur ist vollständig textbasiert. Voice und Video werden im Columbia-Bericht [9] als *Future Directions* aufgeführt — nicht als existierende Funktionen.

Der Columbia-Bericht formuliert dabei ausdrücklich, dass auch in der textbasierten Architektur Stille als bewusstes Gestaltungselement vorkommt: *„Even the use of silence, or pacing between questions, was deliberately designed in AI coaching conversation."* Gemeint sind hier keine technischen VAD-Mechanismen, sondern Rhythmisierung und Wartezeiten im schriftlichen Dialog. Das ist ein anderes, zugänglicheres Problem.

Der Befund ist eindeutig: Das methodisch am weitesten entwickelte Produkt in diesem Markt — dasjenige, das den höchsten Anspruch an Coaching-Integrität stellt — hat das Voice-Schweige-Problem nicht gelöst. Es hat sich entschieden, es zunächst zu umgehen.

---

## 5. Akademische Bestätigung des Befunds

Die Recherche ergab, dass das identifizierte Problem nicht nur empirisch in dieser Plattform auftritt, sondern in der wissenschaftlichen Literatur bereits explizit beschrieben und untersucht wurde.

**Sedlakova & Trachsel (2026)**, American Journal of Bioethics, Vol. 26 No. 2, benennen das Problem in einer ethischen Analyse von KI-Psychotherapie-Chatbots direkt:

> *„AI is not able to skillfully use silence, as it is always 'conversing' or 'chattering.' Therapists use silence actively — for empathy, reflection, and emotional expression. Current AI systems cannot do this conceptually."*

Obwohl die Analyse auf Psychotherapie-Chatbots bezogen ist, gilt das zugrundeliegende Argument unverändert für systemisches Coaching. Die strukturelle Ursache — KI-Systeme sind auf sprachliche Aktivität optimiert, nicht auf das Halten von Raum — ist modellunabhängig.

**Jiang et al. (CHI 2026, arXiv:2602.06134)** gehen einen Schritt weiter. Die Arbeit *„Hear You in Silence: Designing for Active Listening in Human Interaction with Conversational Agents Using Context-Aware Pacing"* identifiziert fünf funktional unterschiedliche Stille-Typen in Coaching-Gesprächen:

| Stille-Typ | Funktion |
|------------|----------|
| Reflective Silence | Coachee verarbeitet eine tiefe Frage |
| Facilitative Silence | Coach hält Raum für emergente Erkenntnis |
| Empathic Silence | Anerkennung ohne Worte |
| Holding Space | Präsenz bei emotionalen Momenten |
| Immediate Response | Kommunikative Lücke, normale Gesprächspause |

Nur der letzte Typ — *Immediate Response* — entspricht dem, wofür aktuelle Voice-KI-Systeme optimiert sind. Die ersten vier sind methodisch bedeutsam und werden von keinem verfügbaren Echtzeit-Modell aktiv unterstützt. Agenten mit context-aware Pacing zeigten in Coaching-Szenarien messbar höheres *affective trust* und tiefere Selbstoffenbarung.

**Kasner et al. (arXiv:2510.22610)** messen das Ausmaß des Problems empirisch: Cascaded dialogue systems unterbrechen Nutzerpausen in **37,1 % der Fälle**, in denen ein Mensch geschwiegen hätte. Das gibt dem Beobachtungsmoment dieser Plattform — dem unterbrochenen „hmmm…" — einen konkreten Vergleichswert.

---

## 6. Wie der Markt das Problem behandelt

Die Recherche zu verfügbaren Voice-Plattformen ergibt ein klares Bild: Keine aktuell verfügbare SaaS-Lösung hat das Problem des methodisch kontrollierten Gesprächsrhythmus für tiefe Coaching-Pausen befriedigend gelöst. Die Unterschiede liegen im Grad der Konfigurierbarkeit und in der Architektur des Ansatzes.

| Plattform | Ansatz | Max. Stille-Toleranz | Konfigurierbar | Coaching-Eignung |
|-----------|--------|---------------------|---------------|-----------------|
| OpenAI Realtime `gpt-4o-realtime` (WebSocket) | Semantic VAD + `eagerness: "low"` | Nicht dokumentiert | 4 Stufen | Hoch |
| LiveKit + Silero VAD | `min_silence_duration` als freie Variable | Theoretisch unbegrenzt | Vollständig (Open Source) | Hoch |
| Pipecat + Smart Turn | 8-Sekunden-Analysefenster, semantisch | 8 Sekunden | Open Source | Hoch |
| Hume EVI | eLLM-basiert, Prosodie + Semantik | Nicht dokumentiert | Keine direkten Parameter | Mittel — EU AI Act Art. 5 |
| ElevenLabs | `vad_silence_threshold_secs` + `turn_timeout` | 3s VAD / 30s Timeout | Moderat | Mittel |
| Vapi.ai | Smart Endpointing (seit 05/2025 nicht deaktivierbar) | ~1–2 Sekunden | Eingeschränkt | Niedrig |
| gpt-realtime-2 via WebRTC | Semantic VAD | Nicht konfigurierbar | Kein Pfad gefunden | Niedrig |

Die technisch vielversprechendsten Lösungen — LiveKit mit Silero VAD und Pipecat mit Smart Turn — sind Open-Source-Frameworks, die eine vollständig eigene Pipeline erfordern: eigene Serverinfrastruktur, eigene STT- und TTS-Integration, eigene Verbindungsverwaltung. Sie bieten maximale Kontrolle, erfordern aber eine grundlegend andere Architektur als die in dieser Plattform gewählte WebRTC-Lösung.

Hume EVI kommt dem Coaching-Bedarf konzeptionell am nächsten: Das proprietäre eLLM analysiert Prosodie, Tonalität und semantische Vollständigkeit gemeinsam und wartet intuitiv länger bei emotional bedeutsamen Momenten. Dieser Ansatz ist methodisch der interessanteste. Er scheidet dennoch aus — nicht wegen seiner Funktion, sondern wegen seiner Methode: EVI inferiert Emotionen aus biometrischen Sprachdaten, was unter EU AI Act Art. 5 im Coaching-Kontext als hochriskante Praxis einzustufen ist (vgl. Kapitel 3, Entscheidungslog).

---

## 7. Analyse: Zwei inkompatible Designziele

Jede Technologie ist die Antwort auf eine Frage.

Die verfügbaren Voice-KI-Systeme sind die Antwort auf folgende Frage: *Wie entsteht ein natürliches, flüssiges, latenzarmes Sprachgespräch zwischen einem Menschen und einer KI?*

Diese Frage stammt aus dem Kundenservice, der Sprachassistenz, dem Dialog-Interface-Design. In diesen Kontexten ist schnelle Reaktion auf das erkannte Gesprächsende das Ziel. Stille ist das Problem, das gelöst werden soll.

Systemisches Coaching ist die Antwort auf eine andere Frage: *Wie entsteht ein Gesprächsraum, in dem ein Mensch eigene Antworten finden kann?*

Diese Frage stammt aus der Psychologie, der Erwachsenenbildung, der Organisationsberatung. In diesen Kontexten ist Lücke nicht Fehler, sondern Funktion. Stille ist das Medium, in dem Reflexion stattfindet.

Der Widerspruch ist nicht graduell. Er ist strukturell. Die gesamte Industrie, die Voice-KI entwickelt, optimiert für Gesprächsfluss. Coaching optimiert für Gesprächsraum. Kein Prompt und keine Konfiguration kann diesen Widerspruch vollständig auflösen, solange die Turn-Detection-Architektur auf einem anderen Ziel basiert.

Dass Sherlock AI — das am methodischsten fundierte Produkt im Markt — bisher kein Voice anbietet, ist in diesem Licht kein Rückstand, sondern eine implizite Qualitätsentscheidung. Die Architektur wurde text-basiert gewählt, weil sie im Text-Modus das Schweige-Problem nicht hat.

---

## 8. Konsequenzen für diese Plattform

**Keine falschen Versprechen.**
Der Voice-Modus der Plattform informiert in der technischen Dokumentation und in künftigen Nutzungshinweisen transparent über diese Einschränkung. Eine Coaching-Plattform, die einen Methodengrundsatz strukturell verletzt, ohne diesen Bruch zu benennen, handelt methodisch unehrlich.

**Voice für geeignete Phasen.**
Das U-Modell (Scharmer) unterscheidet zwischen Phasen, die primär explorativ-sprachlich sind — Einstieg, Auftragsklärung, ZF-Struktur, erste Vertiefung — und Phasen, die tiefe Reflexionsprozesse erfordern — Wendepunkt, Perspektivwechsel, Tetralemma, Inneres Team. Der Voice-Modus eignet sich für erstere. Er ist strukturell ungeeignet für letztere. Der nahtlose Wechsel zwischen beiden Modi ist damit kein Komfortfeature, sondern eine methodische Notwendigkeit.

**Qualitätsnorm QN-12 — Gesprächsrhythmik:**
Der Widerspruch wird als eigenständige Qualitätsnorm in das Normen-Dokument dieser Plattform aufgenommen. Standard: Jede Voice-Komponente, die für diese Plattform evaluiert wird, muss nachweislich konfigurierbare oder deaktivierbare Turn Detection unterstützen — und dies muss durch Konfigurationstest, nicht durch Herstellerdokumentation allein, verifiziert sein.

**Alle Konfigurationspfade sind ausgeschöpft.**
Die Recherche hatte ergeben, dass OpenAI für `gpt-4o-realtime` via WebSocket den Parameter `semantic_vad` mit `eagerness: "low"` dokumentiert. Dieser wurde als letzter Versuch auf gpt-realtime-2 via WebRTC getestet — und mit `unknown_parameter` beantwortet. Das WebRTC-Modell und das WebSocket-Modell teilen nicht dieselbe API-Oberfläche. Es gibt keinen weiteren Konfigurationspfad.

---

## 9. Konsequenzen für das Feld

Der Markt für Voice-KI im Coaching- und Beratungskontext wächst. Keines der untersuchten Produkte adressiert das Schweige-Problem methodisch. Die meisten optimieren für Gesprächsfluss, Latenz und Verfügbarkeit. Was sie nicht optimieren: Reflexionsraum.

Das bedeutet nicht, dass Voice-KI im Coaching keinen Platz hat. Es bedeutet, dass methodisch verantwortungsvoller Einsatz Klarheit über dieses Limit voraussetzt. Eine Plattform, die Voice für Einstiegs- und Orientierungsphasen einsetzt und für Tiefeninterventionen in den Textmodus wechselt, handelt methodisch konsistenter als eine, die den gesamten Prozess über Sprache führt.

Für die technologische Entwicklung benennt dieser Befund eine konkrete Anforderung: Das eigentliche Problem ist nicht Latenz, nicht Sprachqualität, nicht Modellgröße. Das Problem ist die Turn-Detection-Architektur. Eine methodisch geeignete Voice-Lösung für systemisches Coaching wäre ein Modell, das Turn-Detection vollständig der Anwendungslogik überlässt — in diesem Fall einem manuell kontrollierten Gesprächsrhythmus, bei dem der Coachee selbst bestimmt, wann er fertig gesprochen hat. Zum Stand Juni 2026 existiert diese Architektur für native End-to-End-Voice-Verarbeitung nicht als marktreifes Produkt.

Dass Sherlock AI — das Produkt mit dem höchsten dokumentierten methodischen Standard im Markt — Voice noch nicht anbietet, ist in diesem Kontext ein Signal: Das Schweige-Problem ist bekannt. Es ist noch nicht gelöst.

---

## Zusammenfassung

Dieser Befund lässt sich in drei Sätzen zusammenfassen:

> Systemisches Coaching erfordert einen kontrollierten Gesprächsrhythmus mit Raum für Denkpausen. Aktuelle Sprach-KI ist architektonisch auf das Gegenteil optimiert: Gesprächsfluss ohne Stille. Diese Inkompatibilität ist nicht durch Konfiguration auflösbar — und sie ist, wie die Marktrecherche zeigt, im gesamten Feld ungelöst.

Der Befund hat drei Konsequenzen:

1. **Für diese Plattform:** Transparente Nutzungsempfehlung, phasenbezogener Einsatz von Voice, QN-12 als neue methodische Qualitätsnorm, und ein gezielter Test des `eagerness: "low"`-Parameters.
2. **Für die Coaching-Praxis:** Ein neues Evaluationskriterium für Voice-KI-Produkte — neben Latenz, Sprachqualität und Datenschutz nun auch: Kann das System schweigen?
3. **Für die Forschung:** Die Literatur bestätigt (Sedlakova & Trachsel 2026; Jiang et al. CHI 2026; Kasner et al. 2025), dass das Problem strukturell und nicht implementierungsspezifisch ist. Es handelt sich um ein benanntes Gap zwischen dem Stand der Technologie und den Anforderungen methodisch fundierten Coachings — nicht um eine Schwäche einer einzelnen Plattform.

---

*Technische Details zur VAD-Architektur, den durchgeführten Konfigurationsversuchen und dem Whisper-Workaround für User-Transkription: `docs/05_voice-architektur.md`*

*Akademische Quellen: Sedlakova & Trachsel (2026), American Journal of Bioethics 26(2) — Jiang et al. (CHI 2026), arXiv:2602.06134 — Kasner et al. (2025), arXiv:2510.22610 — Sherlock AI, Columbia Coaching Conference 2025 [9]*
