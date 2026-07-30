# Rahmen: Sessioneinstieg, Auftragsklärung, Coachingfrage, Rolle des Coachs

*Dokumentationsstand: 29. Juli 2026*

---

## Zweck

`docs/tools.md` beschreibt, *welche* Werkzeuge KICO in welcher Phase einsetzen kann. Diese Datei beschreibt das, was vor und um jedes Werkzeug herum liegt: wie ein Coaching-Gespräch überhaupt beginnt, wie ein Anliegen zu einer bearbeitbaren Frage wird, welche Haltung das Zuhören selbst braucht, und was einen Coach – auch einen KI-Coach – von einem Berater unterscheidet. Ohne dieses Material hatte der bisherige Systemprompt für den Sessioneinstieg nur eine sehr schmale, selbst erfundene Struktur (die "ZF-Struktur"). Diese Datei ersetzt das durch fachlich fundiertes Material.

**Quellen:** INA CCW-Ausbildungsunterlagen (nicht Teil dieses Repos, urheberrechtlich geschützt, Verwendungshinweis siehe unten):
- Handout M6, "Das Coachingkonzept" (C06) — U-Modell-Tool-Mapping, 4-Phasen-Ablauf des Coachinggesprächs (dort in 6 Schritten operationalisiert), Coaching-Profil, Heldenreise
- Handout M2, "Systemische Grundlagen des Coachings kennen, Kontext und Auftrag klären" (C02) — Systemtheorie, radikaler Konstruktivismus, Theorie U, 4-Phasen-Modell des Coachinggesprächs, systemische Fragekataloge, aktives Zuhören
- Handout "Meine Rolle als Coach" (C03) — Selbstkonzepte des Coachs, Werte/Glaubenssätze, Tooleinsatz-Philosophie

**Zusätzliche, nicht-zertifizierte Quelle** (Abschnitt 9): "Slides Coaching DE.pdf", ein Webinar-Deck des betrieblichen EAP-Anbieters Kyan Health zu Change & Resilienz — kein INA-CCW-Lehrmaterial, aus dem Ordner "Weitere Coaching Quellen". Nur die Fixed-/Growth-Mindset-Folie (nach Carol Dweck) wird herangezogen, explizit als externe Ergänzung gekennzeichnet, nicht als Zitat des zertifizierten Curriculums.

Diese Datei ist wie `docs/tools.md` kuratiertes Rohmaterial für die spätere Abschlussarbeit (Kapitel 3), nicht die Arbeit selbst — siehe Notiz zur Arbeitsteilung in `docs/backlog.md` / Projektgedächtnis.

---

## 1. Systemtheoretische Grundhaltung

Bevor es um Technik oder Fragetechnik geht, steht eine erkenntnistheoretische Prämisse, die die gesamte systemische Methodik trägt (radikaler Konstruktivismus, von Foerster/Watzlawick, M2):

- Niemand beobachtet objektiv. Beobachter sind Teil ihrer Beobachtung.
- "Die Umwelt, wie wir sie wahrnehmen, ist unsere Erfindung" (von Foerster, 1973). Wirklichkeit ist ein subjektives, gedankliches Konstrukt.
- Lineare Kausalität ("A verursacht B") wird durch zirkuläre Kausalität ersetzt: A beeinflusst B, B beeinflusst wieder A. Typisches Beispiel aus M2: "A tut nichts, weil B sich einmischt" vs. "B mischt sich ein, weil A nichts tut" — beide Lesarten sind innerhalb desselben Systems gültig, keine ist "die Wahrheit".
- "The map is not the territory" (Korzybski) — jede Deutung, auch eine coaching-fachlich fundierte, bleibt eine Landkarte, nicht das Gebiet selbst.

**Konsequenz für KICO:** Das Modell darf dem Coachee niemals eine Deutung seiner Situation als richtig oder objektiv präsentieren. Jede Formulierung wie "das Problem ist eigentlich X" widerspricht der methodischen Grundlage. Erlaubt ist ausschließlich das Anbieten von *Perspektiven* ("Könnte es sein, dass …?"), nie das Feststellen von Fakten über die innere Welt des Coachees. Das war im bisherigen Systemprompt implizit (Rollenklarheit: "keine Ratschläge"), ist jetzt aber fachlich begründet, nicht nur als Verhaltensregel gesetzt.

---

## 2. Die Rolle des Coachs

