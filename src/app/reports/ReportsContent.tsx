'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Printer,
  Share2,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ShieldCheck,
  Dumbbell,
  Award,
  RefreshCw,
  Copy,
  CheckCircle2,
  Activity,
  HeartPulse,
  Flame,
  Info,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  generateFitnessReport,
  type ReportTelemetryInput,
} from '@/lib/reports/reportGeneratorService'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import { getSavedPerformanceLogs } from '@/lib/performance-lab/performanceLabService'
import type { FitnessReport, ReportType } from '@/types/reports'

const REPORT_TYPE_OPTIONS: { id: ReportType; label: string; description: string }[] = [
  { id: 'weekly', label: 'Weekly Intelligence', description: '7-day retrospective training, recovery & load balance' },
  { id: 'monthly', label: 'Monthly Transformation', description: '30-day longitudinal adaptation & body composition' },
  { id: 'yearly', label: 'Annual Ecosystem', description: '365-day habit consistency, streak and total tonnage lifted' },
  { id: 'consistency', label: 'Habit Consistency', description: 'Streak integrity, training frequency & rest day audits' },
  { id: 'strength', label: 'Strength Progression', description: 'Compound 1RM benchmarks, working load accumulation' },
  { id: 'nutrition', label: 'Nutrition Adherence', description: 'Macro adherence, daily protein attainment & meal timing' },
  { id: 'recovery', label: 'Recovery & Sleep', description: 'Readiness trends, sleep duration & CNS fatigue markers' },
  { id: 'achievements', label: 'Achievements & PRs', description: 'Arena accolades, RPG milestones & verified performance tests' },
]

