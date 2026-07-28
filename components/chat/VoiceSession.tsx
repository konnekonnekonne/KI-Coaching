'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, PhoneOff, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PipecatClient } from '@pipecat-ai/client-js'
import { DailyTransport } from '@pipecat-ai/daily-transport'

interface VoiceSessionProps {
  sessionId: string
  priorMessages?: { role: 'user' | 'assistant'; content: string }[]
  onEnd: (history: TranscriptEntry[]) => void
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

interface TranscriptEntry {
  role: 'user' | 'kico'
  text: string
}

// ── Schlüsselsatz-Erkennung ─────────────────────────────────────────────────
// Unverändert aus der vorherigen Implementierung übernommen.

const KEY_INDICATORS = [
  'eigentlich', 'wirklich', 'immer', 'nie', 'ständig', 'manchmal',
  'ich merke', 'ich bemerke', 'ich fühle', 'ich spüre',
  'ich will', 'ich wollte', 'ich wünsche', 'ich wünschte',
  'es geht mir', 'es geht darum', 'das bedeutet', 'das heißt',
  'ich glaube', 'mir fällt auf', 'das problem', 'mein problem',
  'ich kann nicht', 'ich schaffe es', 'ich weiß nicht',
  'gleichzeitig', 'obwohl', 'und trotzdem', 'aber eigentlich',
  'mir ist wichtig', 'was mich', 'was ich',
]

function extractKeyPhrase(text: string): string | null {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
  for (const sentence of sentences) {
    if (sentence.split(/\s+/).length >= 7 && KEY_INDICATORS.some(k => sentence.toLowerCase().includes(k))) {
      return sentence
    }
  }
  const long = sentences.filter(s => s.split(/\s+/).length >= 10).sort((a, b) => b.length - a.length)[0]
  return long ?? null
}

// ── Hauptkomponente ─────────────────────────────────────────────────────────
// Cascaded-Architektur (Deepgram STT/TTS -> Claude Sonnet, gehostet auf
// Pipecat Cloud) statt der vorherigen Speech-to-Speech-Anbindung an OpenAI.
// Kein manuelles Push-to-Talk mehr nötig -- Silero VAD mit grosszuegigem
// stop_secs (siehe voice-agent/bot.py) uebernimmt die Turn-Detection.

export function VoiceSession({ sessionId, priorMessages, onEnd }: VoiceSessionProps) {
  const router = useRouter()
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [isKicoSpeaking, setIsKicoSpeaking] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [history, setHistory] = useState<TranscriptEntry[]>([])
  const [keyPhrase, setKeyPhrase] = useState<string | null>(null)
  const [keyPhraseVisible, setKeyPhraseVisible] = useState(false)

  const clientRef = useRef<PipecatClient | null>(null)
  const historyRef = useRef<TranscriptEntry[]>([])
  const historyEndRef = useRef<HTMLDivElement>(null)
  const botTextRef = useRef<string>('')

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const pushHistory = useCallback((entry: TranscriptEntry) => {
    setHistory(h => {
      const next = [...h, entry]
      historyRef.current = next
      return next
    })
  }, [])

  // ── Verbindung aufbauen ─────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setConnectionState('connecting')
    try {
      const client = new PipecatClient({
        transport: new DailyTransport(),
        enableMic: true,
        enableCam: false,
        callbacks: {
          onBotReady: () => setConnectionState('connected'),
          onDisconnected: () => setConnectionState('idle'),
          onError: (message) => {
            console.error('[Voice] Pipecat error:', message)
            setConnectionState('error')
          },
          onBotTtsStarted: () => setIsKicoSpeaking(true),
          onBotTtsStopped: () => setIsKicoSpeaking(false),

          // Coachee-Transkript: nur finale Segmente uebernehmen
          onUserTranscript: (data) => {
            if (!data.final || !data.text.trim()) return
            const trimmed = data.text.trim()
            pushHistory({ role: 'user', text: trimmed })
            const phrase = extractKeyPhrase(trimmed)
            if (phrase) { setKeyPhrase(phrase); setKeyPhraseVisible(true) }
          },

          // KICOs Antwort: Text kommt gestreamt (Delta-Chunks), hier
          // akkumulieren und erst am Ende der Generierung als eine
          // Transkript-Zeile uebernehmen.
          onBotLlmStarted: () => {
            botTextRef.current = ''
            setKeyPhraseVisible(false)
          },
          onBotLlmText: (data) => {
            botTextRef.current += data.text
          },
          onBotLlmStopped: () => {
            const text = botTextRef.current.trim()
            if (text) pushHistory({ role: 'kico', text })
            botTextRef.current = ''
          },
        },
      })
      clientRef.current = client

      await client.startBotAndConnect({
        endpoint: '/api/voice/start',
        // TODO(Task 6/7): priorMessages wird bislang nur durchgereicht, aber
        // von bot.py noch nicht in den LLMContext vorgeladen -- ein
        // Text→Voice-Wechsel startet den Voice-Kontext aktuell "kalt".
        requestData: { sessionId, priorMessages: priorMessages ?? [] },
      })
    } catch (err) {
      console.error('[Voice] Connect error:', err)
      setConnectionState('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- priorMessages ist ein Snapshot beim Verbindungsaufbau, nicht reaktiv
  }, [sessionId, pushHistory])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Verbindungsaufbau zu externem System (Pipecat), kein reiner State-Sync
    connect()
    return () => {
      clientRef.current?.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Mute-Toggle ──────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const client = clientRef.current
    if (!client) return
    const next = !isMicMuted
    client.enableMic(!next)
    setIsMicMuted(next)
  }, [isMicMuted])

