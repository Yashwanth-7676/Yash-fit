'use client'

import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { Eye, EyeOff, FileSpreadsheet } from 'lucide-react'

export interface AccessibleChartSummaryProps {
  title: string
  summary: string
  data: Array<{
    label: string
    value: string | number
    change?: string
    notes?: string
  }>
  unit?: string
  className?: string
}

export function AccessibleChartSummary({
  title,
  summary,
  data,
  unit,
  className = '',
}: AccessibleChartSummaryProps) {
  const [showTable, setShowTable] = useState(false)
  const tableId = `accessible-table-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`

  return (
    <div className={`mt-3 pt-3 border-t border-zinc-800/80 ${className}`}>
      {/* Screen reader only announcement */}
      <div className="sr-only">
        <h4>{title} - Data Summary</h4>
        <p>{summary}</p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className="text-zinc-400 italic line-clamp-1 flex-1 mr-2" title={summary}>
          <span className="font-semibold text-zinc-300 not-italic mr-1">Key insight:</span>
          {summary}
        </p>

        <button
          type="button"
          onClick={() => setShowTable((prev) => !prev)}
          aria-expanded={showTable}
          aria-controls={tableId}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors shrink-0 text-[11px]"
        >
          {showTable ? <EyeOff size={13} /> : <FileSpreadsheet size={13} />}
          <span>{showTable ? 'Hide Table' : 'Accessible Table'}</span>
        </button>
      </div>

      {showTable && (
        <div id={tableId} className="mt-3 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950/60 p-2">
          <div className="text-xs font-semibold text-zinc-300 px-2 py-1 mb-1">
            Tabular Data: {title}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period / Metric</TableHead>
                <TableHead>Value {unit ? `(${unit})` : ''}</TableHead>
                {data.some((d) => d.change) && <TableHead>Delta / Change</TableHead>}
                {data.some((d) => d.notes) && <TableHead>Context</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={`${row.label}-${idx}`}>
                  <TableCell className="font-medium text-zinc-200">{row.label}</TableCell>
                  <TableCell className="text-lime-400 font-bold">{row.value}</TableCell>
                  {data.some((d) => d.change) && (
                    <TableCell className="text-xs text-zinc-400">{row.change ?? '—'}</TableCell>
                  )}
                  {data.some((d) => d.notes) && (
                    <TableCell className="text-xs text-zinc-400">{row.notes ?? '—'}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
