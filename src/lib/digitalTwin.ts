import { EXERCISE_DATABASE } from '../data/exercises'
import { PRESET_WORKOUT_ROUTINES } from '../data/routines'
import { INDIAN_FOOD_DATABASE } from '../data/indianFoods'
import { isSupabaseConfigured } from './profileService'
import { createClient } from './supabase/client'
import type { EquipmentOption, UserProfile } from '../types/profile'
import type { MuscleGroup, WorkoutRoutine } from '../types/workout'

export interface TwinSet {
  weightKg: number
  reps: number
  completed: boolean
}

export interface TwinExerciseLog {
  exerciseId: string
  exerciseName: string
  primaryMuscle?: MuscleGroup
  sets: TwinSet[]
}

export interface TwinWorkout {
  routineName: string
  durationSeconds: number
  totalVolume: number
  totalCompletedSets: number
  date: string
  exercises?: TwinExerciseLog[]
}

export interface RecoveryEntry {
  date: string
  sleepHours: number
  sleepQuality?: number
  soreness?: string
  readinessScore?: number
}

export interface BodyMeasurement {
  id: string
  recordedAt: string
  weightKg?: number
  waistCm?: number
  chestCm?: number
  hipsCm?: number
  armCm?: number
}

export interface TrainingScenario {
  id: string
  name: string
  routineId: string
  sessionsPerWeek: number
  sessionMinutes: number
  caloriesPerDay: number
  proteinGramsPerDay: number
  sleepHours: number
  restDays: number
  exerciseOverrides?: Record<string, string>
  foodItemIds?: string[]
  createdAt: string
}

export interface ScenarioEstimate {
  weeklySets: number
  weeklyMinutes: number
  restDays: number
  muscleSets: { muscle: string; sets: number }[]
  assumptions: string[]
}

export interface MealBasketEstimate {
  servings: number
  calories: number
  proteinGrams: number
  costInr: number | null
}

export interface TrainingAdvice {
  observation: string
  evidence: string
  action: string
  reason: string
  limitation: string
  caution: boolean
}

export interface MilestoneForecast {
  remainingWorkouts: number
  earliestDate: string
  latestDate: string
  assumption: string
}

export interface StrengthForecast {
  earliestDate: string
  latestDate: string
  observations: number
  assumption: string
}

export const workoutHistoryKey = (userId: string) => `yashfit_completed_workouts_${userId}`
export const recoveryHistoryKey = (userId: string) => `yashfit_recovery_history_${userId}`
export const measurementHistoryKey = (userId: string) => `yashfit_body_measurements_${userId}`
export const scenarioHistoryKey = (userId: string) => `yashfit_training_scenarios_${userId}`
export const activePlanKey = (userId: string) => `yashfit_active_training_plan_${userId}`
export const dailyWaterKey = (userId: string) => `yashfit_daily_water_${userId}`
export const waterTargetKey = (userId: string) => `yashfit_water_target_${userId}`

export async function getFitnessUserId(): Promise<string> {
  if (!isSupabaseConfigured()) return 'demo-user'
  const { data, error } = await createClient().auth.getUser()
  if (error) throw error
  return data.user?.id ?? 'demo-user'
}

const muscleNames: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
]

export function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value as T[] : []
  } catch (error) {
    console.warn(`Unable to read stored fitness history "${key}":`, error)
    return []
  }
}

