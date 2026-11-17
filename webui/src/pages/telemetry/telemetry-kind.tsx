import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { DataTable } from '@/components/data-table'
import { TimeRangeBar } from '@/components/time-range-bar'
import { api } from '@/lib/api'
import { apiKindFromSlug, TELEMETRY_KINDS } from '@/lib/telemetry-kinds'
import { formatTimestamp, rangeForPreset, type TimeRangePreset } from '@/lib/time-ranges'

type Row = Awaited<ReturnType<typeof api.telemetry>>[number]
type Device = Awaited<ReturnType<typeof api.devices>>[number]

export function TelemetryKindPage() {
  const { kindSlug } = useParams()
  const apiKind = apiKindFromSlug(kindSlug)
  const kindMeta = TELEMETRY_KINDS.find((k) => k.slug === kindSlug)

  const [preset, setPreset] = useState<TimeRangePreset>('today')
  const [deviceId, setDeviceId] = useState('')
  const [devices, setDevices] = useState<Device[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => rangeForPreset(preset), [preset])

  useEffect(() => {
    api.devices().then(setDevices).catch(() => {})
  }, [])

  useEffect(() => {
    if (!apiKind) return
    api
      .telemetry({
        kind: apiKind,
        deviceId: deviceId || undefined,
        ...range,
        limit: 500,
      })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }, [apiKind, deviceId, range])

  if (!apiKind || !kindMeta) {
    return <Navigate to="/telemetry/gps" replace />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-medium">{kindMeta.label}</h2>
        <TimeRangeBar value={preset} onChange={setPreset} />
      </div>
      <select
        aria-label="Device"
        className="min-h-11 max-w-xs rounded-md border border-input bg-card px-3 text-sm"
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        empty="No samples in this period."
        columns={[
          { id: 'device', header: 'Phone', cell: (r) => r.deviceLabel },
          { id: 'when', header: 'Recorded', cell: (r) => formatTimestamp(r.recordedAt) },
          {
            id: 'payload',
            header: 'Payload',
            cell: (r) => (
              <pre className="max-w-xl overflow-x-auto font-mono text-xs text-muted-foreground">
                {JSON.stringify(r.payload)}
              </pre>
            ),
          },
        ]}
      />
      {rows.length >= 500 ? (
        <p className="text-xs text-muted-foreground">Showing newest 500 rows for this filter.</p>
      ) : null}
    </div>
  )
}