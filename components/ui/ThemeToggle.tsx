'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('kico-theme', next ? 'dark' : 'light')
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2 caption text-muted select-none">
      <span>Ich mag&apos;s lieber</span>
      <button
        onClick={toggle}
        role="switch"
        aria-checked={dark}
        aria-label="Hell/Dunkel umschalten"
        className={cn(
          'relative inline-flex items-center rounded-full border transition-colors duration-200',
          'h-6 w-[84px] px-1',
          dark
            ? 'bg-surface border-border'
            : 'bg-surface border-border'
        )}
      >
        {/* Gleitende Pille */}
        <span
          className={cn(
            'absolute top-0.5 h-5 rounded-full transition-all duration-200 flex items-center justify-center',
            'text-[11px] font-medium leading-none',
            dark
              ? 'right-0.5 left-auto bg-primary w-[46px]'
              : 'left-0.5 right-auto bg-primary w-[36px]'
          )}
          style={{ color: 'var(--on-primary)' }}
        >
          {dark ? 'dunkel' : 'hell'}
        </span>
        {/* Inaktiver Text */}
        <span
          className={cn(
            'absolute text-[11px] font-medium leading-none text-muted transition-opacity',
            dark ? 'left-2' : 'right-1.5'
          )}
        >
          {dark ? 'hell' : 'dunkel'}
        </span>
      </button>
    </div>
  )
}
