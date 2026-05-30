'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputBarProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="border-t border-[--border] bg-[--background] px-4 py-4">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'KICO antwortet…' : 'Deine Nachricht (Enter zum Senden)'}
          className={cn(
            'flex-1 resize-none rounded-2xl border border-[--border] bg-[--surface] px-4 py-3',
            'text-sm text-[--foreground] placeholder:text-[--muted]',
            'focus:outline-none focus:ring-2 focus:ring-[--accent]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[48px] max-h-[160px] overflow-y-auto'
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Senden"
          className={cn(
            'flex-shrink-0 w-11 h-11 rounded-full bg-[--accent] flex items-center justify-center',
            'text-white transition-colors hover:bg-[--accent-light]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <SendHorizontal size={18} />
        </button>
      </div>
      <p className="text-xs text-center text-[--muted] mt-2">
        KICO kann Fehler machen. Kein Ersatz für professionelle Beratung oder Psychotherapie.
      </p>
    </div>
  )
}
