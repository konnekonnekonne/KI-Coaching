'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

interface Session {
  id: string
  created_at: string
  message_count: number
  preview: string | null
}

interface DashboardProps {
  firstName: string | null
  sessions: Session[]
  userId: string
}

export function Dashboard({ firstName, sessions, userId }: DashboardProps) {
  if (!firstName) {
    return <NameOnboarding userId={userId} />
  }
  return <DashboardContent firstName={firstName} sessions={sessions} userId={userId} />
}

// ── Vorname-Onboarding ──────────────────────────────────────────────────────

function NameOnboarding({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await supabase
      .from('profiles')
      .update({ first_name: name.trim() })
      .eq('id', userId)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-20 max-w-lg mx-auto">

      <div className="mb-16 opacity-30">
        <Logo size={22} showWordmark={false} />
      </div>

      <h1 className="display mb-5">
        Willkommen.
      </h1>
      <p className="body-text text-muted mb-12">
        Wie darf ich dich nennen?
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[260px]">
        <Input
          label="Vorname"
          type="text"
          required
          autoFocus
          placeholder="Dein Vorname"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <Button type="submit" loading={loading}>
          Weiter →
        </Button>
      </form>
    </div>
  )
}

// ── Begrüßungstext nach Uhrzeit ────────────────────────────────────────────

function getGreeting(firstName: string): { heading: string; sub: string } {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return {
    heading: `Guten Morgen, ${firstName}.`,
    sub: 'Was nimmst du dir für heute vor?',
  }
  if (hour >= 12 && hour < 18) return {
    heading: `Guten Tag, ${firstName}.`,
    sub: 'Was möchtest du heute erkunden?',
  }
  if (hour >= 18 && hour < 22) return {
    heading: `Guten Abend, ${firstName}.`,
    sub: 'Wie war dein Tag bisher?',
  }
  return {
    heading: `Noch wach, ${firstName}?`,
    sub: 'Was lässt dich heute nicht los?',
  }
}

// ── Preference-Zeile ────────────────────────────────────────────────────────

function PreferenceRow({
  optionA,
  optionB,
  active,
  onToggle,
}: {
  optionA: string
  optionB: string
  active: 'a' | 'b'
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Wechseln zu ${active === 'a' ? optionB : optionA}`}
      className="group flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-lg cursor-pointer w-full text-left hover:bg-primary/5 transition-colors duration-200"
    >
      {/* Option A */}
      <span className="flex items-center gap-1.5">
        {/* reservierter Platz für den Check */}
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {active === 'a' && (
            <Check className="h-3.5 w-3.5 text-accent group-hover:text-primary transition-colors duration-300" />
          )}
        </span>
        <span className={cn(
          'caption transition-colors duration-200',
          active === 'a'
            ? 'text-kico-text font-medium'
            : 'text-muted/40 group-hover:text-muted/70'
        )}>
          {optionA}
        </span>
      </span>

      <span className="caption text-muted/25 select-none">·</span>

      {/* Option B */}
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {active === 'b' && (
            <Check className="h-3.5 w-3.5 text-accent group-hover:text-primary transition-colors duration-300" />
          )}
        </span>
        <span className={cn(
          'caption transition-colors duration-200',
          active === 'b'
            ? 'text-kico-text font-medium'
            : 'text-muted/40 group-hover:text-muted/70'
        )}>
          {optionB}
        </span>
      </span>
    </button>
  )
}

// ── Dashboard-Inhalt ────────────────────────────────────────────────────────

function DashboardContent({
  firstName,
  sessions,
  userId,
}: {
  firstName: string
  sessions: Session[]
  userId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const [dark, setDark] = useState(false)
  const [themeMounted, setThemeMounted] = useState(false)
  // Begrüßung erst client-seitig berechnen — verhindert React-Hydration-Fehler #418
  // (Server-Timezone UTC ≠ Browser-Timezone des Coachees)
  const [greeting, setGreeting] = useState<{ heading: string; sub: string }>({
    heading: `Hallo, ${firstName}.`,
    sub: '',
  })
  const supabase = createClient()

  useEffect(() => {
    setGreeting(getGreeting(firstName))
    setDark(document.documentElement.classList.contains('dark'))
    setThemeMounted(true)
  }, [firstName])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kico-theme', next ? 'dark' : 'light')
  }

  // Leere Sessions nicht anzeigen
  const filledSessions = sessions.filter(s => s.message_count > 0)

  async function startNewSession() {
    const { data: session } = await supabase
      .from('sessions')
      .insert({ user_id: userId })
      .select('id')
      .single()

    if (session) {
      sessionStorage.setItem(`kico-mode-${session.id}`, mode)
      startTransition(() => {
        router.push(`/session/${session.id}`)
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6">

      {/* ── Begrüßung ────────────────────────────────────────────── */}
      <div className="min-h-[65vh] flex flex-col justify-center pt-20 pb-10">

        {/* Kleines Logo-Icon, sehr dezent */}
        <div className="mb-14 opacity-25">
          <Logo size={20} showWordmark={false} />
        </div>

        <h1 className="display mb-4 text-kico-text">
          {greeting.heading}
        </h1>
        <p className="body-text text-muted">
          {greeting.sub}
        </p>
      </div>

      {/* ── Einstellungen & neue Session ─────────────────────────── */}
      <div className="border-t border-border pt-10 pb-16">

        {/* Einladung zur Präferenz */}
        <p className="body-text text-muted mb-5">Mach es dir bequem.</p>

        {/* Preference-Checklist */}
        <div className="mb-10 space-y-0.5">
          {themeMounted && (
            <PreferenceRow
              optionA="Hell"
              optionB="Dunkel"
              active={dark ? 'b' : 'a'}
              onToggle={toggleTheme}
            />
          )}
          <PreferenceRow
            optionA="Schreiben"
            optionB="Sprechen"
            active={mode === 'text' ? 'a' : 'b'}
            onToggle={() => setMode(mode === 'text' ? 'voice' : 'text')}
          />
        </div>

        {/* Typografischer CTA — eine Einladung, kein Formular */}
        <button
          onClick={startNewSession}
          disabled={isPending}
          className={cn(
            'display text-left transition-colors leading-tight cursor-pointer',
            'text-primary hover:text-primary-dark',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          {isPending ? 'Startet…' : 'Session beginnen →'}
        </button>
      </div>

      {/* ── Vergangene Sessions ───────────────────────────────────── */}
      {filledSessions.length > 0 && (
        <div className="pb-16">
          <p className="label-text mb-4">Frühere Sessions</p>
          <div>
            {filledSessions.map(session => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

// ── Session-Zeile ──────────────────────────────────────────────────────────

function SessionRow({ session }: { session: Session }) {
  const router = useRouter()
  const date = new Date(session.created_at)
  const dateStr = date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <button
      onClick={() => router.push(`/session/${session.id}`)}
      className="w-full flex items-baseline gap-4 py-3.5 border-b border-border/40 hover:border-primary/30 text-left group transition-colors"
    >
      <span className="caption text-muted/60 flex-shrink-0 w-14 group-hover:text-muted transition-colors tabular-nums">
        {dateStr}
      </span>
      {session.preview ? (
        <span className="caption text-muted truncate group-hover:text-kico-text transition-colors">
          {session.preview}
        </span>
      ) : (
        <span className="caption text-muted/40 italic">Leer</span>
      )}
    </button>
  )
}
