import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { TimeRangeBar } from '@/components/time-range-bar'
import { api } from '@/lib/api'
import { TELEMETRY_KINDS } from '@/lib/telemetry-kinds'
import { type TimeRangePreset, rangeForPreset } from '@/lib/time-ranges'

type Summary = Awaited<ReturnType<typeof api.summary>>

export function DashboardPage() {
  const [preset, setPreset] = useState<TimeRangePreset>('this_week')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [deviceCount, setDeviceCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => rangeForPreset(preset), [preset])

  useEffect(() => {
    Promise.all([api.summary(range), api.devices()])
      .then(([s, devices]) => {
        setSummary(s)
        setDeviceCount(devices.length)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }, [range])

  const telemetryTotal = summary
    ? Object.values(summary.telemetry).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Activity across enrolled phones for the selected period."
        actions={<TimeRangeBar value={preset} onChange={setPreset} />}
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Devices" value={deviceCount} to="/devices" />
        <StatCard label="SMS rows" value={summary?.sms ?? '—'} to="/sms" />
        <StatCard label="Call rows" value={summary?.calls ?? '—'} to="/calls" />
        <StatCard label="Telemetry rows" value={telemetryTotal || '—'} to="/telemetry/gps" />
      </div>
      {summary ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Telemetry by channel</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {TELEMETRY_KINDS.map((k) => (
              <Link
                key={k.slug}
                to={`/telemetry/${k.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm hover:border-primary/40"
              >
                <span className="text-foreground">{k.label}</span>
                <span className="ml-2 font-mono text-muted-foreground">
                  {(summary.telemetry[k.apiKind] ?? 0).toLocaleString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function StatCard({ label, value, to }: { label: string; value: number | string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-border bg-card px-4 py-5 transition-colors hover:border-primary/40"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium text-foreground">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </Link>
  )
}