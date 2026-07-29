# Werkzeug-Referenz: INA CCW-Methodenkorpus

*Dokumentationsstand: 29. Juli 2026*

---

## Zweck

Diese Datei ist die inhaltliche Grundlage für Backlog B-01 (Werkzeugbeschreibungen) und B-02 (Tool-Auswahllogik). Bisher waren die ~20 Werkzeuge im Systemprompt (`lib/system-prompt.ts`) nur namentlich gelistet — das Modell kannte die Namen, nicht die Anwendungslogik. Diese Datei schließt die Lücke: Für jedes Werkzeug aus dem Original-Quellmaterial (INA CCW Internationale Akademie, Toolbeschreibungen aus der Ausbildung "Systemischer Master Business Coach") sind Prinzip, Einsatzanlass, Kernprozess, passende U-Modell-Phase und visuelle Struktur erfasst — Letzteres zusätzlich als Grundlage für die Session-Umgebung (persistente, teils räumliche Darstellung von Coaching-Artefakten, siehe Konversationsverlauf zu B-23).

**Quelle:** Ordner `Alle Tools/` (INA CCW-Ausbildungsunterlagen, nicht Teil dieses Repos, urheberrechtlich geschützt — siehe Verwendungshinweis am Ende dieser Datei). 47 Dateien gesichtet, davon 9 Team-Coaching-Tools ausgeschlossen (KICO ist reines Einzelcoaching, siehe Rollenklarheit im Systemprompt) und einige als Varianten/Arbeitsblätter statt eigenständiger Tools eingeordnet.

**Wie diese Datei genutzt wird:** Aktuell als Nachschlagewerk für Menschen (Kapitel 3 der Abschlussarbeit, Weiterentwicklung des Systemprompts). Wie genau ein KI-Agent zur Laufzeit darauf zugreift — vollständig in den Systemprompt injiziert, oder per Retrieval nur bei Bedarf geladen — ist eine eigene, noch offene Entscheidung (B-02), da der Volltext für eine permanente Systemprompt-Injektion vermutlich zu groß ist.

---

## Phasen-Mapping: Theory U ↔ KICO-Systemprompt

Die Quelldokumente ordnen jedes Tool einer Theory-U-Phase zu (oft direkt im Original-Steckbrief als Diagramm-Icon kodiert). KICO nutzt im Systemprompt eigene, coaching-nähere Phasennamen. Mapping für den Rest dieser Datei:

| Theory U (Scharmer) | KICO-Systemprompt-Phase |
|---|---|
| Seeing | 1. Einstieg & ZF |
| Sensing / Seeing from the whole | 2. Vertiefung |
| Presencing (Letting Go & Letting Come) | 3. Wendepunkt |
| Crystallizing / Prototyping | 4. Lösungsraum |
| Performing | 5. Transfer |

---

## Schnellübersicht: Phase → Werkzeuge

| KICO-Phase | Werkzeuge (Kurzname) |
|---|---|
| 1. Einstieg & ZF | Stabile Zonen, 5 Säulen der Identität, Hermeneutisch-strukturgenetische Textinterpretation |
| 2. Vertiefung | Systemische Fragen, Wertehierarchie, Ikigai, Erweiterter Perspektivwechsel, Auf mehreren Stühlen, Intra-Rollenkonflikt-Analyse (Teil 1–3), Wertekarten, Affektbilanz |
| 3. Wendepunkt | Inneres Team, Tetralemma, Wunderfrage, Durch das Tor gehen, Moment of Excellence, Systemische Strukturaufstellung, Intra-Rollenkonflikt-Analyse (Teil 4) |
| 4. Lösungsraum | Walt Disney Strategie, Bono-Hüte, Perspektivenrad, Zielematrix, Wege zum Ziel, Walking Scale, Mission/Purpose Statement |
| 5. Transfer | Logische Ebenen (Abschluss), Maßnahmenplan, Die Brücke, Heldenreise/Storytelling, Abschlussauswertung |
| Phasenübergreifend | Skalierung, Systemische Fragen (Basistechnik) |

Einige Werkzeuge spannen mehrere Phasen (z. B. Logische Ebenen: Einstieg bis Transfer, Walking Scale: Einstieg bis Lösungsraum) — dort ist im Einzeleintrag die volle Spannweite genannt.

---

## Visualisierungs-Topologien (für die Session-Umgebung)

Aus allen gesichteten Tools kristallisieren sich acht wiederkehrende räumliche/visuelle Strukturen heraus:

| Kürzel | Topologie | Beispieltools |
|---|---|---|
| (a) | Einzelwert/Einzelanker | Moment of Excellence, Coachingfrage |
| (b) | Liste/Tabelle | Maßnahmenplan, Wertehierarchie (Auswahlschritt), Abschlussauswertung |
| (c) | Radial/kreisförmig um ein Zentrum | Perspektivenrad, Ikigai (Venn-Variante), Walt-Disney-Endphase |
| (d) | Pfad/Sequenz mit variablem Abstand | Wege zum Ziel, Walking Scale, Die Brücke, Heldenreise |
| (e) | Gestapelte/hierarchische Ebenen | Logische Ebenen, Mission Statement (3 Absätze) |
| (f) | Quadranten-/Raster-Layout | Zielematrix, Intra-Rollenkonflikt-Analyse |
| (g) | Kartensortierung/Rangfolge (Turnier) | Wertekarten, Wertehierarchie (Vergleichsschritt) |
| (h) | Freie räumliche Aufstellung (coachee-bestimmt, keine feste Geometrie) | Systemische Strukturaufstellung, Tetralemma (fix) vs. Auf mehreren Stühlen (frei) |
| (i) | Keine Visualisierung nötig (rein dialogisch) | Systemische Fragen, Wunderfrage (Basisform), Brillante Momente |

