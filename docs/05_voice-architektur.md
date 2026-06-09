# 05 — Voice-Architektur

*Dokumentationsstand: Juni 2026*

---

## Ausgangsentscheidung: Warum Voice nicht optional ist

Im Verlauf der Konzeptarbeit wurde entschieden, Voice als gleichwertigen Modus neben Text zu implementieren — nicht als optionale Erweiterung, sondern als methodisch begründete Anforderung. Textbasierte Coaching-Interaktionen sind immer komprimiert und korrigiert. Sprachliche Spontaneität, Pausen, Zögern und Selbstkorrekturen sind im systemischen Coaching diagnostisch relevante Signale. Eine Plattform, die ausschließlich Text anbietet, beschränkt den Coaching-Prozess strukturell.

---

## Architekturmodell: Hybrid

Die Voice-Implementierung folgt einem hybriden Modell, das zwei unterschiedliche KI-Systeme je nach Modus einsetzt:

| Modus | Modell | Begründung |
|-------|--------|------------|
| Text | Anthropic Claude (claude-opus-4-5) | Überlegenste Coaching-Intelligenz, systemischer Fragestil, methodische Steuerbarkeit über System-Prompt |
| Voice | OpenAI gpt-realtime-2 | Einzige verfügbare Lösung mit nativer End-to-End-Audio-Verarbeitung und Semantic VAD |

Diese Aufteilung ist eine technische Notwendigkeit, keine Präferenz. Anthropic bietet zum Stand Juni 2026 keine native Voice API für programmatischen Zugriff. Eine Pipeline-Lösung (Whisper → Claude → TTS) wurde geprüft und verworfen: Die resultierende Latenz von 1,5–3 Sekunden und der Verlust prosodischer Kontinuität an zwei Schnittstellen machen sie für Coaching-Gespräche ungeeignet.

**Dokumentierte Limitation:** Die Verwendung unterschiedlicher Basismodelle erzeugt eine methodische Inkonsistenz. Derselbe System-Prompt lenkt beide Modelle in dieselbe Richtung, kann jedoch grundlegende Verhaltensunterschiede nicht eliminieren. Dies ist ein benanntes Gap der Architektur und ein möglicher Forschungsgegenstand für eine Folgestudie.

---

## Technische Architektur: WebRTC mit Ephemeral Key

### Warum WebRTC (nicht WebSocket)

Die OpenAI Realtime API unterstützt zwei Verbindungsmodelle:

- **WebSocket** (serverseitig): Verbindung läuft über den eigenen Server, API-Key bleibt sicher. Nachteil: Zusätzliche Latenz durch Server-Hop, höhere Serverkosten durch persistente Verbindungen.
- **WebRTC** (clientseitig): Browser verbindet sich direkt mit OpenAI. Niedrigste mögliche Latenz. API-Key wird durch kurzlebigen Ephemeral Key ersetzt — serverseitig generiert, clientseitig eingesetzt.

Für eine Coaching-Anwendung, in der Gesprächsfluss und Reaktionszeit kritisch sind, ist WebRTC die richtige Wahl.

### Verbindungsaufbau (Sequenz)

```
Browser                    KICO-Server              OpenAI
   │                           │                       │
   │── POST /api/voice/session ▶│                       │
   │                           │── POST /v1/realtime/  │
   │                           │   client_secrets      │
   │                           │◀── ephemeral_key ─────│
   │◀── { ephemeral_key } ─────│                       │
   │                           │                       │
   │── getUserMedia() ─────────────────────────────────│ (Mikrofon)
   │── createOffer() (SDP)      │                       │
   │── POST /v1/realtime/calls ──────────────────────▶ │
   │   Authorization: ephemeral_key                     │
   │◀── SDP Answer ─────────────────────────────────── │
   │── setRemoteDescription()   │                       │
   │                            │                       │
   │◀══════ WebRTC Audio-Stream (bidirektional) ══════▶ │
```

### API-Endpunkte (Stand Juni 2026 — GA)

Die OpenAI Realtime Beta API wurde am 12. Mai 2026 abgeschaltet. Die GA-Version verwendet neue Endpunkte:

| Zweck | Endpoint | Anmerkung |
|-------|----------|-----------|
| Ephemeral Key erstellen | `POST /v1/realtime/client_secrets` | Serverseitig, mit API-Key |
| SDP-Austausch (WebRTC) | `POST /v1/realtime/calls` | Clientseitig, mit Ephemeral Key |
| WebSocket (Alternative) | `wss://api.openai.com/v1/realtime` | Serverseitiger Proxy, höhere Latenz |

**Veraltete Beta-Endpunkte (nicht mehr verfügbar):**
- `POST /v1/realtime/sessions` → ersetzt durch `/v1/realtime/client_secrets`
- Modellname `gpt-4o-realtime-preview` → ersetzt durch `gpt-realtime-2`

