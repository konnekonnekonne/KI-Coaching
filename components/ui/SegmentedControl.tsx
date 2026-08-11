'use client'

import { cn } from '@/lib/utils'

// Ersetzt die frühere text-mit-Häkchen-Auswahl (PreferenceRow): Zustand war dort
// ausschließlich über Deckkraft codiert (text-muted/40), das fiel bei einem
// Live-Test durch (siehe docs/04_design-system.md). Segmented Control macht
// Auswahl über Fläche + Position sichtbar, nicht nur über Farbton.

interface SegmentedControlOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label?: string
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div>
      {label && <p className="label-text text-muted mb-1.5">{label}</p>}
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-lg border border-border-strong overflow-hidden"
      >
        {options.map((option, i) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'caption px-3.5 py-2 cursor-pointer transition-colors duration-150',
                i > 0 && 'border-l border-border-strong',
                active
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface text-kico-text hover:bg-primary/5'
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
