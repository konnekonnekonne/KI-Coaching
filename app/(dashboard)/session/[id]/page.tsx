export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo, ThemeToggle } from '@/components/ui'
import { SessionShell } from '@/components/chat/SessionShell'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Session laden und prüfen ob sie dem User gehört
  const { data: session } = await supabase
    .from('sessions')
    .select('id, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()

  // Nachrichten laden
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  const datum = new Date(session.created_at).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="flex flex-col h-screen bg-bg">
      <header className="flex-shrink-0 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/session"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-kico-text transition-colors"
              aria-label="Zurück zur Übersicht"
            >
              <ArrowLeft size={16} />
            </Link>
            <Logo size={22} />
          </div>
          <span className="caption hidden sm:block text-muted">{datum}</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-hidden max-w-3xl w-full mx-auto">
        <SessionShell
          sessionId={session.id}
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