### Konfiguration der Session

```json
{
  "session": {
    "type": "realtime",
    "model": "gpt-realtime-2",
    "instructions": "[KICO System-Prompt]",
    "audio": {
      "output": { "voice": "shimmer" }
    }
  }
}
```

**Dokumentierte Einschränkung — User-Transkription:**
`input_audio_transcription` wird von `gpt-realtime-2` weder über den `client_secrets`-Call noch über `session.update` unterstützt:

- Über `client_secrets`: API antwortet mit `400 Bad Request`
- Über `session.update` nach Verbindungsaufbau: API akzeptiert das Event, ignoriert das Feld aber still — `conversation.item.done` liefert für User-Audio stets `transcript: null`

Empirisch bestätigt im Entwicklungsprozess (Juni 2026). Das Feld ist in der GA-Version des WebRTC-Endpunkts schlicht nicht verfügbar.

**Workaround:** User-Äußerungen werden client-seitig über `MediaRecorder` aufgezeichnet. Wenn das VAD-Event `input_audio_buffer.speech_stopped` eintrifft, wird der Audio-Chunk an den eigenen Endpunkt `/api/transcribe` gesendet, der `whisper-1` aufruft. Latenz: ~1–2 Sekunden nach Sprachende. Dies ist kein Live-Transkript, sondern eine Post-turn-Transkription.

**Geprüfte Alternative:** `gpt-4o-realtime-preview` (das ältere Modell mit dokumentierter `input_audio_transcription`-Unterstützung) ist über den WebRTC-Endpunkt (`/v1/realtime/client_secrets` + `/v1/realtime/calls`) **nicht verfügbar** — ebenfalls mit `400` bestätigt. Diese beiden Endpunkte sind exklusiv an `gpt-realtime-2` gebunden. Eine Migration auf `gpt-4o-realtime-preview` würde einen vollständigen Umbau auf WebSocket mit server-seitigem Proxy erfordern.

---

## Semantic VAD: Das zentrale technische Argument

Alle einfachen Voice-Systeme verwenden energiebasierte Voice Activity Detection (VAD): Stille = Gesprächsende. Im Coaching ist das methodisch inakzeptabel. Ein Coachee, der nach einer schwierigen Frage drei Sekunden schweigt, wird unterbrochen bevor der Gedanke formuliert ist.

**Semantic VAD** (OpenAI, seit 2025/2026) bewertet stattdessen, ob eine Äußerung semantisch abgeschlossen ist. Ein „ähm…" oder eine Denkpause wird nicht als Ende interpretiert.

Konfiguration für den Coaching-Kontext:
- `silence_duration_ms: 1800` — 1,8 Sekunden Toleranz (Standard wäre 500ms) — mehr Raum für Denkpausen
- Threshold `0.8` — hohe Schwelle, weniger sensitiv bei Hintergrundgeräuschen

**Schweige-Signal:** Methodisch wäre ein nicht-sprachliches Präsenzsignal bei längerem Schweigen sinnvoll (Stille als Werkzeug, nicht als Leere). Diese Funktion ist in der aktuellen Implementierung **nicht realisiert** — sie bleibt als offene Designfrage für eine Folgeversion notiert.

---

## Datenhaltung in Voice-Sessions

Gesprächsaudio wird nicht gespeichert. Es wird nicht auf KICO-Servern zwischengespeichert. Die Transkription erfolgt bei OpenAI.

Was gespeichert wird:
- Transkript der User-Äußerungen (`role: 'user'`, in `messages`-Tabelle)
- Transkript der KICO-Antworten (`role: 'assistant'`, in `messages`-Tabelle)
- Dieselbe `session_id` wie bei Text-Sessions — Voice und Text sind in derselben Session zusammengeführt

Beide Modi schreiben in dieselbe `messages`-Tabelle. Der Sessionkontext ist damit über Modiwechsel hinweg konsistent.

---

## Benutzeroberfläche

### Moduswahl (`SessionShell`)

Beim Start einer neuen Session (keine vorhandenen Nachrichten) wählt der Coachee zwischen:
- **Schriftlich** → `ChatWindow` (Claude)
- **Sprachlich** → `VoiceSession` (gpt-realtime-2)

Laufende Sessions mit vorhandenen Nachrichten starten direkt im Text-Modus. Ein Wechsel ist über einen dezenten Link möglich.

### Voice-Oberfläche (`VoiceSession`)

- **Animierter Orb:** Zeigt Verbindungsstatus und wer spricht (Coachee / KICO / Stille)
- **Mute-Button:** Mikrofon stummschalten ohne Verbindungsabbruch
- **Session beenden:** Rote Schaltfläche → Verbindung trennen, zurück zu Text-Ansicht
- **Letztes Transkript:** Dezent unterhalb des Orbs sichtbar (eigene Worte, kein fremder Inhalt)

---

