import React from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import type { SortingState, ColumnDef, HeaderGroup, Row, Cell } from '@tanstack/react-table'

interface DataTableProps<T extends object> {
  columns: ColumnDef<T, any>[]
  data: T[]
  initialSorting?: SortingState
  onRowClick?: (row: T) => void
  maxHeight?: number
}

export function DataTable<T extends object>({ columns, data, initialSorting, onRowClick, maxHeight }: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting || [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  })

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/80 backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/70 text-gray-300 text-[12px]">
            {table.getHeaderGroups().map((hg: HeaderGroup<T>) => (
              <tr key={hg.id}>
                {hg.headers.map((h: any) => {
                  const canSort = h.column.getCanSort()
                  const dir = h.column.getIsSorted() as false | 'asc' | 'desc'
                  return (
                    <th key={h.id} colSpan={h.colSpan} className="px-3 py-2 font-medium text-left select-none">
                      {canSort ? (
                        <button
                          onClick={h.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 group"
                        >
                          <span>{flexRender(h.column.columnDef.header, h.getContext())}</span>
                          <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                            {dir === 'asc' && '▲'}{dir === 'desc' && '▼'}{!dir && '↕'}
                          </span>
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800/70" style={maxHeight ? { display: 'block', maxHeight, overflowY: 'auto' } : undefined}>
            {table.getRowModel().rows.map((row: Row<T>) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-800/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row.original)}
                style={maxHeight ? { display: 'table', width: '100%', tableLayout: 'fixed' } : undefined}
              >
                {row.getVisibleCells().map((cell: Cell<T, unknown>) => (
                  <td key={cell.id} className="px-3 py-2 align-top text-[12px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr className="text-center" style={maxHeight ? { display: 'table', width: '100%', tableLayout: 'fixed' } : undefined}>
                <td className="px-3 py-12 text-[12px] text-gray-500" colSpan={columns.length}>No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