**Wiederkehrendes Element quer durch fast alle Aufstellungstools:** eine "Meta-Position" / ein "Joker"-Anker außerhalb der eigentlichen Struktur, auf den der Coachee nach jeder inhaltlichen Position zurückkehrt (Tetralemma, Auf mehreren Stühlen, Inneres Team, Intra-Rollenkonflikt-Analyse, Stabile Zonen, Walt Disney Strategie, Die Brücke). Kandidat für einen eigenen, wiederverwendbaren Baustein in der Session-Umgebung, unabhängig vom jeweiligen Tool-Layout.

**Übergeordnetes Element:** Die Theory-U-Kurve selbst (siehe "Management-U-Prozess" unten) ist die visuelle Signatur, die in den meisten Original-Steckbriefen als kleines Positions-Icon auftaucht. Guter Kandidat für ein durchgehendes Navigations-/Fortschrittselement der gesamten Session, in das einzelne Tool-Instanzen als Marker eingebettet werden.

---

# Werkzeuge nach Methodenkorpus-Kategorie

## Prozessrahmen

### U-Modell (Scharmer) — Meta-Prozess, kein Einzeltool
**Kurzprinzip:** Der übergeordnete Prozessrahmen selbst, dem alle Tools zugeordnet werden. Sieben Teilphasen (Observe, Seeing from the whole, Letting Go, Letting Come, Crystallizing, Prototyping, Performing), begleitet von vier Kommunikationsqualitäten (Downloading → Debatte → Reflektiver Dialog → Schöpferischer Dialog), die je nach Phase unterschiedlich stark ausgeprägt sein sollten.
**Coaching-Anlass:** Rahmen für den gesamten Coaching-Prozess, nicht anlassbezogen.
**Hinweis für KICO:** Das Original ist für Team-/Organisationsprozesse konzipiert (Steckbrief: "Einzelcoaching: nein") — KICOs Adaption auf Einzelcoaching ist eine eigene Übersetzungsleistung, keine direkte Tool-Übernahme. Die Kommunikationsqualitäts-Dimension (Downloading/Debatte/Reflektiver Dialog/Schöpferischer Dialog) ist im aktuellen Systemprompt nicht abgebildet — möglicher Erweiterungspunkt für eine spätere Session, kein sofortiger Handlungsbedarf.
**Visualisierungs-Topologie:** (d)+(e) — die charakteristische U-Kurve (Start oben links, tiefster Punkt bei Presencing, Ende oben rechts) plus darunterliegende Kommunikationsqualitäts-Bänder.

### Logische Ebenen (Dilts)
**Kurzprinzip:** Sechs aufeinander aufbauende Ebenen (Umwelt → Verhalten → Fähigkeiten → Werte → Identität → Vision/Ziel) als Erklärungsmodell für Veränderung — höhere Ebenen organisieren niedrigere.
**Coaching-Anlass:** Überblick über gewünschte Veränderungen; wenn unklar ist, auf welcher Ebene eine Blockade liegt (Wissen? Werte? Identität?).
**Kernprozess:** Ziel/Vision zuerst formulieren, dann bottom-up durch alle Ebenen (Umwelt → Identität) mit fester Leitfrage "Welche <Ebene> ist günstig, um das Ziel zu erreichen?"; Variante mit Ressourcen-Spalten links/rechts pro Ebene; Variante mit geführter Rückwärts-Meditation am Ende.
**Phase:** Spannt Einstieg (Zielformulierung) bis Transfer (Abschlussreflexion) — Kernarbeit liegt in Vertiefung/Wendepunkt.
**Visualisierungs-Topologie:** (e) gestapelte, geordnete Ebenen mit optionalen Links/Rechts-Nebenspalten pro Ebene.

### Zielematrix
**Kurzprinzip:** Priorisierungstool — bis zu 10 SMART-geprüfte Ziele werden paarweise verglichen, Summenbildung ergibt eine objektivierte Rangfolge.
**Coaching-Anlass:** Mehrere konkurrierende Ziele/Optionen, Entscheidungsschwierigkeit zwischen gleichzeitig verfolgten Zielen; gut für rational-analytische Coachees.
**Kernprozess:** Ziele sammeln → SMART schärfen → paarweiser Vergleich in Matrix (A/B je Zelle) → Summen bilden → Rangfolge besprechen.
**Phase:** Lösungsraum (auch früh in Einstieg nutzbar, wenn mehrere Themen im Raum stehen).
**Visualisierungs-Topologie:** (f) N×N-Vergleichsmatrix, Ergebnis zusätzlich als (g) Rangfolge.

### Wege zum Ziel
**Kurzprinzip:** Entwicklung eines konkreten Wegs zu einem Ziel durch schrittweises Vorwärtsgehen von "Heute" zu "Ziel", Schritt für Schritt auf Bodenankern.
**Coaching-Anlass:** Konkretisierung eines Vorgehens (Futur Pace), wenn ein Ziel formuliert, aber der Weg dorthin unklar/"unerreichbar" erscheint.
**Kernprozess:** Zielbild erarbeiten → "Heute"- und "Ziel"-Karte im subjektiv empfundenen Abstand auslegen → schrittweise Zwischenkarten ergänzen ("Was als Nächstes?") bis Ziel erreicht → Rückblick auf den zurückgelegten Weg → Frage nach dem Ziel hinter dem Ziel. Variante: Ressourcen links (vorhanden)/rechts (fehlend) je Schritt.
**Phase:** Lösungsraum.
**Visualisierungs-Topologie:** (d) Pfad mit zwei Endpunkten in variablem, subjektiv gewähltem Abstand, dazwischen wachsende Kette von Schritt-Karten.

