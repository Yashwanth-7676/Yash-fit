'use client'

import React, { useState, useEffect } from 'react'
import {
  Heart,
  Moon,
  BatteryCharging,
  Sparkles,
  Zap,
  Activity,
  Smile,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, Badge, Button, SectionHeading, Input } from '@/components/ui'
import { calculateReadinessScore, getReadinessCategory } from '@/lib/recoveryCalculator'
import type { EnergyRating, SorenessLevel, StressLevel, RecoveryTrendPoint } from '@/types/recovery'

const DEMO_7DAY_TREND: RecoveryTrendPoint[] = [
  { day: 'Mon', readiness: 74, sleepHours: 7.2 },
  { day: 'Tue', readiness: 68, sleepHours: 6.5 },
  { day: 'Wed', readiness: 85, sleepHours: 8.0 },
  { day: 'Thu', readiness: 80, sleepHours: 7.8 },
  { day: 'Fri', readiness: 65, sleepHours: 6.2 },
  { day: 'Sat', readiness: 88, sleepHours: 8.5 },
  { day: 'Sun', readiness: 82, sleepHours: 7.5 },
]

export function RecoveryTrackerContent() {
  const [sleepHours, setSleepHours] = useState<number>(7.5)
  const [sleepQuality, setSleepQuality] = useState<number>(4)
  const [soreness, setSoreness] = useState<SorenessLevel>('Mild')
  const [energy, setEnergy] = useState<EnergyRating>('High')
  const [stress, setStress] = useState<StressLevel>('Low')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yashfit_latest_recovery')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.sleepHours === 'number') setSleepHours(parsed.sleepHours)
        if (typeof parsed.sleepQuality === 'number') setSleepQuality(parsed.sleepQuality)
        if (parsed.soreness) setSoreness(parsed.soreness)
        if (parsed.energy) setEnergy(parsed.energy)
        if (parsed.stress) setStress(parsed.stress)
      }
    } catch {
      // ignore
    }
  }, [])

  // Current calculated score
  const readinessScore = calculateReadinessScore({
    sleepHours,
    sleepQuality,
    soreness,
    energy,
    stress,
  })

  const category = getReadinessCategory(readinessScore)
  const circumference = 2 * Math.PI * 45

  const handleSaveCheckIn = () => {
    try {
      const log = {
        date: new Date().toISOString(),
        sleepHours,
        sleepQuality,
        soreness,
        energy,
        stress,
        readinessScore,
      }
      localStorage.setItem('yashfit_latest_recovery', JSON.stringify(log))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Recovery Intelligence</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Track daily sleep, muscle fatigue, and energy biomarkers to compute training readiness.
        </p>
      </div>

      {savedSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-sm text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>Today&apos;s recovery metrics logged successfully! Readiness score updated.</span>
        </div>
      )}

      {/* Hero Readiness Ring Card */}
      <Card className="p-6 md:p-8 border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Circular Progress Gauge */}
            <div className="relative shrink-0 w-28 h-28 flex items-center justify-center">
              <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
                <circle cx="56" cy="56" r="45" fill="none" stroke="#27272a" strokeWidth="9" />
                <circle
                  cx="56"
                  cy="56"
                  r="45"
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (readinessScore / 100) * circumference}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{readinessScore}</span>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-base font-bold ${category.color}`}>
                  {category.label}
                </span>
                <Badge variant="accent">Live Score</Badge>
              </div>
              <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
                {category.recommendation}
              </p>
            </div>
          </div>

          <Button size="lg" onClick={handleSaveCheckIn} icon={<CheckCircle2 size={18} />}>
            Save Today&apos;s Check-in
          </Button>
        </div>
      </Card>

      {/* Daily Check-in Form Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sleep & Quality */}
        <Card className="p-6 space-y-5">
          <SectionHeading
            title="Sleep Architecture"
            subtitle="Duration and perceived restfulness last night"
          />

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <Moon size={15} className="text-indigo-400" /> Sleep Duration
                </span>
                <span className="text-white font-bold">{sleepHours} hours</span>
              </div>
              <input
                type="range"
                min="4"
                max="11"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
                <span>4h</span>
                <span>7.5h (Optimal)</span>
                <span>11h</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-300 font-semibold block mb-2">
                Sleep Quality Rating
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSleepQuality(star)}
                    className={[
                      'p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      sleepQuality === star
                        ? 'border-lime-400 bg-lime-400/15 text-white ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700',
                    ].join(' ')}
                  >
                    ★ {star}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Muscle Soreness & Subjective Energy */}
        <Card className="p-6 space-y-5">
          <SectionHeading
            title="Physical Readiness"
            subtitle="Muscle DOMS and subjective morning energy"
          />

          <div className="space-y-4">
            <div>
              <span className="text-xs text-zinc-300 font-semibold block mb-2">
                Muscle Soreness (DOMS)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['None', 'Mild', 'Moderate', 'Severe'] as SorenessLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSoreness(level)}
                    className={[
                      'p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center',
                      soreness === level
                        ? 'border-lime-400 bg-lime-400/15 text-white ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700',
                    ].join(' ')}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-300 font-semibold block mb-2">
                Subjective Energy Level
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Moderate', 'High', 'Peak'] as EnergyRating[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergy(lvl)}
                    className={[
                      'p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center',
                      energy === lvl
                        ? 'border-lime-400 bg-lime-400/15 text-white ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700',
                    ].join(' ')}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-300 font-semibold block mb-2">
                Mental / Life Stress
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['Low', 'Moderate', 'High'] as StressLevel[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStress(st)}
                    className={[
                      'p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center',
                      stress === st
                        ? 'border-lime-400 bg-lime-400/15 text-white ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700',
                    ].join(' ')}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 7-Day Readiness Trend Chart */}
      <Card noPadding className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <SectionHeading
            title="7-Day Recovery & Readiness Trend"
            subtitle="Historical correlation between sleep hours and workout readiness"
          />
          <Badge variant="default">Weekly Trajectory</Badge>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={DEMO_7DAY_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} domain={[40, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '10px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="readiness"
                name="Readiness (%)"
                stroke="#a3e635"
                strokeWidth={2.5}
                fill="url(#readinessGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-zinc-600">
        ✦ Readiness scores are lifestyle conditioning estimators and do not constitute clinical or medical diagnostics.
      </p>
    </div>
  )
}

