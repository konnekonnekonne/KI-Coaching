# 06 — Deployment

---

## Überblick

KICO wird über Netlify als serverlose Next.js-Anwendung betrieben. Jeder Push auf den `main`-Branch des GitHub-Repositories löst automatisch einen neuen Build und Deploy aus (Continuous Deployment).

---

## Infrastruktur

| Dienst | Zweck | URL |
|--------|-------|-----|
| GitHub | Quellcode-Verwaltung | github.com/konnekonnekonne/KI-Coaching |
| Netlify | Hosting, Build, CDN | kicokico.netlify.app (temporär) → kico.pro |
| Supabase | Datenbank + Auth | ejxiboybvwpeknghlvar.supabase.co |
| Anthropic | KI-Modell API | console.anthropic.com |

---

## Umgebungsvariablen

Die Anwendung benötigt vier Umgebungsvariablen, die in Netlify unter *Site settings → Environment variables* hinterlegt werden:

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL des Supabase-Projekts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Öffentlicher Supabase-Schlüssel (für Browser-Client) |
| `ANTHROPIC_API_KEY` | Geheimer Anthropic-API-Schlüssel (nur serverseitig) |
| `NEXT_PUBLIC_SITE_URL` | Öffentliche URL der Plattform |

Variablen mit dem Präfix `NEXT_PUBLIC_` werden zur Build-Zeit in den Client-Bundle eingebettet und sind im Browser sichtbar. Der `ANTHROPIC_API_KEY` trägt dieses Präfix bewusst nicht — er verlässt den Server nie.

---

## Git-Zugang (Deploy Key)

Da das Repository unter einem privaten GitHub-Account liegt, wird ein repository-spezifischer SSH-Deploy-Key verwendet. Dieser wurde als ED25519-Schlüsselpaar generiert und als *Deploy Key with write access* im Repository hinterlegt. Der private Schlüssel liegt lokal unter `~/.ssh/kico_deploy`.

Der SSH-Config-Eintrag (`~/.ssh/config`) verwendet einen eigenen Host-Alias `github-kico`, damit kein Konflikt mit anderen GitHub-Accounts entsteht:

```
Host github-kico
  HostName github.com
  User git
  IdentityFile ~/.ssh/kico_deploy
  IdentitiesOnly yes
```

---

## Build-Konfiguration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

Der `@netlify/plugin-nextjs`-Plugin übersetzt Next.js Server Components und API Routes automatisch in Netlify Functions — kein manueller Serveraufwand.

---

## Supabase-Einrichtung

Nach dem ersten Deployment muss das Datenbankschema einmalig angelegt werden:

1. Supabase SQL-Editor öffnen
2. Inhalt von `supabase/migrations/001_initial.sql` einfügen und ausführen

Außerdem muss die Redirect-URL für die E-Mail-Bestätigung konfiguriert werden:

- Supabase → Authentication → URL Configuration
- **Site URL:** `https://kico.pro`
- **Redirect URLs:** `https://kico.pro/api/auth/callback`
