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

export function VoiceSession({ sessionId, onEnd }: VoiceSessionProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [speakerState, setSpeakerState] = useState<SpeakerState>('silent')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<string>('')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)

  const supabase = createClient()
  const userIdRef = useRef<string | null>(null)

  // User-ID beim Mount laden
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null
    })
  }, [supabase])

  // Verbindung aufbauen
  const connect = useCallback(async () => {
    setConnectionState('connecting')

    try {
      // 1. Ephemeral key vom Server holen
      const tokenRes = await fetch('/api/voice/session', { method: 'POST' })
      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        console.error('Token fetch failed:', tokenRes.status, errText)
        throw new Error(`Token fetch failed: ${tokenRes.status} ${errText}`)
      }
      const { ephemeral_key } = await tokenRes.json()

      // 2. Mikrofon anfordern — echoCancellation verhindert Rückkoppelung
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      localStreamRef.current = stream

      // 3. WebRTC PeerConnection aufbauen
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Audio-Output — nur beim ersten Track setzen, nicht bei jedem Event
      let audioSet = false
      pc.ontrack = (e) => {
        if (!audioSet && audioRef.current) {
          audioRef.current.srcObject = e.streams[0]
          audioRef.current.play().catch(console.error)
          audioSet = true
        }
        setSpeakerState('kico')
      }

      // Audio-Input (Coachee spricht)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // DataChannel für Events (Transkripte, Turn-Detection)
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc
      dc.onmessage = handleDataChannelMessage

      // Nach Verbindungsaufbau: VAD konfigurieren + KICO Begrüßung triggern
      dc.onopen = () => {
        // Semantic VAD konfigurieren
        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            turn_detection: {
              type: 'semantic_vad',
              silence_duration_ms: 1800, // mehr Toleranz für Denkpausen
              threshold: 0.8,            // weniger sensibel bei Hintergrundgeräuschen
            },
            input_audio_transcription: {
              model: 'whisper-1',
              language: 'de',
            },
          },
        }))

        // KICO spricht zuerst — Begrüßung triggern
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

      // 4. SDP Offer erstellen
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 5. SDP an OpenAI senden (mit ephemeral key)
      const sdpRes = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ephemeral_key}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      })

      if (!sdpRes.ok) throw new Error('SDP exchange failed')

      // 6. Answer von OpenAI setzen
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
  }, [])

  // DataChannel Events verarbeiten
  const handleDataChannelMessage = useCallback(async (e: MessageEvent) => {
    try {
      const event = JSON.parse(e.data)

      // Alle Events loggen für Debugging
      console.log('[Voice DC]', event.type)

      // Sprecherstatus tracken
      if (event.type === 'input_audio_buffer.speech_started') {
        setSpeakerState('user')
      } else if (event.type === 'input_audio_buffer.speech_stopped') {
        setSpeakerState('silent')
      } else if (event.type === 'response.audio.delta') {
        setSpeakerState('kico')
      } else if (event.type === 'response.audio.done') {
        setSpeakerState('silent')
      }

      // Transkripte speichern
      if (event.type === 'conversation.item.input_audio_transcription.completed') {
        const text = event.transcript
        console.log('[Voice DC] User transcript:', text, '| user_id:', userIdRef.current)
        if (text?.trim()) {
          setTranscript(text)
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userIdRef.current,
            role: 'user',
            content: text,
          })
          if (error) console.error('[Voice DB] User insert error:', error.message, error.code)
          else console.log('[Voice DB] User message saved ✓')
        }
      }

      if (event.type === 'response.audio_transcript.done') {
        const text = event.transcript
        console.log('[Voice DC] KICO transcript:', text, '| user_id:', userIdRef.current)
        if (text?.trim()) {
          const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userIdRef.current,
            role: 'assistant',
            content: text,
          })
          if (error) console.error('[Voice DB] KICO insert error:', error.message, error.code)
          else console.log('[Voice DB] KICO message saved ✓')
        }
      }

    } catch (err) {
      console.error('[Voice DC] Parse error:', err)
    }
  }, [sessionId, supabase])

  // Cleanup
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current = null
    dataChannelRef.current = null
    setSpeakerState('silent')
  }, [])

  // Session beenden
  const handleEnd = useCallback(() => {
    cleanup()
    onEnd()
  }, [cleanup, onEnd])

  // Mute togglen
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => {
      t.enabled = isMuted
    })
    setIsMuted(m => !m)
  }, [isMuted])

  // Auto-connect beim Mount
  useEffect(() => {
    connect()
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10 px-6">
      {/* Verstecktes Audio-Element — nötig für Browser-Autoplay */}
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Status-Visualisierung */}
      <div className="flex flex-col items-center gap-4">
        <VoiceOrb state={connectionState} speaker={speakerState} />
        <p className="caption text-muted">
          {connectionState === 'connecting' && 'Verbinde…'}
          {connectionState === 'connected' && speakerState === 'user' && 'Du sprichst…'}
          {connectionState === 'connected' && speakerState === 'kico' && 'KICO spricht…'}
          {connectionState === 'connected' && speakerState === 'silent' && 'Hör zu oder sprich…'}
          {connectionState === 'error' && 'Verbindungsfehler — bitte neu laden'}
        </p>
      </div>

      {/* Letztes Transkript (dezent) */}
      {transcript && connectionState === 'connected' && (
        <p className="text-sm text-muted italic text-center max-w-xs leading-relaxed">
          „{transcript}"
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">

        {/* Mute */}
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

        {/* Session beenden */}
        <button
          onClick={handleEnd}
          className="w-14 h-14 rounded-full bg-signal-red flex items-center justify-center text-white hover:opacity-90 transition-opacity"
          aria-label="Voice-Session beenden"
        >
          <PhoneOff size={20} />
        </button>

      </div>

    </div>
  )
}

// Animierter Orb — zeigt Verbindungsstatus und Sprecher
function VoiceOrb({ state, speaker }: { state: ConnectionState; speaker: SpeakerState }) {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">

      {/* Äußerer Ring — pulsiert wenn KICO spricht */}
      <div className={cn(
        'absolute inset-0 rounded-full transition-all duration-300',
        speaker === 'kico' && 'animate-ping bg-primary/20',
      )} />

      {/* Innerer Kreis */}
      <div className={cn(
        'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
        state === 'connecting' && 'bg-surface border-2 border-border',
        state === 'connected' && speaker === 'user' && 'bg-accent/20 border-2 border-accent',
        state === 'connected' && speaker === 'kico' && 'bg-primary border-2 border-primary',
        state === 'connected' && speaker === 'silent' && 'bg-surface border-2 border-border',
        state === 'error' && 'bg-signal-red/10 border-2 border-signal-red',
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
