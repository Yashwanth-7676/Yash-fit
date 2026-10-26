'use client'

import React from 'react'
import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import {
  Activity,
  HeartPulse,
  Droplet,
  Utensils,
  Dumbbell,
  Flame,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import type { TodayFitnessStatus } from '@/types/commandCenter'

interface FitnessStatusHeaderProps {
  status: TodayFitnessStatus
  userName?: string | null
}

export function FitnessStatusHeader({ status, userName }: FitnessStatusHeaderProps) {
  const readinessColor =
    status.readinessScore >= 80
      ? 'text-lime-400 border-lime-400/30 bg-lime-400/10'
      : status.readinessScore >= 65
      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
      : status.readinessScore >= 50
      ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
      : 'text-rose-400 border-rose-400/30 bg-rose-400/10'

  return (
    <Card className="border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-lime-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        {/* Left: User greeting & readiness score */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-lime-400/10 border border-lime-400/30 text-lime-400">
              <Sparkles size={13} />
              AI Command Center
            </span>
            <span className="text-xs text-zinc-500 font-medium">· Real-Time Telemetry</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {userName ? `Welcome back, ${userName}` : 'Fitness Command Center'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-xl">
              Synthesized intelligence across your training sessions, recovery check-ins, hydration, and nutritional adherence.
            </p>
          </div>

          {/* Quick Pill Stats */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="accent" className="flex items-center gap-1">
              <Flame size={12} /> {status.streakDays} Day Streak
            </Badge>
            <Badge variant="default" className="text-zinc-300">
              Lv. {status.level} {status.rank}
            </Badge>
            <Badge variant="default" className="text-zinc-400">
              {status.totalXp.toLocaleString()} XP
            </Badge>
          </div>
        </div>

        {/* Right: Key Telemetry Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-auto w-full">
          {/* 1. Readiness */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Readiness</span>
              <HeartPulse size={14} className="text-lime-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                {status.readinessScore}
                <span className="text-xs text-zinc-500 font-normal">/100</span>
              </div>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${readinessColor}`}>
                {status.readinessLabel}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Moon size={10} /> {status.sleepHours ? `${status.sleepHours}h sleep` : 'No sleep logged'}
            </span>
          </div>

          {/* 2. Today's Workout */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Workout</span>
              <Dumbbell size={14} className="text-lime-400" />
            </div>
            <div className="my-1.5">
              <div className="text-sm font-bold text-white truncate max-w-[120px]">
                {status.scheduledWorkout.name}
              </div>
              <span className="text-[11px] text-zinc-400 block mt-0.5 truncate">
                {status.scheduledWorkout.split}
              </span>
            </div>
            {status.scheduledWorkout.status === 'completed' ? (
              <span className="text-[10px] text-lime-400 font-semibold flex items-center gap-1">
                <CheckCircle2 size={11} /> Completed
              </span>
            ) : (
              <Link
                href="/workout/session"
                className="text-[10px] text-lime-400 font-semibold hover:text-lime-300 flex items-center gap-0.5"
              >
                Launch Now <ArrowRight size={10} />
              </Link>
            )}
          </div>

          {/* 3. Hydration */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Hydration</span>
              <Droplet size={14} className="text-cyan-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                {status.hydration.loggedLiters}
                <span className="text-xs text-zinc-500 font-normal">/ {status.hydration.targetLiters}L</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, status.hydration.percentage)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-zinc-500">
              {status.hydration.percentage}% of daily goal
            </span>
          </div>

          {/* 4. Target Protein */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 text-xs">
              <span>Target Protein</span>
              <Utensils size={14} className="text-amber-400" />
            </div>
            <div className="my-1.5">
              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                {status.nutrition.proteinTargetGrams}
                <span className="text-xs text-zinc-500 font-normal">g/day</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">
                {status.nutrition.caloriesTarget} kcal budget
              </span>
            </div>
            <Link
              href="/meals"
              className="text-[10px] text-lime-400 font-semibold hover:text-lime-300 flex items-center gap-0.5"
            >
              Meal Ideas <ArrowRight size={10} />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}
