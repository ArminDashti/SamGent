export type TimeRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'

export const TIME_RANGE_LABELS: Record<TimeRangePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_week: 'Last week',
  this_month: 'This month',
  last_month: 'Last month',
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  'today',
  'yesterday',
  'this_week',
  'last_week',
  'this_month',
  'last_month',
]

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d)
  n.setUTCDate(n.getUTCDate() + days)
  return n
}

function startOfWeekUtc(d: Date): Date {
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDayUtc(addDays(d, diff))
}

function startOfMonthUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function rangeForPreset(preset: TimeRangePreset, now = new Date()): { from: string; to: string } {
  const todayStart = startOfDayUtc(now)
  const tomorrowStart = addDays(todayStart, 1)

  switch (preset) {
    case 'today':
      return { from: todayStart.toISOString(), to: tomorrowStart.toISOString() }
    case 'yesterday': {
      const yStart = addDays(todayStart, -1)
      return { from: yStart.toISOString(), to: todayStart.toISOString() }
    }
    case 'this_week': {
      const weekStart = startOfWeekUtc(now)
      const nextWeek = addDays(weekStart, 7)
      return { from: weekStart.toISOString(), to: nextWeek.toISOString() }
    }
    case 'last_week': {
      const thisWeekStart = startOfWeekUtc(now)
      const lastWeekStart = addDays(thisWeekStart, -7)
      return { from: lastWeekStart.toISOString(), to: thisWeekStart.toISOString() }
    }
    case 'this_month': {
      const monthStart = startOfMonthUtc(now)
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
      return { from: monthStart.toISOString(), to: nextMonth.toISOString() }
    }
    case 'last_month': {
      const thisMonthStart = startOfMonthUtc(now)
      const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
      return { from: lastMonthStart.toISOString(), to: thisMonthStart.toISOString() }
    }
    default:
      return { from: todayStart.toISOString(), to: tomorrowStart.toISOString() }
  }
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}