## Entscheidungslog: Was verworfen wurde

| Option | Grund für Ablehnung |
|--------|---------------------|
| Hume EVI | EU AI Act Art. 5 — Emotionsinferenz aus biometrischen Daten im Coaching-Kontext rechtlich nicht vertretbar |
| Vapi / Retell | Orchestrierungspipeline, Latenz 700–1500ms, kein Semantic VAD |
| ElevenLabs Conversational AI | Pipeline-Architektur, gutes TTS aber keine nativen Audio-In/Out-Modelle |
| Claude + Whisper + TTS Pipeline | Latenz 1,5–3s, prosodischer Verlust an zwei Schnittstellen |
| `gpt-4o-realtime-preview` via WebRTC | Nicht verfügbar über `/v1/realtime/client_secrets` — 400-Fehler bestätigt. WebRTC-Endpunkt ist exklusiv an `gpt-realtime-2` gebunden. Hätte native `input_audio_transcription`, ist aber über diesen Weg nicht erreichbar. |
| Gemini Live (Vertex AI) | Keine dokumentierte Semantic VAD-Entsprechung (Stand Juni 2026); als regulatorischer Fallback für EU-Datenspeicherung notiert falls OpenAI-Enterprise-Vereinbarung nicht realisierbar |

---

## Forschungsrahmen und Datenschutz: Bewusste Abweichung vom kommerziellen Standard

Kapitel 3 der Abschlussarbeit analysiert die datenschutzrechtlichen Anforderungen an eine KI-Coaching-Plattform im europäischen Rechtsraum ausführlich. Die dort formulierten Anforderungen — EU-Datenspeicherung, Zero-Data-Retention-Vereinbarung mit OpenAI, oder Wechsel zu Gemini Live über Vertex AI als EU-native Alternative — sind für eine kommerzielle Plattform verbindlich.

Die vorliegende Implementierung weicht von diesen Anforderungen in einem Punkt bewusst ab: **Audio-Daten werden über OpenAI-Infrastruktur verarbeitet, die standardmäßig keine EU-Datenspeicherung garantiert.** Sprachaufnahmen sind nach DSGVO Artikel 9 biometrische Personaldaten. Eine kommerzielle Plattform dürfte sie ohne EU-Rechenzentrum oder Enterprise-Vertrag nicht so verarbeiten.

Diese Entscheidung ist im Forschungskontext vertretbar, weil:

1. **Erlaubnistatbestand:** Die DSGVO erlaubt die Verarbeitung biometrischer Daten mit ausdrücklicher informierter Einwilligung (Art. 9 Abs. 2 lit. a). Im Forschungsrahmen wird diese Einwilligung von allen Teilnehmenden eingeholt, einschließlich des Hinweises auf US-seitige Verarbeitung.
2. **Geschlossener Rahmen:** Die Plattform ist nicht öffentlich zugänglich. Zugang erfolgt nur über explizite Einladung im Rahmen der Forschungsarbeit.
3. **Keine kommerzielle Nutzung:** Es findet keine Monetarisierung, kein Marketing und keine Weitergabe an Dritte statt.
4. **Dokumentiertes Gap:** Die datenschutzrechtliche Lücke ist nicht übergangen, sondern in Kapitel 3 der Abschlussarbeit und in dieser Dokumentation explizit benannt. Sie ist Teil des Forschungsbefundes: Eine DSGVO-konforme Voice-Architektur mit Semantic VAD existiert zum Stand Juni 2026 nicht ohne erhebliche kommerzielle Vorabinvestitionen.

**Für eine Weiterentwicklung zur kommerziellen Plattform** wären folgende Schritte erforderlich:
- OpenAI Enterprise-Vertrag mit Zero-Data-Retention und EU-Rechenzentrum, oder
- Wechsel zu Gemini Live über Vertex AI (EU-Datenspeicherung standardmäßig), sobald eine dokumentierte Semantic VAD-Lösung verfügbar ist

## Account-Anforderungen

Die OpenAI Realtime API erfordert **Usage Tier 2** (mind. $50 Gesamtausgaben seit Account-Erstellung). Tier 1 hat keinen Zugang zum `/v1/realtime/client_secrets` Endpoint.

---

## Relevante Dateien

| Datei | Funktion |
|-------|----------|
| `app/api/voice/session/route.ts` | Server: Ephemeral Key generieren |
| `app/api/transcribe/route.ts` | Server: Audio-Chunk → Whisper-1 → Transkript (User-Transkriptions-Workaround) |
| `components/chat/VoiceSession.tsx` | Client: WebRTC-Verbindung, Audio, MediaRecorder, UI |
| `components/chat/SessionShell.tsx` | Moduswahl und Wrapper |
| `app/(dashboard)/session/page.tsx` | Server Component: lädt SessionShell |
| `lib/system-prompt.ts` | Gemeinsamer Prompt für Text und Voice |
