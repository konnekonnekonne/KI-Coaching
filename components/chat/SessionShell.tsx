'use client'

import { useState } from 'react'
import { Mic, MessageSquare } from 'lucide-react'
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
  // Transkript-Übergabe zwischen Modi — kein Reload, kein DB-Roundtrip
  const [voiceHandoff, setVoiceHandoff] = useState<Message[] | null>(null)
  const [currentMessages, setCurrentMessages] = useState<Message[]>(initialMessages)

  function getInitialMode(): Mode {
    if (initialMessages.length > 0) return 'text'
    try {
      const saved = sessionStorage.getItem(`kico-mode-${sessionId}`)
      if (saved === 'voice') return 'voice'
      if (saved === 'text') return 'text'
    } catch { /* SSR */ }
    return 'choose'
  }
  const [mode, setMode] = useState<Mode>(getInitialMode)

  // Voice → Text: History direkt im Speicher übergeben
  function handleVoiceEnd(history: { role: 'user' | 'kico'; text: string }[]) {
    try { sessionStorage.removeItem(`kico-mode-${sessionId}`) } catch { /* ignore */ }
    const messages: Message[] = history.map((entry, i) => ({
      id: `voice-${i}`,
      role: entry.role === 'kico' ? 'assistant' : 'user',
      content: entry.text,
    }))
    setVoiceHandoff(messages)
    setCurrentMessages(messages)
    setMode('text')
  }

  // Text → Voice: aktuellen Stand des Chats als Kontext mitgeben
  function switchToVoice() {
    try { sessionStorage.setItem(`kico-mode-${sessionId}`, 'voice') } catch { /* ignore */ }
    setMode('voice')
  }

  const chatMessages = voiceHandoff ?? initialMessages

  // ── Text-Modus ────────────────────────────────────────────────────────────
  if (mode === 'text' || (initialMessages.length > 0 && mode !== 'voice')) {
    return (
      <div className="flex flex-col h-full">
        {/* Modus-Wechsel — nur anzeigen wenn noch keine Nachrichten (frische Session) */}
        {chatMessages.length === 0 && (
          <div className="flex-shrink-0 flex justify-end px-6 py-3 border-b border-border/40">
            <button
              onClick={switchToVoice}
              className="flex items-center gap-1.5 caption text-muted/50 hover:text-primary transition-colors cursor-pointer"
            >
              <Mic size={12} />
              Zu Sprach­modus wechseln
            </button>
          </div>
        )}
        {/* Modus-Wechsel mitten in einer Session */}
        {chatMessages.length > 0 && (
          <div className="flex-shrink-0 flex justify-end px-6 py-2 border-b border-border/40">
            <button
              onClick={switchToVoice}
              className="flex items-center gap-1.5 caption text-muted/40 hover:text-primary transition-colors cursor-pointer"
            >
              <Mic size={12} />
              Weiter per Sprache
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            sessionId={sessionId}
            initialMessages={chatMessages}
            onMessagesChange={setCurrentMessages}
          />
        </div>
      </div>
    )
  }

  // ── Voice-Modus ───────────────────────────────────────────────────────────
  if (mode === 'voice') {
    return (
      <div className="flex flex-col h-full">
        {/* Modus-Wechsel: Voice → Text */}
        <div className="flex-shrink-0 flex justify-end px-6 py-2 border-b border-border/40">
          <button
            onClick={() => {
              try { sessionStorage.removeItem(`kico-mode-${sessionId}`) } catch { /* ignore */ }
              setMode('text')
            }}
            className="flex items-center gap-1.5 caption text-muted/40 hover:text-primary transition-colors cursor-pointer"
          >
            <MessageSquare size={12} />
            Weiter per Schrift
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <VoiceSession
            sessionId={sessionId}
            priorMessages={currentMessages.map(m => ({ role: m.role, content: m.content }))}
            onEnd={handleVoiceEnd}
          />
        </div>
      </div>
    )
  }

  // ── Moduswahl ─────────────────────────────────────────────────────────────
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
