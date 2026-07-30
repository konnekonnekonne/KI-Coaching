'use client'

import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Persistente Anker (B-23, docs/backlog.md): Coachingfrage, Skalierungswerte,
// Tool-Artefakte -- bleiben unabhängig vom Modus (Text/Voice) sichtbar.
// KICO setzt sie über set_anchor (fertiger Wert) oder request_anchor_input
// (offene Karte, die der COACHEE selbst füllt -- Erweiterung 29./30. Juli
// 2026, siehe docs/backlog.md B-23 und lib/anchors.ts). Diese Komponente
// zeigt gesetzte Anker nur an; offene Karten rendert sie als Eingabefeld und
// schreibt die Coachee-Antwort direkt zurück nach Supabase (RLS erlaubt das,
// da auth.uid() = user_id auf der Zeile steht).

interface Anchor {
  id: string
  key: string
  label: string
  kind: 'text' | 'number' | 'list' | 'checkbox'
  value: unknown
  prompt: string | null
  awaiting_input: boolean
}

function formatValue(anchor: Anchor): string {
  if (anchor.kind === 'checkbox') return anchor.value ? '✓' : '—'
  if (anchor.kind === 'list' && Array.isArray(anchor.value)) return anchor.value.join(', ')
  return String(anchor.value)
}

function isOpenCard(anchor: Anchor): boolean {
  return anchor.awaiting_input && (anchor.value === null || anchor.value === undefined)
}

interface SessionAnchorsProps {
  sessionId: string
  // Nur im Textmodus belegt (siehe SessionShell) -- lässt die Coachee-Antwort
  // zusätzlich als normale Nachricht bei Claude ankommen, statt nur als
  // stiller DB-Wert zu existieren. Im Voice-Modus bewusst ohne Live-Rück-
  // kopplung in den laufenden Pipecat-Kontext (dokumentierte Lücke, siehe
  // docs/backlog.md B-23) -- die Karte persistiert dort trotzdem korrekt.
  onAnchorFilled?: (text: string) => void
}

export function SessionAnchors({ sessionId, onAnchorFilled }: SessionAnchorsProps) {
  const [anchors, setAnchors] = useState<Anchor[]>([])
  const supabase = createClient()

  useEffect(() => {
    let active = true

    supabase
      .from('session_anchors')
      .select('id, key, label, kind, value, prompt, awaiting_input')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active && data) setAnchors(data as Anchor[])
      })

    const channel = supabase
      .channel(`session_anchors:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_anchors', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as Anchor & { key?: string }
          if (!row?.key) return
          setAnchors((prev) => {
            const next = prev.filter((a) => a.key !== row.key)
            return [...next, row as Anchor]
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  async function submitCard(anchor: Anchor, text: string): Promise<boolean> {
    const trimmed = text.trim()
    if (!trimmed) return false
    const { error } = await supabase
      .from('session_anchors')
      .update({ value: trimmed, awaiting_input: false, updated_at: new Date().toISOString() })
      .eq('id', anchor.id)
    if (error) return false
    // Nicht auf das Realtime-Echo warten -- sofort lokal umschalten, damit
    // die Karte ohne Rundlaufverzögerung durch die feste Anzeige ersetzt wird.
    setAnchors((prev) =>
      prev.map((a) => (a.id === anchor.id ? { ...a, value: trimmed, awaiting_input: false } : a))
    )
    onAnchorFilled?.(trimmed)
    return true
  }

  if (anchors.length === 0) return null

  const openCards = anchors.filter(isOpenCard)
  const setAnchorsList = anchors.filter((a) => !isOpenCard(a))

  return (
    <div className="flex-shrink-0 flex flex-col border-b border-border/40 bg-surface/40">
      {openCards.map((anchor) => (
        <OpenAnchorCard key={anchor.key} anchor={anchor} onSubmit={(text) => submitCard(anchor, text)} />
      ))}
      {setAnchorsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6 py-2.5">
          {setAnchorsList.map((anchor) => (
            <div key={anchor.key} className="flex items-baseline gap-1.5">
              <span className="label-text text-muted/60">{anchor.label}:</span>
              <span
                className={cn(
                  'caption text-kico-text',
                  anchor.key === 'coaching_question' && 'italic'
                )}
              >
                {formatValue(anchor)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OpenAnchorCard({
  anchor,
  onSubmit,
}: {
  anchor: Anchor
  onSubmit: (text: string) => Promise<boolean>
}) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    const ok = await onSubmit(trimmed)
    // Bei Erfolg tauscht der Parent-State die Karte gegen die feste Anzeige
    // aus (Unmount). Bei Fehler zurücksetzen, damit erneut versucht werden kann.
    if (!ok) setSubmitting(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="px-6 py-3 border-b border-border/30 bg-primary/5">
      <p className="label-text text-primary/80 mb-1.5">{anchor.label}</p>
      {anchor.prompt && <p className="caption text-muted mb-2">{anchor.prompt}</p>}
      <div className="flex items-end gap-2 max-w-xl">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitting}
          rows={1}
          placeholder="Schreib es hier auf… (Enter zum Festhalten)"
          className={cn(
            'flex-1 resize-none bg-surface border border-border rounded-xl px-3 py-2',
            'font-sans text-sm text-kico-text placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[38px] max-h-[120px] overflow-y-auto transition-colors'
          )}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !value.trim()}
          aria-label="Festhalten"
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl bg-primary',
            'flex items-center justify-center text-white',
            'hover:bg-primary-dark transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Check size={15} />
        </button>
      </div>
    </div>
  )
}