Aus C03 und M2 lässt sich die Rolle präzise gegen die des Beraters/Therapeuten abgrenzen — nicht nur im "was wir nicht sind" (das stand bereits im alten Systemprompt), sondern im "wie wir uns verhalten":

- **Wer fragt, führt.** Wer fragt, redet weniger und erfährt mehr, deckt Hindernisse auf, lenkt das Gespräch zielgerichtet, behauptet nichts, zeigt Interesse, ermöglicht dem Gegenüber Selbstkorrektur, verschafft sich Denkzeit (M2, "Wer fragt, führt").
- **Der Coach ist Prozessexperte, nicht Inhaltsexperte.** Der Coachee bleibt Experte für sein eigenes System; der Coach stellt gezielte Fragen, um Beziehungen und Verhalten *im System des Coachees* zu beleuchten — nicht um es von außen zu bewerten (M2, "Systemisches Coaching").
- **Sich selbst zurücknehmen ist der Schlüssel.** Explizit benannte Fehler aktiven Zuhörens: Erwidern statt zuhören, Erwartungen hineinhören statt Neues entdecken, Überhören was nicht ins eigene Konzept passt, Interpretieren statt annehmen, Bewerten statt neutral bleiben (M2, "Aktives Zuhören, Fehler und Haltung").
- **Selbstklärung ist Teil der Rolle, nicht nur Technik.** M2 führt eine eigene Fragekategorie "Fragen zur Selbstklärung" (u.a. "Bin ich gerade beim Coachee, oder bin ich bei mir?"). Für einen KI-Coach ist das nicht wörtlich übertragbar, aber die Funktion — eine ständige Rückversicherung, dass die Session dem Coachee dient und nicht dem eigenen Ablaufmuster des Systems — bleibt sinngemäß gültig und ist ein Argument für die B-05b-Philosophie ("Grenzen kennen").

**Konsequenz für KICO:** Die Rollenklarheit im Systemprompt wird um diese aktive Komponente ergänzt — nicht nur "was KICO nicht ist", sondern "wie sich KICOs Fragehaltung konkret zeigt" (führen durch Fragen, sich zurücknehmen, nicht interpretieren).

---

## 3. Aktives Zuhören — vier Ebenen

M2 beschreibt aktives Zuhören nicht als einzelne Technik, sondern als vier aufeinander aufbauende Ebenen (angelehnt an C. Otto Scharmers vier Zuhör-Qualitäten aus der Theorie U):

1. **Downloading** — reines Bestätigungssignal: "Mhh…", Nicken, Blickkontakt.
2. **Gegenständlich-unterschiedliches Zuhören** — Inhalt spiegeln: "Es scheint mir um … zu gehen?", "Verstehe ich Sie richtig, wenn …?"
3. **Empathisches Zuhören** — Gefühl benennen: "Es ärgert Sie also, dass …?", "Sind Sie sauer, weil …?"
4. **Schöpferisches Zuhören** — Inhalt, Emotion und Erleben zusammen erfassen, auf einer Ebene, die über das bisher Gesagte hinausgeht.

Ziel: gutes Gesprächsklima schaffen, gemeinsame Problemlösung ermöglichen. Weg: Worte und Empfindungen verstehen, bei Stocken "Was"-Fragen stellen, das Gesagte spiegeln, geduldig akzeptieren, interessiert ausreden lassen, nicht unterbrechen.

**Konsequenz für KICO:** Die bisherige Kurzformel im Systemprompt ("Spiegle → Fasse zusammen → Benenne Muster → Dann erst frage") war schon in diese Richtung, aber ohne die vier Ebenen benannt und ohne die Fehlerliste. Beide werden in den neuen Systemprompt aufgenommen — insbesondere die Fehlerliste ist für ein Sprachmodell direkt handlungsrelevant (z. B. "Interpretieren statt annehmen" ist ein bekanntes LLM-Risiko).

---

## 4. Fragetypen

M2 unterscheidet drei Grundtypen (Übersicht "Fragen im Coaching"):

- **Offene Fragen / W-Fragen** — beginnen mit wer/wie/wo/was/wann/wieviel/weshalb/wozu, führen zu Erläuterung oder Stellungnahme. Tipp aus der Quelle: "warum" durch "aus welchen Gründen" ersetzen (weniger rechtfertigend).
- **Geschlossene Fragen / Entscheidungsfragen** — beginnen mit haben/machen/sollen/werden/können, führen zu Ja/Nein.
- **Systemische Fragen** — ermöglichen oder regen Perspektivwechsel an, beziehen andere Systemmitglieder ein ("Angenommen, ich würde Ihre Mitarbeiter fragen, was würden die sagen?").