  // ── Ende ─────────────────────────────────────────────────────────────────

  const handleSwitchToText = useCallback(() => {
    const snapshot = historyRef.current
    clientRef.current?.disconnect()
    onEnd(snapshot)
  }, [onEnd])

  const handleEndSession = useCallback(() => {
    clientRef.current?.disconnect()
    router.push('/session')
  }, [router])

  // ── Status-Text ─────────────────────────────────────────────────────────

  const statusText =
    connectionState === 'connecting' ? 'Verbinde…' :
    connectionState === 'error'      ? 'Verbindungsfehler — bitte neu laden' :
    isMicMuted                       ? 'Mikrofon stummgeschaltet' :
    isKicoSpeaking                   ? 'KICO spricht.' :
                                       'KICO hört zu. Nimm dir Zeit.'

  const canInteract = connectionState === 'connected'

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* ── Haupt-Spalte ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center md:flex-1 pt-12 pb-8 px-8 gap-8 md:justify-between">

        <div className="flex flex-col items-center gap-6">
          <p className="caption text-muted/40">{statusText}</p>

          <div
            className={cn(
              'relative w-32 h-32 rounded-full flex items-center justify-center',
              'transition-all duration-300 border-2',
              isKicoSpeaking && 'border-primary bg-primary/10 scale-105',
              !isKicoSpeaking && canInteract && 'border-border bg-surface/40',
              !canInteract && 'border-border bg-surface/30',
            )}
          >
            {isKicoSpeaking && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/10" />
            )}
            {connectionState === 'connecting' && (
              <Loader2 size={28} className="text-muted animate-spin" />
            )}
            {connectionState === 'connected' && (
              <Mic size={28} className={cn(
                'transition-colors duration-300',
                isMicMuted ? 'text-muted/30' : 'text-primary'
              )} />
            )}
          </div>

          <button
            onClick={toggleMute}
            disabled={!canInteract}
            aria-label={isMicMuted ? 'Mikrofon aktivieren' : 'Mikrofon stummschalten'}
            className={cn(
              'flex items-center gap-1.5 caption transition-colors cursor-pointer',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              isMicMuted ? 'text-signal-amber' : 'text-muted/50 hover:text-primary',
            )}
          >
            {isMicMuted ? <MicOff size={13} /> : <Mic size={13} />}
            {isMicMuted ? 'Stummgeschaltet' : 'Mikrofon aktiv'}
          </button>
        </div>

        {/* Key Phrase Spotlight */}
        <div className={cn(
          'text-center px-2 transition-all duration-700 overflow-hidden w-full max-w-sm',
          keyPhrase && keyPhraseVisible ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
        )}>
          {keyPhrase && (
            <blockquote className="heading-2 text-kico-text/70 italic leading-snug">
              „{keyPhrase}&rdquo;
            </blockquote>
          )}
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleSwitchToText}
            className="flex items-center gap-1.5 caption text-muted/50 hover:text-primary transition-colors cursor-pointer"
            aria-label="Zu Schriftmodus wechseln"
          >
            <MessageSquare size={13} />
            Weiter per Schrift
          </button>
          <span className="text-muted/20 caption">·</span>
          <button
            onClick={handleEndSession}
            className="flex items-center gap-1.5 caption text-muted/30 hover:text-signal-red transition-colors cursor-pointer"
            aria-label="Session beenden"
          >
            <PhoneOff size={13} />
            Session beenden
          </button>
        </div>
      </div>

      {/* ── Transkript-Panel ───────────────────────────────────────────── */}
      {connectionState === 'connected' && (
        <div className={cn(
          'border-t md:border-t-0 md:border-l border-border',
          'md:w-72 max-h-[35vh] md:max-h-full',
          'overflow-y-auto chat-scroll',
          'px-5 py-5 flex flex-col gap-0.5',
        )}>
          {history.length === 0 && (
            <p className="caption text-muted/35 italic">Deine Worte erscheinen hier…</p>
          )}
          {history.map((entry, i) => (
            <p key={i} className={cn(
              'caption leading-relaxed py-1',
              entry.role === 'user'
                ? 'text-kico-text/60'
                : 'text-muted/50 italic pl-3 border-l border-border/50'
            )}>
              {entry.text}
            </p>
          ))}
          <div ref={historyEndRef} />
        </div>
      )}
    </div>
  )
}
