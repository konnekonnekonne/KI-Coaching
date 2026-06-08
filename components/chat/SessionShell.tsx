'use client'

import { useState } from 'react'
import { Mic } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { VoiceSession } from './VoiceSession'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

interface SessionShellProps {
  sessionId: string
  initialMessages: Message[]
}

type Mode = 'choose' | 'text' | 'voice'

export function SessionShell({ sessionId, initialMessages }: SessionShellProps) {
  // Transkript aus einer abgeschlossenen Voice-Session — direkt im Speicher,
  // kein Reload, kein DB-Roundtrip nötig
  const [voiceHandoff, setVoiceHandoff] = useState<Message[] | null>(null)

  function getInitialMode(): Mode {
    if (initialMessages.length > 0) return 'text'
    try {
      const saved = sessionStorage.getItem(`kico-mode-${sessionId}`)
      if (saved === 'voice') return 'voice'
      if (saved === 'text') return 'text'
    } catch { /* SSR oder privater Modus */ }
    return 'choose'
  }
  const [mode, setMode] = useState<Mode>(getInitialMode)

  // Wird von VoiceSession aufgerufen wenn der Nutzer die Session beendet.
  // history enthält alle abgeschlossenen Turns — direkt als initialMessages
  // an ChatWindow übergeben, damit der Übergang nahtlos und ohne Reload ist.
  function handleVoiceEnd(history: { role: 'user' | 'kico'; text: string }[]) {
    try { sessionStorage.removeItem(`kico-mode-${sessionId}`) } catch { /* ignore */ }

    const messages: Message[] = history.map((entry, i) => ({
      id: `voice-${i}`,
      role: entry.role === 'kico' ? 'assistant' : 'user',
      content: entry.text,
    }))

    setVoiceHandoff(messages)
    setMode('text')
  }

  // Die effektiven initialMessages für ChatWindow:
  // - voiceHandoff wenn gerade aus Voice gewechselt
  // - sonst die vom Server geladenen Nachrichten
  const chatMessages = voiceHandoff ?? initialMessages

  // Text-Modus
  if (mode === 'text' || (initialMessages.length > 0 && mode !== 'voice')) {
    return (
      <div className="flex flex-col h-full">
        {mode === 'text' && chatMessages.length === 0 && (
          <div className="flex-shrink-0 flex justify-end px-6 py-3 border-b border-border">
            <button
              onClick={() => setMode('voice')}
              className="flex items-center gap-1.5 caption text-muted/50 hover:text-primary transition-colors cursor-pointer"
            >
              <Mic size={12} />
              Zu Sprach­modus wechseln
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ChatWindow sessionId={sessionId} initialMessages={chatMessages} />
        </div>
      </div>
    )
  }

  // Voice-Modus
  if (mode === 'voice') {
    return (
      <VoiceSession
        sessionId={sessionId}
        onEnd={handleVoiceEnd}
      />
    )
  }

  // Moduswahl — typografisch, keine Karten
  return (
    <div className="flex flex-col justify-center h-full px-8 max-w-lg mx-auto">
      <p className="body-text text-muted mb-10">
        Wie möchtest du heute arbeiten?
      </p>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setMode('text')}
          className="display text-left text-primary hover:text-primary-dark transition-colors cursor-pointer leading-tight"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          Schreiben →
        </button>
        <button
          onClick={() => setMode('voice')}
          className="display text-left text-primary hover:text-primary-dark transition-colors cursor-pointer leading-tight"
          style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
        >
          Sprechen →
        </button>
      </div>
    </div>
  )
}