### Maßnahmenplan
**Kurzprinzip:** Reines Umsetzungs-/Tracking-Werkzeug — tabellarische Erfassung konkreter Maßnahmen mit Verantwortlichkeit und Frist.
**Coaching-Anlass:** Übergang von Idee zu Umsetzung, wenn Verbindlichkeit/Nachverfolgbarkeit gebraucht wird.
**Kernprozess:** Pro Maßnahme: Idee (was), Grund (wozu), Umsetzung (wie), Verantwortlicher (wer), Frist (bis wann), Controlling (Rücklauf).
**Phase:** Transfer.
**Visualisierungs-Topologie:** (b) Tabelle mit fester Spaltenreihenfolge, beliebig vielen Zeilen, optional Status-Farbcodierung (offen/in Umsetzung/erledigt).

---

## Fragetechniken

### Systemische Fragen (Basistechnik)
**Kurzprinzip:** Keine Einzelmethode, sondern die grundlegende Frage-Werkzeugkiste des systemischen Coachings: wortorientierte, zirkuläre, hypothetische, Ausnahme-, Verschlimmerungs- und Skalierungsfragen.
**Coaching-Anlass (je Unterart):** Wortorientiert bei unscharfen Formulierungen; zirkulär bei blockierter Selbstperspektive/Beziehungsthemen; hypothetisch bei Zielentwicklung und Selbsteinschränkung ("das geht nicht"); Ausnahmefragen bei festgefahrenen Problemen mit unerkannten früheren Lösungsmomenten; Verschlimmerungsfragen bei Ohnmachtsgefühl (paradoxe Intervention).
**Phase:** Phasenübergreifend — laut Quelle Basis der gesamten systemischen Arbeit.
**Visualisierungs-Topologie:** (i) keine, rein dialogisch.

### Skalierungsfragen
**Kurzprinzip:** Subjektive, "weiche" Realitäten (Zufriedenheit, Fortschritt, Motivation) werden auf einer 0–10-Skala vergleichbar und besprechbar gemacht.
**Coaching-Anlass:** Universell — Fortschritts-, Zufriedenheits- oder Motivationseinschätzung, auch als schneller Einstiegs-/Check-in-Baustein, kombinierbar mit fast jedem anderen Tool.
**Kernprozess:** Skala 0–10 setzen → Ist-Position einordnen und explorieren ("was macht aus, dass Sie schon bei X sind") → Zielwert erfragen inkl. Fremdperspektive ("woran würden andere die Veränderung erkennen") → optional Unterskalen für Teilaspekte.
**Phase:** Phasenübergreifend.
**Visualisierungs-Topologie:** (d) linearer Zahlenstrahl mit Positionsmarker, optional mehrere parallele Unterskalen. Embodied Variante: **Walking Scale** — Coachee geht die Skala im Raum physisch ab (1 → aktueller Stand x → x+1 → 4-Wochen-Ziel y), inkl. eingebetteter Wunderfrage auf Position 10. Spannt dabei Einstieg bis Lösungsraum.

### Wunderfrage
**Kurzprinzip:** Lösungsfokussierte Technik (de Shazer/Kim Berg): Coachee stellt sich vor, das Problem sei über Nacht durch ein Wunder gelöst, und beschreibt detailliert die Anzeichen dafür.
**Coaching-Anlass:** Zielentwicklung, wenn Ziele schwer formulierbar sind oder die Problemsicht dominiert; festgefahrene, ausweglos wirkende Situationen.
**Kernprozess:** Zustimmung einholen → Wunderfrage im Indikativ stellen, an Alltagsanker (Morgenroutine) geknüpft → entlang mehrerer Dimensionen vertiefen (Gefühl, Handeln, Interaktion, Beruf, Gesundheit) → kleine, jetzt schon umsetzbare erste Anzeichen identifizieren → optional Skalierung des bisherigen Fortschritts.
**Phase:** Wendepunkt, mündet in Lösungsraum.
**Visualisierungs-Topologie:** (i) primär dialogisch, optional (d) als 0–10-Skala zur Fortschrittsverortung.

### Auftragsklärung
**Status: Lücke geschlossen (29. Juli 2026), siehe `docs/rahmen.md`.** Kein einzelner Tool-Steckbrief, sondern ein systemischer Fragenkatalog aus Handout M2 ("Systemische Grundlagen des Coachings kennen, Kontext und Auftrag klären") — Cluster "Fragen zum Kontext" und "Fragen ins Thema/Problem". Vollständige Herleitung, Fragenkatalog und die daraus resultierende Konsequenz für den Systemprompt (neue Phase 1a "Kontakt & Orientierung") in `docs/rahmen.md`, Abschnitt 6.

---

## Identität & Werte

