import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type Row = Awaited<ReturnType<typeof api.calls>>[number]

export function CallsPage() {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  function load(query?: string) {
    api
      .calls({ q: query })
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
      <h1 className="font-mono text-2xl font-semibold">Calls</h1>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Filter calls"
          placeholder="Filter by number or name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No calls stored yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Number</th>
                  <th className="py-2 pr-3 font-medium">Name</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Duration</th>
                  <th className="py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-3 pr-3 font-mono">{r.number}</td>
                    <td className="py-3 pr-3">{r.name ?? '—'}</td>
                    <td className="py-3 pr-3">{r.type}</td>
                    <td className="py-3 pr-3">{r.durationSec}s</td>
                    <td className="py-3">{r.calledAt}</td>
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
