import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // GA API (seit Mai 2026): turn_detection und input_audio_transcription
    // werden nicht mehr in client_secrets gesetzt, sondern nach Verbindungsaufbau
    // per DataChannel-Event (session.update) konfiguriert.
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: {
          anchor: 'created_at',
          seconds: 3600,
        },
        session: {
          type: 'realtime',
          model: 'gpt-realtime-2',
          instructions: SYSTEM_PROMPT,
          audio: {
            output: {
              voice: 'alloy',
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI Realtime client_secrets error:', error)
      return new Response(error, { status: response.status })
    }

    const data = await response.json()
    return Response.json({ ephemeral_key: data.value })

  } catch (error) {
    console.error('Voice session error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
