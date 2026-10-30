'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Trophy,
  AlertTriangle,
  Download,
  Trash2,
  Plus,
  ShieldAlert,
  Info,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  PERFORMANCE_TEST_CATALOG,
  calculateBrzycki1RM,
  calculateEpley1RM,
  getSavedPerformanceLogs,
  savePerformanceLog,
  deletePerformanceLog,
  clearPerformanceLogs,
  buildTestBenchmarkReport,
  exportPerformanceLogsToCsv,
} from '@/lib/performance-lab/performanceLabService'
import type {
  PerformanceTestDefinition,
  PerformanceTestLog,
  PerformanceTestCategory,
  PerformanceBenchmarkReport,
} from '@/types/performanceLab'

const CATEGORY_FILTERS: { id: PerformanceTestCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Benchmarks' },
  { id: 'strength_progression', label: '1RM Strength' },
  { id: 'repetition_endurance', label: 'Rep Endurance' },
  { id: 'timed_endurance', label: 'Timed Isometric' },
  { id: 'workload_capacity', label: 'Aerobic Capacity' },
]

export function PerformanceLabContent() {
  const toast = useToast()

  const [selectedCategory, setSelectedCategory] = useState<PerformanceTestCategory | 'all'>('all')
  const [selectedTestId, setSelectedTestId] = useState<string>(PERFORMANCE_TEST_CATALOG[0].id)
  const [logs, setLogs] = useState<PerformanceTestLog[]>([])
  const [showLogModal, setShowLogModal] = useState(false)
  const [showSafetyModal, setShowSafetyModal] = useState(false)

  // Form input state
  const [inputWeight, setInputWeight] = useState<string>('80')
  const [inputReps, setInputReps] = useState<string>('5')
  const [inputDirectScore, setInputDirectScore] = useState<string>('40')
  const [inputNotes, setInputNotes] = useState<string>('')
  const [isBaselineCheck, setIsBaselineCheck] = useState<boolean>(false)
  const [conditionsConfirmed, setConditionsConfirmed] = useState<boolean>(true)

  // Load logs on mount
  useEffect(() => {
    const saved = getSavedPerformanceLogs()
    if (saved.length > 0) {
      setLogs(saved)
    } else {
      // Seed default baseline for demo user so charts display cleanly
      const demoLogs: PerformanceTestLog[] = [
        {
          id: 'log-demo-1',
          userId: 'demo-user',
          testId: 'test-1rm-squat',
          testTitle: '1RM Barbell Squat (Submaximal Calculation)',
          category: 'strength_progression',
          date: '2026-10-01',
          resultValue: 100,
          unit: 'kg',
          estimated1RM: 100,
          isBaseline: true,
          conditionsMet: true,
          notes: 'Baseline testing session.',
        },
        {
          id: 'log-demo-2',
          userId: 'demo-user',
          testId: 'test-1rm-squat',
          testTitle: '1RM Barbell Squat (Submaximal Calculation)',
          category: 'strength_progression',
          date: '2026-10-15',
          resultValue: 105,
          unit: 'kg',
          estimated1RM: 105,
          isBaseline: false,
          conditionsMet: true,
          notes: 'Progressive overload check.',
        },
        {
          id: 'log-demo-3',
          userId: 'demo-user',
          testId: 'test-1rm-squat',
          testTitle: '1RM Barbell Squat (Submaximal Calculation)',
          category: 'strength_progression',
          date: '2026-10-28',
          resultValue: 107.5,
          unit: 'kg',
          estimated1RM: 107.5,
          isBaseline: false,
          conditionsMet: true,
          notes: 'New personal best.',
        },
        {
          id: 'log-demo-4',
          userId: 'demo-user',
          testId: 'test-pushup-endurance',
          testTitle: '2-Minute Push-Up Muscular Endurance Test',
          category: 'repetition_endurance',
          date: '2026-10-10',
          resultValue: 36,
          unit: 'reps',
          isBaseline: true,
          conditionsMet: true,
        },
        {
          id: 'log-demo-5',
          userId: 'demo-user',
          testId: 'test-pushup-endurance',
          testTitle: '2-Minute Push-Up Muscular Endurance Test',
          category: 'repetition_endurance',
          date: '2026-10-26',
          resultValue: 42,
          unit: 'reps',
          isBaseline: false,
          conditionsMet: true,
        },
      ]
      setLogs(demoLogs)
      demoLogs.forEach((l) => savePerformanceLog(l))
    }
  }, [])

  // Filtered catalog tests
  const filteredCatalog = useMemo(() => {
    if (selectedCategory === 'all') return PERFORMANCE_TEST_CATALOG
    return PERFORMANCE_TEST_CATALOG.filter((t) => t.category === selectedCategory)
  }, [selectedCategory])

  // Active selected test
  const activeTest = useMemo(() => {
    return (
      PERFORMANCE_TEST_CATALOG.find((t) => t.id === selectedTestId) ||
      PERFORMANCE_TEST_CATALOG[0]
    )
  }, [selectedTestId])

  // Benchmark report for active test
  const benchmarkReport: PerformanceBenchmarkReport = useMemo(() => {
    return buildTestBenchmarkReport(activeTest.id, logs)
  }, [activeTest.id, logs])

  // Submaximal 1RM calculations
  const calculatedBrzycki = useMemo(() => {
    const w = parseFloat(inputWeight) || 0
    const r = parseInt(inputReps, 10) || 0
    return calculateBrzycki1RM(w, r)
  }, [inputWeight, inputReps])

  const calculatedEpley = useMemo(() => {
    const w = parseFloat(inputWeight) || 0
    const r = parseInt(inputReps, 10) || 0
    return calculateEpley1RM(w, r)
  }, [inputWeight, inputReps])

  // Save new test result
  const handleSaveResult = () => {
    if (!conditionsConfirmed) {
      toast.error('Conditions Required', 'Please confirm that standard test conditions were maintained.')
      return
    }

    let finalValue = 0
    let estimated1RM: number | undefined

    if (activeTest.category === 'strength_progression') {
      finalValue = calculatedBrzycki
      estimated1RM = calculatedBrzycki
      if (finalValue <= 0) {
        toast.error('Invalid Values', 'Please enter valid weight and rep count.')
        return
      }
    } else {
      finalValue = parseFloat(inputDirectScore) || 0
      if (finalValue <= 0) {
        toast.error('Invalid Score', 'Please enter a test score greater than 0.')
        return
      }
    }

    const newLog: PerformanceTestLog = {
      id: `perf-${Date.now()}`,
      userId: 'demo-user',
      testId: activeTest.id,
      testTitle: activeTest.title,
      category: activeTest.category,
      date: new Date().toISOString().slice(0, 10),
      resultValue: finalValue,
      unit: activeTest.unit,
      estimated1RM,
      isBaseline: isBaselineCheck,
      conditionsMet: conditionsConfirmed,
      notes: inputNotes.trim() || undefined,
    }

    savePerformanceLog(newLog)
    const updated = [newLog, ...logs.filter((l) => l.id !== newLog.id)]
    setLogs(updated)
    setShowLogModal(false)
    setInputNotes('')
    toast.success('Benchmark Recorded! 🏆', `${finalValue} ${activeTest.unit} recorded for ${activeTest.title}.`)
  }

  const handleDeleteLog = (id: string) => {
    deletePerformanceLog(id)
    setLogs((prev) => prev.filter((l) => l.id !== id))
    toast.info('Log Deleted', 'Benchmark test record removed.')
  }

  const handleExportCsv = () => {
    if (logs.length === 0) {
      toast.info('No Records', 'No performance lab logs to export.')
      return
    }
    const csv = exportPerformanceLogsToCsv(logs)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-performance-lab-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export Successful', 'Downloaded performance lab records as CSV.')
  }

  // Chart data for active test
  const chartData = useMemo(() => {
    return benchmarkReport.recentLogs
      .slice()
      .reverse()
      .map((l) => ({
        date: l.date.slice(5),
        value: l.resultValue,
      }))
  }, [benchmarkReport.recentLogs])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Standardized Fitness Testing</Badge>
            <span className="text-xs text-zinc-400 font-mono">Personal Baseline Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Fitness Performance Lab
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Measurable, repeatable fitness testing and 1RM calculation protocols comparing strictly against your personal historical records.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSafetyModal(true)}
            icon={<ShieldAlert size={14} className="text-amber-400" />}
          >
            Safety Guidelines
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download size={14} />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowLogModal(true)}
            icon={<Plus size={14} />}
          >
            Record Test Result
          </Button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-lime-400 text-zinc-950 font-bold shadow-md'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Test Catalog + Benchmark Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Test Selector List */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block px-1">
            Standardized Protocols ({filteredCatalog.length})
          </span>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredCatalog.map((test) => {
              const isSelected = test.id === selectedTestId
              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTestId(test.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-900 border-lime-400/80 shadow-lg ring-1 ring-lime-400/30'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white leading-tight">
                      {test.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono uppercase">
                      {test.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                    {test.subtitle}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Benchmark Report Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-zinc-800 bg-zinc-900/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="accent">{activeTest.category.replace('_', ' ').toUpperCase()}</Badge>
                  {activeTest.isMaximal ? (
                    <span className="text-[10px] text-amber-400 font-mono">Maximal Test Protocol</span>
                  ) : (
                    <span className="text-[10px] text-sky-400 font-mono">Submaximal Calculation</span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white">{activeTest.title}</h2>
                <p className="text-xs text-zinc-400 mt-0.5">{activeTest.subtitle}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogModal(true)}
                icon={<Plus size={14} />}
              >
                Log Score
              </Button>
            </div>

            {/* Benchmark Comparison Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Personal Best</span>
                <span className="text-xl font-extrabold text-lime-400 font-mono mt-0.5 block">
                  {benchmarkReport.personalBest !== null ? `${benchmarkReport.personalBest} ${activeTest.unit}` : 'None'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Baseline Value</span>
                <span className="text-xl font-extrabold text-zinc-200 font-mono mt-0.5 block">
                  {benchmarkReport.baselineValue !== null ? `${benchmarkReport.baselineValue} ${activeTest.unit}` : 'None'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Latest Test</span>
                <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
                  {benchmarkReport.latestValue !== null ? `${benchmarkReport.latestValue} ${activeTest.unit}` : 'None'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Baseline Progress</span>
                <span
                  className={`text-xl font-extrabold font-mono mt-0.5 block ${
                    benchmarkReport.historicalImprovementPct !== null && benchmarkReport.historicalImprovementPct >= 0
                      ? 'text-lime-400'
                      : 'text-amber-400'
                  }`}
                >
                  {benchmarkReport.historicalImprovementPct !== null
                    ? `${benchmarkReport.historicalImprovementPct >= 0 ? '+' : ''}${benchmarkReport.historicalImprovementPct}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Performance Trend Chart */}
            {chartData.length > 1 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Personal Score Progression</span>
                <div className="h-48 w-full bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#09090b',
                          borderColor: '#27272a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name={activeTest.unit}
                        stroke="#a3e635"
                        strokeWidth={2.5}
                        dot={{ fill: '#a3e635', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Protocol Standard Rules & Equipment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <span className="font-semibold text-white block">Execution Steps:</span>
                <ol className="list-decimal pl-4 space-y-1 text-zinc-400">
                  {activeTest.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
                <span className="font-semibold text-white block">Equipment & Standard Conditions:</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                  {activeTest.standardConditions.map((cond, idx) => (
                    <li key={idx}>{cond}</li>
                  ))}
                </ul>
                <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-300">Equipment: </span>
                  {activeTest.equipmentRequired.join(', ')}
                </div>
              </div>
            </div>

            {/* No fake population average disclaimer */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2">
              <Info size={15} className="text-lime-400 shrink-0 mt-0.5" />
              <span>
                YashFit Performance Lab strictly benchmarks against your personal baseline. We do not compare you against invented population averages or generic percentiles.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Record Test Result Modal */}
      {showLogModal && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title={`Record Test: ${activeTest.title}`}
        >
          <div className="space-y-4 text-xs">
            {activeTest.category === 'strength_progression' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Working Weight (kg)</label>
                    <Input
                      type="number"
                      value={inputWeight}
                      onChange={(e) => setInputWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-zinc-300 block mb-1">Strict Reps (3–5)</label>
                    <Input
                      type="number"
                      value={inputReps}
                      onChange={(e) => setInputReps(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Calculated Estimated 1RM</span>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-lime-400 font-mono">{calculatedBrzycki} kg (Brzycki)</span>
                    <span className="text-xs text-zinc-400 font-mono">{calculatedEpley} kg (Epley)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">
                  Test Score ({activeTest.unit})
                </label>
                <Input
                  type="number"
                  value={inputDirectScore}
                  onChange={(e) => setInputDirectScore(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Test Notes (optional)</label>
              <Input
                placeholder="RPE, fatigue level, or equipment specifics..."
                value={inputNotes}
                onChange={(e) => setInputNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBaselineCheck}
                  onChange={(e) => setIsBaselineCheck(e.target.checked)}
                  className="rounded border-zinc-700 text-lime-400 focus:ring-lime-400"
                />
                <span className="text-zinc-300 font-medium">Mark this test as my official baseline</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={conditionsConfirmed}
                  onChange={(e) => setConditionsConfirmed(e.target.checked)}
                  className="rounded border-zinc-700 text-lime-400 focus:ring-lime-400"
                />
                <span className="text-zinc-300 font-medium">I confirm standard conditions and full range of motion were met</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setShowLogModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveResult}>
                Save Benchmark Score
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Safety Screening Modal */}
      {showSafetyModal && (
        <Modal
          isOpen={showSafetyModal}
          onClose={() => setShowSafetyModal(false)}
          title="Safety Screening & Contraindications"
        >
          <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>
                Performance testing is strictly voluntary. Never attempt maximal testing when fatigued, injured, or without qualified spotters.
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">Absolute Contraindications (Do NOT Test):</h4>
              <ul className="list-disc pl-4 space-y-1 text-zinc-400">
                <li>Chest pain, dizziness, lightheadedness, or shortness of breath.</li>
                <li>Acute joint inflammation, ligament sprain, or lumbar disc herniation within the last 30 days.</li>
                <li>Uncontrolled hypertension or cardiovascular illness without physician clearance.</li>
                <li>Sleep duration below 5 hours in the preceding 24 hours.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">Experience Recommendation:</h4>
              <p className="text-zinc-400">
                Beginners with less than 6 months of structured resistance training should utilize submaximal calculations (3–5 reps) rather than true 1RM attempts.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={() => setShowSafetyModal(false)}>
                Understood &amp; Acknowledged
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Historical Logs Table */}
      <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Performance Lab Testing Log</h3>
            <p className="text-xs text-zinc-400">Full audit trail of all recorded fitness benchmarks.</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            icon={<Download size={14} />}
          >
            Export All to CSV
          </Button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 space-y-2">
            <Trophy size={28} className="mx-auto text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-400">No performance tests recorded yet.</p>
            <p className="text-xs text-zinc-500">Select a protocol above and click &quot;Record Test Result&quot;.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead>
                <tr className="text-[10px] text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Test</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Baseline</th>
                  <th className="py-2.5 px-3">Notes</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 text-zinc-400">{log.date}</td>
                    <td className="py-3 px-3 font-sans font-bold text-white">{log.testTitle}</td>
                    <td className="py-3 px-3 text-zinc-400 font-sans">{log.category.replace('_', ' ')}</td>
                    <td className="py-3 px-3 text-lime-400 font-bold">
                      {log.resultValue} {log.unit}
                    </td>
                    <td className="py-3 px-3">
                      {log.isBaseline ? (
                        <span className="px-1.5 py-0.5 rounded bg-lime-400/20 text-lime-400 text-[10px] font-bold">
                          Baseline
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-sans max-w-xs truncate">{log.notes || '—'}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