### 5 Säulen der Identität
**Kurzprinzip:** Fünf Lebensbereiche (Arbeit & Leistung, Materielle Sicherheit, Soziales Netz, Körper & Gesundheit, Werte & Sinn) als tragende Säulen, deren wahrgenommene Größe/Stabilität die eigene Standortbestimmung abbildet.
**Coaching-Anlass:** Einstieg in einen Coaching-Prozess, umfassende (Neu-)Orientierung, wenn der Coachee diffus von Ungleichgewicht spricht.
**Kernprozess:** Säulen einführen → Coachee zeichnet/legt sie in individuell empfundener Größe → jede Säule einzeln vertiefen → Beobachterperspektive, Veränderungswünsche formulieren.
**Phase:** Einstieg.
**Visualisierungs-Topologie:** (f)/(e) fünf nebeneinanderstehende Säulen fester Reihenfolge, variabler (methodisch bedeutungsvoller) Höhe unter einem gemeinsamen "Dach".

### Wertekarten
**Kurzprinzip:** Turnier-Ausscheidungsverfahren — aus 24 Wertebegriffen werden paarweise die jeweils wichtigeren gewählt, bis 3 Kernwerte übrig bleiben.
**Coaching-Anlass:** Orientierungslosigkeit bei eigenen Werten, innere Wertekonflikte (z. B. Autonomie vs. Nähe), Standortbestimmung zu Beginn eines Prozesses.
**Kernprozess:** 3 Runden paarweisen Vergleichs (24→12→6→3) → Auswertung der 3 finalen Werte (gelebte Ausprägung, Verhaltensbeispiele, Widersprüche). Vertiefungs-Arbeitsblatt "Meine Top-3-Werte" schließt sich an (Alltagserkennung, gewünschte Verhaltensänderung).
**Phase:** Vertiefung, Arbeitsblatt-Variante reicht bis Transfer.
**Visualisierungs-Topologie:** (g) K.O.-Turnierbaum/sich verengender Trichter (24→12→6→3), Ergebnis als (b) kurze geordnete Liste.

### Wertehierarchie und Werteorientierung
**Kurzprinzip:** Aus einer ~100-Begriffe-Liste werden 10, dann 5 Werte gewählt und durch vollständigen paarweisen Vergleich (jeder gegen jeden) in eine Rangfolge gebracht.
**Coaching-Anlass:** Konfliktklärung (Einzel/Team), wenn Reibung auf unausgesprochenen Wertekonzepten beruht; bewusstere Selbstführung.
**Kernprozess:** 100→10→5 Werte auswählen → 5 Werte in Kreisanordnung paarweise vergleichen (Strichzahl = Rang) → je Wert reflektieren: "lebe ich das schon?"/"möchte ich mehr davon?".
**Phase:** Vertiefung.
**Visualisierungs-Topologie:** (b) Listenauswahl gefolgt von (c) vollständigem Graph zwischen 5 Knoten (Pentagon mit allen Diagonalen); Rang ergibt sich aus Anzahl gewonnener Verbindungen, nicht aus fester Position.

### Ikigai
**Kurzprinzip:** Sinnmodell als Schnittmenge vierer Felder: Passion, Mission/Skills, Berufung, Beruf.
**Coaching-Anlass:** Sinn-/Purpose-Fragen, Unzufriedenheit im Berufsalltag, Wunsch nach Neuorientierung; gut für analytisch arbeitende Coachees; oft Vorarbeit vor dem Purpose Statement.
**Kernprozess:** Vier Cluster in fester Reihenfolge (Passion → Mission/Skills → Berufung → Beruf) durcharbeiten → clusterübergreifende Schnittmengen identifizieren.
**Phase:** Vertiefung.
**Visualisierungs-Topologie:** (c) klassisches 4-Kreise-Venn-Diagramm mit bedeutungstragenden Symbolen/Farben pro Feld und an den Überlappungsflächen. ("Ikigai Fragen" ist keine eigene Methode, sondern eine Sketchnote-Fragenliste zu genau diesem Modell.)

### Mission/Purpose Statement
**Kurzprinzip:** Verdichtung vorangegangener Reflexionen (Werte, Passion, Stärken, Berufung) in einen dreiabsätzigen, persönlichen Leitsatz.
**Coaching-Anlass:** Integrierender Abschluss nach Werte-/Sinnarbeit, explizit anschlussfähig an Ikigai.
**Kernprozess:** Freies Schreiben zu Leitfragen → Verdichtung in 3 Absätzen (Selbstbeschreibung+Mission-Satz, Zielgruppe/Feld, konkretes Tun in Verben).
**Phase:** Wendepunkt.
**Visualisierungs-Topologie:** (e) drei aufeinander aufbauende Textfelder, kein räumliches Element.

---

## Perspektive & Entscheidung

### Inneres Team (Schulz von Thun)
**Kurzprinzip:** Widersprüchliche innere Stimmen werden identifiziert, benannt und zu einem stimmigeren "Team" statt "zerstrittenem Haufen" integriert.
**Coaching-Anlass:** Coachee steckt fest, kann nicht entscheiden, erlebt widersprüchliche Bedürfnisse ("ein Teil von mir will X, ein anderer Y").
**Kernprozess:** Stimmen identifizieren und benennen (max. ~5) → jede Stimme einzeln anhören (letzte bewusst positiv/kraftvoll) → Meta-Ebene: Gemeinsamkeiten/Unvereinbarkeiten, Wichtigkeitsskala je Stimme, Schlussfolgerung.
**Phase:** Wendepunkt (mit Sensing-Vorlauf beim Identifizieren).
**Visualisierungs-Topologie:** (e)/(c)-Hybrid — "Ich"-Spitze oben, bis zu 5 Stimmen darunter gleichrangig nebeneinander; Reihenfolge der Präsentation bedeutungsvoll (letzte = stärkste Stimme), Position der Stimmen zueinander sonst frei.

