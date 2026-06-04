'use client'

import { useState } from 'react'
import { MessageSquare, Mic } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { VoiceSession } from './VoiceSession'
import { cn } from '@/lib/utils'

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
  // Hat die Session bereits Nachrichten? Direkt in Text-Modus
  const [mode, setMode] = useState<Mode>(
    initialMessages.length > 0 ? 'text' : 'choose'
  )

  if (mode === 'text' || initialMessages.length > 0 && mode !== 'voice') {
    return (
      <div className="flex flex-col h-full">
        {/* Modus-Switch oben */}
        {mode === 'text' && initialMessages.length === 0 && (
          <ModeSwitch onSwitch={() => setMode('voice')} current="text" />
        )}
        <div className="flex-1 overflow-hidden">
          <ChatWindow sessionId={sessionId} initialMessages={initialMessages} />
        </div>
      </div>
    )
  }

  if (mode === 'voice') {
    return (
      <VoiceSession
        sessionId={sessionId}
        onEnd={() => {
          // Seite neu laden damit Transkripte aus der DB erscheinen
          window.location.reload()
        }}
      />
    )
  }

  // Moduswahl
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 px-6">
      <div className="text-center">
        <h2 className="heading-3 text-kico-text mb-2">Wie möchtest du heute arbeiten?</h2>
        <p className="body-text text-muted">Du kannst den Modus jederzeit wechseln.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
        <ModeCard
          icon={<MessageSquare size={24} />}
          title="Schriftlich"
          description="Tippe deine Gedanken — ruhig und strukturiert."
          onClick={() => setMode('text')}
        />
        <ModeCard
          icon={<Mic size={24} />}
          title="Sprachlich"
          description="Sprich frei — Pausen und Stille sind willkommen."
          onClick={() => setMode('voice')}
          highlight
        />
      </div>
    </div>
  )
}

function ModeCard({
  icon, title, description, onClick, highlight = false
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border text-center transition-all',
        'hover:scale-[1.02] active:scale-[0.98]',
        highlight
          ? 'bg-primary text-white border-primary hover:bg-primary-dark'
          : 'bg-surface text-kico-text border-border hover:border-primary/40'
      )}
    >
      <div className={highlight ? 'text-white' : 'text-primary'}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-sm mb-1">{title}</p>
        <p className={cn('text-xs leading-relaxed', highlight ? 'text-white/80' : 'text-muted')}>
          {description}
        </p>
      </div>
    </button>
  )
}

function ModeSwitch({ onSwitch, current }: { onSwitch: () => void; current: 'text' | 'voice' }) {
  return (
    <div className="flex-shrink-0 flex justify-center py-2 border-b border-border bg-bg">
      <button
        onClick={onSwitch}
        className="flex items-center gap-1.5 caption text-muted hover:text-primary transition-colors"
      >
        {current === 'text' ? <Mic size={13} /> : <MessageSquare size={13} />}
        Zu {current === 'text' ? 'Sprach' : 'Text'}modus wechseln
      </button>
    </div>
  )
}