export function ReportsContent() {
  const toast = useToast()

  // State
  const [reportType, setReportType] = useState<ReportType>('weekly')
  const [includePrivate, setIncludePrivate] = useState(true)
  const [dateRangePreset, setDateRangePreset] = useState<'7d' | '14d' | '30d' | '90d' | '365d'>('7d')
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [hasCopiedShare, setHasCopiedShare] = useState(false)
  const [telemetry, setTelemetry] = useState<ReportTelemetryInput | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch telemetry
  const loadTelemetry = async () => {
    setIsLoading(true)
    try {
      const coachContext = await buildCoachContext('current-user')
      const performanceLogs = getSavedPerformanceLogs()

      setTelemetry({
        profile: coachContext.profile,
        workouts: coachContext.workouts,
        recovery: coachContext.recovery,
        measurements: coachContext.recentMeasurements,
        performanceLogs,
        nutritionPlan: coachContext.nutritionPlan || null,
        waterLoggedLiters: coachContext.waterLoggedLiters,
        activeStreak: coachContext.activeStreak,
      })
    } catch {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTelemetry()
  }, [])

  // Handle Preset changes
  const applyPreset = (preset: '7d' | '14d' | '30d' | '90d' | '365d') => {
    setDateRangePreset(preset)
    const end = new Date()
    const start = new Date()
    let days = 7
    if (preset === '14d') days = 14
    if (preset === '30d') days = 30
    if (preset === '90d') days = 90
    if (preset === '365d') days = 365

    start.setDate(end.getDate() - days)
    setStartDate(start.toISOString().slice(0, 10))
    setEndDate(end.toISOString().slice(0, 10))
  }

  // Generate Report
  const report: FitnessReport | null = useMemo(() => {
    if (!telemetry) return null
    return generateFitnessReport(
      {
        type: reportType,
        startDate,
        endDate,
        includePrivateMetrics: includePrivate,
      },
      telemetry
    )
  }, [telemetry, reportType, startDate, endDate, includePrivate])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleCopyShare = async () => {
    if (!report) return
    try {
      await navigator.clipboard.writeText(report.sanitizedShareText)
      setHasCopiedShare(true)
      toast.success('Copied to Clipboard', 'Sanitized fitness report summary copied successfully.')
      setTimeout(() => setHasCopiedShare(false), 2500)
    } catch {
      toast.error('Copy Failed', 'Could not copy to clipboard. Please copy manually.')
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6 print:border-none">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Fitness Intelligence Reports
                <Badge variant="accent" className="text-xs font-semibold">
                  AUDITED
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Verifiable multi-period audits with zero fabricated metrics & longitudinal delta comparisons
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-3 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTelemetry}
            disabled={isLoading}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            icon={<Share2 className="w-4 h-4" />}
          >
            Share
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Filter & Configuration Bar */}
      <Card className="space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Report Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
            {REPORT_TYPE_OPTIONS.map((item) => {
              const active = reportType === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setReportType(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors duration-150 ${
                    active
                      ? 'bg-lime-400 text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Privacy Toggle */}
          <label className="flex items-center gap-2 text-xs text-zinc-300 select-none cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={includePrivate}
              onChange={(e) => setIncludePrivate(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-lime-400 focus:ring-lime-400/20"
            />
            <span>Include Private Biometrics (Body Weight)</span>
          </label>
        </div>

        {/* Date Controls & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date Range:
            </span>
            {(['7d', '14d', '30d', '90d', '365d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  dateRangePreset === p
                    ? 'bg-zinc-700 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p === '7d' ? '7D' : p === '14d' ? '14D' : p === '30d' ? '30D' : p === '90d' ? '90D' : '1Y'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">From</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 text-xs h-8 py-1"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">To</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36 text-xs h-8 py-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Report Document View */}
      {report && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <Card className="border border-zinc-800 bg-zinc-900/90 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="accent">{report.type.toUpperCase()} REPORT</Badge>
                  <span className="text-xs text-zinc-500 font-mono">
                    Audited: {new Date(report.generatedAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{report.title}</h2>
                <p className="text-xs text-zinc-400">{report.subtitle}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs text-zinc-300 font-mono">
                  {report.dateRange.startDate} ➔ {report.dateRange.endDate}
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mt-4 leading-relaxed">{report.summary}</p>

            {/* Data Integrity / Missing Data Alert */}
            {report.missingDataNotices.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Data Integrity Notice (Zero Fabrication Policy)</span>
                </div>
                <ul className="text-xs text-amber-300/90 list-disc list-inside space-y-0.5">
                  {report.missingDataNotices.map((notice, idx) => (
                    <li key={idx}>{notice}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Key Metrics Grid */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              Verified Performance Telemetry
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {report.metrics.map((metric) => {
                const isPositive = metric.trendDirection === 'up'
                const isNegative = metric.trendDirection === 'down'

                return (
                  <Card key={metric.key} className="p-4 bg-zinc-900 border-zinc-800/80 space-y-2">
                    <span className="text-xs text-zinc-400 block truncate">{metric.label}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-white tracking-tight">
                        {metric.value}
                      </span>
                      {metric.unit && (
                        <span className="text-xs text-zinc-500 font-medium">{metric.unit}</span>
                      )}
                    </div>
                    {metric.changePct !== undefined && (
                      <div className="flex items-center gap-1 text-[11px] font-medium">
                        {isPositive ? (
                          <span className="text-emerald-400 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                            +{metric.changePct}% vs prior
                          </span>
                        ) : isNegative ? (
                          <span className="text-rose-400 flex items-center">
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                            {metric.changePct}% vs prior
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center">
                            <Minus className="w-3 h-3 mr-0.5" />
                            0% vs prior
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Volume Trend Visualization */}
          <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-lime-400" />
                  Lifted Volume Progression Trend
                </h3>
                <p className="text-xs text-zinc-400">
                  Total load lifted per session across the active reporting window
                </p>
              </div>
              <Badge variant="default" className="text-xs font-mono">
                KG TONNAGE
              </Badge>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a3e635" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a3e635" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={12} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    formatter={(val: unknown) => [
                      `${Number(val ?? 0).toLocaleString()} kg`,
                      'Lifted Volume',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#a3e635"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#reportVolumeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Benchmarks & Personal Records */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRs */}
            <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Verified Performance Lab Benchmarks
                </h3>
                <Link href="/performance-lab" className="text-xs text-lime-400 hover:underline">
                  Lab Tests ➔
                </Link>
              </div>

              {report.personalRecords.length > 0 ? (
                <div className="space-y-2.5">
                  {report.personalRecords.map((pr, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-800"
                    >
                      <div>
                        <span className="text-xs font-medium text-white block">{pr.exerciseName}</span>
                        <span className="text-[11px] text-zinc-500 font-mono">{pr.date}</span>
                      </div>
                      <Badge variant="accent" className="font-mono text-xs">
                        {pr.recordValue}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-zinc-800/30 border border-dashed border-zinc-800 space-y-2">
                  <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">No performance lab benchmarks recorded recently.</p>
                  <Link href="/performance-lab">
                    <Button variant="outline" size="sm" className="mt-2 text-xs">
                      Take 1RM / Capacity Test
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Recommendations */}
            <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-lime-400" />
                  Evidence-Based Directives
                </h3>
                <Badge variant="default" className="text-[10px]">
                  AUTONOMOUS AUDIT
                </Badge>
              </div>

              <div className="space-y-2.5">
                {report.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-800"
                  >
                    <CheckCircle2 className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-zinc-300 leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Modal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Sanitized Fitness Report"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            This share summary excludes sensitive medical measurements while highlighting verified workout sessions, volume, and habit streaks.
          </p>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {report?.sanitizedShareText}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsShareModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyShare}
              icon={hasCopiedShare ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {hasCopiedShare ? 'Copied!' : 'Copy Summary'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
