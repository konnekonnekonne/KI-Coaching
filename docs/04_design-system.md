# 04 — Design System

*Dieses Dokument ist die verbindliche Referenz für alle Seiten und Komponenten auf der KICO-Plattform. Neue Seiten orientieren sich ausschließlich an den hier definierten Tokens und Komponenten.*

---

## Grundprinzip

Das Design System basiert auf **CSS Custom Properties** als Single Source of Truth. Alle Farben, Schriften und Abstände sind in `app/globals.css` unter `:root` definiert. Tailwind v4 mappt diese Werte automatisch auf Utility-Klassen. Wer einen Wert ändert, ändert damit die gesamte Plattform konsistent.

---

## Farben

### Kernpalette

| Token | Hex | Tailwind-Klasse | Verwendung |
|-------|-----|-----------------|------------|
| `--bg` | `#F5F7F5` | `bg-bg` | Seitenhintergrund |
| `--primary` | `#2D6A4F` | `bg-primary`, `text-primary`, `border-primary` | Hauptfarbe, primäre Aktionen |
| `--primary-dark` | `#235540` | `bg-primary-dark` | Hover-Zustand von Primary |
| `--accent` | `#52B788` | `bg-accent`, `text-accent` | Highlights, aktive Zustände |
| `--text` | `#1B2E25` | `text-kico-text` | Fließtext, Headlines |
| `--muted` | `#64748B` | `text-muted` | Hilfstexte, Labels, Metadaten |
| `--surface` | `#FFFFFF` | `bg-surface` | Kartenoberflächen, Inputs |
| `--border` | `#D8E6DE` | `border-border` | Rahmen, Trennlinien |

### Signalfarben

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--signal-amber` | `#D97706` | Hinweise, Warnungen |
| `--signal-orange` | `#C2410C` | Starke CTAs, Dringlichkeit |
| `--signal-red` | `#B91C1C` | Fehler, Krisenhinweise |
| `--signal-green` | `#15803D` | Erfolg, Bestätigungen |

Jede Signalfarbe hat eine Hintergrundvariante (`--signal-*-bg`) für Badge- und Alert-Hintergründe.

---

## Typografie

### Schriftarten

| Rolle | Font | Variable | Verwendung |
|-------|------|----------|------------|
| Display | Fraunces | `--font-fraunces` / `font-display` | Wordmark, H1–H3, emotionale Akzente |
| Body | Inter | `--font-inter` / `font-sans` | Fließtext, UI-Elemente, Labels |

Beide Fonts werden über `next/font/google` geladen und als CSS-Variablen ins `<html>`-Element gesetzt.

### Typografie-Klassen

Fertige CSS-Klassen für direkte Anwendung:

```jsx
<h1 className="heading-1">Reflexion beginnt hier.</h1>
<h2 className="heading-2">Was beschäftigt dich gerade?</h2>
<h3 className="heading-3">Deine Session</h3>
<p className="body-text">Fließtext über mehrere Zeilen...</p>
<p className="caption">Letzte Session: vor 2 Tagen</p>
<span className="label-text">Kategorie</span>
```

---

## Logo

Die `Logo`-Komponente rendert das KICO-Icon als inline SVG. Damit ist der Font garantiert geladen und das Logo rendert korrekt in jedem Kontext.

```tsx
import { Logo } from '@/components/ui'

// Standard (grün, mit Wordmark)
<Logo />

// Mit Subline
<Logo subline="Dein KI-Coach" />

// Größe anpassen
<Logo size={40} />

// Für dunklen Hintergrund
<Logo variant="white" />

// Nur Icon, kein Wordmark
<Logo showWordmark={false} size={24} />
```

**Props:**

| Prop | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `size` | `number` | `32` | Icon-Größe in Pixeln |
| `variant` | `'green' \| 'white' \| 'black'` | `'green'` | Farbvariante |
| `showWordmark` | `boolean` | `true` | Wordmark anzeigen |
| `subline` | `string` | – | Optionaler Text unter dem Wordmark |

Die SVG-Dateien unter `public/logo/` sind für externen Gebrauch (Präsentationen, Docs).

---

## Button

