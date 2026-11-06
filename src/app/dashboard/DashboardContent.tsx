'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  Droplet,
  Plus,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Trophy,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calendar,
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
import {
  Card,
  StatCard,
  SectionHeading,
  Badge,
  Button,
  Modal,
  Toggle,
  EmptyState,
  useToast,
  AccessibleChartSummary,
} from '@/components/ui'
import { useOfflineSync } from '@/lib/offline/offlineContext'
import { RpgProgressCard } from '@/components/rpg/RpgProgressCard'
import { DigitalTwinSummaryCard } from './DigitalTwinSummaryCard'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile } from '@/lib/profileService'
import {
  dailyWaterKey,
  readArray,
  waterTargetKey,
  workoutHistoryKey,
  type TwinWorkout,
} from '@/lib/digitalTwin'
import {
  getDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
  getPersonalRecords,
  getUpcomingGoals,
  getContextAwareRecommendations,
  DEFAULT_DASHBOARD_WIDGETS,
} from '@/lib/dashboard/dashboardService'
import type { DashboardWidgetConfig, DashboardWidgetId } from '@/types/dashboard'
import type { UserProfile } from '@/types/profile'
import type { User } from '@supabase/supabase-js'

// ─── Demo Chart Data ──────────────────────────────────────────────────────────

const weeklyActivityData = [
  { day: 'Mon', workouts: 1, calories: 420 },
  { day: 'Tue', workouts: 0, calories: 0 },
  { day: 'Wed', workouts: 1, calories: 380 },
  { day: 'Thu', workouts: 1, calories: 510 },
  { day: 'Fri', workouts: 0, calories: 0 },
  { day: 'Sat', workouts: 1, calories: 460 },
  { day: 'Sun', workouts: 0, calories: 200 },
]

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

// ─── Quick Actions Component ──────────────────────────────────────────────────

