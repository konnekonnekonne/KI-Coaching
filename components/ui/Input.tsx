import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-sans text-sm font-medium text-kico-text"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full font-sans text-sm text-kico-text',
            'px-4 py-2.5 rounded-lg border border-border bg-surface',
            'placeholder:text-muted',
            'outline-none transition-colors duration-150',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            error && 'border-signal-red focus:border-signal-red focus:ring-signal-red/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />

        {hint && !error && (
          <p className="caption">{hint}</p>
        )}
        {error && (
          <p className="font-sans text-xs text-signal-red">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