export function parseExerciseLogs(value: unknown): TwinExerciseLog[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry): TwinExerciseLog[] => {
    if (!entry || typeof entry !== 'object') return []
    const candidate = entry as Record<string, unknown>
    if (typeof candidate.exerciseId !== 'string' || typeof candidate.exerciseName !== 'string' ||
      !Array.isArray(candidate.sets)) return []
    const sets = candidate.sets.flatMap((set): TwinSet[] => {
      if (!set || typeof set !== 'object') return []
      const item = set as Record<string, unknown>
      if ((typeof item.weightKg !== 'number' && typeof item.weightKg !== 'string') ||
        (typeof item.reps !== 'number' && typeof item.reps !== 'string')) return []
      const weightKg = Number(item.weightKg)
      const reps = Number(item.reps)
      return Number.isFinite(weightKg) && weightKg >= 0 && Number.isFinite(reps) && reps > 0
        ? [{ weightKg, reps, completed: item.completed === true }]
        : []
    })
    const primaryMuscle = typeof candidate.primaryMuscle === 'string' &&
      muscleNames.includes(candidate.primaryMuscle as MuscleGroup)
      ? candidate.primaryMuscle as MuscleGroup
      : undefined
    return [{ exerciseId: candidate.exerciseId, exerciseName: candidate.exerciseName, primaryMuscle, sets }]
  })
}

export function getRoutine(routineId: string): WorkoutRoutine {
  return PRESET_WORKOUT_ROUTINES.find((routine) => routine.id === routineId) ?? PRESET_WORKOUT_ROUTINES[0]
}

export function applyExerciseOverrides(
  routine: WorkoutRoutine,
  overrides: Record<string, string> | undefined,
  availableEquipment?: EquipmentOption[],
): WorkoutRoutine {
  if (!overrides) return routine
  return {
    ...routine,
    exercises: routine.exercises.map((item) => {
      const replacement = EXERCISE_DATABASE.find((exercise) => exercise.id === overrides[item.exerciseId])
      if (!replacement || replacement.primaryMuscle !== item.primaryMuscle) return item
      if (availableEquipment?.length &&
        replacement.equipment !== 'No Equipment' &&
        !availableEquipment.includes(replacement.equipment)) return item
      return {
        ...item,
        exerciseId: replacement.id,
        exerciseName: replacement.name,
        equipment: replacement.equipment,
      }
    }),
  }
}

export function calculateScenario(
  scenario: TrainingScenario,
  availableEquipment?: EquipmentOption[],
): ScenarioEstimate {
  const routine = applyExerciseOverrides(getRoutine(scenario.routineId), scenario.exerciseOverrides, availableEquipment)
  const sessions = Number.isFinite(scenario.sessionsPerWeek)
    ? Math.min(7, Math.max(1, Math.round(scenario.sessionsPerWeek)))
    : 1
  const sessionMinutes = Number.isFinite(scenario.sessionMinutes)
    ? Math.max(1, Math.round(scenario.sessionMinutes))
    : routine.durationMinutes
  const muscleSets = muscleNames.map((muscle) => ({
    muscle,
    sets: routine.exercises
      .filter((exercise) => exercise.primaryMuscle === muscle)
      .reduce((total, exercise) => total + exercise.targetSets, 0) * sessions,
  })).filter((entry) => entry.sets > 0)

  return {
    weeklySets: routine.exercises.reduce((total, exercise) => total + exercise.targetSets, 0) * sessions,
    weeklyMinutes: sessionMinutes * sessions,
    restDays: 7 - sessions,
    muscleSets,
    assumptions: [
      `${routine.name} is repeated ${sessions} time${sessions === 1 ? '' : 's'} per week.`,
      'Weekly sets are planned sets from the selected routine; completed work and lifted tonnage may differ.',
      'Calories, protein and sleep are user-entered targets, not measured adherence or predicted outcomes.',
      'Rest days are calculated as seven days minus training sessions; spacing and session fatigue are not modeled.',
    ],
  }
}

export function calculateMealBasket(foodItemIds: string[] = []): MealBasketEstimate {
  const selected = INDIAN_FOOD_DATABASE.filter((food) => foodItemIds.includes(food.id))
  return {
    servings: selected.length,
    calories: selected.reduce((sum, food) => sum + food.calories, 0),
    proteinGrams: selected.reduce((sum, food) => sum + food.proteinGrams, 0),
    costInr: selected.length && selected.every((food) => typeof food.costPerServingInr === 'number')
      ? selected.reduce((sum, food) => sum + (food.costPerServingInr ?? 0), 0)
      : null,
  }
}

