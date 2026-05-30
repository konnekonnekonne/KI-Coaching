import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 })
    }

    // Stream response from Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    // Persist the latest user message to Supabase
    const lastUserMessage = messages.findLast(
      (m: { role: string }) => m.role === 'user'
    )
    if (lastUserMessage && sessionId) {
      await supabase.from('messages').insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: lastUserMessage.content,
      })
    }

    // Return SSE stream
    const encoder = new TextEncoder()
    let fullAssistantMessage = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            const text = chunk.delta.text
            fullAssistantMessage += text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Persist the complete assistant response
        if (fullAssistantMessage && sessionId) {
          await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content: fullAssistantMessage,
          })
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
