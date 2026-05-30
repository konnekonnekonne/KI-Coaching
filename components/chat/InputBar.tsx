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
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
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
    <div className="flex-shrink-0 border-t border-border bg-bg px-4 py-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'KICO antwortet…' : 'Schreib etwas… (Enter zum Senden)'}
          className={cn(
            'flex-1 resize-none bg-surface border border-border rounded-xl px-4 py-2.5',
            'font-sans text-sm text-kico-text placeholder:text-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[44px] max-h-[160px] overflow-y-auto transition-colors'
          )}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          aria-label="Senden"
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl bg-primary',
            'flex items-center justify-center text-white',
            'hover:bg-primary-dark transition-colors',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <SendHorizontal size={16} />
        </button>
      </div>
      <p className="caption text-center mt-2">
        KICO ersetzt keine Psychotherapie.{' '}
        <a href="tel:08001110111" className="text-primary hover:underline">0800 111 0 111</a>
        {' '}bei Krisen (kostenlos, 24/7)
      </p>
    </div>
  )
}
