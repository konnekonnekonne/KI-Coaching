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

    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: {
          anchor: 'created_at',
          seconds: 3600, // 1h — ausreichend für eine Coaching-Session
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
          turn_detection: {
            type: 'semantic_vad',
            silence_duration_ms: 1200, // Denkpausen tolerieren
            threshold: 0.5,
          },
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
            language: 'de',
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
