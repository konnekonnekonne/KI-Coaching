# Kapitel [X] — Das Schweige-Problem
## Gesprächsrhythmus als methodologischer Widerspruch zwischen verfügbarer Sprach-KI und systemischem Coaching

*Dokumentiert im Rahmen des Plattform-Entwicklungsprozesses, Juni 2026*

---

## Vorbemerkung: Wie dieser Befund entstand

Manche Erkenntnisse entstehen nicht im Voraus, sondern im Betrieb. Der in diesem Kapitel dokumentierte Widerspruch trat im Verlauf der Implementierung des Voice-Modus dieser Plattform empirisch auf, wurde anschließend technisch systematisch untersucht und durch eine gezielte Markt- und Literaturrecherche kontextualisiert. Er erhält einen eigenen Abschnitt in dieser Arbeit, weil die Untersuchung zeigt, dass das Problem weder in einer ungenügenden Implementierung begründet liegt noch auf diese Plattform beschränkt ist. Im gesamten Feld der Sprach-KI für reflexive Gesprächsanwendungen bleibt es ungelöst.

Der Ausgangspunkt war ein konkreter Moment während eines Testgesprächs im Voice-Modus: Ein Coachee sagte „hmmm…", pausierte kurz und wurde von der KI unterbrochen, bevor er seinen Gedanken formuliert hatte. Die KI hatte die Pause als Gesprächsende interpretiert und antwortete sofort.

---

## 1. Stille als Coaching-Werkzeug

Stille gehört im systemischen Coaching zur Methode. Wenn ein Coach fragt „Woran würdest du erkennen, dass du dieses Ziel erreicht hast?" oder „Was würde dein zukünftiges Selbst dir raten?", dann braucht die anschließende Pause des Coachees methodischen Schutz. In diesen Sekunden findet häufig die wichtigste kognitive Bewegung der gesamten Session statt: Der Coachee verlässt die Oberfläche des Problems und beginnt, echte eigene Antworten zu suchen.

Die Fähigkeit, diese Stille auszuhalten, gilt im systemischen Coaching als eine der anspruchsvollsten professionellen Fertigkeiten. Sie erfordert auf Seiten des Coaches: Präsenz zeigen ohne zu sprechen, Interesse signalisieren ohne zu drängen, Raum halten ohne ihn zu füllen. Das INA CCW-Curriculum formuliert dies strukturell: Der Coach trägt Prozessverantwortung, nicht inhaltliche Verantwortung. Zum Prozess gehört ausdrücklich, den Coachee beim Denken nicht zu unterbrechen.

Methodisch begründet ist das so: Jede vorzeitige Unterbrechung einer Denkpause verschiebt den Fokus zurück auf die Sprachoberfläche, bevor die tiefere Schicht erreicht ist. Der Coachee antwortet auf das zuletzt Gehörte, statt auf das, was er gerade zu verstehen im Begriff war. Die systemische Wirkung der Frage entfaltet sich nicht vollständig.

Eine Pause von drei bis acht Sekunden nach einer kraftvollen Frage ist im professionellen systemischen Coaching verbreitet und methodisch erwünscht. Schweigen auszuhalten ist professionelles Können.

---

## 2. Semantic VAD: Was das Modell tut

gpt-realtime-2 verwendet Semantic Voice Activity Detection (Semantic VAD). Im Unterschied zur einfachen energiebasierten VAD, die schlicht Stille als Gesprächsende wertet, bewertet Semantic VAD, ob eine Äußerung **semantisch abgeschlossen** ist. Dadurch wird ein „ähm…" oder ein Gedankenabbruch nicht als Gesprächsende gewertet, wenn der Satz semantisch unvollständig geblieben ist. Das ist eine echte Verbesserung gegenüber früheren Systemen.

Die Grenze dieses Ansatzes liegt in seinen Trainingsdaten. gpt-realtime-2 wurde auf konversationellen Dialogen trainiert: Kundengesprächen, Assistenz-Interaktionen, Frage-Antwort-Sequenzen. In diesen Kontexten signalisiert ein „hmmm…" gefolgt von zwei Sekunden Stille, dass der Sprecher seinen Redebeitrag abgeschlossen hat. Das Modell hat gelernt, diese Sequenz als Übergabepunkt zu behandeln.

Im Coaching-Kontext gilt eine andere Norm. Dort ist dieselbe Sequenz Denken. Das Modell kennt diesen Unterschied nicht, denn es verarbeitet keine Intentionen, keine Kontextklassen, keine Methodenphasen. Es sieht eine semantisch vollständige Lautäußerung, gefolgt von Stille, und antwortet.