### Intra-Rollenkonflikt-Analyse
**Kurzprinzip:** Bodenanker-Aufstellung zur Analyse von Rollenkonflikten zwischen widersprüchlichen Umfeld-Erwartungen (z. B. Sandwichposition), mündet in Entscheidung zwischen Erwartung A, Erwartung B oder aktiver Rollengestaltung.
**Coaching-Anlass:** Bestehende Rollenkonflikte, insbesondere Sandwichpositionen; präventiv bei bevorstehenden Rollenwechseln.
**Kernprozess:** Rolle (Meta-Bodenanker) → je Umfeld ein Anker, Erwartungen erkunden → eigene Erwartungen → Entscheidung (A / Gestalten / B) mit Konsequenzenanalyse → neue Rolle "anprobieren" und positiv benennen → Abschlussreflexion.
**Phase:** Vertiefung (Erwartungen erkunden) bis Wendepunkt (Entscheidung).
**Visualisierungs-Topologie:** (f)/(e) feste Positionshierarchie: Rolle oben, symmetrisch links/rechts die Umfelder, darunter eigene Erwartungen, darunter drei Optionsfelder, zusammenlaufend zur finalen Rolle. Symmetrie und Schrittreihenfolge sind methodisch bedeutungsvoll.

### Tetralemma
**Kurzprinzip:** Entweder-oder-Entscheidungen werden über fünf feste Positionen (Das Eine, Das Andere, Beides, Keines von Beidem, Joker) aufgelöst, um neue Optionen jenseits der binären Alternative sichtbar zu machen.
**Coaching-Anlass:** Coachee fühlt sich zwischen zwei Optionen gefangen ("nur A oder B").
**Kernprozess:** Zwei Positionen herausarbeiten → Synthese ("Beides") und Negation ("Keines von Beidem") ergänzen → freien "Joker" hinzufügen → alle 5 Positionen körperlich in fester Reihenfolge durchlaufen → Joker zuletzt reflektieren.
**Phase:** Wendepunkt, mit Ausläufern in Lösungsraum.
**Visualisierungs-Topologie:** (d)/(f)-Hybrid — feste kreuzförmige Anordnung (rechts/links = Pole, oben = Beides, unten = Keines, Joker frei), feste Durchlaufreihenfolge.

### Erweiterter Perspektivwechsel
**Kurzprinzip:** Über die einfache Ich-Du-Perspektive hinaus werden weitere Beteiligte sowie Meta-Positionen (neutraler Beobachter, Helikopter-Perspektive, andere Zeitperspektive) eingenommen.
**Coaching-Anlass:** Beurteilung von Situationen/Konflikten aus mehreren Blickwinkeln; Ideenstau, wenn der Coachee die Rolle eines selbstgewählten Experten einnehmen soll.
**Kernprozess:** Ich-Position beschreiben → weitere Beteiligte benennen und einfühlen → Meta-Positionen (neutral, Helikopter, Zeitperspektive) in intuitiver Reihenfolge → Rückkehr und Abschluss immer auf Ich-Position.
**Phase:** Vertiefung, mit Meta-Positionen Richtung Wendepunkt.
**Visualisierungs-Topologie:** (c) radial, Anzahl/Reihenfolge variabel, Ich-Position fester Start-/Endpunkt.

### Auf mehreren Stühlen
**Kurzprinzip:** Entscheidungsfindung zwischen mehreren (mehr als zwei) Optionen über Stühle/Bodenanker plus freie Meta-Position.
**Coaching-Anlass:** Entscheidung zwischen mehreren Alternativen, innere Widersprüchlichkeit von Entscheidungstendenzen.
**Kernprozess:** Je Option ein Stuhl/Anker plus ein frei platzierbarer Meta-Anker → jede Position in freier Reihenfolge einnehmen und reflektieren, Schlüsselwort notieren → Meta-Position: Gesamtbild, nächste Schritte.
**Phase:** Vertiefung bis Wendepunkt.
**Visualisierungs-Topologie:** (c)/(h) variable Anzahl radial/frei verteilter Positionen um eine frei platzierte Meta-Position; im Unterschied zum Tetralemma nicht geometrisch fixiert.

### Walt Disney Strategie
**Kurzprinzip:** Drei komplementäre Denkpositionen (Träumer, Realist, Kritiker) plus Metaraum, um eine Idee kreativ zu entwickeln und umsetzungsreif zu machen.
**Coaching-Anlass:** Entwicklung von Lösungsoptionen/Ideen/Projekten, festgefahrenes Denken, wenn Kreativität und Umsetzbarkeit beide gebraucht werden.
**Kernprozess:** Positionen zunächst an neutralen Erfahrungen ankern → am Thema: Träumer (visionär) → Realist (wetterfest machen) → Kritiker (konstruktiv prüfen) → Metaraum → mehrfaches, schneller werdendes Durchlaufen mit spiralförmiger Annäherung → Abschluss im Metaraum.
**Phase:** Lösungsraum, mit kreativem Vorlauf in Wendepunkt.
**Visualisierungs-Topologie:** (c) drei Positionen im Kreis um Metaraum außerhalb, mit dynamischer Spiralbewegung nach innen im dritten Durchgang. Form/Farbe bedeutungsvoll: Träumer=Kreis/gelb, Realist=Quadrat/grün, Kritiker=Dreieck/rot, Meta=Wolke/blau.