Das deckt sich mit der bereits bestehenden Regel "keine Ja/Nein-Fragen" im Systemprompt, liefert aber die fachliche Begründung nach.

---

## 5. Der Gesprächsablauf — drei Quellen, ein Rahmen

Drei Quellen beschreiben denselben Gesprächsbogen mit unterschiedlicher Granularität. Sie widersprechen sich nicht, sondern zoomen unterschiedlich weit:

| Theorie U (Scharmer, 5 Kernphasen) | KICO-Systemprompt (bisher) | M2 — 4-Phasen-Modell | M6 — 6-Schritte-Ablauf |
|---|---|---|---|
| Seeing | 1. Einstieg & ZF | 1. Kontakt & Orientierung | 1. Gesprächseinstieg |
| — | (Teil von Phase 1) | 2. Anliegen & Ziel | 2. Klärung der Auftragssituation |
| Sensing / Seeing from the whole | 2. Vertiefung | (Teil von Phase 3) | 3. Zieldefinition |
| Presencing (Letting Go/Letting Come) | 3. Wendepunkt | 3. Entwicklung von Lösungen | 4. Lösungen entwickeln |
| Crystallizing/Prototyping | 4. Lösungsraum | (Teil von Phase 3) | (Teil von Schritt 4) |
| Performing | 5. Transfer | 4. Transfer | 5. Transfersicherung, 6. Gesprächsabschluss |

Für KICO bleibt das 5-Phasen-Modell aus dem Systemprompt die führende Struktur (es ist bereits an Theorie U angelehnt und im Backlog/tools.md verankert). Neu ist, dass **Phase 1 jetzt inhaltlich in zwei Teilschritte zerfällt**, die M2 und M6 übereinstimmend als eigenständig behandeln:

1. **Kontakt & Orientierung** (M2) / **Gesprächseinstieg** (M6): gute Gesprächsbasis schaffen, Einverständnis zum Vorgehen herstellen, Leitfragen: "Was läuft hier genau ab? Mit wem habe ich es zu tun? Können wir miteinander?" — Transparenz über den Ablauf selbst.
2. **Anliegen & Ziel** (M2) / **Klärung der Auftragssituation + Zieldefinition** (M6): verstehen, konkretisieren, unterstützen. Leitfragen: "Worum soll es genau gehen? Was will der Coachee erreichen?"

Das ist genau die Lücke, die in `docs/tools.md` als "Auftragsklärung — Quelldatei nicht gefunden" offen markiert war. Diese Lücke ist mit M2 geschlossen — siehe Abschnitt 6.

---

## 6. Auftragsklärung — die systemischen Fragekataloge

M2 liefert keinen einzelnen "Auftragsklärung"-Steckbrief, sondern etwas Besseres für einen dialogfähigen KI-Coach: einen Katalog systemischer Fragen, gegliedert nach Funktion. Für den Sessioneinstieg sind vor allem die ersten beiden Cluster relevant:

**Fragen zum Kontext** (Auftragsklärung im engeren Sinn):
Was hat Sie zum Coaching geführt? Wie ist es zu diesem Gespräch gekommen? Von wem geht die Initiative aus? Wer ist am meisten/wenigsten am Coaching interessiert? Was war der Auslöser/Anlass für dieses Gespräch? Aus welchen Gründen gerade jetzt? Was ist Ihre Erwartung an mich? Welche Vorerfahrung haben Sie bereits mit Coaching? Was müsste passieren, damit das Coaching scheitert? Was müsste passieren, damit sich das Coaching für Sie gelohnt hat?

**Fragen ins Thema/Problem** (wenn der Coachee mit einer Situation statt einer fertigen Frage kommt):
Wie lässt sich die Situation beschreiben? Warum ist es ein Problem? Was ist genau passiert? Wie wird das Problem spürbar oder sichtbar? Wer ist alles (nicht) beteiligt? In welchem Kontext tritt das Thema auf? Wo sehen Sie Ihren Anteil für dieses Problem?

**Fragen ins Ziel** (Übergang zur Coachingfrage, siehe Abschnitt 7):
Wenn das Thema gelöst wäre, was genau wäre dann anders? Woran würden Sie erkennen, dass das Thema gelöst ist? Auf einer Skala von 1 bis 10, wie wichtig ist dieses Ziel für Sie? Was haben Sie bislang schon erreicht?

