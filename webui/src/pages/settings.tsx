import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type IssuedKey = {
  label: string
  deviceUid: string
  apiKey: string
  reason: 'created' | 'rotated'
}

export function SettingsPage() {
  const [label, setLabel] = useState('')
  const [issued, setIssued] = useState<IssuedKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function onCreate(e: FormEvent) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'create_failed')
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
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Provision devices and open advanced data tools." />

      <Card>
        <CardHeader>
          <CardTitle>Create device</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={onCreate}>
            <div className="min-w-[16rem] flex-1 space-y-1">
              <label className="text-sm text-muted-foreground" htmlFor="device-label">
                Phone label
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
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {issued ? (
        <Card>
          <CardHeader>
            <CardTitle>API key — copy now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {issued.label} · <span className="font-mono text-xs">{issued.deviceUid}</span>
            </p>
            <p className="break-all rounded-md border border-border bg-muted/40 p-3 font-mono text-sm">
              {issued.apiKey}
            </p>
            <Button type="button" onClick={copyKey}>
              {copied ? 'Copied' : 'Copy API key'}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Advanced</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <Link to="/entities" className="text-primary hover:underline">
            Parsed entities from SMS
          </Link>
          <Link to="/search" className="text-primary hover:underline">
            Global search
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}