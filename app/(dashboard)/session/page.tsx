export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { LogOut } from 'lucide-react'

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get or create a session for today
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

  // Load existing messages for this session
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('session_id', session?.id)
    .order('created_at', { ascending: true })

  return (
    <div className="flex flex-col h-screen bg-[--background]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[--accent]">kico</span>
          <span className="text-xs text-[--muted] hidden sm:inline">· Dein KI-Coach</span>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            formAction={signOut}
            className="flex items-center gap-1.5 text-sm text-[--muted] hover:text-[--foreground] transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </form>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-3xl w-full mx-auto">
        <ChatWindow
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