### Bono-Hüte (Sechs Denkhüte)
**Kurzprinzip:** Ein Thema wird nacheinander aus sechs farbcodierten Denkperspektiven betrachtet (Weiß=Fakten, Rot=Gefühle, Schwarz=Risiken, Gelb=Chancen, Grün=Kreativität, Blau=Meta-Steuerung).
**Coaching-Anlass:** Festgefahrene Konflikte, blockierte Ideen, "out of the box"-Denken gewünscht. **Hinweis:** Quell-Steckbrief ist primär auf Teamcoaching ausgerichtet (3–20 Teilnehmer); Einzelcoaching-Tauglichkeit im Original inkonsistent markiert.
**Kernprozess:** Hüte einführen → Leitfrage klären → Denkstile nacheinander durchlaufen (~3–5 Min je Hut) → mit Blauem Hut Prozess reflektieren und nächste Schritte klären.
**Phase:** Lösungsraum.
**Visualisierungs-Topologie:** (h) feste, farbcodierte Kategorien-Sequenz (physisch: Hüte/Kärtchen, digital explizit als "farbcodierte Spalten" beschrieben); Farbcodierung strikt bedeutungsvoll, Reihenfolge variabel. **Überschneidet sich stark mit dem Perspektivenrad** (identische sechs Denkhüte von de Bono als Grundlage) — Perspektivenrad ist die für Einzelcoaching ausgearbeitete, räumlich-radiale Variante (Zentrumskarte + Kreis), Bono-Hüte die eher gruppenorientierte, spaltenbasierte Variante. Für KICO ist das Perspektivenrad die primäre Umsetzung; Bono-Hüte als eigenständiger Eintrag nur der Vollständigkeit halber geführt.

### Perspektivenrad
**Kurzprinzip:** Strukturierte Klärung widersprüchlicher Einstellungen/Argumente/Gefühle zu einem Thema über sechs kreisförmig angeordnete "Denkhut"-Positionen (De Bono) um eine zentrale Aussage.
**Coaching-Anlass:** Wichtige Entscheidungen mit ambivalenten Gefühlen/widersprüchlichen Argumenten; konkrete, abgrenzbare Entscheidungen (nicht bei generellen Entscheidungsproblemen).
**Kernprozess:** Entscheidungskonflikt in eine Aussage verdichten, mittig auslegen → sechs farbige Karten kreisförmig darum positionieren → Coachee durchläuft in fester Reihenfolge (Weiß→Rot→Schwarz→Gelb→Grün→Blau) und beantwortet ausschließlich aus der jeweiligen Perspektive → Auswertung (wohlste/unangenehmste Position, üblicher Denkstil).
**Phase:** Lösungsraum (Analysephase/Entscheidungsklärung laut Quelle).
**Visualisierungs-Topologie:** (c) eine Zentrumskarte + 6 Karten im Kreis, feste Farbcodierung, feste Reihenfolge des Durchlaufens — bereits im Detail dokumentiert (siehe Konversationsverlauf), erste vollständig spezifizierte Referenz-Topologie für die Session-Umgebung.

### Stabile Zonen
**Kurzprinzip:** Identifikation individueller Stabilitätsanker in sechs Lebensbereichen (Ideen, Macht, Menschen, Plätze, Dinge, Organisationen) und Prüfung ihrer Bestandsfestigkeit.
**Coaching-Anlass:** Orientierungsphase/Einstieg ohne klar benanntes Thema, Umbruchsituationen (Jobwechsel, Umzug, Verlust), wenn der Coach Themen für den weiteren Prozess identifizieren will.
**Kernprozess:** Sechs Reflexionsfragen je Zone (bestehen? wie stabil? Nutzen morgen? Einfluss? Investition? Verträglichkeit mit Beruf/Familie?) → Beobachterposition, Veränderungswünsche formulieren.
**Phase:** Einstieg, mit Sensing-Anteilen.
**Visualisierungs-Topologie:** (h) Grundversion dialogisch; Bodenanker-Variante mit sechs Kategorie-Ankern plus separatem "Joker"/Meta-Anker außerhalb der Struktur — keine feste Geometrie, aber klare Trennung System/Beobachterposition.

### Affektbilanz
**Kurzprinzip:** Ein Thema wird gleichzeitig auf zwei unabhängigen 0–100-Skalen bewertet (positive Affekte / negative Affekte, nicht als ein Gegensatzpaar).
**Coaching-Anlass:** Konfliktklärung, schnelle Einschätzung eines emotional aufgeladenen Themas, auch zur Überprüfung der emotionalen Tragfähigkeit bereits erarbeiteter Lösungen.
**Kernprozess:** Thema benennen → spontan (ohne Nachdenken) auf beiden Skalen markieren → Argumente notieren → Handlungsoptionen ableiten ("Wovon mehr, was weniger?") → optional Re-Einsatz am Ende zur Überprüfung.
**Phase:** Vertiefung, Zweiteinsatz auch Lösungsraum.
**Visualisierungs-Topologie:** (h) zwei parallele, unabhängige Vertikalskalen (0 unten, 100 oben), räumliche Trennung negativ/positiv methodisch bedeutsam.

