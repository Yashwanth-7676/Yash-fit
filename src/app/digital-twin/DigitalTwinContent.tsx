'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  Dumbbell,
  FileText,
  GitCompare,
  HeartPulse,
  History,
  Plus,
  Save,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, Button, Card, Input, SectionHeading, Modal } from '@/components/ui'
import { InteractiveAvatar } from '@/components/digital-twin/InteractiveAvatar'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { INDIAN_FOOD_DATABASE } from '@/data/indianFoods'
import { getUserProfile, isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import {
  buildUnifiedTimeline,
  compareScenarios,
  buildDigitalTwinExport,
  exportTimelineToCsv,
} from '@/lib/digitalTwin/digitalTwin2Service'
import {
  activePlanKey,
  calculateMealBasket,
  calculateScenario,
  forecastExerciseTarget,
  forecastWorkoutMilestone,
  getExerciseProgress,
  getFitnessUserId,
  getMuscleGroup,
  getRoutine,
  getTrainingAdvice,
  measurementHistoryKey,
  parseExerciseLogs,
  readArray,
  recoveryHistoryKey,
  scenarioHistoryKey,
  workoutHistoryKey,
  type BodyMeasurement,
  type RecoveryEntry,
  type TrainingScenario,
  type TwinWorkout,
} from '@/lib/digitalTwin'
import type { EquipmentOption, UserProfile } from '@/types/profile'
import type { MuscleGroup } from '@/types/workout'

const chartTooltipStyle = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '8px',
  color: '#fff',
}

function createScenario(id: string, name: string, routineId: string, sessionsPerWeek: number): TrainingScenario {
  return {
    id,
    name,
    routineId,
    sessionsPerWeek,
    sessionMinutes: getRoutine(routineId).durationMinutes,
    caloriesPerDay: 2200,
    proteinGramsPerDay: 140,
    sleepHours: 7.5,
    restDays: 7 - sessionsPerWeek,
    createdAt: new Date().toISOString(),
  }
}

