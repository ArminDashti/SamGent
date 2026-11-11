import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type Device = Awaited<ReturnType<typeof api.devices>>[number]

type IssuedKey = {
  label: string
  deviceUid: string
  apiKey: string
  reason: 'created' | 'rotated'
}

export function DevicesPage() {
  const [rows, setRows] = useState<Device[]>([])
  const [label, setLabel] = useState('')
  const [issued, setIssued] = useState<IssuedKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function reload() {
    const list = await api.devices()
    setRows(list)
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const res = await api.createDevice(trimmed)
      setIssued({
        label: res.label,
        deviceUid: res.deviceUid,
        apiKey: res.apiKey,
        reason: 'created',
      })
      setLabel('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'create_failed')
    } finally {
      setBusy(false)
    }
  }

  async function onRotate(id: number) {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const res = await api.rotateDevice(id)
      setIssued({
        label: res.label,
        deviceUid: res.deviceUid,
        apiKey: res.apiKey,
        reason: 'rotated',
      })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'rotate_failed')
    } finally {
      setBusy(false)
    }
  }

  async function copyKey() {
    if (!issued) return
    try {
      await navigator.clipboard.writeText(issued.apiKey)
      setCopied(true)
    } catch {
      setError('clipboard_failed')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">Devices</h1>
      {error ? <p className="text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Create device</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={onCreate}>
            <div className="min-w-[16rem] flex-1 space-y-1">
              <label className="text-sm text-muted-foreground" htmlFor="device-label">
                Label
              </label>
              <Input
                id="device-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Kitchen phone"
                disabled={busy}
              />
            </div>
            <Button type="submit" disabled={busy || !label.trim()}>
              Create device
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            Copy the API key into the Android app with your server base URL. The key is shown once.
          </p>
        </CardContent>
      </Card>

      {issued ? (
        <Card>
          <CardHeader>
            <CardTitle>
              API key {issued.reason === 'rotated' ? 'rotated' : 'created'} — copy now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {issued.label} · <span className="font-mono text-xs">{issued.deviceUid}</span>
            </p>
            <p className="break-all rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
              {issued.apiKey}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This key will not be shown again. Rotate if you lose it.
            </p>
            <Button type="button" onClick={copyKey}>
              {copied ? 'Copied' : 'Copy API key'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Registered</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">
              No devices yet. Create one here, then paste the API key into the Android app.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Label</th>
                  <th className="py-2 pr-4 font-medium">UID</th>
                  <th className="py-2 pr-4 font-medium">Last seen</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{d.label}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{d.deviceUid}</td>
                    <td className="py-3 pr-4">{d.lastSeenAt ?? '—'}</td>
                    <td className="py-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-9 px-3 text-xs"
                        disabled={busy}
                        onClick={() => onRotate(d.id)}
                      >
                        Rotate key
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
