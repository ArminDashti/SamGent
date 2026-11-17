import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type DataTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  empty: ReactNode
  className?: string
}

export function DataTable<T>({ columns, rows, rowKey, empty, className }: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-muted-foreground">
            {columns.map((col) => (
              <th key={col.id} className={cn('px-4 py-3 font-medium', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey(row)}
              className={cn(
                'border-b border-border/60 last:border-0',
                i % 2 === 1 && 'bg-muted/30',
              )}
            >
              {columns.map((col) => (
                <td key={col.id} className={cn('px-4 py-3 align-middle', col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}