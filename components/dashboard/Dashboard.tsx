'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MessageSquare, Mic, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Input } from '@/components/ui'
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
  // Vorname noch nicht gesetzt → Onboarding zeigen
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="max-w-sm w-full">
        <h1 className="heading-2 mb-2">Willkommen bei KICO.</h1>
        <p className="body-text text-muted mb-8">
          Wie darf ich dich nennen?
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Vorname"
            type="text"
            required
            autoFocus
            placeholder="Dein Vorname"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button type="submit" loading={loading} className="w-full">
            Weiter
          </Button>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard-Inhalt ────────────────────────────────────────────────────────

function DashboardContent({ firstName, sessions, userId }: { firstName: string; sessions: Session[]; userId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'text' | 'voice'>('text')
  const supabase = createClient()

  async function startNewSession() {
    const { data: session } = await supabase
      .from('sessions')
      .insert({ user_id: userId })
      .select('id')
      .single()

    if (session) {
      // Modus in sessionStorage merken damit SessionShell ihn kennt
      sessionStorage.setItem(`kico-mode-${session.id}`, mode)
      startTransition(() => {
        router.push(`/session/${session.id}`)
      })
    }
  }

  const hasSessions = sessions.length > 0

  return (
    <div className="flex flex-col gap-10">

      {/* ── Begrüßung ── */}
      <div>
        <h1 className="heading-2 mb-1">
          Guten Tag, {firstName}.
        </h1>
        <p className="body-text text-muted">
          Was möchtest du heute erkunden?
        </p>
      </div>

      {/* ── Neue Session starten ── */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="heading-3 mb-1">Neue Session</h2>
        <p className="caption mb-5">Wähle, wie du heute arbeiten möchtest.</p>

        <div className="flex gap-3 mb-5">
          <ModeButton
            icon={<MessageSquare size={16} />}
            label="Schriftlich"
            active={mode === 'text'}
            onClick={() => setMode('text')}
          />
          <ModeButton
            icon={<Mic size={16} />}
            label="Sprachlich"
            active={mode === 'voice'}
            onClick={() => setMode('voice')}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={startNewSession}
            disabled={isPending}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl caption font-medium transition-all',
              'bg-accent/15 text-accent border border-accent/30',
              'hover:bg-accent/25 hover:border-accent/50',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Plus size={14} />
            {isPending ? 'Startet…' : 'Session starten'}
          </button>
        </div>
      </div>

      {/* ── Vergangene Sessions ── */}
      {hasSessions && (
        <div>
          <h2 className="heading-3 mb-4">Vergangene Sessions</h2>
          <div className="flex flex-col gap-2">
            {sessions.map(session => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {!hasSessions && (
        <p className="caption text-center text-muted py-8">
          Noch keine Sessions — starte deine erste oben.
        </p>
      )}
    </div>
  )
}

// ── Session-Karte ───────────────────────────────────────────────────────────

function SessionCard({ session }: { session: Session }) {
  const router = useRouter()
  const date = new Date(session.created_at)
  const dateStr = date.toLocaleDateString('de-DE', {
    weekday: 'short', day: 'numeric', month: 'long'
  })
  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <button
      onClick={() => router.push(`/session/${session.id}`)}
      className="w-full flex items-center justify-between gap-4 bg-surface border border-border rounded-xl px-5 py-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="caption font-medium text-kico-text">{dateStr}</span>
          <span className="caption text-muted">{timeStr}</span>
          {session.message_count > 0 && (
            <span className="caption text-muted">· {session.message_count} Nachrichten</span>
          )}
        </div>
        {session.preview ? (
          <p className="caption text-muted truncate">
            „{session.preview}{session.preview.length >= 80 ? '…' : '"'}"
          </p>
        ) : (
          <p className="caption text-muted italic">Leere Session</p>
        )}
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-muted group-hover:text-primary transition-colors" />
    </button>
  )
}

// ── Modus-Button ─────────────────────────────────────────────────────────────

function ModeButton({ icon, label, active, onClick }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border caption font-medium transition-all',
        active
          ? 'bg-primary border-primary'
          : 'bg-bg border-border text-muted hover:border-primary/40 hover:text-kico-text'
      )}
      style={active ? { color: 'var(--on-primary)' } : undefined}
    >
      {icon}
      {label}
    </button>
  )
}
