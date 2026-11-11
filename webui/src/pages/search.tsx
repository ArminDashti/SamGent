import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type Result = Awaited<ReturnType<typeof api.search>>

export function SearchPage() {
  const [q, setQ] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSearch(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    try {
      setResult(await api.search(q.trim()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">Search</h1>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Global search"
          placeholder="Search SMS, calls, entities"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      {result ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>SMS ({result.sms.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.sms.length === 0 ? (
                <p className="text-muted-foreground">None</p>
              ) : (
                result.sms.map((s) => (
                  <div key={s.id} className="rounded-md border border-border/60 p-2">
                    <div className="font-medium">{s.address}</div>
                    <div className="line-clamp-2 text-muted-foreground">{s.body}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Calls ({result.calls.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.calls.length === 0 ? (
                <p className="text-muted-foreground">None</p>
              ) : (
                result.calls.map((c) => (
                  <div key={c.id} className="rounded-md border border-border/60 p-2">
                    <div className="font-mono">{c.number}</div>
                    <div className="text-muted-foreground">
                      {c.type} · {c.calledAt}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Entities ({result.entities.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {result.entities.length === 0 ? (
                <p className="text-muted-foreground">None</p>
              ) : (
                result.entities.map((e) => (
                  <div key={e.id} className="rounded-md border border-border/60 p-2">
                    <span className="font-mono text-xs">{e.type}</span>
                    <div>{e.value}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