---

## 3. Technische Untersuchung: Alle drei Konfigurationspfade getestet

Die Beobachtung dieses Verhaltens führte zu einer systematischen Untersuchung aller verfügbaren Konfigurationsmöglichkeiten. Alle drei wurden vollständig ausgetestet.

**Pfad 1 — Konfiguration beim Verbindungsaufbau (`client_secrets`):**
Der `client_secrets`-Endpunkt der OpenAI Realtime API, über den Session-Parameter serverseitig gesetzt werden, erlaubt keine Konfiguration des `turn_detection`-Felds. Ein expliziter Versuch mit `turn_detection: { type: 'none' }` im Session-Body führte zu einem `400 Bad Request`.

**Pfad 2 — Nachträgliche Deaktivierung (`session.update`, `type: 'none'`):**
Der WebRTC-DataChannel erlaubt es, nach dem Verbindungsaufbau ein `session.update`-Event zu senden. Eine Nachricht mit `turn_detection: { type: 'none' }` wurde von der API ohne Fehler entgegengenommen, hatte aber keinen Effekt. Das Modell setzte sein automatisches Verhalten fort, als wäre das Event nie gesendet worden.

**Pfad 3 — Verlangsamung innerhalb des Mechanismus (`session.update`, `type: 'semantic_vad'`, `eagerness: 'low'`):**
Dieser Pfad unterscheidet sich konzeptionell von Pfad 2: Er fragt nach Verlangsamung, nicht nach Deaktivierung. OpenAI dokumentiert den Parameter `eagerness: 'low'` für `gpt-4o-realtime` via WebSocket. Der Versuch, ihn via `session.update` auf gpt-realtime-2 zu setzen, ergab folgende Fehlermeldung:

```
{
  "type": "invalid_request_error",
  "code": "unknown_parameter",
  "message": "Unknown parameter: 'session.turn_detection'.",
  "param": "session.turn_detection"
}
```

Das Feld `turn_detection` existiert auf diesem Modell schlicht nicht. Das WebRTC-Endpunkt-Modell und das WebSocket-Modell teilen nicht dieselbe API-Oberfläche.

**Zusammenfassung der Testergebnisse:**

| Pfad | Aktion | Ergebnis |
|------|--------|----------|
| 1 | `client_secrets` + `turn_detection: { type: 'none' }` | `400 Bad Request` |
| 2 | `session.update` + `turn_detection: { type: 'none' }` | Silently ignored |
| 3 | `session.update` + `turn_detection: { type: 'semantic_vad', eagerness: 'low' }` | `unknown_parameter` |

Einen vierten Pfad gibt es nicht.

---

## 4. Das Referenzprodukt hat keine Voice-Lösung

Kapitel 2 dieser Arbeit stellte Sherlock AI als das einzige dokumentierte Beispiel einer KI-Plattform vor, die von Grund auf als Coaching-System konzipiert wurde. Die Plattform wurde zwischen 2022 und 2024 von erfahrenen Coaches entwickelt, ohne auf generische vortrainierte Datensätze zurückzugreifen. Jedes Coaching-Modul nahm bis zu acht Monate in der Entwicklung. Die methodische Sorgfalt dieser Architektur ist im Feld ohne Vergleich.

Diese Plattform bietet zum Stand Juni 2026 keinen Voice-Modus. Die Architektur ist vollständig textbasiert. Voice und Video werden im Columbia-Bericht [9] als *Future Directions* aufgeführt, nicht als existierende Funktionen.

Der Columbia-Bericht hält fest, dass auch in der textbasierten Architektur Stille als bewusstes Gestaltungselement vorkommt: *„Even the use of silence, or pacing between questions, was deliberately designed in AI coaching conversation."* Gemeint sind dabei keine technischen VAD-Mechanismen, sondern Rhythmisierung und Wartezeiten im schriftlichen Dialog. Dieses Problem lässt sich in einem textbasierten System kontrollieren.

Das methodisch am weitesten entwickelte Produkt in diesem Markt hat das Voice-Schweige-Problem noch nicht gelöst. Es hat die Voice-Entwicklung aufgeschoben, bis das Problem gelöst werden kann.

---

## 5. Akademische Bestätigung des Befunds

Die Recherche ergab, dass das identifizierte Problem in der wissenschaftlichen Literatur bereits explizit beschrieben und untersucht wurde.

**Sedlakova & Trachsel (2026)** analysieren in einer ethischen Untersuchung von KI-Psychotherapie-Chatbots das Schweige-Problem direkt:

