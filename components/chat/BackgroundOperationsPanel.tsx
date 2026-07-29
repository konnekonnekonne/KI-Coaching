'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Ausklappbares Panel für Hintergrundprozesse (Transkript, Trigger-Wort-
// Monitoring, künftig Sentiment/Konsistenz/QN-Prüfung aus Task 6) -- primär
// zum Testen gedacht, aber bewusst für alle sichtbar, nicht versteckt:
// KICO ist ein Forschungsprototyp, kein kommerzielles Produkt. Transparenz
// über das, was im Hintergrund passiert, passt zum eigenen Forschungsziel
// ("was KI im Coaching nicht kann/tut", siehe Landingpage).

interface MessageRow {
  id: string
  role: 'user' | 'assistant'
  content: string
  risk_level: string | null
  risk_terms: string[] | null
  sentiment_valence: number | null
  consistency_note: string | null
  qn_flags: Record<string, unknown> | null
  created_at: string
}

const RISK_COLORS: Record<string, string> = {
  keine: 'text-muted/40',
  niedrig: 'text-signal-amber',
  mittel: 'text-signal-orange',
  hoch: 'text-signal-red',
  akut: 'text-signal-red font-medium',
}

export function BackgroundOperationsPanel({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<MessageRow[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    let active = true

    supabase
      .from('messages')
      .select('id, role, content, risk_level, risk_terms, sentiment_valence, consistency_note, qn_flags, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (active && data) setRows(data as MessageRow[])
      })

    const channel = supabase
      .channel(`messages_debug:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as MessageRow
          if (!row?.id) return
          setRows((prev) => {
            const withoutRow = prev.filter((r) => r.id !== row.id)
            return [...withoutRow, row].sort((a, b) => a.created_at.localeCompare(b.created_at))
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, open])

  return (
    <div className="flex-shrink-0 border-t border-border/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-2 caption text-muted/40 hover:text-muted transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Activity size={12} />
          Hintergrundprozesse (Transkript, Trigger-Wort-Monitoring)
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <div className="max-h-64 overflow-y-auto chat-scroll px-6 pb-4 space-y-2">
          {rows.length === 0 && (
            <p className="caption text-muted/35 italic">Noch keine Daten für diese Session.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="text-xs font-mono border-l-2 border-border/50 pl-2.5 py-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted/50">{row.role}</span>
                {row.risk_level && row.risk_level !== 'keine' && (
                  <span className={cn(RISK_COLORS[row.risk_level])}>
                    risk: {row.risk_level}
                    {row.risk_terms?.length ? ` (${row.risk_terms.join(', ')})` : ''}
                  </span>
                )}
                {row.sentiment_valence !== null && (
                  <span className="text-muted/50">sentiment: {row.sentiment_valence}</span>
                )}
                {row.consistency_note && (
                  <span className="text-muted/50">konsistenz: {row.consistency_note}</span>
                )}
                {row.qn_flags && (
                  <span className="text-muted/50">qn: {JSON.stringify(row.qn_flags)}</span>
                )}
              </div>
              <p className="text-kico-text/70 truncate">{row.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