### Systemische Strukturaufstellung als Simulationsverfahren
**Kurzprinzip:** Bildgebendes Aufstellungsverfahren — Schlüsselelemente (Werte, Ressourcen, Anteile, blinde Flecken) werden durch Repräsentanten im Raum positioniert, befragt und umgestellt, bis sich ein Lösungsbild ergibt. Original ist ein Gruppenverfahren mit menschlichen Repräsentanten; die vorliegende Fassung ist für Einzelcoaching adaptiert (Repräsentanten = Bodenanker/Karten/Stühle).
**Coaching-Anlass:** Komplexe innere Konflikte, Entscheidungsdilemmata, unklare Systemzusammenhänge, blinde Flecken — wenn rein verbale Reflexion nicht ausreicht. **Hinweis:** Setzt laut Quelle einen erfahrenen, im Tool sicheren Coach voraus — Eignung für einen KI-Agenten ohne weitere Prüfung fraglich, hier nur dokumentiert, nicht zur unmittelbaren Aufnahme empfohlen.
**Kernprozess:** Key-Words aus der Coaching-Frage identifizieren → Ausgangsbild aufstellen → jedes Element befragen → Coachee stellt intuitiv um → erneutes Befragen/Umstellen → Lösungsbild → Repräsentanten "entrollen" → Abschlussreflexion.
**Phase:** Vertiefung bis Wendepunkt.
**Visualisierungs-Topologie:** (h) völlig freie, sich im Prozessverlauf verändernde Konstellation; Abstände/Blickrichtungen hochgradig bedeutungstragend; mehrere aufeinanderfolgende Zustände (Ausgangsbild → Umstellung → Lösungsbild), ggf. als Zeitverlauf derselben Szene abbildbar.

### Hermeneutisch-strukturgenetische Textinterpretation
**Kurzprinzip:** Sprachanalytisches Verfahren — die Formulierung der Coaching-Frage selbst wird Wort für Wort, kontextfrei analysiert, da sie bereits unbewusste Antwort-Spuren enthalten soll.
**Coaching-Anlass:** Coachee bringt eine ihn stark bewegende, explizit formulierte Frage (nicht nur eine Situationsbeschreibung). **Hinweis:** Setzt laut Quelle einen erfahrenen Coach voraus, nicht für Führungskräfte oder Teamsettings — anspruchsvollste, am wenigsten standardisierte Methode im gesamten Korpus. Wie bei der Strukturaufstellung: dokumentiert, aber nicht ohne Weiteres für einen KI-Agenten zu empfehlen.
**Kernprozess:** Coachee formuliert und notiert die Frage wörtlich → laut vorlesen → Schlüsselwörter markieren → sequentielle, kontextfreie Analyse je Wort (mehrere Deutungshypothesen, die der Coach für sich behält und durch Rückfragen prüft, nicht mitteilt) → optional kombiniert mit Strukturaufstellung.
**Phase:** Einstieg.
**Visualisierungs-Topologie:** (h) Sonderfall — ein einzelner, wörtlich notierter Satz mit hervorgehobenen Schlüsselwörtern; bei Kombination mit Aufstellung (c)/(h) frei positionierte Repräsentanten je Schlüsselwort.

### Durch das Tor gehen
**Kurzprinzip:** Geführtes Imaginationsritual — der Coachee durchschreitet mental ein symbolisches Tor auf ein Signalwort hin, um eine bereits gewonnene positive Erkenntnis emotional zu verankern.
**Coaching-Anlass:** Bekräftigung einer positiven Erkenntnis/Entscheidung am Ende einer intensiven Sequenz. **Voraussetzung:** Coachee muss zu diesem Zeitpunkt emotional stabil sein — nicht bei ungeklärter/ambivalenter Gefühlslage einsetzen. Nur 1:1.
**Kernprozess:** Einlassen einlladen → Ausgangssituation imaginativ erspüren → Weg zu einem imaginären Tor beschreiben lassen → Tor detailliert beschreiben → auf Signalwort hindurchgehen → nachspüren lassen, Coach hält sich zurück.
**Phase:** Wendepunkt.
**Visualisierungs-Topologie:** (i) primär rein erlebnisbasiert (geschlossene Augen, keine Karten); falls dennoch dargestellt, ein einzelnes Schwellen-/Portal-Symbol auf der Session-Timeline.

### Moment of Excellence
**Kurzprinzip:** NLP-Ressourcenanker — eine vergangene Bestform-Situation wird über sinnesbasierte (V.A.K.O.G.) Fragen in leichter Trance nacherlebt und körperlich verankert.
**Coaching-Anlass:** Ressourcenaktivierung vor anspruchsvollen Situationen (Prüfung, Präsentation, Wettkampf).
**Kernprozess:** Drei mögliche Situationen sammeln → beste auswählen → Bodenanker auslegen → V.A.K.O.G.-geführte Trance-Vertiefung auf dem Anker → langsames Zurückkommen.
**Phase:** Wendepunkt, mit Anwendungsbrücke zu Transfer.
**Visualisierungs-Topologie:** (a) ein einzelner Bodenanker für die gewählte Situation; Vorauswahl aus drei Optionen als kurze (b) Liste, aber nur die gewählte erhält den physischen Anker.

---

## Abschluss

### Heldenreise / Storytelling (Campbell)
**Kurzprinzip:** Ein Veränderungsvorhaben oder bereits durchlaufener Prozess wird als archetypische Erzählung (Ruf → Aufbruch → Prüfungen → Schatz → Rückkehr) narrativ verdichtet.
**Coaching-Anlass:** Größere Veränderungsvorhaben, Change-Kommunikation, Visionsentwicklung — oder rückblickend: Abschluss eines längeren Prozesses, bewusstes Abschiednehmen von einer durchlaufenen "Reise".
**Kernprozess:** Ruf des Abenteuers (Herausforderung benennen) → Aufbruch (Grenzen, innere Widerstände) → Weg der Prüfungen (Hindernisse, Gelerntes) → der Schatz (Ziel/Lohn) → Rückkehr (Alltagsverankerung). Als Abschlussvariante: freie Verschriftlichung anhand von 8 Leitfragen, optional in einem gewählten Genre (Krimi, Märchen, Sci-Fi, Western).
**Phase:** Spannt potenziell den gesamten Bogen (als Prozessmodell); als Abschlusstool klar Transfer.
**Visualisierungs-Topologie:** (d) zyklischer/spiralförmiger Pfad mit fester, dramaturgisch zwingender Reihenfolge und einem klaren Spannungshöhepunkt (Krise/Prüfungen) in der Mitte.

