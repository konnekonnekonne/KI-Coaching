import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const PIPECAT_AGENT_NAME = 'kico'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { sessionId, priorMessages } = await request.json()
    if (!sessionId) {
      return new Response('sessionId fehlt', { status: 400 })
    }

    // Ownership pruefen -- dieselbe RLS-gestuetzte Regel wie im Textmodus
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return new Response('Session nicht gefunden', { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('voice_gender')
      .eq('id', user.id)
      .single()

    const response = await fetch(
      `https://api.pipecat.daily.co/v1/public/${PIPECAT_AGENT_NAME}/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PIPECAT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createDailyRoom: true,
          body: {
            session_id: sessionId,
            user_id: user.id,
            voice_gender: profile?.voice_gender ?? 'weiblich',
            // Noch nicht von bot.py ausgewertet -- siehe TODO in VoiceSession.tsx
            prior_messages: priorMessages ?? [],
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Pipecat Cloud start error:', error)
      return new Response(error, { status: response.status })
    }

    const data = await response.json()
    return Response.json(data)

  } catch (error) {
    console.error('Voice start error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
