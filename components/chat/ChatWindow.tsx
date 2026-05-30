'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface ChatWindowProps {
  sessionId: string
  initialMessages?: Message[]
}

export function ChatWindow({ sessionId, initialMessages = [] }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Start session with KICO greeting if no messages yet
  useEffect(() => {
    if (messages.length === 0) {
      handleSend('__init__')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = useCallback(async (content: string) => {
    const isInit = content === '__init__'

    // Build messages array for the API
    const apiMessages = isInit
      ? [{ role: 'user', content: 'Hallo' }]
      : [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content },
        ]

    // Optimistically add user message to UI (not for init)
    if (!isInit) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content },
      ])
    }

    setIsStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, sessionId }),
      })

      if (!response.ok) throw new Error('API error')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const { text } = JSON.parse(data)
              accumulated += text
              setStreamingContent(accumulated)
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      // Commit streamed message to state
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: accumulated },
      ])
      setStreamingContent('')
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut.',
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }, [messages, sessionId])

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <MessageBubble
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
            }}
            isStreaming={!streamingContent}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <InputBar onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