### Die Brücke
**Kurzprinzip:** Vier-Positionen-Abschlusstool — verbindet Ausgangsanliegen mit Erreichtem über eine imaginierte, physisch ausgelegte "Brücke", abschließend aus einer Meta-Position gewürdigt.
**Coaching-Anlass:** Abschluss eines längeren Prozesses/einer Etappe, besonders wenn zu Beginn kein klares Ziel definiert wurde oder sich Ziele stark verändert haben; Bewusstmachung und Festigung von Gelerntem vor dem Alltagstransfer.
**Kernprozess:** "Anliegen"-Anker (Ausgangspunkt) → "Erreichte"-Anker (mit spürbarem Abstand zum ersten) → "Brücke" dazwischen: Coachee legt gewonnenes Wissen/Fähigkeiten als Kartenpfad zwischen beiden Ankern aus → "Meta"-Position außerhalb der Achse: Gesamtbild, Transferfragen ("must have" vs. "nice to have").
**Phase:** Transfer.
**Visualisierungs-Topologie:** (d) zwei fixe Endpunkte mit spürbarem, subjektiv gewähltem Abstand, dazwischen ein selbst ausgelegter Kartenpfad; Meta-Position bewusst außerhalb der Hauptachse. **Noch nicht im aktuellen Methodenkorpus** — Kandidat für Aufnahme, da methodisch stark zu Backlog B-04 (Sessionabschluss) passt.

### Abschlussauswertung
**Kurzprinzip:** Strukturierte Vierblock-Evaluation des gesamten Coaching-Prozesses (äußerer Ablauf, Lernprozess, Beziehungsqualität, Perspektiven).
**Coaching-Anlass:** Formeller Abschluss eines Coaching-Prozesses oder einer Etappe, wenn eine mehrdimensionale (nicht nur zielbezogene) Auswertung gewünscht ist.
**Kernprozess:** Vier Blöcke nacheinander: äußerer Ablauf → Lernprozess (Erwartungen, Themen, Mitnahmen) → Beziehung Coach-Coachee → Perspektiven/offene Themen.
**Phase:** Transfer.
**Visualisierungs-Topologie:** (i) primär dialogisch/Formular; falls visualisiert, (e) vier gestapelte thematische Blöcke ohne positionale Bedeutung.

---

## Nicht übernommene / gesondert zu behandelnde Funde

**Team-Coaching-Tools (9 Dateien, ausgeschlossen):** Reflecting Team, HDI, Open Space, World Café, Team-Uhr, Talent-Talk, Team-Rad, Teamkörper, sowie Bono-Hüte (siehe oben, mit Vorbehalt geführt) — für KICOs reines Einzelcoaching-Setting nicht anwendbar.

**Brillante Momente:** Formal keine TEAM_-Datei, methodisch aber ein Zwei-Personen-Partnerformat (Rollen "Mensch"/"Giraffe") — für ein 1:1-KI-Coaching ohne zweite Person nicht direkt nutzbar. Nicht in den Methodenkorpus aufgenommen.

**Evaluation von Coaching durch Coachee:** Kein Session-Tool, sondern ein 34-Item-Meta-Fragebogen zur Qualitätsbewertung eines abgeschlossenen Coaching-Zeitraums. Eher ein Kandidat für ein separates Plattform-Feature (Nutzer-Feedback) als für den Methodenkorpus.

**Systemische Strukturaufstellung** und **Hermeneutisch-strukturgenetische Textinterpretation:** Beide laut Quelle ausdrücklich nur für erfahrene, im jeweiligen Tool sichere Coaches vorgesehen. Dokumentiert, aber bewusst nicht automatisch in die aktive Tool-Auswahl übernommen — erfordert eine gesonderte Entscheidung, ob und wie ein KI-Agent diese anspruchsvollsten Verfahren des Korpus verantwortbar einsetzen kann.

**Walking Scale, Die Brücke, Moment of Excellence, Durch das Tor gehen:** Vier Tools mit Bodenanker-Bezug, die nicht explizit im aktuellen Systemprompt-Methodenkorpus stehen, aber methodisch gut passen (Walking Scale als Skalierungs-Variante, Die Brücke für B-04/Sessionabschluss, Moment of Excellence für Ressourcenaktivierung, Durch das Tor gehen für Wendepunkt-Verankerung). Kandidaten für eine bewusste Erweiterungsentscheidung, keine automatische Aufnahme.

---

## Verwendungshinweis (Quellmaterial)

Die zugrundeliegenden Toolbeschreibungen stammen von der INA CCW Internationale Akademie (Coaching Campus World) und unterliegen deren Verwendungshinweis: Nutzung im Rahmen eigener Coachings gestattet, Weitergabe/Vervielfältigung in Ausbildungen nur mit vorheriger schriftlicher Zustimmung der INA CCW. Diese Datei fasst die Inhalte für die technische Dokumentation zusammen, ersetzt aber nicht die Originalquellen und ist nicht zur Weitergabe außerhalb dieses Forschungsprojekts bestimmt.
