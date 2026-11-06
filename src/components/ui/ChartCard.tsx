import * as React from 'react'
import { Card, SectionHeading } from './index'
import { AccessibleChartSummary } from '@/components/accessibility/AccessibleChartSummary'

export interface ChartCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
  accessibleSummary?: {
    summary: string
    data: Array<{ label: string; value: string | number; change?: string; notes?: string }>
    unit?: string
  }
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  badge,
  children,
  className = '',
  accessibleSummary,
}) => (
  <Card noPadding className={`overflow-hidden ${className}`}>
    <div className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60">
      <div className="flex items-center gap-3">
        <SectionHeading title={title} subtitle={subtitle} />
        {badge}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    <div className="p-5 pt-4 w-full">
      {children}
      {accessibleSummary && (
        <AccessibleChartSummary
          title={title}
          summary={accessibleSummary.summary}
          data={accessibleSummary.data}
          unit={accessibleSummary.unit}
        />
      )}
    </div>
  </Card>
)

export interface DarkTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number | string
    color?: string
    unit?: string
    dataKey?: string
  }>
  label?: string
  valueFormatter?: (value: number | string) => string
}

export const DarkChartTooltip: React.FC<DarkTooltipProps> = ({
  active,
  payload,
  label,
  valueFormatter,
}) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl bg-zinc-950/95 border border-zinc-800 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[140px]">
      {label && <p className="font-semibold text-zinc-300 border-b border-zinc-800/80 pb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const val = valueFormatter && item.value !== undefined ? valueFormatter(item.value) : item.value
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color || '#a3e635' }}
                />
                <span className="text-zinc-400 capitalize">{item.name || item.dataKey}:</span>
              </div>
              <span className="font-mono font-medium text-white">
                {val} {item.unit || ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
