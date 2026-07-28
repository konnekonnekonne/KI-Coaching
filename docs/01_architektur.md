# 01 — Systemarchitektur

---

> **Hinweis (Juli 2026):** Für den Voice-Modus wurde ein Wechsel von der hier beschriebenen nativen Speech-to-Speech-Architektur (OpenAI `gpt-realtime`, WebRTC) zu einer Cascaded-Architektur (STT → Text → Claude → TTS) beschlossen. Begründung: [10_architekturentscheidung-voice-cascaded.md](10_architekturentscheidung-voice-cascaded.md). Die konkrete Umsetzung (Provider-Wahl, Datenflüsse) ist zum jetzigen Stand noch offen — dieses Dokument beschreibt daher weiterhin den **zuletzt implementierten** Stand für Voice, nicht den beschlossenen Zielzustand. Text-Architektur (Claude, SSE) ist von der Entscheidung unberührt.

## Überblick

KICO ist eine webbasierte Einzel-Coaching-Plattform, die einen sprachbasierten KI-Agenten in einen methodisch kontrollierten Coaching-Rahmen einbettet. Die Architektur folgt dem in der Abschlussarbeit formulierten Prinzip **„Methode vor Modell"**: Das KI-Modell hat keinen freien Handlungsspielraum, sondern arbeitet innerhalb eines fest definierten Methodenkorpus (INA CCW-Curriculum).

---

## Tech-Stack

| Schicht | Technologie | Begründung |
|---------|-------------|------------|
| Frontend | Next.js 16 (App Router), TypeScript | Server Components ermöglichen auth-gesichertes Rendering ohne Client-Roundtrip |
| Styling | Tailwind CSS v4 | Utility-first, kein zusätzliches CSS-Build-Tool |
| Backend / Auth / DB | Supabase | Managed PostgreSQL + Row Level Security + Auth in einem Dienst |
| KI-Modell Text | Anthropic Claude (claude-opus-4-5) | Stärkstes verfügbares Modell für nuancierte Gesprächsführung |
| KI-Modell Voice | OpenAI gpt-realtime-2 | Einzige GA-Lösung mit Semantic VAD und nativer End-to-End-Audio-Verarbeitung |
| Voice-Transport | WebRTC (Ephemeral Key) | Niedrigste Latenz; API-Key bleibt serverseitig |
| Streaming (Text) | Server-Sent Events (SSE) | Antworten erscheinen Wort für Wort — kein Warten auf vollständige Antwort |
| Deployment | Netlify (+ @netlify/plugin-nextjs) | Automatisches Deployment bei jedem Git-Push |
| Domain | kico.pro | — |

---

## Systemdiagramm

```
Nutzer (Browser)
       │
       │ HTTPS
       ▼
┌──────────────────────┐
│   Netlify CDN        │
│   Next.js 16         │
│                      │
│  ┌────────────────┐  │
│  │  proxy.ts      │  │  ← Auth-Guard: schützt /session
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  /session      │  │  ← Dashboard-Lobby: Begrüßung, Session-Liste, neue Session starten
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  /session/[id] │  │  ← Coaching-Session: lädt SessionShell (Text oder Voice)
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  /api/chat     │  │  ← Text-Modus: sendet an Claude, streamt zurück (SSE)
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │/api/voice/     │  │  ← Voice-Modus: generiert Ephemeral Key für WebRTC
│  │session         │  │
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ├── Supabase (PostgreSQL + Auth)
       │   profiles / sessions / messages
       │
       ├── Anthropic API (Text-Modus)
       │   System-Prompt + Gesprächsverlauf → Claude → SSE-Stream
       │
       └── OpenAI Realtime API (Voice-Modus)
           WebRTC direkt Browser ↔ OpenAI (gpt-realtime-2)
           Ephemeral Key: serverseitig generiert, clientseitig eingesetzt
```

---

## Wichtige Architekturentscheidungen

### Session-Routing: Lobby → Coaching
Der Einstieg nach dem Login ist `/session` — eine Dashboard-Lobby. Dort wählt der Nutzer den Modus (Text/Voice) und klickt „Session starten". Das Dashboard erzeugt eine neue Session in Supabase und navigiert zu `/session/[id]`. Die Detail-Route lädt die Session-Daten, prüft die Ownership (RLS + explizites `user_id`-Filter) und rendert `SessionShell`. Der gewählte Modus wird via `sessionStorage` übergeben.

### Server Components für die Session-Seiten
Beide Routen (`/session` und `/session/[id]`) sind React Server Components. Auth-Prüfung, Datenbankabfragen und Rendering passieren auf dem Server. Keine sensiblen Daten im Client-Bundle.

### SSE statt WebSockets
Die Chat-Antworten werden als Server-Sent Events gestreamt. SSE ist unidirektional (Server → Client), reicht für diesen Anwendungsfall vollständig aus und ist deutlich einfacher zu implementieren und zu betreiben als WebSockets.

### Supabase Row Level Security (RLS)
Jede Datenbanktabelle hat RLS aktiviert. Nutzerinnen können ausschließlich eigene Daten lesen und schreiben — auch wenn jemand direkten Datenbankzugang erlangte, wären fremde Coaching-Daten nicht lesbar.

### Kein clientseitiger API-Key
Der Anthropic API-Key verlässt den Server nie. Alle Claude-Anfragen laufen über die Next.js API Route `/api/chat` — der Browser sieht nur den SSE-Stream.

---

## Verzeichnisstruktur

```
/
├── app/
│   ├── page.tsx                    # Landingpage
│   ├── (auth)/
│   │   ├── login/page.tsx          # Anmeldung
│   │   └── signup/page.tsx         # Registrierung
│   ├── (dashboard)/
│   │   ├── session/page.tsx        # Dashboard-Lobby: Profil, Sessions laden, neue Session starten
│   │   └── session/[id]/page.tsx   # Coaching-Session (Text oder Voice)
│   └── api/
│       ├── chat/route.ts           # Claude-Streaming-Endpunkt (Text)
│       ├── voice/session/route.ts  # Ephemeral Key für WebRTC (Voice)
│       └── auth/callback/route.ts  # Supabase OAuth-Callback
├── components/
│   ├── dashboard/
│   │   └── Dashboard.tsx           # Lobby: Onboarding, zeitbasierte Begrüßung, Session-Liste
│   └── chat/
│       ├── SessionShell.tsx        # Moduswahl (Text / Voice) + Wrapper
│       ├── ChatWindow.tsx          # Text-Modus: State, Streaming-Logik
│       ├── MessageBubble.tsx       # Einzelne Nachricht (User / KICO)
│       ├── InputBar.tsx            # Texteingabe mit Auto-Resize
│       └── VoiceSession.tsx        # Voice-Modus: WebRTC, Orb-UI, Transkript
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser-Client
│   │   └── server.ts               # Server-Client (SSR-sicher)
│   ├── system-prompt.ts            # KICO-Systemprompt (INA CCW-Methodenkorpus)
│   └── utils.ts                    # Hilfsfunktionen (cn)
├── proxy.ts                        # Auth-Middleware (Next.js 16)
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql         # Datenbankschema + RLS
│       └── 002_add_firstname.sql   # first_name in profiles
└── docs/                           # Diese Dokumentation
```
