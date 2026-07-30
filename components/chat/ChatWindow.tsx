'use client'

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface ChatWindowProps {
  sessionId: string
  initialMessages?: Message[]
  onMessagesChange?: (messages: Message[]) => void
}

export interface ChatWindowHandle {
  sendMessage: (content: string) => void
}

export const ChatWindow = forwardRef<ChatWindowHandle, ChatWindowProps>(function ChatWindow(
  { sessionId, initialMessages = [], onMessagesChange },
  ref
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  // Scroll to bottom on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Aktuelle Message-Liste nach oben melden (für Text→Voice-Übergabe)
  useEffect(() => {
    onMessagesChange?.(messages)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // KICO-Begrüßung beim ersten Laden — nur wenn keine Nachrichten vorhanden
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (initialMessages.length === 0) {
      triggerGreeting()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Begrüßung: kein User-Input, kein DB-Eintrag — rein serverseitig getriggert
  async function triggerGreeting() {
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],   // Leere History → System-Prompt öffnet das Gespräch
          sessionId,
          isGreeting: true, // API speichert nur die Antwort, kein User-Eintrag
        }),
      })

      if (!response.ok) throw new Error('API error')
      await readStream(response, '')
    } catch (err) {
      console.error('Greeting error:', err)
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSend = useCallback(async (content: string) => {
    // User-Nachricht sofort in der UI anzeigen
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content }])
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const apiMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, sessionId }),
      })

      if (!response.ok) throw new Error('API error')
      await readStream(response, content)
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es erneut.',
      }])
    } finally {
      setIsStreaming(false)
    }
  }, [messages, sessionId])

  // Erlaubt das programmatische Senden einer Nachricht von außerhalb (z. B.
  // wenn der Coachee eine offene Anker-Karte ausfüllt, siehe SessionAnchors.tsx
  // und SessionShell.tsx) -- fließt exakt wie normaler Chat-Input in Claudes
  // Kontext ein.
  useImperativeHandle(ref, () => ({ sendMessage: handleSend }), [handleSend])

  // Stream lesen und KICO-Antwort aufbauen
  async function readStream(response: Response, _userContent: string) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break

      const lines = decoder.decode(value).split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') break
        try {
          const { text } = JSON.parse(data)
          accumulated += text
          setStreamingContent(accumulated)
        } catch { /* ignore */ }
      }
    }

    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: accumulated,
    }])
    setStreamingContent('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Nachrichten */}
      <div className="flex-1 overflow-y-auto chat-scroll px-4 py-6 space-y-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isStreaming && (
          <MessageBubble
            message={{ id: 'streaming', role: 'assistant', content: streamingContent }}
            isStreaming={!streamingContent}
          />
        )}

        <div ref={bottomRef} />
      </div>

      <InputBar onSend={handleSend} disabled={isStreaming} />
    </div>
  )
})
