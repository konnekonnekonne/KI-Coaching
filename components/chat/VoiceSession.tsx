'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square, PhoneOff, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

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

export function VoiceSession({ sessionId, priorMessages, onEnd }: VoiceSessionProps) {
  const router = useRouter()
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [isKicoSpeaking, setIsKicoSpeaking] = useState(false)
  const [isMicOpen, setIsMicOpen] = useState(false)       // Mic-Track aktiv
  const [isRecording, setIsRecording] = useState(false)   // VAD erkennt Sprache
  const [isTranscribing, setIsTranscribing] = useState(false) // Whisper läuft
  const [history, setHistory] = useState<TranscriptEntry[]>([])
  const [keyPhrase, setKeyPhrase] = useState<string | null>(null)
  const [keyPhraseVisible, setKeyPhraseVisible] = useState(false)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<TranscriptEntry[]>([])
  // Verhindert Stale-Closure: DataChannel verwendet immer den aktuellen Handler
  const messageHandlerRef = useRef<((e: MessageEvent) => void) | null>(null)

  // MediaRecorder: User-Audio für Whisper-Transkription abgreifen
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)
  // Deduplizierung: verhindert Doppeleinträge bei mehrfach feuernden Events
  const processedItemIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [supabase])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, isTranscribing])

  // ── DataChannel Handler ─────────────────────────────────────────────────

  const handleDataChannelMessage = useCallback(async (e: MessageEvent) => {
    try {
      const event = JSON.parse(e.data)

      // Speaking-State: steuert Mic-Button-Animation
      if (event.type === 'response.output_audio.delta' ||
          event.type === 'response.audio.delta') {
        setIsKicoSpeaking(true)
      }
      if (event.type === 'response.output_audio.done' ||
          event.type === 'response.audio.done') {
        setIsKicoSpeaking(false)
      }

      // VAD: User-Sprache erkannt — MediaRecorder starten
      if (event.type === 'input_audio_buffer.speech_started') {
        setIsRecording(true)
        const stream = localStreamRef.current
        if (stream && !mediaRecorderRef.current) {
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : ''
          const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
          audioChunksRef.current = []
          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) audioChunksRef.current.push(ev.data)
          }
          recorder.start()
          mediaRecorderRef.current = recorder
        }
      }

      // VAD: Sprache beendet — Aufnahme stoppen, Whisper aufrufen
      if (event.type === 'input_audio_buffer.speech_stopped') {
        setIsRecording(false)

        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop()
          recorder.onstop = async () => {
            mediaRecorderRef.current = null
            const chunks = audioChunksRef.current
            audioChunksRef.current = []

            const blob = new Blob(chunks, { type: chunks[0]?.type ?? 'audio/webm' })
            if (blob.size < 1000) return // zu kurz / Stille

            setIsTranscribing(true)
            try {
              const fd = new FormData()
              fd.append('audio', blob, 'audio.webm')
              const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
              if (res.ok) {
                const { text } = await res.json()
                const trimmed = (text ?? '').trim()
                if (trimmed) {
                  setHistory(h => {
                    const next = [...h, { role: 'user' as const, text: trimmed }]
                    historyRef.current = next
                    return next
                  })
                  const phrase = extractKeyPhrase(trimmed)
                  if (phrase) { setKeyPhrase(phrase); setKeyPhraseVisible(true) }
                  const { error } = await supabase.from('messages').insert({
                    session_id: sessionId,
                    user_id: userIdRef.current,
                    role: 'user',
                    content: trimmed,
                  })
                  if (error) console.error('[Voice DB] User insert error:', error.message)
                }
              } else {
                console.error('[Voice Whisper] HTTP', res.status)
              }
            } catch (err) {
              console.error('[Voice Whisper] Fetch error:', err)
            } finally {
              setIsTranscribing(false)
            }
          }
        }
      }

      // KICO-Transkript: via response.output_audio_transcript.done (bestätigtes Event)
      // item_id-Dedup verhindert Doppeleinträge
      if (
        event.type === 'response.output_audio_transcript.done' ||
        event.type === 'response.audio_transcript.done'
      ) {
        const text: string = event.transcript ?? ''
        const itemId: string = event.item_id ?? ''
        if (text.trim() && (!itemId || !processedItemIds.current.has(itemId))) {
          if (itemId) processedItemIds.current.add(itemId)
          setHistory(h => {
            const next = [...h, { role: 'kico' as const, text: text.trim() }]
            historyRef.current = next
            return next
          })
          setKeyPhraseVisible(false)
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userIdRef.current,
            role: 'assistant',
            content: text.trim(),
          })
          if (error) console.error('[Voice DB] KICO insert error:', error.message)
        }
      }

    } catch (err) {
      console.error('[Voice DC] Parse error:', err)
    }
  }, [sessionId, supabase])

  // Ref immer aktuell halten
  useEffect(() => {
    messageHandlerRef.current = handleDataChannelMessage
  }, [handleDataChannelMessage])

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
      dc.onmessage = (e) => messageHandlerRef.current?.(e)

      dc.onopen = () => {
        if (priorMessages && priorMessages.length > 0) {
          const context = priorMessages.slice(-20)
          for (const msg of context) {
            dc.send(JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: msg.role,
                content: [{ type: msg.role === 'assistant' ? 'text' : 'input_text', text: msg.content }],
              },
            }))
          }
          dc.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: 'Wir wechseln jetzt von Schrift zu Sprache. Bitte führe das Gespräch nahtlos fort.' }],
            },
          }))
        } else {
          dc.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: 'Bitte eröffne das Gespräch.' }],
            },
          }))
        }
        dc.send(JSON.stringify({ type: 'response.create' }))
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ephemeral_key}`, 'Content-Type': 'application/sdp' },
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

  // ── Mic Toggle ──────────────────────────────────────────────────────────
  // VAD übernimmt Commit + Response-Trigger — wir schalten nur den Mic-Track.

  const handleRecordButton = useCallback(() => {
    if (connectionState !== 'connected') return
    if (!isMicOpen) {
      if (isKicoSpeaking) {
        dataChannelRef.current?.send(JSON.stringify({ type: 'response.cancel' }))
        setIsKicoSpeaking(false)
      }
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = true })
      setIsMicOpen(true)
    } else {
      localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false })
      setIsMicOpen(false)
    }
  }, [connectionState, isMicOpen, isKicoSpeaking])

  // ── Cleanup & Ende ──────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null
    dataChannelRef.current = null
    setIsKicoSpeaking(false)
    setIsMicOpen(false)
    setIsRecording(false)
  }, [])

  const handleSwitchToText = useCallback(() => {
    const snapshot = historyRef.current
    cleanup()
    onEnd(snapshot)
  }, [cleanup, onEnd])

  const handleEndSession = useCallback(() => {
    cleanup()
    router.push('/session')
  }, [cleanup, router])

  useEffect(() => {
    connect()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statusText =
    connectionState === 'connecting' ? 'Verbinde…' :
    connectionState === 'error'      ? 'Verbindungsfehler — bitte neu laden' :
    isKicoSpeaking                   ? 'Tippen zum Unterbrechen' :
    isRecording                      ? 'Spreche…' :
    isMicOpen                        ? 'Mic offen — sprich jetzt' :
                                       'Tippen zum Sprechen'

  const canRecord = connectionState === 'connected'

  return (
    <div className="flex flex-col md:flex-row h-full">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* ── Haupt-Spalte ──────────────────────────────────────────────── */}
      <div className="flex flex-col items-center md:flex-1 pt-12 pb-8 px-8 gap-8 md:justify-between">

        {/* Status + Aufnahme-Button */}
        <div className="flex flex-col items-center gap-6">
          <p className="caption text-muted/60">{statusText}</p>

          <button
            onClick={handleRecordButton}
            disabled={!canRecord}
            aria-label={isMicOpen ? 'Mic schließen' : 'Mic öffnen'}
            className={cn(
              'relative w-32 h-32 rounded-full flex items-center justify-center',
              'transition-all duration-300 cursor-pointer',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              !isMicOpen && canRecord && [
                'border-2 border-primary/30 bg-primary/5',
                'hover:border-primary hover:bg-primary/10 hover:scale-105',
                'active:scale-95',
              ],
              isMicOpen && !isRecording && 'border-2 border-primary/60 bg-primary/10 scale-105',
              isRecording && 'border-2 border-signal-red bg-signal-red/10 scale-105',
              (!canRecord && !isMicOpen) && 'border-2 border-border bg-surface/30',
            )}
          >
            {isRecording && <span className="absolute inset-0 rounded-full animate-ping bg-signal-red/20" />}
            {isKicoSpeaking && <span className="absolute inset-0 rounded-full animate-ping bg-primary/15" />}
            {connectionState === 'connecting' && <Loader2 size={28} className="text-muted animate-spin" />}
            {connectionState === 'connected' && !isRecording && (
              <Mic size={28} className={cn(
                'transition-colors duration-300',
                isMicOpen ? 'text-primary' : 'text-primary'
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
          {history.length === 0 && !isRecording && !isTranscribing && (
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
          {/* VAD erkennt Sprache */}
          {isRecording && (
            <div className="flex items-center gap-1 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-signal-red/70 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
          {/* Whisper transkribiert */}
          {isTranscribing && !isRecording && (
            <p className="caption text-muted/30 py-1 animate-pulse">…</p>
          )}
          <div ref={historyEndRef} />
        </div>
      )}
    </div>
  )
}