function ScenarioEditor({
  scenario,
  onChange,
  availableEquipment,
  beginner,
}: {
  scenario: TrainingScenario
  onChange: (patch: Partial<TrainingScenario>) => void
  availableEquipment: EquipmentOption[]
  beginner: boolean
}) {
  const routine = getRoutine(scenario.routineId)
  const budgetFoods = INDIAN_FOOD_DATABASE
    .filter((food) => food.isBudgetFriendly && typeof food.costPerServingInr === 'number')
    .sort((a, b) => (a.costPerServingInr ?? 0) - (b.costPerServingInr ?? 0))
    .slice(0, 12)
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="sr-only" htmlFor={`${scenario.id}-name`}>Scenario name</label>
        <input
          id={`${scenario.id}-name`}
          value={scenario.name}
          maxLength={80}
          onChange={(event) => onChange({ name: event.target.value })}
          className="min-w-0 flex-1 bg-transparent text-base font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded"
          aria-label="Scenario name"
        />
        <Badge variant="default">{scenario.sessionsPerWeek} days/week</Badge>
      </div>
      <label className="block text-xs text-zinc-400">
        Training split / exercise selection
        <select
          value={scenario.routineId}
          onChange={(event) => {
            const routine = getRoutine(event.target.value)
            onChange({ routineId: routine.id, sessionMinutes: routine.durationMinutes, exerciseOverrides: {} })
          }}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-lime-400 focus:outline-none"
        >
          {PRESET_WORKOUT_ROUTINES.map((routine) => (
            <option key={routine.id} value={routine.id}>{routine.name} · {routine.exercises.length} exercises</option>
          ))}
        </select>
      </label>
      <details className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-lime-400">Exercise substitutions</summary>
        <div className="mt-3 space-y-2">
          {routine.exercises.map((exercise) => {
            const alternatives = EXERCISE_DATABASE.filter((option) =>
              option.primaryMuscle === exercise.primaryMuscle &&
              option.id !== exercise.exerciseId &&
              (!availableEquipment.length || option.equipment === 'No Equipment' || availableEquipment.includes(option.equipment)),
            )
            return (
              <label key={exercise.exerciseId} className="block text-xs text-zinc-400">
                Replace {exercise.exerciseName}
                <select
                  value={scenario.exerciseOverrides?.[exercise.exerciseId] ?? ''}
                  onChange={(event) => {
                    const overrides = { ...scenario.exerciseOverrides }
                    if (event.target.value) overrides[exercise.exerciseId] = event.target.value
                    else delete overrides[exercise.exerciseId]
                    onChange({ exerciseOverrides: overrides })
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">Keep current exercise</option>
                  {alternatives.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {option.equipment}{beginner && option.difficulty === 'Beginner' ? ' · Beginner' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )
          })}
          <p className="text-[11px] text-zinc-500">
            Alternatives keep the same primary muscle and use recorded equipment when available.
            {beginner ? ' Beginner-level options are marked where available.' : ''}
          </p>
        </div>
      </details>
      <details className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-lime-400">Affordable Indian food comparison basket</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {budgetFoods.map((food) => (
            <label key={food.id} className="flex items-start gap-2 text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={scenario.foodItemIds?.includes(food.id) ?? false}
                onChange={(event) => {
                  const selected = new Set(scenario.foodItemIds ?? [])
                  if (event.target.checked) selected.add(food.id)
                  else selected.delete(food.id)
                  onChange({ foodItemIds: [...selected] })
                }}
                className="mt-0.5 accent-lime-400"
              />
              <span>{food.name} · ₹{food.costPerServingInr}/{food.servingSize}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">Select example servings from the existing food catalog. This is not a complete daily meal plan; prices are catalog estimates.</p>
      </details>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Sessions per week"
          type="number"
          min={1}
          max={7}
          value={scenario.sessionsPerWeek}
          onChange={(event) => {
            const sessionsPerWeek = Math.min(7, Math.max(1, Number(event.target.value) || 1))
            onChange({ sessionsPerWeek, restDays: 7 - sessionsPerWeek })
          }}
        />
        <Input
          label="Minutes per session"
          type="number"
          min={10}
          max={240}
          value={scenario.sessionMinutes}
          onChange={(event) => onChange({ sessionMinutes: Math.min(240, Math.max(10, Number(event.target.value) || 10)) })}
        />
        <Input
          label="Calories per day"
          type="number"
          min={500}
          max={10000}
          value={scenario.caloriesPerDay}
          onChange={(event) => onChange({ caloriesPerDay: Math.min(10000, Math.max(500, Number(event.target.value) || 500)) })}
        />
        <Input
          label="Protein grams per day"
          type="number"
          min={0}
          max={500}
          value={scenario.proteinGramsPerDay}
          onChange={(event) => onChange({ proteinGramsPerDay: Math.min(500, Math.max(0, Number(event.target.value) || 0)) })}
        />
        <Input
          label="Estimated sleep (hours)"
          type="number"
          min={0}
          max={24}
          step={0.5}
          value={scenario.sleepHours}
          onChange={(event) => onChange({ sleepHours: Math.min(24, Math.max(0, Number(event.target.value) || 0)) })}
        />
        <label className="block text-xs font-medium text-zinc-300">
          Planned rest days
          <select
            value={scenario.restDays}
            onChange={(event) => {
              const restDays = Number(event.target.value)
              onChange({ restDays, sessionsPerWeek: 7 - restDays })
            }}
            className="mt-1 h-10 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:border-lime-400 focus:outline-none"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((days) => <option key={days} value={days}>{days} day{days === 1 ? '' : 's'}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-zinc-500">
        Rest-day count sets the weekly training frequency. Exact day spacing is not modeled.
      </p>
    </Card>
  )
}

export function DigitalTwinContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState('demo-user')
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([])
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [savedScenarios, setSavedScenarios] = useState<TrainingScenario[]>([])
  const [scenarioA, setScenarioA] = useState<TrainingScenario>(createScenario('compare-a', 'Plan A', 'routine-full-body', 3))
  const [scenarioB, setScenarioB] = useState<TrainingScenario>(createScenario('compare-b', 'Plan B', 'routine-push-day', 4))
  const [weightInput, setWeightInput] = useState('')
  const [waistInput, setWaistInput] = useState('')
  const [chestInput, setChestInput] = useState('')
  const [hipsInput, setHipsInput] = useState('')
  const [armInput, setArmInput] = useState('')
  const [selectedExercise, setSelectedExercise] = useState('')
  const [strengthTargetKg, setStrengthTargetKg] = useState('')
  const [avatarMuscle, setAvatarMuscle] = useState<MuscleGroup | null>(null)
  const [applyingScenario, setApplyingScenario] = useState<TrainingScenario | null>(null)
  const [renamingScenario, setRenamingScenario] = useState<TrainingScenario | null>(null)
  const [renameInputValue, setRenameInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'timeline' | 'export'>('overview')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'workout' | 'measurement' | 'recovery'>('all')

  const timelineEvents = useMemo(() => {
    const events = buildUnifiedTimeline(userId, workouts, measurements, recovery)
    if (timelineFilter === 'all') return events
    return events.filter((e) => e.category === timelineFilter)
  }, [userId, timelineFilter, workouts, measurements, recovery])

  const scenarioMatrix = useMemo(() => {
    return compareScenarios([scenarioA, scenarioB])
  }, [scenarioA, scenarioB])

  const handleExportJson = () => {
    const data = buildDigitalTwinExport(userId)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-digital-twin-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Digital Twin JSON exported successfully.')
  }

  const handleExportCsv = () => {
    const timeline = buildUnifiedTimeline(userId)
    const csv = exportTimelineToCsv(timeline)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-timeline-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Unified Timeline CSV exported successfully.')
  }

  useEffect(() => {
    async function loadTwin() {
      try {
        const id = await getFitnessUserId()
        setUserId(id)
        const [loadedProfile] = await Promise.all([getUserProfile(id)])
        setProfile(loadedProfile)

        const userWorkouts = readArray<TwinWorkout>(workoutHistoryKey(id))
        const currentWorkouts = id === 'demo-user' && userWorkouts.length === 0
          ? readArray<TwinWorkout>('yashfit_completed_workouts')
          : userWorkouts
        setWorkouts(currentWorkouts)
        const userRecovery = readArray<RecoveryEntry>(recoveryHistoryKey(id))
        if (id === 'demo-user' && userRecovery.length === 0) {
          const latest = localStorage.getItem('yashfit_latest_recovery')
          if (latest) {
            const entry = JSON.parse(latest) as RecoveryEntry
            setRecovery([entry])
          }
        } else {
          setRecovery(userRecovery)
        }
        const localMeasurements = readArray<BodyMeasurement>(measurementHistoryKey(id))
        setMeasurements(localMeasurements)
        let scenarios = readArray<TrainingScenario>(scenarioHistoryKey(id))
        setSavedScenarios(scenarios)
        if (id !== 'demo-user' && isSupabaseConfigured()) {
          const supabase = createClient()
          const [measurementResult, scenarioResult, workoutResult, recoveryResult] = await Promise.all([
            supabase
              .from('body_measurements')
              .select('id, recorded_at, weight_kg, waist_cm, chest_cm, hips_cm, arm_cm')
              .eq('user_id', id)
              .order('recorded_at', { ascending: false }),
            supabase
              .from('fitness_scenarios')
              .select('id, name, scenario, created_at')
              .eq('user_id', id)
              .order('updated_at', { ascending: false }),
            supabase
              .from('workout_logs')
              .select('routine_name, duration_seconds, total_volume_kg, total_sets_completed, exercise_logs, completed_at')
              .eq('user_id', id)
              .order('completed_at', { ascending: false }),
            supabase
              .from('recovery_logs')
              .select('date, sleep_hours, sleep_quality, soreness, readiness_score')
              .eq('user_id', id)
              .order('date', { ascending: false }),
          ])
          if (measurementResult.error) {
            console.warn('Unable to load cloud body measurements; using browser history:', measurementResult.error.message)
          } else {
            const cloudMeasurements: BodyMeasurement[] = (measurementResult.data ?? []).map((item) => ({
              id: item.id,
              recordedAt: item.recorded_at,
              weightKg: item.weight_kg === null ? undefined : Number(item.weight_kg),
              waistCm: item.waist_cm === null ? undefined : Number(item.waist_cm),
              chestCm: item.chest_cm === null ? undefined : Number(item.chest_cm),
              hipsCm: item.hips_cm === null ? undefined : Number(item.hips_cm),
              armCm: item.arm_cm === null ? undefined : Number(item.arm_cm),
            }))
            setMeasurements(cloudMeasurements)
          }
          if (scenarioResult.error) {
            console.warn('Unable to load cloud scenarios; using browser history:', scenarioResult.error.message)
          } else {
            const cloudScenarios = (scenarioResult.data ?? []).map((item) => ({
              ...(item.scenario as TrainingScenario),
              id: item.id,
              name: item.name,
              createdAt: item.created_at,
            }))
            scenarios = cloudScenarios
            setSavedScenarios(cloudScenarios)
          }
          if (workoutResult.error) {
            console.warn('Unable to load cloud workout history; using browser history:', workoutResult.error.message)
          } else {
            const localDates = new Set(currentWorkouts.map((workout) => Date.parse(workout.date)).filter(Number.isFinite))
            const cloudWorkouts: TwinWorkout[] = (workoutResult.data ?? [])
              .filter((item) => !localDates.has(Date.parse(item.completed_at)))
              .map((item) => ({
                routineName: item.routine_name,
                durationSeconds: item.duration_seconds,
                totalVolume: Number(item.total_volume_kg),
                totalCompletedSets: item.total_sets_completed,
                date: item.completed_at,
                exercises: parseExerciseLogs(item.exercise_logs),
              }))
            setWorkouts([...currentWorkouts, ...cloudWorkouts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)))
          }
          if (recoveryResult.error) {
            console.warn('Unable to load cloud recovery history; using browser history:', recoveryResult.error.message)
          } else {
            const cloudRecovery: RecoveryEntry[] = (recoveryResult.data ?? []).map((item) => ({
              date: item.date,
              sleepHours: Number(item.sleep_hours),
              sleepQuality: item.sleep_quality,
              soreness: item.soreness,
              readinessScore: item.readiness_score,
            }))
            const byDay = new Map<string, RecoveryEntry>()
            ;[...cloudRecovery, ...userRecovery].forEach((entry) => byDay.set(entry.date.slice(0, 10), entry))
            setRecovery([...byDay.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)))
          }
        }
        const preferredRoutine = loadedProfile
          ? PRESET_WORKOUT_ROUTINES.find((routine) =>
            loadedProfile.training_days_per_week <= 3 ? routine.id === 'routine-full-body' : routine.id === 'routine-push-day')
          : PRESET_WORKOUT_ROUTINES[0]
        const initialDays = loadedProfile?.training_days_per_week ?? 3
        const initialRoutine = preferredRoutine?.id ?? PRESET_WORKOUT_ROUTINES[0].id
        if (scenarios.length >= 2) {
          setScenarioA(scenarios[0])
          setScenarioB(scenarios[1])
        } else {
          setScenarioA(createScenario('compare-a', 'Plan A', initialRoutine, initialDays))
          setScenarioB(createScenario('compare-b', 'Plan B', 'routine-full-body', Math.min(7, initialDays + 1)))
        }
      } catch (error) {
        console.error('Unable to load digital twin data:', error)
        setErrorMessage('Some profile data could not be loaded. Recorded local history is still available.')
      } finally {
        setIsLoading(false)
      }
    }
    loadTwin()
  }, [])

  const advice = useMemo(() => getTrainingAdvice(profile, workouts, recovery), [profile, workouts, recovery])
  const progress = useMemo(() => getExerciseProgress(workouts), [workouts])
  const forecastTarget = (Math.floor(workouts.length / 10) + 1) * 10
  const forecast = useMemo(
    () => forecastWorkoutMilestone(workouts, forecastTarget),
    [workouts, forecastTarget],
  )
  const scenarioAEstimate = useMemo(() => calculateScenario(scenarioA, profile?.available_equipment), [scenarioA, profile?.available_equipment])
  const scenarioBEstimate = useMemo(() => calculateScenario(scenarioB, profile?.available_equipment), [scenarioB, profile?.available_equipment])
  const mealBasketA = useMemo(() => calculateMealBasket(scenarioA.foodItemIds), [scenarioA.foodItemIds])
  const mealBasketB = useMemo(() => calculateMealBasket(scenarioB.foodItemIds), [scenarioB.foodItemIds])
  const exerciseOptions = useMemo(() => progress.filter((item) => item.entries.length > 0), [progress])
  const selectedProgress = exerciseOptions.find((item) => item.name === selectedExercise) ?? exerciseOptions[0]
  const strengthForecast = useMemo(
    () => selectedProgress && strengthTargetKg
      ? forecastExerciseTarget(workouts, selectedProgress.name, Number(strengthTargetKg))
      : null,
    [workouts, selectedProgress, strengthTargetKg],
  )
  const handleAvatarMuscleSelect = (muscle: MuscleGroup | null) => {
    setAvatarMuscle(muscle)
    if (muscle) {
      const match = exerciseOptions.find((ex) => {
        const dbEx = EXERCISE_DATABASE.find((e) => e.name === ex.name)
        return dbEx?.primaryMuscle === muscle
      })
      if (match) setSelectedExercise(match.name)
    }
  }
  const today = Date.now()
  const last28Days = workouts.filter((workout) => {
    const date = Date.parse(workout.date)
    return Number.isFinite(date) && date >= today - 28 * 86400000
  })
  const distinctTrainingDays = new Set(last28Days.map((workout) => workout.date.slice(0, 10))).size
  const plannedFourWeekSessions = (profile?.training_days_per_week ?? 0) * 4
  const consistency = plannedFourWeekSessions
    ? Math.min(100, Math.round((distinctTrainingDays / plannedFourWeekSessions) * 100))
    : null

  const weeklyVolume = useMemo(() => {
    const weekMap = new Map<string, { week: string; volume: number; sessions: number }>()
    workouts.forEach((workout) => {
      const time = Date.parse(workout.date)
      if (!Number.isFinite(time)) return
      const date = new Date(time)
      const monday = new Date(date)
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      monday.setHours(0, 0, 0, 0)
      const key = monday.toISOString().slice(0, 10)
      const current = weekMap.get(key) ?? { week: monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), volume: 0, sessions: 0 }
      current.volume += Number(workout.totalVolume) || 0
      current.sessions += 1
      weekMap.set(key, current)
    })
    return [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([, value]) => value)
  }, [workouts])

  const muscleDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    workouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        const muscle = getMuscleGroup(exercise)
        if (!muscle) return
        const sets = exercise.sets.filter((set) => set.completed).length
        counts.set(muscle, (counts.get(muscle) ?? 0) + sets)
      })
    })
    return [...counts.entries()].map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets)
  }, [workouts])

  const weightHistory = useMemo(
    () => measurements
      .filter((entry) => Number.isFinite(entry.weightKg))
      .sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt))
      .map((entry) => ({ date: new Date(entry.recordedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), weight: entry.weightKg })),
    [measurements],
  )
  const recoveryTrend = useMemo(
    () => [...recovery]
      .filter((entry) => Number.isFinite(entry.sleepHours) || Number.isFinite(entry.readinessScore))
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
      .slice(-14)
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        sleep: entry.sleepHours,
        readiness: entry.readinessScore,
      })),
    [recovery],
  )

  const handleSaveMeasurement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = [weightInput, waistInput, chestInput, hipsInput, armInput]
    if (values.every((value) => value.trim() === '')) {
      setErrorMessage('Enter at least one measurement before saving.')
      return
    }
    const parse = (value: string) => value.trim() ? Number(value) : undefined
    const measurement: BodyMeasurement = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      weightKg: parse(weightInput),
      waistCm: parse(waistInput),
      chestCm: parse(chestInput),
      hipsCm: parse(hipsInput),
      armCm: parse(armInput),
    }
    const updated = [measurement, ...measurements]
    try {
      localStorage.setItem(measurementHistoryKey(userId), JSON.stringify(updated))
    } catch (error) {
      console.error('Unable to save body measurement:', error)
      setErrorMessage('Measurement could not be saved. Check available browser storage and try again.')
      return
    }
    setMeasurements(updated)
    setWeightInput('')
    setWaistInput('')
    setChestInput('')
    setHipsInput('')
    setArmInput('')
    setErrorMessage('')
    if (userId !== 'demo-user' && isSupabaseConfigured()) {
      try {
        const { error } = await createClient().from('body_measurements').insert({
          id: measurement.id,
          user_id: userId,
          recorded_at: measurement.recordedAt,
          weight_kg: measurement.weightKg ?? null,
          waist_cm: measurement.waistCm ?? null,
          chest_cm: measurement.chestCm ?? null,
          hips_cm: measurement.hipsCm ?? null,
          arm_cm: measurement.armCm ?? null,
        })
        if (error) {
          console.warn('Unable to sync body measurement to Supabase:', error.message)
          setMessage('Measurement saved in this browser; cloud sync failed. Check the Digital Twin migration and try again.')
          return
        }
      } catch (error) {
        console.warn('Unable to reach Supabase to sync body measurement:', error)
        setMessage('Measurement saved in this browser; the cloud service could not be reached.')
        return
      }
    }
    setMessage(userId === 'demo-user' ? 'Measurement saved to this browser.' : 'Measurement saved to your account.')
  }

  const updateScenario = (
    setter: (scenario: TrainingScenario) => void,
    current: TrainingScenario,
    patch: Partial<TrainingScenario>,
  ) => setter({ ...current, ...patch })

  const saveScenario = async (scenario: TrainingScenario) => {
    const normalized = { ...scenario, name: scenario.name.trim() }
    if (!normalized.name || normalized.name.length > 80) {
      setErrorMessage('Enter a scenario name with 1 to 80 characters before saving.')
      return
    }
    const exists = savedScenarios.some((item) => item.id === normalized.id)
    const saved = exists ? normalized : { ...normalized, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const updated = exists
      ? savedScenarios.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...savedScenarios]
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(updated))
      setSavedScenarios(updated)
      setMessage(exists ? 'Scenario changes saved.' : 'Scenario saved.')
      setErrorMessage('')
    } catch (error) {
      console.error('Unable to save training scenario:', error)
      setErrorMessage('Scenario could not be saved to browser storage.')
      return
    }
    if (userId !== 'demo-user' && isSupabaseConfigured()) {
      try {
        const { error } = await createClient().from('fitness_scenarios').upsert({
          id: saved.id,
          user_id: userId,
          name: saved.name,
          routine_id: saved.routineId,
          scenario: saved,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        if (error) {
          console.warn('Unable to sync saved scenario to Supabase:', error.message)
          setMessage('Scenario saved in this browser; cloud sync failed. Check the Digital Twin migration and try again.')
        }
      } catch (error) {
        console.warn('Unable to reach Supabase to sync training scenario:', error)
        setMessage('Scenario saved in this browser; the cloud service could not be reached.')
      }
    }
  }

  const deleteScenario = async (id: string) => {
    const updated = savedScenarios.filter((scenario) => scenario.id !== id)
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(updated))
      setSavedScenarios(updated)
      setMessage('Scenario deleted.')
    } catch (error) {
      console.error('Unable to delete training scenario:', error)
      setErrorMessage('Scenario could not be deleted.')
      return
    }
    if (userId !== 'demo-user' && isSupabaseConfigured()) {
      try {
        const { error } = await createClient()
          .from('fitness_scenarios')
          .delete()
          .eq('user_id', userId)
          .eq('id', id)
        if (error) {
          console.warn('Unable to delete cloud scenario:', error.message)
          setMessage('Scenario removed from this browser; cloud deletion failed.')
        }
      } catch (error) {
        console.warn('Unable to reach Supabase to delete training scenario:', error)
        setMessage('Scenario removed from this browser; cloud deletion failed.')
      }
    }
  }

  const applyScenario = (scenario: TrainingScenario) => {
    setApplyingScenario(scenario)
  }

  const confirmApplyScenario = (scenario: TrainingScenario) => {
    try {
      localStorage.setItem(activePlanKey(userId), JSON.stringify({
        routineId: scenario.routineId,
        exerciseOverrides: scenario.exerciseOverrides ?? {},
        trainingDaysPerWeek: scenario.sessionsPerWeek,
        scenarioName: scenario.name,
        appliedAt: new Date().toISOString(),
      }))
      setMessage('Plan applied. The Workout Planner will use this split until another plan is applied.')
      setErrorMessage('')
    } catch (error) {
      console.error('Unable to apply training scenario:', error)
      setErrorMessage('The plan could not be applied because browser storage is unavailable.')
    }
  }

  const renameScenario = (scenario: TrainingScenario) => {
    setRenamingScenario(scenario)
    setRenameInputValue(scenario.name)
  }

  if (isLoading) {
    return <div className="max-w-7xl mx-auto py-16 text-center text-sm text-zinc-400" role="status">Loading your recorded fitness data…</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lime-400">
            <Activity size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Personal Fitness Digital Twin</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">Your recorded fitness, in context</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-400">
            A transparent view of your profile, training and check-ins. No body composition or appearance is inferred.
          </p>
        </div>
        <Link href="/workout"><Button variant="outline" icon={<Dumbbell size={16} />}>Open Workout Planner</Button></Link>
      </div>

      {(message || errorMessage) && (
        <div role={errorMessage ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${errorMessage ? 'border-amber-800 bg-amber-950/40 text-amber-200' : 'border-emerald-800 bg-emerald-950/40 text-emerald-200'}`}>
          {errorMessage || message}
          <button type="button" onClick={() => { setMessage(''); setErrorMessage('') }} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      <Card className="border-lime-400/20 bg-gradient-to-r from-zinc-900 to-lime-950/10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div><p className="text-xs text-zinc-500">Current goal</p><p className="mt-1 text-sm font-semibold text-white">{profile?.primary_goal ?? 'Not recorded'}</p><Badge variant="default">Profile data</Badge></div>
          <div><p className="text-xs text-zinc-500">Profile weight</p><p className="mt-1 text-sm font-semibold text-white">{profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not recorded'}</p><Badge variant="default">Profile value · not a trend</Badge></div>
          <div><p className="text-xs text-zinc-500">Training days</p><p className="mt-1 text-sm font-semibold text-white">{profile?.training_days_per_week ? `${profile.training_days_per_week} / week` : 'Not recorded'}</p><Badge variant="default">Profile target</Badge></div>
          <div><p className="text-xs text-zinc-500">4-week consistency</p><p className="mt-1 text-sm font-semibold text-white">{consistency === null ? 'Unavailable' : `${consistency}%`}</p><Badge variant="default">{last28Days.length} logged sessions · calculated</Badge></div>
        </div>
      </Card>

      {/* Tabs for Digital Twin 2.0 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'overview'
              ? 'bg-lime-400 text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Activity size={14} /> Overview & Anatomy
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scenarios'}
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'scenarios'
              ? 'bg-lime-400 text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <GitCompare size={14} /> Scenario Matrix Studio
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'timeline'
              ? 'bg-lime-400 text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <History size={14} /> Unified Timeline
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'export'}
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeTab === 'export'
              ? 'bg-lime-400 text-black shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          <Download size={14} /> Data Export & Disclosures
        </button>
      </div>

      {activeTab === 'overview' && (
      <>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4">
          <SectionHeading title="Adaptive training guidance" subtitle="Deterministic review of your own recent workout and recovery records" />
          <div className="flex gap-3">
            {advice.caution ? <ShieldAlert className="mt-0.5 shrink-0 text-amber-400" size={20} /> : <Sparkles className="mt-0.5 shrink-0 text-lime-400" size={20} />}
            <div className="space-y-3 text-sm">
              <p className="font-semibold text-white">{advice.observation}</p>
              <p><span className="text-zinc-500">Recorded support: </span><span className="text-zinc-300">{advice.evidence}</span></p>
              <p><span className="text-zinc-500">Suggested action: </span><span className="text-lime-300">{advice.action}</span></p>
              <p><span className="text-zinc-500">Why: </span><span className="text-zinc-300">{advice.reason}</span></p>
              <p className="text-xs leading-relaxed text-zinc-500">{advice.limitation}</p>
            </div>
          </div>
          <Link href="/workout" className="inline-flex items-center gap-1 text-sm font-medium text-lime-400 hover:text-lime-300">Review workout options <ArrowRight size={15} /></Link>
        </Card>
        <Card className="space-y-4">
          <SectionHeading title="Next workout milestone" subtitle="A timeline is shown only when recorded history supports a rate" />
          {forecast ? (
            <>
              <p className="text-sm text-zinc-300">Next milestone: <strong className="text-white">{forecastTarget} completed workouts</strong> ({forecast.remainingWorkouts} to go).</p>
              <p className="text-lg font-semibold text-lime-300">{new Date(forecast.earliestDate).toLocaleDateString()} – {new Date(forecast.latestDate).toLocaleDateString()}</p>
              <p className="text-xs text-zinc-500">{forecast.assumption}</p>
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-sm font-medium text-zinc-200">Not enough history for a meaningful timeline yet.</p>
              <p className="mt-1 text-xs text-zinc-500">Record at least 3 completed workouts spanning 14 days. No body-weight forecast is made from sparse records.</p>
            </div>
          )}
          <div className="border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold text-white">Strength target timeline</h3>
            {selectedProgress ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-zinc-400">Enter a future working-set load target for {selectedProgress.name}.</p>
                <Input
                  label="Target load (kg)"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={strengthTargetKg}
                  onChange={(event) => setStrengthTargetKg(event.target.value)}
                />
                {strengthForecast ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                    <p className="text-sm font-semibold text-lime-300">Estimated range: {new Date(strengthForecast.earliestDate).toLocaleDateString()} – {new Date(strengthForecast.latestDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs text-zinc-500">{strengthForecast.assumption}</p>
                  </div>
                ) : <p className="text-xs text-zinc-500">A timeline needs at least 4 logged sessions for this exercise across 28 days, a positive load trend, and a target above the latest load. No estimate is produced otherwise.</p>}
              </div>
            ) : <p className="mt-2 text-xs text-zinc-500">No exercise-level set history yet. Record loads and repetitions in at least 4 sessions across 28 days before setting a strength milestone.</p>}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500"><Target size={14} />Logged milestone count is based on completed sessions; projection is an estimate, not a promise.</div>
        </Card>
      </div>

      <section className="space-y-4" aria-labelledby="measurements-title">
        <SectionHeading title="Body measurements" subtitle="User-recorded measurements only. No inferred body composition or avatar." />
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card>
            <form onSubmit={handleSaveMeasurement} className="space-y-4">
              <h3 className="text-sm font-semibold text-white">Record a measurement</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Weight (kg)" type="number" min={25} max={350} step={0.1} value={weightInput} onChange={(event) => setWeightInput(event.target.value)} />
                <Input label="Waist (cm)" type="number" min={20} max={250} step={0.1} value={waistInput} onChange={(event) => setWaistInput(event.target.value)} />
                <Input label="Chest (cm)" type="number" min={20} max={250} step={0.1} value={chestInput} onChange={(event) => setChestInput(event.target.value)} />
                <Input label="Hips (cm)" type="number" min={20} max={250} step={0.1} value={hipsInput} onChange={(event) => setHipsInput(event.target.value)} />
                <Input label="Arm (cm)" type="number" min={5} max={120} step={0.1} value={armInput} onChange={(event) => setArmInput(event.target.value)} />
              </div>
              <Button type="submit" icon={<Plus size={16} />}>Save measurement</Button>
              <p className="text-xs text-zinc-500">Saved privately in this browser under the current account. You can enter only the measurements you have taken.</p>
            </form>
          </Card>
          <Card noPadding className="min-h-64">
            <div className="flex items-center justify-between px-5 pt-5">
              <SectionHeading title="Recorded weight history" subtitle="Measured entries only · kg" />
              <Scale size={18} className="text-lime-400" />
            </div>
            {weightHistory.length ? (
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightHistory}>
                    <defs><linearGradient id="twinWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a3e635" stopOpacity={0.25} /><stop offset="95%" stopColor="#a3e635" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <YAxis domain={['auto', 'auto']} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#a3e635" fill="url(#twinWeight)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="px-5 pb-6 text-sm text-zinc-500">No recorded weight history yet. Your profile weight is shown separately above and is not treated as a history series.</p>}
          </Card>
        </div>
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-white">Latest recorded measurements</h3>
          {measurements.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="text-zinc-500"><tr><th className="pb-2">Date</th><th>Weight kg</th><th>Waist cm</th><th>Chest cm</th><th>Hips cm</th><th>Arm cm</th></tr></thead>
                <tbody>{measurements.slice(0, 8).map((item) => <tr key={item.id} className="border-t border-zinc-800 text-zinc-300"><td className="py-2">{new Date(item.recordedAt).toLocaleDateString()}</td><td>{item.weightKg ?? '—'}</td><td>{item.waistCm ?? '—'}</td><td>{item.chestCm ?? '—'}</td><td>{item.hipsCm ?? '—'}</td><td>{item.armCm ?? '—'}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p className="text-sm text-zinc-500">No measurements recorded.</p>}
        </Card>
      </section>

      {/* Interactive 3D / SVG Humanoid Anatomy Avatar */}
      <section className="space-y-4" aria-labelledby="anatomy-avatar-title">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <SectionHeading
            title="Muscular Anatomy & Recovery Avatar"
            subtitle="Interactive body schematic reflecting completed set volume and recovery readiness per muscle group"
          />
          <div className="flex items-center gap-2">
            <Badge variant="accent">Schematic View</Badge>
            <Badge variant="default">Deterministic</Badge>
          </div>
        </div>
        <InteractiveAvatar
          workouts={workouts}
          recovery={recovery}
          selectedMuscle={avatarMuscle}
          onSelectMuscle={handleAvatarMuscleSelect}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card noPadding className="min-h-72">
          <div className="px-5 pt-5"><SectionHeading title="Weekly training volume" subtitle="Recorded lifted volume and sessions; kg × reps from completed sets" /></div>
          {weeklyVolume.length ? (
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="week" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis yAxisId="volume" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar yAxisId="volume" dataKey="volume" name="Volume (kg × reps)" fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="px-5 pb-6 text-sm text-zinc-500">No completed workout history is available for this account yet.</p>}
        </Card>
        <Card noPadding className="min-h-72">
          <div className="px-5 pt-5"><SectionHeading title="Muscle-group distribution" subtitle="Completed sets by recorded exercise muscle group" /></div>
          {muscleDistribution.length ? (
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={muscleDistribution} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis type="category" dataKey="muscle" width={80} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="sets" name="Completed sets" fill="#a3e635" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="px-5 pb-6 text-sm text-zinc-500">Exercise-level set data is missing. New workout logs will populate this distribution.</p>}
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card noPadding className="min-h-72">
          <div className="flex items-center justify-between gap-2 px-5 pt-5">
            <SectionHeading title="Exercise strength progression" subtitle="Best completed set load; no estimated 1RM" />
            {exerciseOptions.length > 0 && (
              <select
                value={selectedProgress?.name ?? ''}
                onChange={(event) => setSelectedExercise(event.target.value)}
                aria-label="Choose exercise strength history"
                className="max-w-40 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-white"
              >
                {exerciseOptions.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            )}
          </div>
          {selectedProgress ? (
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedProgress.entries.map((entry) => ({ ...entry, date: new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line type="monotone" dataKey="weightKg" name="Load (kg)" stroke="#a3e635" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="px-5 pb-6 text-sm text-zinc-500">No exercise-level sets have been recorded. Log completed weights and reps in workout sessions to show progression.</p>}
        </Card>
        <Card noPadding className="min-h-72">
          <div className="px-5 pt-5"><SectionHeading title="Sleep and recovery" subtitle="Self-reported recovery check-ins; readiness is calculated by the existing tracker" /></div>
          {recoveryTrend.length ? (
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recoveryTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis yAxisId="sleep" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <YAxis yAxisId="readiness" orientation="right" domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Line yAxisId="sleep" type="monotone" dataKey="sleep" name="Sleep (hours)" stroke="#60a5fa" connectNulls />
                  <Line yAxisId="readiness" type="monotone" dataKey="readiness" name="Readiness / 100" stroke="#a3e635" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="px-5 pb-6 text-sm text-zinc-500">Recovery history is missing. Log check-ins in Recovery to build a trend; no sample values are shown.</p>}
        </Card>
      </section>

      <Card className="flex items-start gap-3">
        <HeartPulse className="mt-0.5 shrink-0 text-rose-400" size={19} />
        <div>
          <h2 className="text-sm font-semibold text-white">Nutrition and recovery data availability</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Nutrition targets can be used in scenario comparisons, but actual meal adherence history is not recorded by this app. Hydration currently has only a daily value, not a dated trend. No nutrition adherence or hydration forecast is inferred.
          </p>
          <Link href="/nutrition" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-lime-400">Review nutrition targets <ArrowRight size={14} /></Link>
        </div>
      </Card>
      </>
      )}

      {activeTab === 'scenarios' && (
      <section className="space-y-4" aria-labelledby="scenario-comparison">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading title="Training and nutrition scenario simulator" subtitle="Compare transparent plan inputs, not predicted body changes or guaranteed outcomes" />
          <span className="text-xs text-zinc-500">Scenarios are separate from recorded history</span>
        </div>

        {/* Side-by-side matrix summary */}
        <div className="grid gap-4 md:grid-cols-2">
          {scenarioMatrix.metrics.map((item) => (
            <Card key={item.scenarioId} className="border-zinc-800 bg-zinc-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{item.scenarioName}</h4>
                <Badge
                  variant={
                    item.projectedWeeklyStimulus === 'optimal'
                      ? 'accent'
                      : item.projectedWeeklyStimulus === 'high_fatigue'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {item.projectedWeeklyStimulus === 'optimal'
                    ? 'Optimal Stimulus'
                    : item.projectedWeeklyStimulus === 'high_fatigue'
                    ? 'High Fatigue Risk'
                    : item.projectedWeeklyStimulus === 'low'
                    ? 'Low Stimulus'
                    : 'Moderate Stimulus'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                <div className="rounded bg-zinc-900/80 p-2">
                  <span className="text-zinc-500 block">Weekly Volume</span>
                  <span className="font-semibold text-white">{item.weeklyVolumeSets} working sets</span>
                </div>
                <div className="rounded bg-zinc-900/80 p-2">
                  <span className="text-zinc-500 block">Training Time</span>
                  <span className="font-semibold text-white">{item.weeklyMinutes} min / week</span>
                </div>
                <div className="rounded bg-zinc-900/80 p-2">
                  <span className="text-zinc-500 block">Rest Days</span>
                  <span className="font-semibold text-white">{item.restDays} days / week</span>
                </div>
                <div className="rounded bg-zinc-900/80 p-2">
                  <span className="text-zinc-500 block">Nutrition Fuel</span>
                  <span className="font-semibold text-white">{item.dailyCalories} kcal · {item.dailyProteinGrams}g P</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <ScenarioEditor
            scenario={scenarioA}
            onChange={(patch) => updateScenario(setScenarioA, scenarioA, patch)}
            availableEquipment={profile?.available_equipment ?? []}
            beginner={profile?.experience_level === 'Beginner'}
          />
          <ScenarioEditor
            scenario={scenarioB}
            onChange={(patch) => updateScenario(setScenarioB, scenarioB, patch)}
            availableEquipment={profile?.available_equipment ?? []}
            beginner={profile?.experience_level === 'Beginner'}
          />
        </div>
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-white">Side-by-side comparison</h3>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" icon={<Save size={14} />} onClick={() => saveScenario(scenarioA)}>Save Plan A</Button>
              <Button size="sm" variant="outline" icon={<Save size={14} />} onClick={() => saveScenario(scenarioB)}>Save Plan B</Button>
              <Button size="sm" icon={<Check size={14} />} onClick={() => applyScenario(scenarioA)}>Apply Plan A</Button>
              <Button size="sm" icon={<Check size={14} />} onClick={() => applyScenario(scenarioB)}>Apply Plan B</Button>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-56">
              <p className="mb-2 text-xs text-zinc-500">Approximate planned weekly working sets</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: scenarioA.name || 'Plan A', sets: scenarioAEstimate.weeklySets },
                  { name: scenarioB.name || 'Plan B', sets: scenarioBEstimate.weeklySets },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="sets" name="Planned sets" fill="#a3e635" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-56">
              <p className="mb-2 text-xs text-zinc-500">Planned weekly time (minutes)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: scenarioA.name || 'Plan A', minutes: scenarioAEstimate.weeklyMinutes },
                  { name: scenarioB.name || 'Plan B', minutes: scenarioBEstimate.weeklyMinutes },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="minutes" name="Minutes per week" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[{ scenario: scenarioA, estimate: scenarioAEstimate, basket: mealBasketA }, { scenario: scenarioB, estimate: scenarioBEstimate, basket: mealBasketB }].map(({ scenario, estimate, basket }) => (
              <div key={scenario.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                <p className="mb-1 font-semibold text-white">{scenario.name || 'Unnamed plan'} · {getRoutine(scenario.routineId).name}</p>
                <p>{estimate.weeklySets} planned sets · {estimate.weeklyMinutes} min/week · {estimate.restDays} rest days · {scenario.caloriesPerDay} kcal/day · {scenario.proteinGramsPerDay}g protein · {scenario.sleepHours}h estimated sleep</p>
                <p className="mt-1">Food basket: {basket.servings} servings · {basket.calories} kcal · {basket.proteinGrams}g protein · {basket.costInr === null ? 'catalog cost unavailable' : `₹${basket.costInr} per selected serving set`}</p>
                <details className="mt-2"><summary className="cursor-pointer text-lime-400">Assumptions and limitations</summary><ul className="mt-2 list-disc space-y-1 pl-4">{estimate.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={17} className="text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Saved scenarios</h3>
          </div>
          {savedScenarios.length ? (
            <ul className="divide-y divide-zinc-800">
              {savedScenarios.map((scenario) => (
                <li key={scenario.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="text-sm font-medium text-white">{scenario.name}</p><p className="text-xs text-zinc-500">{getRoutine(scenario.routineId).name} · {scenario.sessionsPerWeek} sessions/week · {scenario.caloriesPerDay} kcal/day</p></div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setScenarioA(scenario)}>Load as Plan A</Button>
                    <Button size="sm" variant="outline" onClick={() => setScenarioB(scenario)}>Load as Plan B</Button>
                    <Button size="sm" variant="ghost" onClick={() => renameScenario(scenario)}>Rename / edit</Button>
                    <Button size="sm" variant="destructive" icon={<Trash2 size={14} />} onClick={() => deleteScenario(scenario.id)}>Delete</Button>
                    <Button size="sm" onClick={() => applyScenario(scenario)}>Apply…</Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-zinc-500">No saved scenarios. Adjust Plan A or B and save it here.</p>}
          <p className="mt-3 text-xs text-zinc-500">Saved scenarios are private to this browser and account key. Applying a scenario always asks for confirmation first.</p>
        </Card>
      </section>
      )}

      {activeTab === 'timeline' && (
      <section className="space-y-4" aria-labelledby="timeline-heading">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SectionHeading
            title="Unified Historical Fitness Timeline"
            subtitle="Audit trail of real recorded entries distinguished from model estimates"
          />
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(['all', 'workout', 'measurement', 'recovery'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setTimelineFilter(filter)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  timelineFilter === filter
                    ? 'bg-lime-400 text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {timelineEvents.map((evt) => (
            <Card key={evt.id} className="border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono text-zinc-500">
                    {new Date(evt.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <Badge variant={evt.isMeasured ? 'accent' : 'info'}>
                    {evt.isMeasured ? 'Measured Actual' : 'Estimated Model'}
                  </Badge>
                  <Badge variant="default" className="capitalize">
                    {evt.category}
                  </Badge>
                </div>
                <span className="text-xs text-zinc-500">Source: {evt.source.replace(/_/g, ' ')}</span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-white">{evt.title}</h4>
              <p className="mt-1 text-xs text-zinc-300">{evt.summary}</p>
            </Card>
          ))}
          {timelineEvents.length === 0 && (
            <Card className="text-center py-8 text-zinc-500 text-sm">
              No fitness logs found in this category.
            </Card>
          )}
        </div>
      </section>
      )}

      {activeTab === 'export' && (
      <section className="space-y-5" aria-labelledby="export-heading">
        <SectionHeading
          title="Digital Twin Data Export & Scientific Limitations"
          subtitle="Export complete audit history and review algorithmic assumptions"
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText size={16} className="text-lime-400" /> Export Unified Timeline (CSV)
            </h4>
            <p className="text-xs text-zinc-400">
              Download your complete history of completed workouts, body measurements, and recovery entries formatted for spreadsheets.
            </p>
            <Button variant="outline" icon={<Download size={15} />} onClick={handleExportCsv}>
              Download Timeline CSV
            </Button>
          </Card>
          <Card className="space-y-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Download size={16} className="text-lime-400" /> Export Complete Digital Twin (JSON)
            </h4>
            <p className="text-xs text-zinc-400">
              Full machine-readable bundle containing your profile targets, saved scenarios, and logged event history with explicit disclaimers.
            </p>
            <Button variant="primary" icon={<Download size={15} />} onClick={handleExportJson}>
              Download Twin JSON
            </Button>
          </Card>
        </div>

        <Card className="border-amber-900/30 bg-amber-950/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert size={18} />
            <h4 className="text-sm font-semibold">Forecast Uncertainty & Scientific Disclosures</h4>
          </div>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-5">
            <li>All projections are mathematical models based on recorded set tonnage and self-reported recovery check-ins; they are not physiological promises or medical guarantees.</li>
            <li>Metabolic and caloric values do not account for non-exercise physical activity (NEAT) fluctuations or clinical metabolic variances.</li>
            <li>Strength progression estimates require consistent biomechanics and identical equipment calibration.</li>
            <li>YashFit never shares or sells your personal fitness telemetry without your explicit authenticated consent.</li>
          </ul>
        </Card>
      </section>
      )}

      <footer className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-xs leading-relaxed text-zinc-500">
        <Clock3 className="mr-1 inline-block" size={14} />
        Historical records are user-entered/local records; missing entries are not imputed. Workout milestone timelines use logged session frequency only when at least 3 sessions span 14 days and include an uncertainty range. Scenario totals are planning arithmetic, not physiological predictions. Profile measurements and calculated metrics are labeled separately.
      </footer>

      {/* Confirm Plan Application Modal */}
      <Modal
        isOpen={applyingScenario !== null}
        onClose={() => setApplyingScenario(null)}
        title="Apply Plan to Active Workout Planner"
        description="Confirm changing your active workout split and frequency in YashFit."
        maxWidth="md"
      >
        {applyingScenario && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Scenario Name</span>
                <span className="text-sm font-semibold text-white">{applyingScenario.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Routine Split</span>
                <span className="text-sm font-semibold text-lime-400">
                  {getRoutine(applyingScenario.routineId).name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Weekly Frequency</span>
                <span className="text-sm font-semibold text-white">
                  {applyingScenario.sessionsPerWeek} sessions/week
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Session Duration</span>
                <span className="text-sm font-semibold text-white">
                  {applyingScenario.sessionMinutes} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Rest Days</span>
                <span className="text-sm font-semibold text-zinc-300">
                  {applyingScenario.restDays} rest days/week
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Applying this scenario updates your active workout schedule in the Workout Planner. You can switch back or apply a different scenario at any time.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setApplyingScenario(null)}>
                Cancel
              </Button>
              <Button
                icon={<Check size={16} />}
                onClick={() => {
                  confirmApplyScenario(applyingScenario)
                  setApplyingScenario(null)
                }}
              >
                Confirm &amp; Apply Plan
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rename Scenario Modal */}
      <Modal
        isOpen={renamingScenario !== null}
        onClose={() => setRenamingScenario(null)}
        title="Rename Saved Scenario"
        description="Enter a descriptive label for this training & nutrition comparison."
        maxWidth="sm"
      >
        {renamingScenario && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (renameInputValue.trim()) {
                saveScenario({ ...renamingScenario, name: renameInputValue.trim() })
                setRenamingScenario(null)
              }
            }}
            className="space-y-4"
          >
            <Input
              label="Scenario Name"
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              maxLength={80}
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setRenamingScenario(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Name
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
