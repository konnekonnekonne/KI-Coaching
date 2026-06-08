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

    // session.update via DataChannel scheitert für input_audio_transcription bei gpt-realtime-2
    // → Konfiguration server-seitig beim Client-Secret-Request setzen
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
          // Input-Transkription server-seitig aktivieren (client-seitiges session.update
          // wird von gpt-realtime-2 für diese Felder nicht akzeptiert)
          input_audio_transcription: {
            model: 'whisper-1',
          },
          audio: {
            output: {
              voice: 'shimmer',
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
