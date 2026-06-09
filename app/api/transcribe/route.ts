import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    if (!audioFile || audioFile.size < 500) {
      return new Response('No audio', { status: 400 })
    }

    // Whisper-1 via direkten Fetch-Call (kein openai-SDK nötig)
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'de')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: whisperForm,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper error:', response.status, error)
      return new Response(error, { status: response.status })
    }

    const data = await response.json()
    return Response.json({ text: data.text ?? '' })

  } catch (error) {
    console.error('Transcribe route error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