> *„AI is not able to skillfully use silence, as it is always 'conversing' or 'chattering.' Therapists use silence actively — for empathy, reflection, and emotional expression. Current AI systems cannot do this conceptually."*

Obwohl die Analyse auf Psychotherapie-Chatbots bezogen ist, gilt das zugrundeliegende Argument für systemisches Coaching in gleicher Weise. KI-Systeme sind auf sprachliche Aktivität optimiert, der Coaching-Prozess erfordert methodisch kontrollierte Inaktivität.

**Jiang et al. (CHI 2026)** entwickeln in *„Hear You in Silence"* eine Taxonomie von fünf funktional unterschiedlichen Stille-Typen in Coaching-Gesprächen:

| Stille-Typ | Funktion |
|------------|----------|
| Reflective Silence | Coachee verarbeitet eine tiefe Frage |
| Facilitative Silence | Coach hält Raum für emergente Erkenntnis |
| Empathic Silence | Anerkennung ohne Worte |
| Holding Space | Präsenz bei emotionalen Momenten |
| Immediate Response | Kommunikative Lücke, normale Gesprächspause |

Aktuelle Voice-KI-Systeme sind auf den letzten Typ ausgerichtet. Die ersten vier sind methodisch bedeutsam und werden von keinem verfügbaren Echtzeit-Modell aktiv unterstützt. Agenten mit context-aware Pacing zeigten in den Coaching-Szenarien der Studie messbar höheres *affective trust* und tiefere Selbstoffenbarung.

**Kasner et al. (arXiv:2510.22610)** messen das Ausmaß des Problems empirisch: Cascaded dialogue systems unterbrechen Nutzerpausen in **37,1 % der Fälle**, in denen ein Mensch geschwiegen hätte. Das gibt dem Beobachtungsmoment dieser Plattform einen konkreten Vergleichswert.

---

## 6. Wie der Markt das Problem behandelt

Die Recherche zu verfügbaren Voice-Plattformen ergibt ein übereinstimmendes Bild: Keine aktuell verfügbare SaaS-Lösung hat das Problem des methodisch kontrollierten Gesprächsrhythmus für tiefe Coaching-Pausen befriedigend gelöst. Die Unterschiede liegen im Grad der Konfigurierbarkeit und in der Architektur des Ansatzes.

| Plattform | Ansatz | Konfigurierbar | Coaching-Eignung |
|-----------|--------|---------------|-----------------|
| OpenAI Realtime `gpt-4o-realtime` (WebSocket) | Semantic VAD + `eagerness: "low"` | 4 Stufen (dokumentiert, ungetestet) | Mittel |
| LiveKit + Silero VAD | `min_silence_duration` als freie Variable | Vollständig (Open Source) | Hoch |
| Pipecat + Smart Turn | 8-Sekunden-Analysefenster, semantisch | Open Source | Hoch |
| Hume EVI | eLLM-basiert, Prosodie + Semantik | Keine direkten Parameter | Mittel (EU AI Act Art. 5) |
| ElevenLabs | `vad_silence_threshold_secs` max 3s, `turn_timeout` max 30s | Moderat | Mittel |
| Vapi.ai | Smart Endpointing (seit 05/2025 nicht deaktivierbar) | Eingeschränkt | Niedrig |
| gpt-realtime-2 via WebRTC | Semantic VAD, `turn_detection` nicht vorhanden | Kein Pfad | Niedrig |

Zur Einordnung von `gpt-4o-realtime` via WebSocket: Der Parameter `eagerness: "low"` ist in der OpenAI-Dokumentation beschrieben und wäre konzeptionell der richtigste Einstiegspunkt. Zwei Einschränkungen bleiben dennoch bestehen. Erstens erfordert die WebSocket-Architektur einen serverseitigen Proxy, der die gesamte Audioverarbeitung über den eigenen Server leitet und damit die Latenz erhöht sowie einen grundlegenden Architekturumbau nötig macht. Zweitens bleibt auch bei `eagerness: "low"` die Grundannahme bestehen: Semantic VAD bewertet semantische Vollständigkeit auf Basis konversationeller Trainingsdaten. Ein „hmmm…" mit Denkpause gilt dort weiterhin als abgeschlossener Beitrag. Die Konfigurierbarkeit verschiebt die Toleranzschwelle, löst aber das zugrundeliegende Problem nicht. Hinzu kommt: Unsere Erfahrung mit gpt-realtime-2 lehrt, dass dokumentierte Parameter und tatsächlich verfügbare Parameter bei diesen Modellen auseinanderfallen können. Eine Einstufung als „hoch geeignet" auf Basis von Dokumentation allein wäre nicht vertretbar.

