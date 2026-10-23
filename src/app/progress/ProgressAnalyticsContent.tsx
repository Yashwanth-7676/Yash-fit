'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Dumbbell,
  Scale,
  Calendar,
  Flame,
  Trophy,
  ArrowUpRight,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, Badge, Button, SectionHeading, StatCard } from '@/components/ui'
import { getUserProfile } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/profile'

const STRENGTH_PROGRESSION_DATA = [
  { week: 'W1', benchPress: 50, squat: 70, deadlift: 80 },
  { week: 'W2', benchPress: 52.5, squat: 72.5, deadlift: 85 },
  { week: 'W3', benchPress: 55, squat: 77.5, deadlift: 90 },
  { week: 'W4', benchPress: 57.5, squat: 80, deadlift: 92.5 },
  { week: 'W5', benchPress: 60, squat: 85, deadlift: 97.5 },
  { week: 'W6', benchPress: 62.5, squat: 87.5, deadlift: 102.5 },
]

const WORKOUT_CONSISTENCY_DATA = [
  { week: 'Week 1', sessions: 4, volumeTons: 12.4 },
  { week: 'Week 2', sessions: 3, volumeTons: 10.8 },
  { week: 'Week 3', sessions: 5, volumeTons: 15.2 },
  { week: 'Week 4', sessions: 4, volumeTons: 13.6 },
  { week: 'Week 5', sessions: 4, volumeTons: 14.1 },
  { week: 'Week 6', sessions: 5, volumeTons: 16.8 },
]

interface SavedWorkout {
  routineName: string
  durationSeconds: number
  totalVolume: number
  totalCompletedSets: number
  date: string
}

export function ProgressAnalyticsContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeExerciseTab, setActiveExerciseTab] = useState<'benchPress' | 'squat' | 'deadlift'>('benchPress')
  const [loggedWorkouts, setLoggedWorkouts] = useState<SavedWorkout[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const userId = data?.user?.id || 'demo-user'
        const p = await getUserProfile(userId)
        setProfile(p)
      } catch {
        // ignore
      }

      try {
        const stored = localStorage.getItem('yashfit_completed_workouts')
        if (stored) {
          setLoggedWorkouts(JSON.parse(stored))
        }
      } catch {
        // ignore
      }
    }
    loadData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Progress &amp; Strength Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track progressive overload lifts, body composition metrics, and weekly volume output.
          </p>
        </div>
        <Link href="/workout">
          <Button size="md" icon={<Dumbbell size={16} />}>
            Log Today&apos;s Workout
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Lifted Volume"
          value="82.9"
          unit="Tons"
          icon={<Flame size={18} />}
          trend={{ value: '+14% vs last cycle', positive: true }}
        />
        <StatCard
          label="Best Bench Press"
          value="62.5"
          unit="kg"
          icon={<Trophy size={18} />}
          trend={{ value: '+12.5 kg since start', positive: true }}
        />
        <StatCard
          label="Current Weight"
          value={profile?.weight_kg || '72.0'}
          unit="kg"
          icon={<Scale size={18} />}
          trend={{ value: 'Target: ' + (profile?.primary_goal || 'Muscle'), positive: true }}
        />
        <StatCard
          label="Adherence Rate"
          value="92"
          unit="%"
          icon={<Target size={18} />}
          trend={{ value: 'Consistent', positive: true }}
        />
      </div>

      {/* Progressive Overload Strength Curve */}
      <Card noPadding className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeading
            title="Compound Lift Strength Progression (kg)"
            subtitle="Estimated 1RM / Working Weight increases over 6 weeks"
          />

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveExerciseTab('benchPress')}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                activeExerciseTab === 'benchPress'
                  ? 'bg-lime-400 text-zinc-950'
                  : 'text-zinc-400 hover:text-white',
              ].join(' ')}
            >
              Bench Press
            </button>
            <button
              onClick={() => setActiveExerciseTab('squat')}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                activeExerciseTab === 'squat'
                  ? 'bg-lime-400 text-zinc-950'
                  : 'text-zinc-400 hover:text-white',
              ].join(' ')}
            >
              Back Squat
            </button>
            <button
              onClick={() => setActiveExerciseTab('deadlift')}
              className={[
                'px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                activeExerciseTab === 'deadlift'
                  ? 'bg-lime-400 text-zinc-950'
                  : 'text-zinc-400 hover:text-white',
              ].join(' ')}
            >
              Deadlift
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={STRENGTH_PROGRESSION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="strengthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={12} domain={['auto', 'auto']} tickLine={false} />
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
                dataKey={activeExerciseTab}
                name={
                  activeExerciseTab === 'benchPress'
                    ? 'Bench Press (kg)'
                    : activeExerciseTab === 'squat'
                    ? 'Back Squat (kg)'
                    : 'Deadlift (kg)'
                }
                stroke="#a3e635"
                strokeWidth={3}
                fill="url(#strengthGradient)"
                dot={{ fill: '#a3e635', strokeWidth: 0, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weekly Volume & Adherence Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card noPadding className="p-6 space-y-4">
          <SectionHeading
            title="Weekly Tonnage Volume (Tons)"
            subtitle="Total cumulative workload lifted across all sets"
          />
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKOUT_CONSISTENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="volumeTons" name="Volume (Tons)" fill="#a3e635" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card noPadding className="p-6 space-y-4">
          <SectionHeading
            title="Workout Frequency & Consistency"
            subtitle="Completed sessions vs. weekly planned commitment"
          />
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WORKOUT_CONSISTENCY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="week" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} domain={[0, 7]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  name="Workouts Completed"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ fill: '#38bdf8', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Completed Workouts Session Log */}
      <Card noPadding className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeading
            title="Recent Completed Workout Sessions"
            subtitle="Logged sets, volume, and session duration"
          />
          <Link href="/workout">
            <Button size="sm" variant="outline" icon={<Dumbbell size={14} />}>
              Start New Workout
            </Button>
          </Link>
        </div>

        {loggedWorkouts.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl space-y-2">
            <p className="text-sm text-zinc-400">No workout sessions logged yet today.</p>
            <p className="text-xs text-zinc-500">
              Start an active routine to automatically track sets, reps, tonnage, and rest intervals.
            </p>
            <div className="pt-2">
              <Link href="/workout">
                <Button size="sm">Choose Routine</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {loggedWorkouts.slice(0, 5).map((log, index) => {
              const minutes = Math.floor(log.durationSeconds / 60)
              const seconds = log.durationSeconds % 60
              const formattedTime = `${minutes}m ${seconds}s`
              const dateStr = new Date(log.date).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-lime-400/10 text-lime-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{log.routineName}</h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {formattedTime}
                        </span>
                        <span>•</span>
                        <span>{log.totalCompletedSets} sets completed</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right sm:text-right">
                    <Badge variant="accent">
                      {log.totalVolume.toLocaleString()} kg lifted
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
