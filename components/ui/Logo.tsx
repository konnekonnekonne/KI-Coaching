import { cn } from '@/lib/utils'

interface LogoProps {
  /** Pixelgröße des Icons (quadratisch) */
  size?: number
  /** Farbvariante des Icons */
  variant?: 'green' | 'white' | 'black'
  /** Wordmark "kico" neben dem Icon anzeigen */
  showWordmark?: boolean
  /** Subline unter dem Wordmark anzeigen */
  subline?: string
  className?: string
}

const colors = {
  green: '#2D6A4F',
  white: '#FFFFFF',
  black: '#1B2E25',
}

const wordmarkColors = {
  green: 'text-primary',
  white: 'text-white',
  black: 'text-kico-text',
}

const sublineColors = {
  green: 'text-muted',
  white: 'text-white/50',
  black: 'text-muted',
}

export function Logo({
  size = 32,
  variant = 'green',
  showWordmark = true,
  subline,
  className,
}: LogoProps) {
  const c = colors[variant]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Icon — inline SVG damit Fraunces-Font nicht benötigt wird */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Stamm */}
        <line
          x1="20" y1="36" x2="20" y2="21"
          stroke={c} strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Linker Ast — etwas tiefer, kürzer */}
        <path
          d="M20 21 Q14 17 9 13"
          stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"
        />
        {/* Rechter Ast — etwas höher, weiter */}
        <path
          d="M20 21 Q26 15 31 8"
          stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"
        />
        {/* Endknoten links */}
        <circle cx="9"  cy="13" r="3.5" fill={c} />
        {/* Endknoten rechts */}
        <circle cx="31" cy="8"  r="3.5" fill={c} />
      </svg>

      {showWordmark && (
        <div>
          <span
            className={cn(
              'font-display font-semibold leading-none tracking-tight',
              wordmarkColors[variant]
            )}
            style={{ fontSize: size * 0.85 }}
          >
            kico
          </span>
          {subline && (
            <p
              className={cn('font-sans mt-0.5', sublineColors[variant])}
              style={{ fontSize: size * 0.32 }}
            >
              {subline}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
