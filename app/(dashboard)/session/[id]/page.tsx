export const dynamic = 'force-dynamic'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

      {/* ── Minimaler Header ── */}
      <header className="flex-shrink-0 h-11 flex items-center justify-between px-6 border-b border-border/40">
        <Link
          href="/session"
          className="flex items-center gap-1.5 caption text-muted/50 hover:text-muted transition-colors"
          aria-label="Zurück zur Übersicht"
        >
          <ArrowLeft size={13} />
          Zurück
        </Link>
        <span className="caption text-muted/35 hidden sm:block">{datum}</span>
        <div className="w-14" />
      </header>

      {/* ── Volle Breite — Voice-Layout braucht den Platz ── */}
      <div className="flex-1 overflow-hidden">
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
