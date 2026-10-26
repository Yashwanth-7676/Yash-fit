'use client'

import React, { useState, useMemo } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Info,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { TrendHorizon, TrendForecastPoint, StrengthProgressionItem } from '@/types/commandCenter'
import { computeTrendForecastPoints } from '@/lib/command-center/commandCenterService'
import type { TwinWorkout } from '@/lib/digitalTwin'

interface TrendsAndForecastsCardProps {
  workouts: TwinWorkout[]
  strengthItems: StrengthProgressionItem[]
}

const chartTooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '11px',
}

export function TrendsAndForecastsCard({ workouts, strengthItems }: TrendsAndForecastsCardProps) {
  const [horizon, setHorizon] = useState<TrendHorizon>('30d')
  const [activeTab, setActiveTab] = useState<'volume' | 'strength'>('volume')

  const trendPoints = useMemo(() => {
    return computeTrendForecastPoints(workouts, horizon)
  }, [workouts, horizon])

  const hasHistoricalData = trendPoints.some((p) => !p.isProjected)
  const hasForecastPoint = trendPoints.some((p) => p.isProjected)

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Progress Trends &amp; Projections</h3>
            <Badge variant="default">Verified History</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Measured training history with cautious uncertainty projections
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Selector */}
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('volume')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'volume'
                  ? 'bg-lime-400 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lifted Volume
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('strength')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                activeTab === 'strength'
                  ? 'bg-lime-400 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Strength Trends
            </button>
          </div>

          {/* Horizon Selector */}
          {activeTab === 'volume' && (
            <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
              {(['7d', '30d', '90d', 'all'] as TrendHorizon[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHorizon(h)}
                  className={`px-2 py-1 rounded-md font-medium uppercase text-[10px] transition-all ${
                    horizon === h
                      ? 'bg-zinc-800 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      {activeTab === 'volume' ? (
        hasHistoricalData ? (
          <div className="space-y-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="measuredVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  {/* Measured Line & Area */}
                  <Area
                    type="monotone"
                    dataKey="measuredValue"
                    name="Measured Volume (kg)"
                    stroke="#a3e635"
                    strokeWidth={2}
                    fill="url(#measuredVolume)"
                    connectNulls
                  />
                  {/* Forecast Line */}
                  {hasForecastPoint && (
                    <Area
                      type="monotone"
                      dataKey="forecastValue"
                      name="Cautious Projection"
                      stroke="#60a5fa"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      fill="url(#forecastVolume)"
                      connectNulls
                    />
                  )}
                  {hasForecastPoint && (
                    <Line
                      type="monotone"
                      dataKey="upperBound"
                      name="Uncertainty Upper Bound (+12%)"
                      stroke="#93c5fd"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      dot={false}
                      connectNulls
                    />
                  )}
                  {hasForecastPoint && (
                    <Line
                      type="monotone"
                      dataKey="lowerBound"
                      name="Uncertainty Lower Bound (-12%)"
                      stroke="#93c5fd"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      dot={false}
                      connectNulls
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Explanatory Banner */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block" />
                <span>Measured Volume</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block ml-2" />
                <span>Cautious Forward Projection (±12% range)</span>
              </div>
              <span className="text-zinc-500">
                Horizon: {horizon.toUpperCase()} · Transparent linear extrapolation
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 space-y-2">
            <Activity size={24} className="mx-auto text-zinc-500" />
            <h4 className="text-sm font-semibold text-zinc-300">No workout volume history in this horizon</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Complete and record workout sessions to display lifted volume progression and data-backed forward forecasts.
            </p>
          </div>
        )
      ) : (
        /* Strength Progression Tab */
        <div className="space-y-4">
          {strengthItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {strengthItems.map((item) => {
                const latestLoad = item.history[item.history.length - 1]?.weightKg || 0
                const isPositive = item.trendPercent >= 0

                return (
                  <div
                    key={item.exerciseName}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {item.exerciseName}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5 ${
                          isPositive
                            ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                            : 'bg-rose-400/10 text-rose-400 border border-rose-400/20'
                        }`}
                      >
                        <ArrowUpRight size={10} className={isPositive ? '' : 'rotate-90'} />
                        {isPositive ? `+${item.trendPercent}%` : `${item.trendPercent}%`}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-white">{latestLoad}</span>
                      <span className="text-xs text-zinc-500 font-normal">kg working set</span>
                    </div>

                    <span className="text-[10px] text-zinc-500 block">
                      Across {item.history.length} logged sessions
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 space-y-2">
              <Activity size={24} className="mx-auto text-zinc-500" />
              <h4 className="text-sm font-semibold text-zinc-300">Need at least 2 sessions per exercise</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Strength progression tracks verified changes across compound lifts like Bench Press, Squats, and Deadlifts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Methodology Disclaimer */}
      <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center gap-1.5">
        <Info size={11} className="shrink-0 text-zinc-400" />
        <span>
          <strong>Methodology:</strong> Volume is calculated strictly as completed working sets (kg × reps). Projections use recent 4-session moving averages with an explicit ±12% physiological uncertainty band.
        </span>
      </div>
    </Card>
  )
}
