import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type Row = Awaited<ReturnType<typeof api.sms>>[number]

export function SmsPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  function load(query?: string) {
    api
      .sms({ q: query })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }

  useEffect(() => {
    load()
  }, [])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    load(q)
  }

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">SMS</h1>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Filter SMS"
          placeholder="Filter by sender or body"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No SMS stored yet.</p>
          ) : (
            rows.map((r) => (
              <article key={r.id} className="rounded-lg border border-border/70 bg-muted/40 p-3">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{r.address}</span>
                  <span>{r.deviceLabel}</span>
                  <span>{r.receivedAt}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{r.body}</p>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
