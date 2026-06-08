'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface VoiceSessionProps {
  sessionId: string
  onEnd: () => void
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'
type SpeakerState = 'silent' | 'user' | 'kico'

interface TranscriptEntry {
  role: 'user' | 'kico'
  text: string
}

// ── Schlüsselsatz-Erkennung ─────────────────────────────────────────────────
// Einfache Heuristik: Sätze die lang genug sind UND Coaching-Schlüsselwörter
// enthalten, die typischerweise auf einen zentralen Gedanken hinweisen.

const KEY_INDICATORS = [
  'eigentlich', 'wirklich', 'immer', 'nie', 'ständig', 'manchmal',
  'ich merke', 'ich bemerke', 'ich fühle', 'ich spüre',
  'ich will', 'ich wollte', 'ich wünsche', 'ich wünschte',
  'es geht mir', 'es geht darum', 'das bedeutet', 'das heißt',
  'ich glaube', 'mir fällt auf', 'das problem', 'mein problem',
  'ich kann nicht', 'ich schaffe', 'ich weiß nicht',
  'gleichzeitig', 'obwohl', 'aber eigentlich', 'und trotzdem',
  'mir ist wichtig', 'was mich', 'was ich',
]

function extractKeyPhrase(text: string): string | null {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  // Priorisiere: langer Satz mit Schlüsselindikator
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/)
    const lower = sentence.toLowerCase()
    if (words.length >= 7 && KEY_INDICATORS.some(k => lower.includes(k))) {
      return sentence
    }
  }

  // Fallback: längster Satz wenn > 10 Wörter
  const long = sentences
    .filter(s => s.split(/\s+/).length >= 10)
    .sort((a, b) => b.length - a.length)[0]

  return long ?? null
}

// ── Hauptkomponente ─────────────────────────────────────────────────────────

