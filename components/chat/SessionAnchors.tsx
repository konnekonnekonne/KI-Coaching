'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Persistente Anker (B-23, docs/backlog.md): Coachingfrage, Skalierungswerte,
// Tool-Artefakte -- bleiben unabhängig vom Modus (Text/Voice) sichtbar.
// KICO setzt sie über das set_anchor-Tool (lib/anchors.ts); diese Komponente
// zeigt sie nur an, live per Supabase Realtime.

interface Anchor {
  key: string
  label: string
  kind: 'text' | 'number' | 'list' | 'checkbox'
  value: unknown
}

function formatValue(anchor: Anchor): string {
  if (anchor.kind === 'checkbox') return anchor.value ? '✓' : '—'
  if (anchor.kind === 'list' && Array.isArray(anchor.value)) return anchor.value.join(', ')
  return String(anchor.value)
}

export function SessionAnchors({ sessionId }: { sessionId: string }) {
  const [anchors, setAnchors] = useState<Anchor[]>([])
  const supabase = createClient()

  useEffect(() => {
    let active = true

    supabase
      .from('session_anchors')
      .select('key, label, kind, value')
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
            return [...next, { key: row.key!, label: row.label, kind: row.kind, value: row.value }]
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

  if (anchors.length === 0) return null

  return (
    <div className="flex-shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6 py-2.5 border-b border-border/40 bg-surface/40">
      {anchors.map((anchor) => (
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
  )
}
