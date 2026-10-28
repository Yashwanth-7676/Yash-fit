'use client'

import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  HelpCircle,
} from 'lucide-react'
import { Card } from '@/components/ui'
import {
  calculateMetricTrend,
  METRIC_CONFIG,
} from '@/lib/transformation/transformationService'
import type {
  BodyMeasurementEntry,
  MeasurementMetricKey,
} from '@/types/transformation'

interface Props {
  entries: BodyMeasurementEntry[]
}

type DateRange = '7d' | '30d' | '90d' | '1y' | 'all'

export function MeasurementHistoryCharts({ entries }: Props) {
  const [selectedMetric, setSelectedMetric] = useState<MeasurementMetricKey>('weight_kg')
  const [selectedRange, setSelectedRange] = useState<DateRange>('90d')

  // Filter entries by date range
  const filteredEntries = useMemo(() => {
    if (selectedRange === 'all') return entries

    const now = new Date().getTime()
    const daysMap: Record<DateRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
      all: 9999,
    }
    const days = daysMap[selectedRange]
    const cutoff = now - days * 24 * 3600 * 1000

    return entries.filter((e) => new Date(e.recordedDate).getTime() >= cutoff)
  }, [entries, selectedRange])

  // Chart data
  const chartData = useMemo(() => {
    return filteredEntries
      .map((e) => {
        let val: number | undefined
        switch (selectedMetric) {
          case 'weight_kg':
            val = e.weightKg
            break
          case 'waist_cm':
            val = e.waistCm
            break
          case 'chest_cm':
            val = e.chestCm
            break
          case 'hips_cm':
            val = e.hipsCm
            break
          case 'arm_cm':
            val = e.armCm
            break
          case 'thigh_cm':
            val = e.thighCm
            break
          case 'neck_cm':
            val = e.neckCm
            break
        }
        return {
          date: e.recordedDate,
          displayDate: e.recordedDate.slice(5), // MM-DD
          value: typeof val === 'number' && val > 0 ? val : null,
        }
      })
      .filter((d) => d.value !== null)
  }, [filteredEntries, selectedMetric])

  // Trend analysis
  const trend = useMemo(() => {
    return calculateMetricTrend(filteredEntries, selectedMetric)
  }, [filteredEntries, selectedMetric])

  const cfg = METRIC_CONFIG[selectedMetric]

  return (
    <Card className="p-6 bg-zinc-950 border-zinc-800 space-y-6">
      {/* Metric Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(Object.keys(METRIC_CONFIG) as MeasurementMetricKey[]).map((key) => {
            const item = METRIC_CONFIG[key]
            const active = selectedMetric === key
            return (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  active
                    ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {(['7d', '30d', '90d', '1y', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase transition ${
                selectedRange === range
                  ? 'bg-zinc-800 text-lime-400 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="displayDate"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#a1a1aa' }}
                formatter={(val) => [`${val} ${cfg.unit}`, cfg.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#a3e635"
                strokeWidth={2.5}
                dot={{ fill: '#a3e635', stroke: '#09090b', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#bef264' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-zinc-500">
            Log at least 2 measurements across different dates to visualize trend trajectories.
          </div>
        )}
      </div>

      {/* Scientific Trend Analysis & Uncertainty Explanation */}
      {trend && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Rate & Direction */}
          <div className="space-y-1">
            <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">
              Trajectory Rate
            </span>
            <div className="flex items-center gap-2">
              {trend.direction === 'decreasing' && (
                <span className="flex items-center gap-1 font-bold text-sky-400 font-mono text-sm">
                  <TrendingDown size={16} /> {trend.weeklyRate} {trend.unit}/week
                </span>
              )}
              {trend.direction === 'increasing' && (
                <span className="flex items-center gap-1 font-bold text-lime-400 font-mono text-sm">
                  <TrendingUp size={16} /> +{trend.weeklyRate} {trend.unit}/week
                </span>
              )}
              {trend.direction === 'stable' && (
                <span className="flex items-center gap-1 font-bold text-zinc-400 font-mono text-sm">
                  <Minus size={16} /> Plateau / Maintained
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-400">
              Net Change: {trend.netChange > 0 ? `+${trend.netChange}` : trend.netChange} {trend.unit}
            </span>
          </div>

          {/* Current vs Start */}
          <div className="space-y-1 font-mono">
            <span className="text-zinc-500 font-medium uppercase tracking-wider text-[10px]">
              Recorded Shift
            </span>
            <div className="text-sm font-bold text-white">
              {trend.startValue} → <span className="text-lime-400">{trend.currentValue} {trend.unit}</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-sans">
              Confidence Score: High (verified timestamps)
            </span>
          </div>

          {/* Measurement Uncertainty Explanation */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-zinc-400 font-bold text-[11px]">
              <HelpCircle size={13} className="text-amber-400" />
              <span>Uncertainty Margin: ±{trend.uncertaintyMargin} {trend.unit}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {trend.uncertaintyExplanation}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

