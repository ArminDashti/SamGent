import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { TimeRangeBar } from '@/components/time-range-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatTimestamp, rangeForPreset, type TimeRangePreset } from '@/lib/time-ranges'

type Row = Awaited<ReturnType<typeof api.callContacts>>[number]

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

export function CallsPage() {
  const [preset, setPreset] = useState<TimeRangePreset>('this_month')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => rangeForPreset(preset), [preset])

  useEffect(() => {
    api
      .callContacts({ ...range, q: filter || undefined })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }, [range, filter])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setFilter(q)
  }

  return (
    <div>
      <PageHeader
        title="Calls"
        description="Outgoing counts as sent; incoming and missed as receive."
        actions={<TimeRangeBar value={preset} onChange={setPreset} />}
      />
      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Filter calls"
          placeholder="Filter by name or number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <DataTable
        rows={rows}
        rowKey={(r) => r.number}
        empty="No calls in this period."
        columns={[
          { id: 'contact', header: 'Contact', cell: (r) => r.contact },
          { id: 'number', header: 'Number', cell: (r) => <span className="font-mono text-xs">{r.number}</span> },
          { id: 'sent', header: 'Sent', cell: (r) => r.sent },
          { id: 'receive', header: 'Receive', cell: (r) => r.receive },
          { id: 'duration', header: 'Total duration', cell: (r) => formatDuration(r.totalDurationSec) },
          { id: 'updated', header: 'Updated at', cell: (r) => formatTimestamp(r.updatedAt) },
        ]}
      />
    </div>
  )
}