export function VoiceSession({ sessionId, onEnd }: VoiceSessionProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [speakerState, setSpeakerState] = useState<SpeakerState>('silent')
  const [isMuted, setIsMuted] = useState(false)

  // Transkript-State
  const [liveTranscript, setLiveTranscript] = useState('')      // läuft live mit
  const [history, setHistory] = useState<TranscriptEntry[]>([]) // abgeschlossene Turns
  const [keyPhrase, setKeyPhrase] = useState<string | null>(null)
  const [keyPhraseVisible, setKeyPhraseVisible] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)

  // User-ID beim Mount laden
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [supabase])

  // Auto-scroll ans Ende des Transkripts
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, liveTranscript])

  // Verbindung aufbauen
  const connect = useCallback(async () => {
    setConnectionState('connecting')

    try {
      const tokenRes = await fetch('/api/voice/session', { method: 'POST' })
      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        throw new Error(`Token fetch failed: ${tokenRes.status} ${errText}`)
      }
      const { ephemeral_key } = await tokenRes.json()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      localStreamRef.current = stream

      const pc = new RTCPeerConnection()
      pcRef.current = pc

      let audioSet = false
      pc.ontrack = (e) => {
        if (!audioSet && audioRef.current) {
          audioRef.current.srcObject = e.streams[0]
          audioRef.current.play().catch(console.error)
          audioSet = true
        }
        setSpeakerState('kico')
      }

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc
      dc.onmessage = handleDataChannelMessage

      dc.onopen = () => {
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: {
              type: 'semantic_vad',
              silence_duration_ms: 1800,
              threshold: 0.8,
            },
            input_audio_transcription: {
              model: 'whisper-1',
              language: 'de',
            },
          },
        }))
        dc.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'Bitte eröffne das Gespräch.' }],
          },
        }))
        dc.send(JSON.stringify({ type: 'response.create' }))
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })

      if (!sdpRes.ok) throw new Error('SDP exchange failed')

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: await sdpRes.text(),
      })

      setConnectionState('connected')

    } catch (err) {
      console.error('Voice connect error:', err)
      setConnectionState('error')
      cleanup()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // DataChannel Events
  const handleDataChannelMessage = useCallback(async (e: MessageEvent) => {
    try {
      const event = JSON.parse(e.data)
      console.log('[Voice DC]', event.type)

      // ── Sprecherstatus ────────────────────────────────────────────────────
      if (event.type === 'input_audio_buffer.speech_started') {
        setSpeakerState('user')
        setLiveTranscript('') // neuer Turn beginnt
      } else if (event.type === 'input_audio_buffer.speech_stopped') {
        setSpeakerState('silent')
      } else if (event.type === 'response.audio.delta') {
        setSpeakerState('kico')
      } else if (event.type === 'response.audio.done') {
        setSpeakerState('silent')
      }

      // ── Live-Transkript (Deltas) ──────────────────────────────────────────
      if (event.type === 'conversation.item.input_audio_transcription.delta') {
        const delta: string = event.delta ?? ''
        setLiveTranscript(prev => prev + delta)
      }

      // ── Abgeschlossenes User-Transkript ───────────────────────────────────
      if (event.type === 'conversation.item.input_audio_transcription.completed') {
        const text: string = event.transcript ?? ''
        if (text.trim()) {
          setLiveTranscript('')
          setHistory(h => [...h, { role: 'user', text }])

          // Schlüsselsatz erkennen
          const phrase = extractKeyPhrase(text)
          if (phrase) {
            setKeyPhrase(phrase)
            setKeyPhraseVisible(true)
          }

          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userIdRef.current,
            role: 'user',
            content: text,
          })
          if (error) console.error('[Voice DB] User insert error:', error.message)
          else console.log('[Voice DB] User message saved ✓')
        }
      }

      // ── KICO Antwort ──────────────────────────────────────────────────────
      if (event.type === 'response.audio_transcript.done') {
        const text: string = event.transcript ?? ''
        if (text.trim()) {
          setHistory(h => [...h, { role: 'kico', text }])
          // Schlüsselsatz verblasst wenn KICO antwortet
          setKeyPhraseVisible(false)

          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userIdRef.current,
            role: 'assistant',
            content: text,
          })
          if (error) console.error('[Voice DB] KICO insert error:', error.message)
          else console.log('[Voice DB] KICO message saved ✓')
        }
      }

    } catch (err) {
      console.error('[Voice DC] Parse error:', err)
    }
  }, [sessionId, supabase])

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null
    dataChannelRef.current = null
    setSpeakerState('silent')
  }, [])

  const handleEnd = useCallback(() => {
    cleanup()
    onEnd()
  }, [cleanup, onEnd])

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = isMuted })
    setIsMuted(m => !m)
  }, [isMuted])

  useEffect(() => {
    connect()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statusText =
    connectionState === 'connecting' ? 'Verbinde…' :
    connectionState === 'error'      ? 'Verbindungsfehler — bitte neu laden' :
    speakerState === 'user'          ? 'Du sprichst…' :
    speakerState === 'kico'          ? 'KICO spricht…' :
                                       'Hör zu oder sprich…'

  return (
    <div className="flex flex-col md:flex-row h-full">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* ── Linke Seite / Mobile-Kopf: Orb + Schlüsselsatz + Controls ──── */}
      <div className="flex flex-col items-center md:flex-1 md:justify-between pt-10 pb-8 px-8 gap-6">

        {/* Orb + Status */}
        <div className="flex flex-col items-center gap-4">
          <VoiceOrb state={connectionState} speaker={speakerState} />
          <p className="caption text-muted">{statusText}</p>
        </div>

        {/* Schlüsselsatz — erscheint wenn ein zentraler Satz erkannt wurde */}
        <div className={cn(
          'text-center px-2 transition-all duration-700 overflow-hidden',
          keyPhrase && keyPhraseVisible
            ? 'max-h-56 opacity-100'
            : 'max-h-0 opacity-0'
        )}>
          {keyPhrase && (
            <blockquote className="heading-2 text-kico-text/75 italic leading-snug">
              „{keyPhrase}"
            </blockquote>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMute}
            disabled={connectionState !== 'connected'}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isMuted
                ? 'bg-signal-amber text-white'
                : 'bg-surface border border-border text-muted hover:text-kico-text',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            aria-label={isMuted ? 'Mikrofon einschalten' : 'Mikrofon stummschalten'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={handleEnd}
            className="w-14 h-14 rounded-full bg-signal-red flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            aria-label="Voice-Session beenden"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* ── Rechte Seite / Mobile-Unten: Live-Transkript ─────────────────── */}
      {connectionState === 'connected' && (
        <div className={cn(
          'border-t md:border-t-0 md:border-l border-border',
          'md:w-72 max-h-[35vh] md:max-h-full',
          'overflow-y-auto chat-scroll',
          'px-5 py-5 flex flex-col gap-0.5',
        )}>

          {/* Leerer Zustand */}
          {history.length === 0 && !liveTranscript && (
            <p className="caption text-muted/40 italic">
              Deine Worte erscheinen hier…
            </p>
          )}

          {/* Gesprächsverlauf */}
          {history.map((entry, i) => (
            <p
              key={i}
              className={cn(
                'caption leading-relaxed py-1.5',
                entry.role === 'user'
                  ? 'text-kico-text/65'
                  : 'text-muted/55 italic pl-3 border-l border-border/50'
              )}
            >
              {entry.text}
            </p>
          ))}

          {/* Live-Transkript — läuft in Echtzeit mit */}
          {liveTranscript && (
            <p className="caption text-kico-text/35 leading-relaxed py-1.5">
              {liveTranscript}
              <span className="animate-pulse">▌</span>
            </p>
          )}

          <div ref={historyEndRef} />
        </div>
      )}
    </div>
  )
}

// ── Animierter Orb ──────────────────────────────────────────────────────────

function VoiceOrb({ state, speaker }: { state: ConnectionState; speaker: SpeakerState }) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">

      <div className={cn(
        'absolute inset-0 rounded-full transition-all duration-300',
        speaker === 'kico' && 'animate-ping bg-primary/20',
      )} />

      <div className={cn(
        'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
        state === 'connecting'                                   && 'bg-surface border-2 border-border',
        state === 'connected' && speaker === 'user'             && 'bg-accent/20 border-2 border-accent',
        state === 'connected' && speaker === 'kico'             && 'bg-primary border-2 border-primary',
        state === 'connected' && speaker === 'silent'           && 'bg-surface border-2 border-border',
        state === 'error'                                        && 'bg-signal-red/10 border-2 border-signal-red',
      )}>
        {state === 'connecting' && <Loader2 size={28} className="text-muted animate-spin" />}
        {state === 'connected' && (
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <line x1="20" y1="36" x2="20" y2="21"
              stroke={speaker === 'kico' ? 'white' : 'var(--color-primary)'}
              strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M20 21 Q14 17 9 13"
              stroke={speaker === 'kico' ? 'white' : 'var(--color-primary)'}
              strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M20 21 Q26 15 31 8"
              stroke={speaker === 'kico' ? 'white' : 'var(--color-primary)'}
              strokeWidth="2" strokeLinecap="round" fill="none"/>
            <circle cx="9" cy="13" r="3.5"
              fill={speaker === 'kico' ? 'white' : 'var(--color-primary)'}/>
            <circle cx="31" cy="8" r="3.5"
              fill={speaker === 'kico' ? 'white' : 'var(--color-primary)'}/>
          </svg>
        )}
      </div>
    </div>
  )
}