export function getMuscleGroup(record: TwinExerciseLog): MuscleGroup | undefined {
  if (record.primaryMuscle) return record.primaryMuscle
  return EXERCISE_DATABASE.find((exercise) => exercise.id === record.exerciseId)?.primaryMuscle
}

export function getTrainingAdvice(
  profile: UserProfile | null,
  workouts: TwinWorkout[],
  recovery: RecoveryEntry[],
): TrainingAdvice {
  const latestRecovery = [...recovery]
    .filter((entry) => (Number.isFinite(entry.readinessScore) || Number.isFinite(entry.sleepHours)) && Number.isFinite(Date.parse(entry.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0]
  const latestSoreness = latestRecovery?.soreness?.toLowerCase()
  const recoveryIsRecent = Boolean(latestRecovery && Number.isFinite(Date.parse(latestRecovery.date)) &&
    Date.now() - Date.parse(latestRecovery.date) <= 14 * 86400000)
  const recoveryCaution =
    recoveryIsRecent && (
      (typeof latestRecovery?.readinessScore === 'number' && latestRecovery.readinessScore < 50) ||
      (typeof latestRecovery?.sleepHours === 'number' && latestRecovery.sleepHours < 6) ||
      latestSoreness === 'severe' ||
      latestSoreness === 'high'
    )

  if (recoveryCaution) {
    const signals = [
      typeof latestRecovery?.readinessScore === 'number' ? `readiness ${latestRecovery.readinessScore}/100` : '',
      typeof latestRecovery?.sleepHours === 'number' ? `${latestRecovery.sleepHours} hours sleep` : '',
      latestRecovery?.soreness ? `${latestRecovery.soreness.toLowerCase()} soreness` : '',
    ].filter(Boolean).join(', ')
    return {
      observation: 'Recent recovery data suggests caution.',
      evidence: signals || 'A recovery check-in was recorded.',
      action: 'Consider a rest day or reduce planned sets; avoid increasing loads today.',
      reason: 'Low readiness, short sleep, or high soreness can signal that a normal session may be harder to recover from.',
      limitation: 'This is a conservative training suggestion based only on your latest self-reported check-in, not a medical assessment.',
      caution: true,
    }
  }

  if (workouts.length < 2) {
    return {
      observation: 'There is not enough workout history for a progression recommendation.',
      evidence: `${workouts.length} completed workout${workouts.length === 1 ? '' : 's'} recorded for this account.`,
      action: 'Log your next sessions, including completed exercises, sets, repetitions, and loads.',
      reason: 'Comparing multiple sessions is necessary to distinguish progress from a single observation.',
      limitation: 'No increase in training load is suggested until recent performance and recovery can be compared.',
      caution: false,
    }
  }

  const recent = [...workouts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4)
  const recentSets = recent.reduce((total, workout) => total + (workout.totalCompletedSets || 0), 0)
  const expectedDays = profile?.training_days_per_week
  const sessionDays = new Set(recent.map((workout) => workout.date.slice(0, 10))).size
  const progression = PRESET_WORKOUT_ROUTINES.flatMap((routine) => routine.exercises.map((prescription) => {
    const sessions = [...workouts]
      .filter((workout) => workout.routineName === routine.name)
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .map((workout) => ({
        workout,
        sets: workout.exercises?.find((exercise) => exercise.exerciseId === prescription.exerciseId)
          ?.sets.filter((set) => set.completed && set.weightKg >= 0 && set.reps > 0) ?? [],
      }))
      .filter((entry) => entry.sets.length > 0)
    return { prescription, sessions: sessions.slice(0, 2) }
  })).find((item) => item.sessions.length === 2)

  if (progression) {
    const [latest, previous] = progression.sessions
    const topRepRange = Number(prescriptionRangeUpperBound(progression.prescription.targetReps))
    const currentBest = [...latest.sets].sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0]
    const previousBest = [...previous.sets].sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0]
    const performanceDeclined = currentBest.weightKg < previousBest.weightKg ||
      (currentBest.weightKg === previousBest.weightKg && currentBest.reps < previousBest.reps)
    const reachedTopOfRange = Number.isFinite(topRepRange) &&
      latest.sets.every((set) => set.reps >= topRepRange)
    const beginnerNote = profile?.experience_level === 'Beginner'
      ? ' Keep technique controlled and stop with repetitions in reserve; use a beginner-friendly variation if form is not consistent.'
      : ''
    const evidence = `${progression.prescription.exerciseName}: latest best set ${currentBest.weightKg} kg × ${currentBest.reps} reps on ${latest.workout.date.slice(0, 10)}; prior best ${previousBest.weightKg} kg × ${previousBest.reps} reps.`

    if (performanceDeclined) {
      return {
        observation: 'Recent exercise performance dipped; hold off on increasing load.',
        evidence,
        action: `Keep ${progression.prescription.exerciseName} at the current or a lighter load and prioritize recovery before progressing.`,
        reason: 'The latest best set was below the previous logged session, so adding load now would not be supported by the recent record.',
        limitation: 'This compares only the two most recent logged sessions for this exercise and does not account for form, equipment differences, or unlogged fatigue.',
        caution: true,
      }
    }

    if (!recoveryIsRecent) {
      return {
        observation: 'Recent recovery data is missing, so load progression is on hold.',
        evidence,
        action: 'Keep the current load and record a current sleep and soreness check-in before considering an increase.',
        reason: 'The recent workout sets alone do not show whether training is being recovered from.',
        limitation: 'No increase is recommended without a recovery check-in from the last 14 days.',
        caution: true,
      }
    }

    if (reachedTopOfRange && currentBest.weightKg > 0) {
      const increaseKg = Math.max(0.1, Math.round(currentBest.weightKg * 0.025 * 10) / 10)
      return {
        observation: 'Recent logged sets reached the top of the prescribed rep range without a recorded performance drop.',
        evidence,
        action: `If recovery remains good and form is consistent, consider only a small ${increaseKg} kg increase (about 2.5%, rounded to 0.1 kg) next time; keep the change user-approved.${beginnerNote}`,
        reason: 'A small increase is suggested only after recorded sets reached the current routine’s upper rep target across two sessions.',
        limitation: 'Loads and reps are self-entered; the app cannot verify technique or available equipment increments and never changes the plan automatically.',
        caution: false,
      }
    }

    return {
      observation: 'Keep the current exercise load while building repetitions.',
      evidence,
      action: `Repeat the current load for ${progression.prescription.exerciseName} and work toward ${progression.prescription.targetReps} with consistent form.${beginnerNote}`,
      reason: 'The logged sets have not yet reached the top of the routine’s rep range, so there is no data-based reason to add load.',
      limitation: 'Only completed set entries are compared; effort, technique, and unlogged sessions are not available.',
      caution: false,
    }
  }

  return {
    observation: 'Recent training has been logged consistently enough to review.',
    evidence: `${recent.length} recent sessions, ${recentSets} completed sets, and ${sessionDays} distinct training date${sessionDays === 1 ? '' : 's'} recorded. Profile goal: ${profile?.primary_goal ?? 'not recorded'}.`,
    action: recovery.length === 0
      ? 'Keep the current plan steady and add a recovery check-in before considering progression.'
      : 'Keep the current routine; only consider a small load increase after completing the top of the rep range with good form.',
    reason: 'Small changes are easier to assess against your next logged session than large jumps in load or volume.',
    limitation: `The workout history currently contains summary data${recent.some((workout) => workout.exercises?.length) ? ' and exercise sets' : ' without exercise-level sets'}. ${expectedDays ? `Your profile target is ${expectedDays} sessions per week.` : ''} No automatic plan changes are made.`,
    caution: false,
  }

  function prescriptionRangeUpperBound(targetReps: string): number {
    const matches = targetReps.match(/\d+/g)
    return matches ? Number(matches[matches.length - 1]) : Number.NaN
  }
}

