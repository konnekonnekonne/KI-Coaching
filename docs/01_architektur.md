# 01 — Systemarchitektur

---

## Überblick

KICO ist eine webbasierte Einzel-Coaching-Plattform, die einen sprachbasierten KI-Agenten in einen methodisch kontrollierten Coaching-Rahmen einbettet. Die Architektur folgt dem in der Abschlussarbeit formulierten Prinzip **„Methode vor Modell"**: Das KI-Modell hat keinen freien Handlungsspielraum, sondern arbeitet innerhalb eines fest definierten Methodenkorpus (INA CCW-Curriculum).

---

## Tech-Stack

| Schicht | Technologie | Begründung |
|---------|-------------|------------|
| Frontend | Next.js 16 (App Router), TypeScript | Server Components ermöglichen auth-gesichertes Rendering ohne Client-Roundtrip |
| Styling | Tailwind CSS v4 | Utility-first, kein zusätzliches CSS-Build-Tool |
| Backend / Auth / DB | Supabase | Managed PostgreSQL + Row Level Security + Auth in einem Dienst |
| KI-Modell | Anthropic Claude (claude-opus-4-5) | Stärkstes verfügbares Modell für nuancierte Gesprächsführung |
| Streaming | Server-Sent Events (SSE) | Antworten erscheinen Wort für Wort — kein Warten auf vollständige Antwort |
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
│  │  /session      │  │  ← Server Component: lädt User + Sessiondaten
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  /api/chat     │  │  ← API Route: sendet an Claude, streamt zurück
│  └────────────────┘  │
└──────┬───────────────┘
       │
       ├── Supabase (PostgreSQL + Auth)
       │   profiles / sessions / messages
       │
       └── Anthropic API
           System-Prompt + Gesprächsverlauf → Claude → SSE-Stream
```

---

## Wichtige Architekturentscheidungen

### Server Components für die Session-Seite
Die Seite `/session` ist ein React Server Component. Das bedeutet: Auth-Prüfung, Datenbankabfragen (bestehende Nachrichten laden) und Rendering passieren auf dem Server, bevor der Browser irgendwas sieht. Keine sensiblen Daten im Client-Bundle.

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
│   │   └── session/page.tsx        # Coaching-Session
│   └── api/
│       ├── chat/route.ts           # Claude-Streaming-Endpunkt
│       └── auth/callback/route.ts  # Supabase OAuth-Callback
├── components/
│   └── chat/
│       ├── ChatWindow.tsx          # Hauptkomponente: State, Streaming-Logik
│       ├── MessageBubble.tsx       # Einzelne Nachricht (User / KICO)
│       └── InputBar.tsx            # Texteingabe mit Auto-Resize
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser-Client
│   │   └── server.ts               # Server-Client (SSR-sicher)
│   ├── system-prompt.ts            # KICO-Systemprompt (INA CCW-Methodenkorpus)
│   └── utils.ts                    # Hilfsfunktionen (cn)
├── proxy.ts                        # Auth-Middleware (Next.js 16)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         # Datenbankschema + RLS
└── docs/                           # Diese Dokumentation
```