Ergänzend, aber erst für spätere Phasen relevant: **Fragen zu Vorerfahrungen** (Was haben Sie bereits unternommen? Mit welchem Erfolg?), **Fragen zur Assoziation/Dissoziation** (Wie wird es sich anfühlen, wenn Sie das Ziel erreicht haben? / Wie würde ein neutraler Beobachter das Thema darstellen?), **Fragen zur Ressourcenaktivierung** (Was hat bereits gut funktioniert? Welche Ihrer Stärken können Sie einsetzen?) und die **Wunderfrage** (bereits im Methodenkorpus, siehe `tools.md`).

**Konsequenz für KICO:** Nicht der komplette Katalog gehört in jede Session — das wäre ein Verhörcharakter, das Gegenteil dessen, was M2 unter gutem aktivem Zuhören versteht. Aber eine kleine, sorgfältig gewählte Teilmenge aus "Fragen zum Kontext" gehört in die neue Phase 1a (Kontakt & Orientierung), bevor die bisherige ZF-Struktur beginnt — insbesondere "Was hat dich zum Coaching geführt?" und "Was ist deine Erwartung an mich?" sind kurze, warme Einstiegsfragen, die dem Coachee Raum geben, ohne zu verhören.

Diese Datei löst damit eine Architekturfrage aus dem bisherigen Systemprompt-Kommentar auf ("Der Auftrag (A) wurde bereits durch die Benutzeroberfläche eingeholt"): Diese Aussage war nur teilweise richtig. Der *organisatorische* Auftrag (wer, warum, welcher Rahmen) kann über eine künftige Intake-UI erhoben werden (Backlog B-17, noch nicht gebaut). Der *coaching-fachliche* Auftrag — die in M2 beschriebene Kontextklärung — ist dialogisch und gehört in die Session selbst, nicht in ein Formular. Der neue Systemprompt trägt dieser Unterscheidung Rechnung.

---

## 7. Die Coachingfrage

Der Begriff "Coachingfrage" (im bisherigen Systemprompt als "F" der ZF-Struktur verankert) ist kein einzelner benannter Tool-Steckbrief im gesichteten Quellmaterial, lässt sich aber präzise aus zwei Quellen ableiten:

- M6, Schritt "Zieldefinition": "Worum soll es genau gehen? Was will der Coachee erreichen?" — Definition der gewünschten Veränderung, Einigung über den Schwerpunkt.
- M2, Cluster "Fragen ins Ziel": dieselbe Funktion, ausführlicher mit Skalierung, Assoziation und Ressourcenbezug hinterlegt.

Die Coachingfrage ist damit die **verdichtete, vom Coachee selbst formulierte Fassung dessen, was in der Kontextklärung als Thema sichtbar wurde** — nicht identisch mit dem ersten geäußerten Anliegen (das ist oft noch eine Situationsbeschreibung), sondern das Ergebnis eines kurzen Verdichtungsschritts. Das bestätigt die bisherige Systemprompt-Logik ("Der Coachee formuliert die Frage selbst. Du schlägst keine Formulierung vor") und liefert zusätzlich die Anschlussfragen aus M2, falls die erste Antwort noch zu vage ist ("Wenn das Thema gelöst wäre, was genau wäre dann anders?").

---

## 8. Lösungsorientierung als Grundhaltung für die späteren Phasen

M2 führt zwei ergänzende lösungsorientierte Traditionen ein, die bereits implizit im Methodenkorpus stecken (Wunderfrage, Ausnahmefragen, Skalierung), hier aber erstmals mit ihrer eigenen Begründung:

- **de Shazer:** "Solution talk creates solutions" — wer beim Problem bleibt, bleibt beim Problem hängen. Der Weg von Problem- zu Lösungsorientierung führt über Ausnahmefragen ("Gibt es Ausnahmen? Wann ist es nicht so?").
- **Insoo Kim Berg, drei Leitsätze:** (1) Repariere nicht, was nicht kaputt ist. (2) Finde heraus, was gut funktioniert, und tue mehr davon. (3) Wenn etwas trotz vieler Anstrengungen nicht gut genug funktioniert, höre damit auf und versuche etwas Neues.

**Konsequenz für KICO:** Diese drei Leitsätze sind kompakt genug, um als explizite Grundhaltung in den Systemprompt aufgenommen zu werden — sie begründen, warum KICO in der Vertiefungsphase aktiv nach Ausnahmen und bereits funktionierenden Ansätzen fragen soll, statt nur die Problem-Erzählung zu vertiefen.

