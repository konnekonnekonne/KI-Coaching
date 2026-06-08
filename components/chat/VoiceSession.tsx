'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, PhoneOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface VoiceSessionProps {
  sessionId: string
  onEnd: (history: TranscriptEntry[]) => void
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error'

interface TranscriptEntry {
  role: 'user' | 'kico'
  text: string
}

// ── Schlüsselsatz-Erkennung ─────────────────────────────────────────────────

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
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/)
    const lower = sentence.toLowerCase()
    if (words.length >= 7 && KEY_INDICATORS.some(k => lower.includes(k))) {
      return sentence
    }
  }

  const long = sentences
    .filter(s => s.split(/\s+/).length >= 10)
    .sort((a, b) => b.length - a.length)[0]

  return long ?? null
}

// ── Hauptkomponente ─────────────────────────────────────────────────────────

export function VoiceSession({ sessionId, onEnd }: VoiceSessionProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [isKicoSpeaking, setIsKicoSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const [liveTranscript, setLiveTranscript] = useState('')
  const [history, setHistory] = useState<TranscriptEntry[]>([])
  const [keyPhrase, setKeyPhrase] = useState<string | null>(null)
  const [keyPhraseVisible, setKeyPhraseVisible] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)
  // Ref damit handleEnd nie eine veraltete history-Kopie übergibt
  const historyRef = useRef<TranscriptEntry[]>([])

  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [supabase])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, liveTranscript])

  // ── Verbindung aufbauen ─────────────────────────────────────────────────

  const connect = useCallback(async () => {
    setConnectionState('connecting')
    try {
      const tokenRes = await fetch('/api/voice/session', { method: 'POST' })
      if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`)
      const { ephemeral_key } = await tokenRes.json()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      // Mikrofon startet stummgeschaltet — Nutzer aktiviert per Knopfdruck
      stream.getAudioTracks().forEach(t => { t.enabled = false })
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
      }

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc
      dc.onmessage = handleDataChannelMessage

      dc.onopen = () => {
        // Push-to-Talk: VAD deaktiviert — Nutzer kontrolliert Aufnahme selbst
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: null,
            input_audio_transcription: { model: 'whisper-1', language: 'de' },
          },
        }))
        // KICO begrüßt zuerst
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
          Authorization: `Bearer ${ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })
      if (!sdpRes.ok) throw new Error('SDP exchange failed')

      await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() })
      setConnectionState('connected')

    } catch (err) {
      console.error('Voice connect error:', err)
      setConnectionState('error')
      cleanup()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── DataChannel Events ──────────────────────────────────────────────────

  const handleDataChannelMessage = useCallback(async (e: MessageEvent) => {
    try {
      const event = JSON.parse(e.data)
      console.log('[Voice DC]', event.type)

      if (event.type === 'response.audio.delta') setIsKicoSpeaking(true)
      if (event.type === 'response.audio.done')  setIsKicoSpeaking(false)

      // Live-Transkript (Deltas)
      if (event.type === 'conversation.item.input_audio_transcription.delta') {
        setLiveTranscript(prev => prev + (event.delta ?? ''))
      }

      // Abgeschlossenes User-Transkript
      if (event.type === 'conversation.item.input_audio_transcription.completed') {
        const text: string = event.transcript ?? ''
        if (text.trim()) {
          setLiveTranscript('')
          setHistory(h => {
            const next = [...h, { role: 'user' as const, text }]
            historyRef.current = next
            return next
          })
          const phrase = extractKeyPhrase(text)
          if (phrase) {
            setKeyPhrase(phrase)
            setKeyPhraseVisible(true)
          }
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId, user_id: userIdRef.current, role: 'user', content: text,
          })
          if (error) console.error('[Voice DB] User insert error:', error.message)
        }
      }

      // KICO Antwort
      if (event.type === 'response.audio_transcript.done') {
        const text: string = event.transcript ?? ''
        if (text.trim()) {
          setHistory(h => {
            const next = [...h, { role: 'kico' as const, text }]
            historyRef.current = next
            return next
          })
          setKeyPhraseVisible(false)
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId, user_id: userIdRef.current, role: 'assistant', content: text,
          })
          if (error) console.error('[Voice DB] KICO insert error:', error.message)
        }
      }

    } catch (err) {
      console.error('[Voice DC] Parse error:', err)
    }
  }, [sessionId, supabase])

  // ── Push-to-Talk ────────────────────────────────────────────────────────

  const startRecording = useCallback(() => {
    if (connectionState !== 'connected') return
    // KICO unterbrechen falls sie gerade spricht
    if (isKicoSpeaking) {
      dataChannelRef.current?.send(JSON.stringify({ type: 'response.cancel' }))
      setIsKicoSpeaking(false)
    }
    dataChannelRef.current?.send(JSON.stringify({ type: 'input_audio_buffer.clear' }))
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
    setLiveTranscript('')
    setIsRecording(true)
  }, [connectionState, isKicoSpeaking])

  const stopAndSend = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false })
    setIsRecording(false)
    dataChannelRef.current?.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
    dataChannelRef.current?.send(JSON.stringify({ type: 'response.create' }))
  }, [])

  const handleRecordButton = useCallback(() => {
    if (isRecording) stopAndSend()
    else startRecording()
  }, [isRecording, startRecording, stopAndSend])

  // ── Cleanup & Ende ──────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null
    dataChannelRef.current = null
    setIsKicoSpeaking(false)
    setIsRecording(false)
  }, [])

  const handleEnd = useCallback(() => {
    const snapshot = historyRef.current
    cleanup()
    onEnd(snapshot)
  }, [cleanup, onEnd])

  useEffect(() => {
    connect()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status-Text ─────────────────────────────────────────────────────────

  const statusText =
    connectionState === 'connecting' ? 'Verbinde…' :
    connectionState === 'error'      ? 'Verbindungsfehler — bitte neu laden' :
    isRecording                      ? 'Nochmal tippen zum Senden' :
    isKicoSpeaking                   ? 'Tippen zum Unterbrechen' :
                                       'Tippen zum Sprechen'

  // Button immer aktiv wenn verbunden — Tippen während KICO spricht = Unterbrechen
  const canRecord = connectionState === 'connected'

  return (
    <div className="flex flex-col md:flex-row h-full">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* ── Haupt-Spalte: Aufnahme-Button + Key Phrase + Hang-up ──── */}
      <div className="flex flex-col items-center md:flex-1 pt-12 pb-8 px-8 gap-8 md:justify-between">

        {/* Oberer Bereich: Status + Aufnahme-Button */}
        <div className="flex flex-col items-center gap-6">

          {/* Status */}
          <p className="caption text-muted/60">{statusText}</p>

          {/* Push-to-Talk Button */}
          <button
            onClick={handleRecordButton}
            disabled={!canRecord}
            aria-label={isRecording ? 'Aufnahme senden' : 'Aufnahme starten'}
            className={cn(
              'relative w-32 h-32 rounded-full flex items-center justify-center',
              'transition-all duration-300 cursor-pointer',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              // Idle / bereit
              !isRecording && canRecord && [
                'border-2 border-primary/30 bg-primary/5',
                'hover:border-primary hover:bg-primary/10 hover:scale-105',
                'active:scale-95',
              ],
              // Aufnahme läuft
              isRecording && 'border-2 border-signal-red bg-signal-red/10 scale-105',
              // KICO spricht / connecting
              (!canRecord && !isRecording) && 'border-2 border-border bg-surface/30',
            )}
          >
            {/* Pulsierender Ring während Aufnahme */}
            {isRecording && (
              <span className="absolute inset-0 rounded-full animate-ping bg-signal-red/20" />
            )}
            {/* Pulsierender Ring wenn KICO spricht */}
            {isKicoSpeaking && (
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/15" />
            )}

            {connectionState === 'connecting' && (
              <Loader2 size={28} className="text-muted animate-spin" />
            )}
            {connectionState === 'connected' && !isRecording && (
              <Mic size={28} className={cn(
                'transition-colors duration-300',
                isKicoSpeaking ? 'text-border' : 'text-primary'
              )} />
            )}
            {connectionState === 'connected' && isRecording && (
              <Square size={24} className="text-signal-red fill-signal-red" />
            )}
          </button>
        </div>

        {/* Key Phrase Spotlight */}
        <div className={cn(
          'text-center px-2 transition-all duration-700 overflow-hidden w-full max-w-sm',
          keyPhrase && keyPhraseVisible ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
        )}>
          {keyPhrase && (
            <blockquote className="heading-2 text-kico-text/70 italic leading-snug">
              „{keyPhrase}"
            </blockquote>
          )}
        </div>

        {/* Session beenden */}
        <button
          onClick={handleEnd}
          className="flex items-center gap-2 caption text-muted/40 hover:text-signal-red transition-colors cursor-pointer"
          aria-label="Voice-Session beenden"
        >
          <PhoneOff size={14} />
          Session beenden
        </button>
      </div>

      {/* ── Transkript-Panel (rechts / unten auf Mobile) ────────────── */}
      {connectionState === 'connected' && (
        <div className={cn(
          'border-t md:border-t-0 md:border-l border-border',
          'md:w-72 max-h-[35vh] md:max-h-full',
          'overflow-y-auto chat-scroll',
          'px-5 py-5 flex flex-col gap-0.5',
        )}>

          {history.length === 0 && !isRecording && (
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

          {/* Aufnahme läuft — Punkte statt falscher Live-Text-Versprechen */}
          {isRecording && (
            <div className="flex items-center gap-1 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:300ms]" />
            </div>
          )}

          {/* Delta-Transkript (falls OpenAI es liefert) */}
          {liveTranscript && !isRecording && (
            <p className="caption text-kico-text/30 leading-relaxed py-1">
              {liveTranscript}<span className="animate-pulse">▌</span>
            </p>
          )}

          <div ref={historyEndRef} />
        </div>
      )}
    </div>
  )
}
