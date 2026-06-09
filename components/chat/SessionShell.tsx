'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, PhoneOff } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { VoiceSession } from './VoiceSession'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()
  const router = useRouter()

  // Initialer Mode: server und client starten identisch (kein sessionStorage im SSR)
  // → verhindert React-Hydration-Fehler #418
  const [mode, setMode] = useState<Mode>(() =>
    initialMessages.length > 0 ? 'text' : 'choose'
  )

  // sessionStorage-Wert erst nach dem Mounten lesen (nur im Browser verfügbar)
  useEffect(() => {
    if (initialMessages.length > 0) return
    try {
      const saved = sessionStorage.getItem(`kico-mode-${sessionId}`)
      if (saved === 'voice') setMode('voice')
      else if (saved === 'text') setMode('text')
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Voice → Text: History direkt im Speicher übergeben, DB-Fallback wenn leer
  async function handleVoiceEnd(history: { role: 'user' | 'kico'; text: string }[]) {
    try { sessionStorage.removeItem(`kico-mode-${sessionId}`) } catch { /* ignore */ }
    let messages: Message[]
    if (history.length > 0) {
      messages = history.map((entry, i) => ({
        id: `voice-${i}`,
        role: (entry.role === 'kico' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: entry.text,
      }))
    } else {
      // In-flight DB-Inserts noch nicht committed — kurz warten, dann aus DB lesen
      await new Promise(r => setTimeout(r, 600))
      const { data } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      messages = (data ?? []).map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
    }
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
        {/* Aktionsleiste — konsistent mit Voice-Modus */}
        <div className="flex-shrink-0 flex items-center justify-end gap-5 px-6 py-2 border-b border-border/40">
          <button
            onClick={switchToVoice}
            className="flex items-center gap-1.5 caption text-muted/40 hover:text-primary transition-colors cursor-pointer"
          >
            <Mic size={12} />
            {chatMessages.length === 0 ? 'Zu Sprach­modus wechseln' : 'Weiter per Sprache'}
          </button>
          <span className="caption text-muted/20">·</span>
          <button
            onClick={() => router.push('/session')}
            className="flex items-center gap-1.5 caption text-muted/30 hover:text-signal-red transition-colors cursor-pointer"
          >
            <PhoneOff size={12} />
            Session beenden
          </button>
        </div>
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
        <VoiceSession
          sessionId={sessionId}
          priorMessages={currentMessages.map(m => ({ role: m.role, content: m.content }))}
          onEnd={handleVoiceEnd}
        />
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
