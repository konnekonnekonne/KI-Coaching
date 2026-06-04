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
      "output": { "voice": "alloy" }
    },
    "turn_detection": {
      "type": "semantic_vad",
      "silence_duration_ms": 1200,
      "threshold": 0.5
    },
    "input_audio_transcription": {
      "model": "gpt-4o-mini-transcribe",
      "language": "de"
    }
  },
  "expires_after": {
    "anchor": "created_at",
    "seconds": 3600
  }
}
```

---

## Semantic VAD: Das zentrale technische Argument

Alle einfachen Voice-Systeme verwenden energiebasierte Voice Activity Detection (VAD): Stille = Gesprächsende. Im Coaching ist das methodisch inakzeptabel. Ein Coachee, der nach einer schwierigen Frage drei Sekunden schweigt, wird unterbrochen bevor der Gedanke formuliert ist.

**Semantic VAD** (OpenAI, seit 2025/2026) bewertet stattdessen, ob eine Äußerung semantisch abgeschlossen ist. Ein „ähm…" oder eine Denkpause wird nicht als Ende interpretiert.

Konfiguration für den Coaching-Kontext:
- `silence_duration_ms: 1200` — 1,2 Sekunden Toleranz (Standard wäre 500ms)
- Threshold `0.5` — mittlere Empfindlichkeit

**Schweige-Signal ab 3 Sekunden:** Eine Applikationsschicht erkennt Schweigen über 1,2 Sekunden hinaus und sendet ein kurzes akustisches Präsenzsignal. Diese Entscheidung ist methodisch begründet: Im systemischen Coaching ist Stille ein Werkzeug. Jedes sprachliche Signal wäre eine Intervention. Ein nicht-sprachliches Geräusch signalisiert Präsenz ohne Erwartungsdruck. Die genaue Gestaltung dieses Signals bleibt eine offene Designfrage für die Evaluation.

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
| Gemini Live (Vertex AI) | Keine dokumentierte Semantic VAD-Entsprechung (Stand Juni 2026); als regulatorischer Fallback für EU-Datenspeicherung notiert falls OpenAI-Enterprise-Vereinbarung nicht realisierbar |

---

## Account-Anforderungen

Die OpenAI Realtime API erfordert **Usage Tier 2** (mind. $50 Gesamtausgaben seit Account-Erstellung). Tier 1 hat keinen Zugang zum `/v1/realtime/client_secrets` Endpoint.

Für den Forschungskontext dieser Arbeit wurde explizit auf den Datenschutzrahmen hingewiesen: Audio-Transkripte sind biometrische Personaldaten (DSGVO Art. 9). Im Forschungsrahmen deckt die informierte Einwilligung der Teilnehmenden die Verarbeitungsgrundlage ab. Für eine kommerzielle Deployment wäre eine EU-Datenspeicherlösung oder eine OpenAI-Enterprise-Zero-Data-Retention-Vereinbarung erforderlich.

---

## Relevante Dateien

| Datei | Funktion |
|-------|----------|
| `app/api/voice/session/route.ts` | Server: Ephemeral Key generieren |
| `components/chat/VoiceSession.tsx` | Client: WebRTC-Verbindung, Audio, UI |
| `components/chat/SessionShell.tsx` | Moduswahl und Wrapper |
| `app/(dashboard)/session/page.tsx` | Server Component: lädt SessionShell |
| `lib/system-prompt.ts` | Gemeinsamer Prompt für Text und Voice |
