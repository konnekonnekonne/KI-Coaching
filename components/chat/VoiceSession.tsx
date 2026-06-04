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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)

  const supabase = createClient()

  // Verbindung aufbauen
  const connect = useCallback(async () => {
    setConnectionState('connecting')

    try {
      // 1. Ephemeral key vom Server holen
      const tokenRes = await fetch('/api/voice/session', { method: 'POST' })
      if (!tokenRes.ok) throw new Error('Token fetch failed')
      const { ephemeral_key } = await tokenRes.json()

      // 2. Mikrofon anfordern
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream

      // 3. WebRTC PeerConnection aufbauen
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // Audio-Output (KICO spricht)
      const audio = new Audio()
      audio.autoplay = true
      audioRef.current = audio
      pc.ontrack = (e) => {
        audio.srcObject = e.streams[0]
        setSpeakerState('kico')
      }

      // Audio-Input (Coachee spricht)
      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // DataChannel für Events (Transkripte, Turn-Detection)
      const dc = pc.createDataChannel('oai-events')
      dataChannelRef.current = dc
      dc.onmessage = handleDataChannelMessage

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
        if (text?.trim()) {
          setTranscript(text)
          await supabase.from('messages').insert({
            session_id: sessionId,
            role: 'user',
            content: text,
          })
        }
      }

      if (event.type === 'response.audio_transcript.done') {
        const text = event.transcript
        if (text?.trim()) {
          await supabase.from('messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: text,
          })
        }
      }

    } catch { /* ignore parse errors */ }
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

      <p className="caption text-center text-muted">
        KICO ersetzt keine Psychotherapie.{' '}
        <a href="tel:08001110111" className="text-primary hover:underline">0800 111 0 111</a>
        {' '}bei Krisen (kostenlos, 24/7)
      </p>
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