```tsx
import { Button } from '@/components/ui'

// Primäre Aktion
<Button>Sitzung starten</Button>

// Sekundär
<Button variant="secondary">Mehr erfahren</Button>

// Starker CTA (orange — sparsam einsetzen!)
<Button variant="cta">Jetzt registrieren →</Button>

// Ghost — für Aktionen die zurücktreten sollen
<Button variant="ghost">Abmelden</Button>

// Fehler/Löschen
<Button variant="danger">Session löschen</Button>

// Größen
<Button size="sm">Klein</Button>
<Button size="md">Standard</Button>
<Button size="lg">Groß</Button>

// Ladezustand
<Button loading>Lädt…</Button>
```

**Varianten im Überblick:**

| Variante | Wann einsetzen |
|----------|---------------|
| `primary` | Hauptaktion einer Seite (max. 1× pro Seite) |
| `secondary` | Alternativen, Navigation |
| `cta` | Conversion-kritische Aktionen (Registrierung, Upgrade) |
| `ghost` | Destruktive Nebenaktionen (Abmelden, Schließen) |
| `danger` | Löschen, Fehler-Kontexte |

---

## Input

```tsx
import { Input } from '@/components/ui'

// Standard
<Input
  label="E-Mail"
  placeholder="du@beispiel.de"
  type="email"
/>

// Mit Hilfstex
<Input
  label="Passwort"
  type="password"
  hint="Mindestens 8 Zeichen"
/>

// Fehlerzustand
<Input
  label="E-Mail"
  error="Diese E-Mail ist bereits registriert."
/>
```

---

## Badge

Für Status-Anzeigen, Warnungen und Krisenhinweise.

```tsx
import { Badge } from '@/components/ui'

<Badge variant="amber">⚠ Hinweis</Badge>
<Badge variant="red">✕ Krisensignal erkannt</Badge>
<Badge variant="green">✓ Session gespeichert</Badge>
<Badge variant="orange">Neu</Badge>
<Badge variant="neutral">Entwurf</Badge>
```

---

## Seitenstruktur

Jede neue Seite folgt diesem Grundgerüst:

```tsx
// app/(bereich)/seite/page.tsx

export default function MeineSeite() {
  return (
    // Hintergrundfarbe — immer bg-bg
    <main className="min-h-screen bg-bg">

      {/* Zentrierter Container — max-w-3xl für Content-Seiten */}
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Headline immer in Fraunces */}
        <h1 className="heading-1 mb-4">Seitentitel</h1>

        {/* Beschreibung in Inter/muted */}
        <p className="body-text text-muted mb-8">Beschreibungstext</p>

        {/* Karten auf weißem Surface */}
        <div className="bg-surface border border-border rounded-xl p-6">
          {/* Inhalt */}
        </div>

      </div>
    </main>
  )
}
```

---

## Do's & Don'ts

**✓ Do**
- Immer `bg-bg` als Seitenhintergrund
- Immer `bg-surface` für Karten und Modals
- Fraunces nur für H1–H3 und den Wordmark
- `text-muted` für Metadaten, Labels, Hilfstexte
- Signal-Farben nur für ihren definierten Zweck (Amber = Warnung, Rot = Fehler/Krise)
- `variant="cta"` sparsam — max. 1× pro Seite sichtbar

**✗ Don't**
- Keine Inline-Farben (`style={{ color: '#123' }}`) — immer CSS-Variable oder Tailwind-Klasse
- Kein weiteres Grün erfinden — Palette ist abgeschlossen
- Kein weißer Hintergrund als Seiten-BG (`bg-white`) — immer `bg-bg`
- Keine eigenen Schriftgrößen definieren — vorhandene Klassen nutzen

---

## Dateipfade

```
app/globals.css                  ← Design Tokens + CSS-Klassen
app/layout.tsx                   ← Font-Loader (Fraunces + Inter)
components/ui/
  index.ts                       ← Zentraler Import
  Logo.tsx                       ← Logo-Komponente
  Button.tsx                     ← Button mit allen Varianten
  Input.tsx                      ← Input mit Label, Hint, Error
  Badge.tsx                      ← Signal-Badges
public/logo/
  icon-green.svg                 ← Icon (Standard)
  icon-white.svg                 ← Icon (Dunkel)
  icon-black.svg                 ← Icon (Print)
  lockup-green.svg               ← Icon + Wordmark
  lockup-white.svg               ← Icon + Wordmark (Dunkel)
```