export function forecastWorkoutMilestone(
  workouts: TwinWorkout[],
  milestoneCount: number,
  now = new Date(),
): MilestoneForecast | null {
  const validDates = workouts
    .map((workout) => Date.parse(workout.date))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  if (validDates.length < 3 || validDates[validDates.length - 1] - validDates[0] < 14 * 86400000) return null

  const elapsedWeeks = (validDates[validDates.length - 1] - validDates[0]) / (7 * 86400000)
  const weeklyRate = validDates.length / elapsedWeeks
  if (!Number.isFinite(weeklyRate) || weeklyRate <= 0) return null

  const remainingWorkouts = Math.max(0, milestoneCount - workouts.length)
  const earliest = new Date(now.getTime() + (remainingWorkouts / (weeklyRate * 1.25)) * 7 * 86400000)
  const latest = new Date(now.getTime() + (remainingWorkouts / (weeklyRate * 0.75)) * 7 * 86400000)
  return {
    remainingWorkouts,
    earliestDate: earliest.toISOString(),
    latestDate: latest.toISOString(),
    assumption: `Uses ${validDates.length} logged workouts over ${elapsedWeeks.toFixed(1)} weeks and projects the observed average weekly frequency with a ±25% range. This is an estimate, not a promise.`,
  }
}

