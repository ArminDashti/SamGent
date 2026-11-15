import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

type Row = Awaited<ReturnType<typeof api.telemetry>>[number]
type Device = Awaited<ReturnType<typeof api.devices>>[number]

const KINDS = [
  '',
  'gps',
  'network_signal',
  'network_type',
  'battery',
  'wifi',
  'public_ip',
]

export function TelemetryPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [kind, setKind] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  function load(nextDeviceId = deviceId, nextKind = kind) {
    api
      .telemetry({
        deviceId: nextDeviceId || undefined,
        kind: nextKind || undefined,
      })
      .then(setRows)
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

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">Telemetry</h1>
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
              {k || 'All kinds'}
            </option>
          ))}
        </select>
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Samples</CardTitle>
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
