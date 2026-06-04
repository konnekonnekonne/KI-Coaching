export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/ui'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profil laden (inkl. Vorname)
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .single()

  // Vergangene Sessions laden (max. 20)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Für jede Session Nachrichten laden
  const sessionIds = sessions?.map(s => s.id) ?? []
  const { data: messageSummaries } = sessionIds.length > 0
    ? await supabase
        .from('messages')
        .select('session_id, content, role, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  // Sessions anreichern mit Vorschau
  const enrichedSessions = sessions?.map(session => {
    const msgs = messageSummaries?.filter(m => m.session_id === session.id) ?? []
    const firstUserMsg = msgs.find(m => m.role === 'user')
    return {
      id: session.id,
      created_at: session.created_at,
      message_count: msgs.length,
      preview: firstUserMsg?.content?.slice(0, 80) ?? null,
    }
  }) ?? []

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex-shrink-0 bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size={24} />
          <form>
            <button
              formAction={signOut}
              className="caption text-muted hover:text-kico-text transition-colors px-2 py-1"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Dashboard
          firstName={profile?.first_name ?? null}
          sessions={enrichedSessions}
          userId={user.id}
        />
      </main>
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
