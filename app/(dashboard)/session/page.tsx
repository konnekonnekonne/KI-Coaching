export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, voice_gender')
    .eq('id', user.id)
    .single()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const sessionIds = sessions?.map(s => s.id) ?? []
  const { data: messageSummaries } = sessionIds.length > 0
    ? await supabase
        .from('messages')
        .select('session_id, content, role, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true })
    : { data: [] }

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
    <div className="min-h-screen bg-bg relative">

      {/* Abmelden — sehr dezent, oben rechts */}
      <div className="absolute top-5 right-6 z-10">
        <form>
          <button
            formAction={signOut}
            className="caption text-muted/40 hover:text-muted transition-colors"
          >
            Abmelden
          </button>
        </form>
      </div>

      <Dashboard
        firstName={profile?.first_name ?? null}
        sessions={enrichedSessions}
        userId={user.id}
        voiceGender={(profile?.voice_gender as 'weiblich' | 'maennlich') ?? 'weiblich'}
      />
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
