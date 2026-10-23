'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Dumbbell,
  Salad,
  Heart,
  TrendingUp,
  Brain,
  Zap,
  Play,
  ArrowRight,
  Activity,
  Flame,
  Target,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, StatCard, SectionHeading, Badge, Button } from '@/components/ui'
import { RpgProgressCard } from '@/components/rpg/RpgProgressCard'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/profileService'
import type { UserProfile } from '@/types/profile'
import type { User } from '@supabase/supabase-js'

// ─── Demo Data ────────────────────────────────────────────────────────────────

const weeklyActivityData = [
  { day: 'Mon', workouts: 1, calories: 420 },
  { day: 'Tue', workouts: 0, calories: 0 },
  { day: 'Wed', workouts: 1, calories: 380 },
  { day: 'Thu', workouts: 1, calories: 510 },
  { day: 'Fri', workouts: 0, calories: 0 },
  { day: 'Sat', workouts: 1, calories: 460 },
  { day: 'Sun', workouts: 0, calories: 200 },
]

const weightTrendData = [
  { week: 'W1', weight: 78.5 },
  { week: 'W2', weight: 78.1 },
  { week: 'W3', weight: 77.8 },
  { week: 'W4', weight: 77.4 },
  { week: 'W5', weight: 77.0 },
  { week: 'W6', weight: 76.8 },
]

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Today's Workout Card ─────────────────────────────────────────────────────

function TodaysWorkoutCard() {
  return (
    <Card className="border-lime-400/20 bg-gradient-to-br from-zinc-900 to-zinc-900/80">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Badge variant="accent">Today&apos;s Workout</Badge>
          <h3 className="mt-2 text-lg font-bold text-white">Upper Body</h3>
          <p className="text-sm text-zinc-500 mt-0.5">45 min · 6 exercises</p>
        </div>
        <div className="p-2.5 rounded-lg bg-lime-400/10 text-lime-400" aria-hidden="true">
          <Dumbbell size={20} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
          <span>Progress</span>
          <span className="text-lime-400 font-medium">0 / 6 exercises</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={0} aria-valuemin={0} aria-valuemax={6} aria-label="Workout progress">
          <div className="h-full w-0 bg-lime-400 rounded-full transition-all" />
        </div>
      </div>

      <Link href="/workout">
        <Button size="sm" icon={<Play size={14} />} fullWidth>
          Start Workout
        </Button>
      </Link>
    </Card>
  )
}

// ─── Recovery Card ────────────────────────────────────────────────────────────

function RecoveryCard() {
  const [score, setScore] = useState(78)
  const [sleepText, setSleepText] = useState('Sleep quality: Good')
  const [sorenessText, setSorenessText] = useState('Muscle soreness: Low')
  const [energyText, setEnergyText] = useState('Energy levels: Moderate')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('yashfit_latest_recovery')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.readinessScore) setScore(parsed.readinessScore)
        if (parsed.sleepQuality) setSleepText(`Sleep quality: ${parsed.sleepQuality}/5 (${parsed.sleepHours}h)`)
        if (parsed.soreness) setSorenessText(`Muscle soreness: ${parsed.soreness}`)
        if (parsed.energy) setEnergyText(`Energy levels: ${parsed.energy}`)
      }
    } catch {
      // ignore
    }
  }, [])

  const circumference = 2 * Math.PI * 36

  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Badge variant="default">Recovery</Badge>
          <h3 className="mt-2 text-base font-semibold text-white">Readiness Score</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Calculated from recovery biomarkers</p>
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-800 text-emerald-400" aria-hidden="true">
          <Heart size={20} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Circular progress */}
        <div className="relative shrink-0" aria-label={`Recovery score: ${score}%`} role="img">
          <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90" aria-hidden="true">
            <circle cx="44" cy="44" r="36" fill="none" stroke="#27272a" strokeWidth="7" />
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="#a3e635"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (score / 100) * circumference}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{score}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400" aria-hidden="true" />
            <span className="text-xs text-zinc-400">{sleepText}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="text-xs text-zinc-400">{sorenessText}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            <span className="text-xs text-zinc-400">{energyText}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-500">Readiness assessment</span>
        <Link href="/recovery">
          <Button size="sm" variant="outline">
            Log Recovery <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────