---

## 9. Gute vs. schlechte Coachingfrage — Synthese, kein Quellenfund (30. Juli 2026)

**Kein einzelnes Dokument im gesichteten Material enthält eine explizite Kriterienliste** für "gute" vs. "schlechte" Coachingfragen. Der folgende Abschnitt ist deshalb ausdrücklich als **eigene Synthese aus zwei getrennten Quellen** gekennzeichnet, nicht als Zitat:

- **INA CCW / M2, Lösungsorientierung** (bereits in Abschnitt 8 dokumentiert): de Shazer ("solution talk creates solutions"), Insoo Kim Bergs drei Leitsätze. Betrifft dort die Gesprächsführung insgesamt, nicht namentlich die Formulierung der einen Coachingfrage.
- **Kyan Health-Deck, Fixed vs. Growth Mindset** (Dweck, externe Quelle, siehe oben): Gegenüberstellung von vergangenheits-/defizitorientierter Sprache ("Ich kann das nicht", "Das übersteigt meine Fähigkeiten") und zukunfts-/selbstwirksamkeitsorientierter Sprache ("Ich werde das mit der Zeit verstehen", "Jeder Experte war mal ein Anfänger").

**Verdichtetes Kriterium für KICO:** Eine Coachingfrage tendiert zur schwächeren Seite, wenn sie rückwärtsgewandt ist (fragt nach Ursachen statt nach Zielzustand — "Warum ist X passiert?"), external attribuiert (Verantwortung/Veränderung liegt bei einer dritten Person — "Warum ist mein Chef so?") oder listend/passiv ist (zählt Symptome auf, ohne einen Ansatzpunkt für eigenes Handeln zu benennen — "Was hemmt mich alles?"). Sie tendiert zur stärkeren Seite, wenn sie nach vorne gerichtet ist, beim eigenen Einflussbereich ansetzt und selbstwirksam formuliert ist ("Wie schaffe ich es, …?", "Was kann ich tun, damit …?").

**Zentrale Grenze — bewusst eng gefasst nach Nutzer-Korrektur (30. Juli 2026):** KICO bewertet die Formulierung, schlägt aber **keine eigene Alternativformulierung vor**. Das würde die in Abschnitt 2 dokumentierte Rollengrenze verletzen ("Der Coach ist Prozessexperte, nicht Inhaltsexperte", "Du schlägst keine Formulierung vor"). Erkennt KICO eine rückwärtsgewandte/externale/listende Frage, stellt es ausschließlich eine **Prozessfrage**, die die Möglichkeit einer Neuformulierung eröffnet, z. B.: "Ich höre da eine Frage, die stark auf das schaut, was schwierig ist — gäbe es eine Möglichkeit, sie so zu stellen, dass sie nach vorne schaut, auf das, worauf du selbst Einfluss hast?" Die eigentliche Neuformulierung bleibt vollständig beim Coachee, wie bei der ursprünglichen Coachingfrage-Klärung selbst (Abschnitt 7). KICO drängt außerdem nicht auf eine "perfekte" Frage — ein Durchgang der Rückfrage reicht; entscheidet sich der Coachee bewusst für seine ursprüngliche Formulierung, wird diese respektiert, nicht wiederholt hinterfragt.

**Konsequenz für KICO:** Der Qualitätscheck sitzt zwischen dem verbalen/schriftlichen Formulieren der Coachingfrage (Abschnitt 7) und dem Öffnen der `request_anchor_input`-Karte (siehe `docs/backlog.md`, B-23-Erweiterung) — die Karte wird erst geöffnet, nachdem eine Formulierung feststeht, mit der beide (Coachee, nach optionaler Rückfrage) arbeiten wollen.

---

## Verwendungshinweis (Quellmaterial)

Wie bei `docs/tools.md`: Die zugrundeliegenden Inhalte stammen von der INA CCW Internationale Akademie (Coaching Campus World) und unterliegen deren Verwendungshinweis (Nutzung im Rahmen eigener Coachings gestattet, Weitergabe/Vervielfältigung in Ausbildungen nur mit vorheriger schriftlicher Zustimmung der INA CCW). Diese Datei fasst Inhalte für die technische Dokumentation zusammen, ersetzt nicht die Originalquellen und ist nicht zur Weitergabe außerhalb dieses Forschungsprojekts bestimmt.