Die technisch vielversprechendsten Lösungen, LiveKit mit Silero VAD und Pipecat mit Smart Turn, sind Open-Source-Frameworks, die eine vollständig eigene Pipeline erfordern: eigene Serverinfrastruktur, eigene STT- und TTS-Integration, eigene Verbindungsverwaltung. Sie bieten maximale Kontrolle, verlangen aber eine grundlegend andere Architektur als die in dieser Plattform gewählte WebRTC-Lösung.

Hume EVI kommt dem Coaching-Bedarf konzeptionell am nächsten: Das proprietäre eLLM analysiert Prosodie, Tonalität und semantische Vollständigkeit gemeinsam. Der Ansatz scheidet aus regulatorischen Gründen aus. EVI inferiert Emotionen aus biometrischen Sprachdaten, was unter EU AI Act Art. 5 im Coaching-Kontext als hochriskante Praxis einzustufen ist (vgl. Kapitel 3, Entscheidungslog).

---

## 7. Analyse: Zwei inkompatible Designziele

Jede Technologie ist die Antwort auf eine Frage.

Die verfügbaren Voice-KI-Systeme beantworten folgende Frage: *Wie entsteht ein natürliches, flüssiges, latenzarmes Sprachgespräch zwischen einem Menschen und einer KI?* Diese Frage stammt aus dem Kundenservice, der Sprachassistenz, dem Dialog-Interface-Design. In diesen Kontexten ist schnelle Reaktion auf das erkannte Gesprächsende das Ziel. Stille soll überwunden werden.

Systemisches Coaching beantwortet eine andere Frage: *Wie entsteht ein Gesprächsraum, in dem ein Mensch eigene Antworten finden kann?* Diese Frage stammt aus der Psychologie, der Erwachsenenbildung, der Organisationsberatung. Dort ist die Pause kein Defizit des Gesprächs, sondern sein Medium.

Die gesamte Industrie, die Voice-KI entwickelt, optimiert für Gesprächsfluss. Coaching optimiert für Gesprächsraum. Dieser Widerspruch ist strukturell und lässt sich durch keinen Prompt und keine Konfiguration vollständig auflösen, solange die Turn-Detection-Architektur auf dem jeweils anderen Ziel basiert.

Dass Sherlock AI, das am methodischsten fundierte Produkt im Markt, bisher kein Voice anbietet, lässt sich in diesem Licht als implizite Qualitätsentscheidung lesen: Die textbasierte Architektur wurde gewählt, weil sie das Schweige-Problem strukturell nicht hat.

---

## 8. Konsequenzen für diese Plattform

**Transparenz über das Limit.** Der Voice-Modus der Plattform informiert in der technischen Dokumentation und in künftigen Nutzungshinweisen über diese Einschränkung. Eine Coaching-Plattform, die einen Methodengrundsatz strukturell verletzt, ohne diesen Bruch zu benennen, handelt methodisch unehrlich.

**Phasenbezogener Einsatz von Voice.** Das U-Modell (Scharmer) unterscheidet zwischen Phasen, die primär explorativ-sprachlich verlaufen (Einstieg, Auftragsklärung, ZF-Struktur, erste Vertiefung) und Phasen, die tiefe Reflexionsprozesse erfordern (Wendepunkt, Perspektivwechsel, Tetralemma, Inneres Team). Der Voice-Modus eignet sich für erstere und ist strukturell ungeeignet für letztere. Der nahtlose Wechsel zwischen beiden Modi ist aus dieser Erkenntnis heraus eine methodische Notwendigkeit, kein Komfortfeature.

**Qualitätsnorm QN-12 — Gesprächsrhythmik.** Der Widerspruch wird als eigenständige Qualitätsnorm in das Normen-Dokument dieser Plattform aufgenommen. Standard: Jede Voice-Komponente, die für diese Plattform evaluiert wird, muss nachweislich konfigurierbare oder deaktivierbare Turn Detection unterstützen. Die Konfigurierbarkeit muss durch Funktionstest verifiziert sein, nicht durch Herstellerdokumentation allein.

---

## 9. Konsequenzen für das Feld

Der Markt für Voice-KI im Coaching- und Beratungskontext wächst. Keines der untersuchten Produkte adressiert das Schweige-Problem methodisch. Die meisten optimieren für Gesprächsfluss, Latenz und Verfügbarkeit.