function AIInsightCard() {
  return (
    <Card className="border-lime-400/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/10">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400" aria-hidden="true">
          <Brain size={16} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">AI Insight</span>
          <Badge variant="accent">Sample</Badge>
        </div>
      </div>
      <blockquote className="text-sm text-zinc-300 leading-relaxed border-l-2 border-lime-400/40 pl-3">
        Your training consistency improved this week — 4 workouts completed vs. 2 last week. 
        Recovery scores suggest you&apos;re ready to push intensity on your next session.
      </blockquote>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          Synthesized training, recovery, nutrition &amp; habit analysis
        </p>
        <Link href="/insights">
          <Button size="sm" variant="outline">
            View All AI Insights <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// ─── Weekly Activity Chart ────────────────────────────────────────────────────

function WeeklyActivityChart() {
  return (
    <Card noPadding>
      <div className="px-5 pt-5 pb-0 flex items-center justify-between">
        <SectionHeading
          title="Weekly Activity"
          subtitle="Calories burned this week"
        />
        <Badge variant="default">Demo</Badge>
      </div>
      <div className="p-5 pt-3" aria-hidden="true">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyActivityData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="day"
              tick={{ fill: '#71717a', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#a1a1aa' }}
              cursor={{ fill: '#27272a' }}
            />
            <Bar
              dataKey="calories"
              name="Calories"
              fill="#a3e635"
              radius={[4, 4, 0, 0]}
              fillOpacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Weight Trend Chart ───────────────────────────────────────────────────────

function WeightTrendChart() {
  return (
    <Card noPadding>
      <div className="px-5 pt-5 pb-0 flex items-center justify-between">
        <SectionHeading
          title="Weight Trend"
          subtitle="6-week overview (kg)"
        />
        <Badge variant="default">Demo</Badge>
      </div>
      <div className="p-5 pt-3" aria-hidden="true">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weightTrendData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a3e635" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#a3e635" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#71717a', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#a1a1aa' }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              name="Weight (kg)"
              stroke="#a3e635"
              strokeWidth={2}
              fill="url(#weightGradient)"
              dot={{ fill: '#a3e635', strokeWidth: 0, r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const quickActions = [
  {
    label: 'Start Workout',
    href: '/workout',
    icon: <Dumbbell size={20} />,
    description: 'Begin today\'s session',
    color: 'text-lime-400 bg-lime-400/10',
  },
  {
    label: 'Log Recovery',
    href: '/recovery',
    icon: <Heart size={20} />,
    description: 'Track how you feel',
    color: 'text-rose-400 bg-rose-400/10',
  },
  {
    label: 'View Progress',
    href: '/progress',
    icon: <TrendingUp size={20} />,
    description: 'See your trends',
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    label: 'Plan Meals',
    href: '/nutrition',
    icon: <Salad size={20} />,
    description: 'Manage nutrition',
    color: 'text-amber-400 bg-amber-400/10',
  },
]

function QuickActions() {
  return (
    <div>
      <SectionHeading title="Quick Actions" className="mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`} aria-hidden="true">
              {action.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-lime-400 transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{action.description}</p>
            </div>
            <ArrowRight
              size={14}
              className="text-zinc-600 group-hover:text-lime-400 group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export function DashboardContent() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Live tracking states
  const [recoveryScore, setRecoveryScore] = useState(78)
  const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(3)
  const [waterLogged, setWaterLogged] = useState(2.1)
  const [waterTarget, setWaterTarget] = useState(3.0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (data.user) {
        const p = await getUserProfile(data.user.id)
        setProfile(p)
      } else {
        // Fallback for demo mode
        const p = await getUserProfile('demo-user')
        setProfile(p)
      }
      setIsLoading(false)
    })

    // Load live tracking metrics from localStorage
    try {
      const rec = localStorage.getItem('yashfit_latest_recovery')
      if (rec) {
        const parsed = JSON.parse(rec)
        if (parsed.readinessScore) setRecoveryScore(parsed.readinessScore)
      }

      const w = localStorage.getItem('yashfit_completed_workouts')
      if (w) {
        const parsed = JSON.parse(w)
        if (Array.isArray(parsed)) setCompletedWorkoutsCount(parsed.length)
      }

      const water = localStorage.getItem('yashfit_daily_water')
      if (water) {
        const parsed = parseFloat(water)
        if (!isNaN(parsed)) setWaterLogged(parsed)
      }

      const wt = localStorage.getItem('yashfit_water_target')
      if (wt) {
        const parsed = parseFloat(wt)
        if (!isNaN(parsed)) setWaterTarget(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const displayName = profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || null

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{formatDate()}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
            {isLoading
              ? 'Loading...'
              : displayName
              ? `${getGreeting()}, ${displayName} 👋`
              : `${getGreeting()} 👋`}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Here&apos;s your personalized fitness and recovery telemetry for today.
          </p>
        </div>

        {/* User Profile Pill */}
        {profile && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
              Goal: {profile.primary_goal}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800">
              {profile.training_days_per_week} days/week
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-400 border border-zinc-800">
              {profile.dietary_preference}
            </span>
          </div>
        )}
      </div>

      {/* Personalized Profile Snapshot Banner */}
      {profile && (
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/60 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
              <Target size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">Your Plan Target</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Active Schedule</span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile.primary_goal} · {profile.experience_level} Level
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Training at {profile.training_environment} · {profile.weight_kg} kg · {profile.height_cm} cm
              </p>
            </div>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button variant="outline" size="sm">
              Edit Plan &amp; Goals
            </Button>
          </Link>
        </div>
      )}

      {/* Anime Fitness RPG Hero Progression Card */}
      <RpgProgressCard />

      {/* Stats row with live telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Calories"
          value="1,840"
          unit="kcal"
          icon={<Flame size={18} />}
          trend={{ value: '1,840 / 2,200 target', positive: true }}
        />
        <StatCard
          label="Hydration"
          value={waterLogged}
          unit={`/ ${waterTarget}L`}
          icon={<Target size={18} />}
          trend={{
            value: waterLogged >= waterTarget ? 'Goal reached! 💧' : `${(waterTarget - waterLogged).toFixed(1)}L remaining`,
            positive: waterLogged >= waterTarget,
          }}
        />
        <StatCard
          label="Recovery"
          value={recoveryScore}
          unit="%"
          icon={<Activity size={18} />}
          trend={{
            value: recoveryScore >= 75 ? 'Ready for high intensity' : 'Recommend moderate load',
            positive: recoveryScore >= 70,
          }}
        />
        <StatCard
          label="Workouts Logged"
          value={completedWorkoutsCount}
          unit="sessions"
          icon={<Zap size={18} />}
          trend={{ value: `${completedWorkoutsCount} completed sessions`, positive: true }}
        />
      </div>

      {/* Main grid: Today's Workout + Recovery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TodaysWorkoutCard />
        <RecoveryCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <WeeklyActivityChart />
        <WeightTrendChart />
      </div>

      {/* AI Insight */}
      <AIInsightCard />

      {/* Quick Actions */}
      <QuickActions />

      {/* Demo disclaimer */}
      <div className="text-center py-4">
        <p className="text-xs text-zinc-700">
          ✦ Statistics and charts above use sample data for UI demonstration. Real data tracking
          coming in a future update.
        </p>
      </div>
    </div>
  )
}

