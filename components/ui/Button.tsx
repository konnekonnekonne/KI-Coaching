import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   'bg-primary text-white border-primary hover:bg-primary-dark hover:border-primary-dark',
  secondary: 'bg-transparent text-primary border-primary hover:bg-primary/8',
  cta:       'bg-signal-orange text-white border-signal-orange hover:bg-signal-orange/90',
  ghost:     'bg-transparent text-muted border-transparent hover:text-kico-text hover:bg-border/40',
  danger:    'bg-signal-red-bg text-signal-red border-signal-red/40 hover:bg-signal-red/10',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:  'text-sm px-4 py-2 rounded-lg gap-1.5',
  md:  'text-sm px-5 py-2.5 rounded-lg gap-2',
  lg:  'text-base px-7 py-3 rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // Base
          'inline-flex items-center justify-center font-sans font-medium',
          'border-2 transition-all duration-150 cursor-pointer',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            Lädt…
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
