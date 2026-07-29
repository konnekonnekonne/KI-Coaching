import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { COACHING_MODEL } from '@/lib/models'
import { scanForSignals, CRISIS_RESPONSE_TEXT } from '@/lib/signal-scanner'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, sessionId, isGreeting = false } = await request.json()

    if (!Array.isArray(messages)) {
      return new Response('Invalid request body', { status: 400 })
    }

    const lastUserMessage = !isGreeting
      ? messages.findLast((m: { role: string }) => m.role === 'user')
      : undefined
    const signal = lastUserMessage ? scanForSignals(lastUserMessage.content) : null

    // Deterministischer Pre-Filter (B-05b): akute Krisensignale umgehen das
    // Modell vollständig -- unabhängig von dessen Verlässlichkeit. Kein
    // LLM-Call, direkte, garantierte Antwort. Siehe docs/backlog.md B-05b.
    if (signal?.level === 'akut') {
      if (sessionId) {
        await supabase.from('messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'user',
          content: lastUserMessage.content,
          risk_level: signal.level,
          risk_terms: signal.matchedTerms,
        })
        await supabase.from('messages').insert({
          session_id: sessionId,
          user_id: user.id,
          role: 'assistant',
          content: CRISIS_RESPONSE_TEXT,
        })
      }

      const encoder = new TextEncoder()
      const crisisStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: CRISIS_RESPONSE_TEXT })}\n\n`)
          )
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        },
      })
      return new Response(crisisStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Begrüßung: leere History, Claude öffnet das Gespräch proaktiv
    // Normaler Chat: History + neue User-Nachricht
    const claudeMessages = isGreeting
      ? [{ role: 'user' as const, content: 'Bitte eröffne das Gespräch.' }]
      : messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))

    const stream = await anthropic.messages.stream({
      model: COACHING_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: claudeMessages,
    })

    // User-Nachricht in DB speichern — aber NICHT bei isGreeting.
    // risk_level/risk_terms werden auch bei niedrigeren Stufen mitgespeichert
    // (Audit-Trail für spätere Kontextklassifikation), ohne den Call zu blockieren.
    if (!isGreeting && sessionId && lastUserMessage) {
      await supabase.from('messages').insert({
        session_id: sessionId,
        user_id: user.id,
        role: 'user',
        content: lastUserMessage.content,
        risk_level: signal?.level ?? 'keine',
        risk_terms: signal?.matchedTerms?.length ? signal.matchedTerms : null,
      })
    }

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

        // KICO-Antwort immer speichern (auch Begrüßung)
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
