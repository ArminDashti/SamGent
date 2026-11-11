import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'

type Row = Awaited<ReturnType<typeof api.entities>>[number]
const TYPES = ['', 'otp', 'amount', 'phone', 'url', 'sender']

export function EntitiesPage() {
  const [type, setType] = useState('')
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  function load(nextType = type, nextQ = q) {
    api
      .entities({ type: nextType || undefined, q: nextQ || undefined })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }

  useEffect(() => {
    load('', '')
  }, [])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    load()
  }

  return (
    <div className="space-y-4">
      <h1 className="font-mono text-2xl font-semibold">Parsed entities</h1>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="entity-type">
          Type
        </label>
        <select
          id="entity-type"
          className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {TYPES.map((t) => (
            <option key={t || 'all'} value={t}>
              {t || 'All types'}
            </option>
          ))}
        </select>
        <Input
          aria-label="Filter entities"
          placeholder="Filter by value"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rows.length === 0 ? (
            <p className="text-muted-foreground">No parsed entities yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Value</th>
                  <th className="py-2 pr-3 font-medium">Device</th>
                  <th className="py-2 font-medium">From SMS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-3 pr-3">
                      <span className="rounded-md bg-accent/20 px-2 py-0.5 font-mono text-xs text-accent-foreground">
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-mono">{r.value}</td>
                    <td className="py-3 pr-3">{r.deviceLabel}</td>
                    <td className="py-3 max-w-xs truncate" title={r.body}>
                      {r.address}
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