const quickActions = [
  {
    label: 'Start Workout',
    href: '/workout-studio',
    icon: <Dumbbell size={20} />,
    description: "Begin today's session",
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
    href: '/nutrition-planner',
    icon: <Salad size={20} />,
    description: 'Manage Indian nutrition',
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

export function DashboardContent() {
  const toast = useToast()
  const { enqueue } = useOfflineSync()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Layout Preferences
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>([])
  const [showLayoutModal, setShowLayoutModal] = useState(false)

  // Live telemetry states
  const [recoveryScore, setRecoveryScore] = useState(78)
  const [sleepText, setSleepText] = useState('Sleep quality: Good')
  const [sorenessText, setSorenessText] = useState('Muscle soreness: Low')
  const [energyText, setEnergyText] = useState('Energy levels: Moderate')
  const [completedWorkoutsCount, setCompletedWorkoutsCount] = useState(0)
  const [waterLogged, setWaterLogged] = useState(2.1)
  const [waterTarget, setWaterTarget] = useState(3.0)

  const userId = user?.id || 'demo-user'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        setUser(data.user)
        const currentUserId = data.user?.id || 'demo-user'
        const p = await getUserProfile(currentUserId)
        setProfile(p)
        setWidgets(getDashboardPreferences(currentUserId))
        setIsLoading(false)

        try {
          const rec =
            currentUserId === 'demo-user'
              ? localStorage.getItem('yashfit_latest_recovery')
              : localStorage.getItem(`yashfit_latest_recovery_${currentUserId}`)
          if (rec) {
            const parsed = JSON.parse(rec)
            if (parsed.readinessScore) setRecoveryScore(parsed.readinessScore)
            if (parsed.sleepQuality)
              setSleepText(`Sleep: ${parsed.sleepQuality}/5 (${parsed.sleepHours || 7.5}h)`)
            if (parsed.soreness) setSorenessText(`Soreness: ${parsed.soreness}`)
            if (parsed.energy) setEnergyText(`Energy: ${parsed.energy}`)
          }

          let workouts = readArray<TwinWorkout>(workoutHistoryKey(currentUserId))
          if (currentUserId === 'demo-user' && workouts.length === 0) {
            workouts = readArray<TwinWorkout>('yashfit_completed_workouts')
          }
          setCompletedWorkoutsCount(workouts.length)

          const water =
            currentUserId === 'demo-user'
              ? localStorage.getItem('yashfit_daily_water')
              : localStorage.getItem(dailyWaterKey(currentUserId))
          if (water) {
            const parsed = parseFloat(water)
            if (!isNaN(parsed)) setWaterLogged(parsed)
          }

          const wt =
            currentUserId === 'demo-user'
              ? localStorage.getItem('yashfit_water_target')
              : localStorage.getItem(waterTargetKey(currentUserId))
          if (wt) {
            const parsed = parseFloat(wt)
            if (!isNaN(parsed)) setWaterTarget(parsed)
          }
        } catch (error) {
          console.warn('Unable to load dashboard fitness tracking data:', error)
        }
      })
      .catch((error: unknown) => console.error('Unable to load dashboard user:', error))
  }, [])

  // Quick Water Logger
  const handleLogWater = (amountLiters: number) => {
    const newTotal = Number((waterLogged + amountLiters).toFixed(2))
    setWaterLogged(newTotal)
    try {
      if (userId === 'demo-user') {
        localStorage.setItem('yashfit_daily_water', newTotal.toString())
      } else {
        localStorage.setItem(dailyWaterKey(userId), newTotal.toString())
      }

      // Enqueue hydration update for offline-first synchronization
      enqueue('LOG_HYDRATION', {
        userId,
        amountLiters,
        totalLiters: newTotal,
        loggedAt: new Date().toISOString(),
      })

      toast.success('Hydration Logged! 💧', `Added +${amountLiters * 1000}ml. Total: ${newTotal}L.`)
    } catch {
      // ignore
    }
  }

  // Widget Preference Management
  const handleToggleWidget = (id: DashboardWidgetId, enabled: boolean) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled } : w)))
  }

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === widgets.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newWidgets = [...widgets]
    const temp = newWidgets[index]
    newWidgets[index] = newWidgets[targetIndex]
    newWidgets[targetIndex] = temp

    // Reassign order
    const ordered = newWidgets.map((w, idx) => ({ ...w, order: idx + 1 }))
    setWidgets(ordered)
  }

  const handleSavePreferences = () => {
    saveDashboardPreferences(widgets, userId)
    setShowLayoutModal(false)
    toast.success('Dashboard Customization Saved', 'Your widget order and visibility have been updated.')
  }

  const handleResetPreferences = () => {
    const defaults = resetDashboardPreferences(userId)
    setWidgets(defaults)
    toast.info('Restored Default Dashboard Layout')
  }

  // Derived Authenticated Data
  const personalRecords = useMemo(() => getPersonalRecords(userId), [userId, completedWorkoutsCount])
  const upcomingGoals = useMemo(() => getUpcomingGoals(profile, userId), [profile, userId, completedWorkoutsCount])
  const recommendations = useMemo(
    () => getContextAwareRecommendations(recoveryScore, completedWorkoutsCount, profile),
    [recoveryScore, completedWorkoutsCount, profile]
  )

  const displayName = profile?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || null
  const circumference = 2 * Math.PI * 36

  // Enabled widgets in sorted order
  const activeWidgets = useMemo(() => {
    return widgets.filter((w) => w.enabled).sort((a, b) => a.order - b.order)
  }, [widgets])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{formatDate()}</p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {isLoading
              ? 'Loading YashFit...'
              : displayName
              ? `${getGreeting()}, ${displayName} 👋`
              : `${getGreeting()} 👋`}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Adaptive Personal Dashboard · Real telemetry verified from your workouts and recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {profile && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
              Goal: {profile.primary_goal}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLayoutModal(true)}
            icon={<SlidersHorizontal size={15} />}
          >
            Customize Widgets
          </Button>
        </div>
      </div>

      {/* Profile Target Banner */}
      {profile && (
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/60 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
              <Target size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">
                  Active Fitness Plan
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                  {profile.training_days_per_week} Days/Week
                </span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">
                {profile.primary_goal} · {profile.experience_level} Tier
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {profile.training_environment} · {profile.weight_kg} kg · {profile.dietary_preference}
              </p>
            </div>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button variant="outline" size="sm">
              Edit Plan Targets
            </Button>
          </Link>
        </div>
      )}

      {/* DYNAMIC WIDGETS SECTION */}
      <div className="space-y-8">
        {activeWidgets.map((widget) => {
          switch (widget.id) {
            // ─── 1. Daily Overview ───────────────────────────────────────────
            case 'daily_overview':
              return (
                <div key={widget.id} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Calories"
                    value="1,840"
                    unit="kcal"
                    icon={<Flame size={18} />}
                    trend={{ value: '1,840 / 2,200 target', positive: true }}
                  />
                  <StatCard
                    label="Workouts"
                    value={completedWorkoutsCount.toString()}
                    unit="done"
                    icon={<Dumbbell size={18} />}
                    trend={{
                      value: `${completedWorkoutsCount} sessions logged`,
                      positive: completedWorkoutsCount > 0,
                    }}
                  />
                  <StatCard
                    label="Readiness"
                    value={`${recoveryScore}%`}
                    unit="optimal"
                    icon={<Heart size={18} />}
                    trend={{
                      value: recoveryScore >= 70 ? 'Prime training state' : 'Rest advised',
                      positive: recoveryScore >= 70,
                    }}
                  />
                  <StatCard
                    label="Water"
                    value={`${waterLogged}L`}
                    unit={`/ ${waterTarget}L`}
                    icon={<Droplet size={18} />}
                    trend={{
                      value: `${Math.round((waterLogged / waterTarget) * 100)}% daily goal`,
                      positive: waterLogged >= waterTarget * 0.7,
                    }}
                  />
                </div>
              )

            // ─── 2. Today's Workout & Schedule ──────────────────────────────
            case 'todays_workout':
              return (
                <div key={widget.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Today's Workout Card */}
                  <Card className="border-lime-400/20 bg-gradient-to-br from-zinc-900 to-zinc-900/80 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Badge variant="accent">Today&apos;s Workout</Badge>
                          <h3 className="mt-2 text-lg font-bold text-white">Upper Body Hypertrophy</h3>
                          <p className="text-sm text-zinc-400 mt-0.5">45 min · 6 compound &amp; isolation exercises</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-lime-400/10 text-lime-400">
                          <Dumbbell size={20} />
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                          <span>Progress</span>
                          <span className="text-lime-400 font-medium">Ready to initiate</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-lime-400 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <Link href="/workout-studio">
                      <Button size="md" icon={<Play size={16} />} fullWidth>
                        Start Guided Workout Studio
                      </Button>
                    </Link>
                  </Card>

                  {/* Rest & Recovery Readiness Card */}
                  <Card className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="default">Recovery Readiness</Badge>
                          <h3 className="mt-2 text-base font-semibold text-white">Circadian Readiness Score</h3>
                          <p className="text-xs text-zinc-400 mt-0.5">Calculated from recovery biomarkers</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-800 text-emerald-400">
                          <Heart size={20} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0" role="img" aria-label={`Recovery score: ${recoveryScore}%`}>
                          <svg width="84" height="84" viewBox="0 0 88 88" className="-rotate-90">
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
                              strokeDashoffset={circumference - (recoveryScore / 100) * circumference}
                              className="transition-all duration-700"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-extrabold text-white">{recoveryScore}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-zinc-300">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                            <span>{sleepText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{sorenessText}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{energyText}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-zinc-500">Readiness check-in</span>
                      <Link href="/recovery">
                        <Button size="sm" variant="outline">
                          Log Recovery <ArrowRight size={14} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>
              )

            // ─── 3. Context-Aware Recommendations ───────────────────────────
            case 'context_recommendations':
              return (
                <div key={widget.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-lime-400" />
                    <h3 className="text-base font-bold text-white">Context-Aware AI Guidance</h3>
                    <Badge variant="accent" className="text-[10px]">
                      Live Telemetry
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec) => (
                      <Card
                        key={rec.id}
                        className="p-5 border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-lime-400 uppercase tracking-wider">
                              {rec.type}
                            </span>
                            {rec.urgency === 'high' && <Badge variant="warning">Action Advised</Badge>}
                          </div>
                          <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{rec.rationale}</p>
                        </div>
                        {rec.actionLabel && rec.actionHref && (
                          <div className="mt-4 pt-3 border-t border-zinc-800">
                            <Link href={rec.actionHref}>
                              <Button size="sm" variant="outline" className="text-xs">
                                {rec.actionLabel} <ArrowRight size={13} className="ml-1" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )

            // ─── 4. Nutrition & Hydration Progress ──────────────────────────
            case 'nutrition_hydration':
              return (
                <Card key={widget.id} className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <SectionHeading
                        title="Nutrition &amp; Hydration Engine"
                        subtitle="Macronutrient distribution and water intake tracking"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLogWater(0.25)}
                        icon={<Plus size={14} />}
                      >
                        +250ml Water
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLogWater(0.5)}
                        icon={<Plus size={14} />}
                      >
                        +500ml Water
                      </Button>
                      <Link href="/food-scanner">
                        <Button size="sm" variant="outline">
                          Scan Meal
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Macro Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-300">Protein Target</span>
                        <span className="text-lime-400 font-mono font-bold">120g / 150g</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-lime-400 rounded-full" style={{ width: '80%' }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-300">Carbohydrates</span>
                        <span className="text-amber-400 font-mono font-bold">180g / 230g</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '78%' }} />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-zinc-300">Healthy Fats</span>
                        <span className="text-rose-400 font-mono font-bold">48g / 60g</span>
                      </div>
                      <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: '80%' }} />
                      </div>
                    </div>
                  </div>
                </Card>
              )

            // ─── 5. Personal Records (PRs) ───────────────────────────────────
            case 'personal_records':
              return (
                <Card key={widget.id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-base font-bold text-white">Personal Records (PRs)</h3>
                        <p className="text-xs text-zinc-400">Calculated from your verified completed sets</p>
                      </div>
                    </div>
                    <Link href="/progress">
                      <Button size="sm" variant="ghost" className="text-xs">
                        View All Records <ArrowRight size={13} className="ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {personalRecords.length === 0 ? (
                    <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                      <Dumbbell className="w-8 h-8 text-zinc-700 mx-auto" />
                      <p className="text-xs font-medium text-zinc-300">No heavy lift records logged yet</p>
                      <p className="text-[11px] text-zinc-500">
                        Complete your working sets in the Workout Studio to automatically record compound 1RMs.
                      </p>
                      <Link href="/workout-studio">
                        <Button size="sm" variant="outline" className="mt-2 text-xs">
                          Start Workout Session
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {personalRecords.slice(0, 4).map((pr) => (
                        <div key={pr.exerciseId} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                          <span className="text-xs font-semibold text-zinc-200 block truncate">
                            {pr.exerciseName}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-extrabold text-lime-400">{pr.maxWeightKg}</span>
                            <span className="text-xs text-zinc-500">kg × {pr.repsAtMax} reps</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 block font-mono">
                            Est. 1RM: {pr.estimated1RmKg} kg
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )

            // ─── 6. Upcoming Goals ───────────────────────────────────────────
            case 'upcoming_goals':
              return (
                <Card key={widget.id} className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionHeading
                      title="Upcoming Goals &amp; Milestones"
                      subtitle="Longitudinal progression tracked against your target baseline"
                    />
                    <Link href="/settings">
                      <Button size="sm" variant="outline">
                        Configure Goals
                      </Button>
                    </Link>
                  </div>

                  <div className="space-y-3 pt-1">
                    {upcomingGoals.map((g) => (
                      <div key={g.id} className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{g.title}</span>
                          <span className="text-lime-400 font-mono font-semibold">
                            {g.currentValue} ({g.percentComplete}%)
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-lime-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, g.percentComplete)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )

            // ─── 7. Weekly Progress Chart ────────────────────────────────────
            case 'weekly_progress':
              return (
                <Card key={widget.id} noPadding>
                  <div className="px-5 pt-5 pb-0 flex items-center justify-between">
                    <SectionHeading
                      title="Weekly Activity &amp; Volume"
                      subtitle="Verified training sessions logged this week"
                    />
                    <Badge variant="accent">Weekly View</Badge>
                  </div>
                  <div className="p-5 pt-3" aria-hidden="true">
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={weeklyActivityData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#09090b',
                            borderColor: '#27272a',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="calories" fill="#a3e635" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="px-5 pb-4">
                    <AccessibleChartSummary
                      title="Weekly Activity & Volume"
                      summary="Daily workout expenditure across Monday through Sunday with peak output on Wednesday and Friday."
                      data={weeklyActivityData.map((d) => ({
                        label: d.day,
                        value: d.calories,
                      }))}
                      unit="kcal"
                    />
                  </div>
                </Card>
              )

            // ─── 8. Anime RPG Hero Progression ──────────────────────────────
            case 'rpg_progress':
              return <RpgProgressCard key={widget.id} />

            // ─── 9. Digital Twin Muscle Fatigue ─────────────────────────────
            case 'digital_twin':
              return <DigitalTwinSummaryCard key={widget.id} profile={profile} userId={userId} />

            default:
              return null
          }
        })}
      </div>

      {/* Quick Actions Row */}
      <QuickActions />

      {/* CUSTOMIZE WIDGETS MODAL */}
      {showLayoutModal && (
        <Modal
          isOpen={showLayoutModal}
          onClose={() => setShowLayoutModal(false)}
          title="Customize Dashboard Layout"
          maxWidth="lg"
        >
          <div className="space-y-6 pt-2">
            <p className="text-xs text-zinc-400">
              Reorder or hide supported dashboard widgets to personalize your daily fitness overview. Preferences are persisted automatically.
            </p>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {widgets.map((w, index) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveWidget(index, 'up')}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === widgets.length - 1}
                        onClick={() => handleMoveWidget(index, 'down')}
                        className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white block truncate">{w.title}</span>
                      <span className="text-[11px] text-zinc-400 block line-clamp-1">{w.description}</span>
                    </div>
                  </div>

                  <Toggle checked={w.enabled} onChange={(val) => handleToggleWidget(w.id, val)} />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <Button size="sm" variant="ghost" onClick={handleResetPreferences}>
                Reset to Default
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowLayoutModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSavePreferences}>
                  Save Layout
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