Methodisch verantwortungsvoller Einsatz setzt Klarheit über dieses Limit voraus. Eine Plattform, die Voice für Einstiegs- und Orientierungsphasen einsetzt und für Tiefeninterventionen in den Textmodus wechselt, handelt konsistenter als eine, die den gesamten Prozess über Sprache führt.

Für die technologische Entwicklung benennt dieser Befund eine konkrete Anforderung: Das Problem liegt weder in Latenz noch in Sprachqualität noch in Modellgröße, sondern in der Turn-Detection-Architektur. Eine methodisch geeignete Voice-Lösung für systemisches Coaching wäre ein Modell, das Turn-Detection vollständig der Anwendungslogik überlässt und damit dem Coachee die Kontrolle darüber gibt, wann er fertig gesprochen hat. Zum Stand Juni 2026 existiert diese Architektur für native End-to-End-Voice-Verarbeitung nicht als marktreifes Produkt.

Dass Sherlock AI, das Produkt mit dem höchsten dokumentierten methodischen Standard im Markt, Voice noch nicht anbietet, ist in diesem Kontext ein Signal: Das Schweige-Problem ist bekannt. Gelöst ist es noch nicht.

---

## Zusammenfassung

Systemisches Coaching erfordert einen kontrollierten Gesprächsrhythmus mit Raum für Denkpausen. Aktuelle Sprach-KI ist architektonisch auf Gesprächsfluss optimiert. Diese Inkompatibilität lässt sich durch Konfiguration nicht auflösen, und sie beschränkt sich, wie die Marktrecherche zeigt, nicht auf einzelne Produkte.

Der Befund hat drei Konsequenzen:

1. **Für diese Plattform:** Transparente Nutzungsempfehlung, phasenbezogener Einsatz von Voice und QN-12 als neue methodische Qualitätsnorm.
2. **Für die Coaching-Praxis:** Ein neues Evaluationskriterium für Voice-KI-Produkte, das bisher selten gestellt wurde: Kann das System schweigen?
3. **Für die Forschung:** Die Literatur bestätigt (Sedlakova & Trachsel 2026; Jiang et al. CHI 2026; Kasner et al. 2025), dass das Problem strukturell begründet ist. Es handelt sich um ein benanntes Gap zwischen dem Stand der Technologie und den Anforderungen methodisch fundierten Coachings.

---

## Quellenverzeichnis

**[S1]** Sedlakova, J. & Trachsel, M. (2026). The Sound of Silence: What AI Psychotherapy Chatbots Bring About While Always Chattering. *American Journal of Bioethics*, 26(2). https://www.tandfonline.com/doi/full/10.1080/15265161.2025.2608643

**[S2]** Jiang, Y., Chen, R., Zhang, L., Li, M. & Ray, L. C. (2026). Hear You in Silence: Designing for Active Listening in Human Interaction with Conversational Agents Using Context-Aware Pacing. *Proceedings of the CHI Conference on Human Factors in Computing Systems (CHI '26)*. arXiv:2602.06134. https://arxiv.org/pdf/2602.06134

**[S3]** Kasner, J. et al. (2025). Everything counts: the managed omnirelevance of speech in 'human-voice agent' interaction. arXiv:2510.22610. https://arxiv.org/pdf/2510.22610

**[S4]** Brahmasmi & Bali (2025). Pioneering: Designing the World's First Coaching-Native AI — Principles, Challenges and Enterprise. *Columbia Coaching Conference 2025*. https://www.columbiacoachingconference.org/post/pioneering-designing-the-world-s-first-coaching-native-ai-principles-challenges-and-enterprise

**[S5]** Passmore, J. & Tee, D. (2024). AI coaching: democratising or illusion? *International Journal of Evidence Based Coaching and Mentoring*, 22(2). https://doi.org/10.1080/17521882.2024.2368598

**[S6]** OpenAI (2026). Voice activity detection (VAD). *OpenAI Developer Documentation*. https://platform.openai.com/docs/guides/realtime-vad

**[S7]** Scharmer, C. O. (2009). *Theory U: Leading from the Future as It Emerges*. Berrett-Koehler Publishers.

**[S8]** INA CCW-Curriculum (ECA-zertifiziert). Methodenkorpus systemisches Coaching. Institut für Neue Arbeit, Köln. Vgl. Kapitel 2 dieser Arbeit.

---

*Technische Details zur VAD-Architektur, den durchgeführten Konfigurationsversuchen und dem Whisper-Workaround für User-Transkription: `docs/05_voice-architektur.md`*
