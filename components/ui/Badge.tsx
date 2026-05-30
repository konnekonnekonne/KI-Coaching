import { cn } from '@/lib/utils'

type BadgeVariant = 'amber' | 'orange' | 'red' | 'green' | 'neutral'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  amber:   'bg-signal-amber-bg text-signal-amber',
  orange:  'bg-signal-orange-bg text-signal-orange',
  red:     'bg-signal-red-bg text-signal-red',
  green:   'bg-signal-green-bg text-signal-green',
  neutral: 'bg-border text-muted',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md',
        'font-sans text-xs font-semibold',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
