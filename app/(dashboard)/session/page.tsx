export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SessionShell } from '@/components/chat/SessionShell'
import { Logo } from '@/components/ui'
import { LogOut } from 'lucide-react'

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Heutige Session laden oder neu anlegen
  const today = new Date().toISOString().split('T')[0]

  let { data: session } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    const { data: newSession } = await supabase
      .from('sessions')
      .insert({ user_id: user.id })
      .select('id')
      .single()
    session = newSession
  }

  // Bestehende Nachrichten laden
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('session_id', session?.id)
    .order('created_at', { ascending: true })

  const datum = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="flex flex-col h-screen bg-bg">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size={24} />
          <span className="caption hidden sm:block">{datum}</span>
          <form>
            <button
              formAction={signOut}
              className="flex items-center gap-1.5 caption text-muted hover:text-kico-text transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </form>
        </div>
      </header>

      {/* ── Session Shell (Text oder Voice) ── */}
      <div className="flex-1 overflow-hidden max-w-3xl w-full mx-auto">
        <SessionShell
          sessionId={session?.id ?? ''}
          initialMessages={
            messages?.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              created_at: m.created_at,
            })) ?? []
          }
        />
      </div>
    </div>
  )
}

async function signOut() {
  'use server'
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  await supabase.auth.signOut()
  const { redirect } = await import('next/navigation')
  redirect('/')
}
