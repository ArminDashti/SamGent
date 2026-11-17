import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { TimeRangeBar } from '@/components/time-range-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatTimestamp, rangeForPreset, type TimeRangePreset } from '@/lib/time-ranges'

type Row = Awaited<ReturnType<typeof api.smsContacts>>[number]

export function SmsPage() {
  const [preset, setPreset] = useState<TimeRangePreset>('this_month')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState<string | null>(null)

  const range = useMemo(() => rangeForPreset(preset), [preset])

  function load(query?: string) {
    api
      .smsContacts({ ...range, q: query || undefined })
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'failed'))
  }

  useEffect(() => {
    load(filter)
  }, [range, filter])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    setFilter(q)
  }

  return (
    <div>
      <PageHeader
        title="SMS"
        description="Message counts grouped by contact for the selected period."
        actions={<TimeRangeBar value={preset} onChange={setPreset} />}
      />
      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Filter by phone"
          placeholder="Filter by phone number"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <DataTable
        rows={rows}
        rowKey={(r) => r.phone}
        empty="No SMS in this period."
        columns={[
          { id: 'contact', header: 'Contact', cell: (r) => r.contact },
          { id: 'phone', header: 'Phone', cell: (r) => <span className="font-mono text-xs">{r.phone}</span> },
          { id: 'sent', header: 'Sent', cell: (r) => r.sent },
          { id: 'receive', header: 'Receive', cell: (r) => r.receive },
          { id: 'updated', header: 'Updated at', cell: (r) => formatTimestamp(r.updatedAt) },
        ]}
      />
    </div>
  )
}