export function forecastExerciseTarget(
  workouts: TwinWorkout[],
  exerciseName: string,
  targetKg: number,
  now = new Date(),
): StrengthForecast | null {
  if (!Number.isFinite(targetKg) || targetKg <= 0) return null
  const exercise = getExerciseProgress(workouts).find((item) => item.name === exerciseName)
  if (!exercise || exercise.entries.length < 4) return null
  const first = exercise.entries[0]
  const latest = exercise.entries[exercise.entries.length - 1]
  const spanDays = (Date.parse(latest.date) - Date.parse(first.date)) / 86400000
  const gainKg = latest.weightKg - first.weightKg
  if (!Number.isFinite(spanDays) || spanDays < 28 || gainKg <= 0 || targetKg <= latest.weightKg) return null

  const rateKgPerWeek = gainKg / spanDays * 7
  const fastestWeeks = (targetKg - latest.weightKg) / (rateKgPerWeek * 1.5)
  const slowestWeeks = (targetKg - latest.weightKg) / (rateKgPerWeek * 0.5)
  if (slowestWeeks > 26) return null
  return {
    earliestDate: new Date(now.getTime() + fastestWeeks * 7 * 86400000).toISOString(),
    latestDate: new Date(now.getTime() + slowestWeeks * 7 * 86400000).toISOString(),
    observations: exercise.entries.length,
    assumption: `A simple linear projection from ${exercise.entries.length} logged sessions over ${Math.round(spanDays)} days. The date range assumes the observed average rate varies by ±50%; this is a scenario range, not a statistical confidence interval or promise.`,
  }
}

export function getExerciseProgress(workouts: TwinWorkout[]) {
  const progress = new Map<string, { date: string; weightKg: number; reps: number }[]>()
  workouts.forEach((workout) => {
    if (!Number.isFinite(Date.parse(workout.date))) return
    workout.exercises?.forEach((exercise) => {
      const bestSet = exercise.sets
        .filter((set) => set.completed && Number.isFinite(set.weightKg) && set.weightKg >= 0 && Number.isFinite(set.reps) && set.reps > 0)
        .sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0]
      if (!bestSet) return
      const entries = progress.get(exercise.exerciseName) ?? []
      entries.push({ date: workout.date, weightKg: bestSet.weightKg, reps: bestSet.reps })
      progress.set(exercise.exerciseName, entries)
    })
  })
  return [...progress.entries()].map(([name, entries]) => ({
    name,
    entries: entries.sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  }))
}
