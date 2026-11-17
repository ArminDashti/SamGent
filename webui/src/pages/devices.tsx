import { useEffect, useState } from 'react'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { INTERVAL_FIELDS, api, type DeviceIntervals } from '@/lib/api'
import { formatTimestamp } from '@/lib/time-ranges'

type Device = Awaited<ReturnType<typeof api.devices>>[number]

export function DevicesPage() {
  const [rows, setRows] = useState<Device[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [intervals, setIntervals] = useState<DeviceIntervals | null>(null)
  const [issuedKey, setIssuedKey] = useState<string | null>(null)

  async function reload() {
    const list = await api.devices()
    setRows(list)
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }, [])

  async function onRotate(id: number) {
    setBusy(true)
    setError(null)
    try {
      const res = await api.rotateDevice(id)
      setIssuedKey(res.apiKey)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'rotate_failed')
    } finally {
      setBusy(false)
    }
  }

  async function openIntervals(id: number) {
    setBusy(true)
    setError(null)
    try {
      const cfg = await api.getIntervals(id)
      setEditId(id)
      setIntervals(cfg)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'intervals_failed')
    } finally {
      setBusy(false)
    }
  }

  async function saveIntervals(e: React.FormEvent) {
    e.preventDefault()
    if (editId == null || !intervals) return
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, number | string> = { updatedAt: intervals.updatedAt }
      for (const f of INTERVAL_FIELDS) {
        body[f.key] = intervals[f.key]
      }
      const saved = await api.putIntervals(editId, body)
      setIntervals(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save_intervals_failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Devices" description="Enrolled phones and last sync from the field." />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {issuedKey ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Rotated API key — copy now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="break-all rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
              {issuedKey}
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={() => navigator.clipboard.writeText(issuedKey)}>
                Copy API key
              </Button>
              <Button type="button" variant="outline" onClick={() => setIssuedKey(null)}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        rows={rows}
        rowKey={(d) => d.id}
        empty="No devices yet. Create one under Settings, then paste the API key into the Android app."
        columns={[
          { id: 'phone', header: 'Phone', cell: (d) => d.label },
          { id: 'os', header: 'OS', cell: (d) => d.osVersion ?? '—' },
          {
            id: 'last',
            header: 'Last update',
            cell: (d) => formatTimestamp(d.lastSeenAt),
          },
          {
            id: 'id',
            header: 'ID',
            cell: (d) => (
              <span className="font-mono text-xs" title={d.deviceUid}>
                {d.id}
              </span>
            ),
          },
          {
            id: 'actions',
            header: '',
            className: 'text-right',
            cell: (d) => (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-8 px-2 text-xs"
                  disabled={busy}
                  onClick={() => openIntervals(d.id)}
                >
                  Intervals
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-8 px-2 text-xs"
                  disabled={busy}
                  onClick={() => onRotate(d.id)}
                >
                  Rotate key
                </Button>
              </div>
            ),
          },
        ]}
      />

      {editId != null && intervals ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Intervals · {rows.find((r) => r.id === editId)?.label ?? editId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={saveIntervals}>
              {INTERVAL_FIELDS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm text-muted-foreground" htmlFor={`iv-${f.key}`}>
                    {f.label}
                  </label>
                  <Input
                    id={`iv-${f.key}`}
                    type="number"
                    min={60}
                    max={86400}
                    value={intervals[f.key]}
                    disabled={busy}
                    onChange={(e) =>
                      setIntervals({
                        ...intervals,
                        [f.key]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" disabled={busy}>
                  Save intervals
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setEditId(null)
                    setIntervals(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}