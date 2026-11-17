import type { TimeRangePreset } from '@/lib/time-ranges'
import { TIME_RANGE_LABELS, TIME_RANGE_PRESETS } from '@/lib/time-ranges'
import { cn } from '@/lib/utils'

type TimeRangeBarProps = {
  value: TimeRangePreset
  onChange: (preset: TimeRangePreset) => void
  className?: string
}

export function TimeRangeBar({ value, onChange, className }: TimeRangeBarProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)} role="group" aria-label="Time range">
      {TIME_RANGE_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={cn(
            'min-h-9 cursor-pointer rounded-md border px-3 text-sm transition-colors',
            value === preset
              ? 'border-primary/60 bg-primary/15 text-foreground'
              : 'border-border bg-card text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
          )}
        >
          {TIME_RANGE_LABELS[preset]}
        </button>
      ))}
    </div>
  )
}