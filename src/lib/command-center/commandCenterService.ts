import type {
  TodayFitnessStatus,
  PersonalRecordItem,
  AttentionArea,
  DailyActionItem,
  AdaptiveWorkoutRecommendation,
  TrendHorizon,
  TrendForecastPoint,
  StrengthProgressionItem,
} from '@/types/commandCenter'
import type { UserProfile, EquipmentOption } from '@/types/profile'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { calculateMacroTargets } from '@/lib/nutritionCalculator'
import { calculateReadinessScore, getReadinessCategory } from '@/lib/recoveryCalculator'

export const DAILY_ACTIONS_STORAGE_KEY = 'yashfit_daily_actions'
export const ADAPTIVE_PLAN_DECISION_KEY = 'yashfit_adaptive_plan_decision'

/**
 * Calculates current day's high-level readiness, scheduled session, and tracking progress.
 */
export function calculateTodayFitnessStatus(
  profile: UserProfile | null,
  workouts: TwinWorkout[],
  recovery: RecoveryEntry[],
  waterLogged: number,
  waterTarget: number,
  rpgData: { level: number; rank: string; totalXp: number; streak: number }
): TodayFitnessStatus {
  const latestRecovery = recovery[0] || null
  let readinessScore = latestRecovery?.readinessScore ?? 75
  let readinessLabel: TodayFitnessStatus['readinessLabel'] = 'Good'

  if (latestRecovery) {
    if (readinessScore >= 80) readinessLabel = 'Optimal'
    else if (readinessScore >= 65) readinessLabel = 'Good'
    else if (readinessScore >= 50) readinessLabel = 'Moderate'
    else readinessLabel = 'Low / Fatigued'
  } else {
    readinessLabel = 'Unrecorded'
    readinessScore = 70
  }

  // Determine scheduled workout based on training days per week or active split
  const trainingDays = profile?.training_days_per_week ?? 3
  const defaultRoutine = trainingDays <= 3 ? PRESET_WORKOUT_ROUTINES[0] : PRESET_WORKOUT_ROUTINES[1]

  // Check if a workout was completed today
  const todayStr = new Date().toISOString().slice(0, 10)
  const completedToday = workouts.some((w) => w.date.slice(0, 10) === todayStr)

  const targets = calculateMacroTargets(profile)

  return {
    readinessScore,
    readinessLabel,
    sleepHours: latestRecovery?.sleepHours ?? null,
    soreness: latestRecovery?.soreness ?? null,
    scheduledWorkout: {
      id: defaultRoutine.id,
      name: defaultRoutine.name,
      split: defaultRoutine.targetSplit,
      exerciseCount: defaultRoutine.exercises.length,
      status: completedToday ? 'completed' : 'scheduled',
    },
    hydration: {
      loggedLiters: Number(waterLogged.toFixed(1)),
      targetLiters: Number(waterTarget.toFixed(1)),
      percentage: Math.min(100, Math.round((waterLogged / (waterTarget || 2.5)) * 100)),
    },
    nutrition: {
      caloriesTarget: targets.calories,
      proteinTargetGrams: targets.protein,
      isAdherenceAvailable: true,
    },
    streakDays: rpgData.streak,
    level: rpgData.level,
    rank: rpgData.rank,
    totalXp: rpgData.totalXp,
  }
}

/**
 * Computes verified personal records across all recorded workout sets.
 */
export function computePersonalRecords(workouts: TwinWorkout[]): PersonalRecordItem[] {
  const prMap = new Map<string, PersonalRecordItem>()
  const twoWeeksAgo = Date.now() - 14 * 86400000

  workouts.forEach((workout) => {
    workout.exercises?.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (!set.completed || !set.weightKg || set.weightKg <= 0 || !set.reps || set.reps <= 0) return

        const existing = prMap.get(exercise.exerciseName)
        // Brzycki 1RM estimation: weight * (36 / (37 - reps))
        const reps = Math.min(30, set.reps)
        const estimated1Rm = Math.round(set.weightKg * (36 / (37 - reps)))

        if (!existing || set.weightKg > existing.bestWeightKg || (set.weightKg === existing.bestWeightKg && set.reps > existing.repsAtBestWeight)) {
          const workoutTimestamp = Date.parse(workout.date)
          prMap.set(exercise.exerciseName, {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            primaryMuscle: exercise.primaryMuscle || 'General',
            bestWeightKg: set.weightKg,
            repsAtBestWeight: set.reps,
            estimated1RmKg: Math.max(set.weightKg, estimated1Rm),
            achievedDate: workout.date,
            isRecent: Number.isFinite(workoutTimestamp) && workoutTimestamp >= twoWeeksAgo,
          })
        }
      })
    })
  })

  return [...prMap.values()].sort((a, b) => b.estimated1RmKg - a.estimated1RmKg)
}

/**
 * Detects areas needing user attention (under-recovery, lagging hydration, missing logs).
 */
export function detectAttentionAreas(
  status: TodayFitnessStatus,
  workouts: TwinWorkout[],
  recovery: RecoveryEntry[]
): AttentionArea[] {
  const areas: AttentionArea[] = []

  // 1. Recovery Attention
  if (status.readinessScore < 50 || (status.sleepHours !== null && status.sleepHours < 6) || status.soreness?.toLowerCase() === 'severe') {
    areas.push({
      id: 'att-recovery-fatigue',
      category: 'recovery',
      severity: 'high',
      title: 'Elevated Systemic Fatigue Detected',
      description: `Readiness is ${status.readinessScore}/100 with ${status.sleepHours ? `${status.sleepHours}h sleep` : 'elevated soreness'}. High risk of overreaching.`,
      metricValue: `${status.readinessScore}/100`,
      actionLabel: 'Review Recovery Plan',
      actionHref: '/recovery',
    })
  }

  // 2. Hydration Attention
  if (status.hydration.percentage < 40 && status.hydration.loggedLiters < 1.0) {
    areas.push({
      id: 'att-hydration-lag',
      category: 'hydration',
      severity: 'medium',
      title: 'Hydration Significantly Behind Target',
      description: `Only ${status.hydration.loggedLiters}L recorded today against your ${status.hydration.targetLiters}L target (${status.hydration.percentage}%).`,
      metricValue: `${status.hydration.percentage}%`,
      actionLabel: 'Log Water Intake',
      actionHref: '/nutrition',
    })
  }

  // 3. Workout Gap Attention
  if (workouts.length > 0) {
    const latestWorkoutTime = Date.parse(workouts[0].date)
    const daysSinceLastWorkout = Math.floor((Date.now() - latestWorkoutTime) / 86400000)
    if (daysSinceLastWorkout >= 4 && !status.scheduledWorkout.status.includes('completed')) {
      areas.push({
        id: 'att-training-gap',
        category: 'consistency',
        severity: 'medium',
        title: 'Training Schedule Inactivity Gap',
        description: `It has been ${daysSinceLastWorkout} days since your last recorded session. Adherence drops sharply after 4+ days of unplanned rest.`,
        metricValue: `${daysSinceLastWorkout} days ago`,
        actionLabel: 'Start Today’s Session',
        actionHref: '/workout',
      })
    }
  }

  // 4. Missing Recovery Check-in
  if (status.readinessLabel === 'Unrecorded') {
    areas.push({
      id: 'att-recovery-missing',
      category: 'recovery',
      severity: 'info',
      title: 'Morning Recovery Not Yet Recorded',
      description: 'Check in on your sleep quality and muscle soreness to enable AI adaptive workout calibrations.',
      actionLabel: 'Complete Check-in',
      actionHref: '/recovery',
    })
  }

  return areas
}

/**
 * Generates actionable daily tasks reflecting actual completion state.
 */
export function generateDailyActionPlan(
  userId: string,
  status: TodayFitnessStatus,
  workouts: TwinWorkout[],
  recovery: RecoveryEntry[]
): DailyActionItem[] {
  const todayStr = new Date().toISOString().slice(0, 10)
  const isWorkoutDone = workouts.some((w) => w.date.slice(0, 10) === todayStr)
  const isRecoveryDone = recovery.some((r) => r.date.slice(0, 10) === todayStr)
  const isHydrationDone = status.hydration.percentage >= 90

  // Read user local completion overrides for today
  let localOverrides: Record<string, boolean> = {}
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${DAILY_ACTIONS_STORAGE_KEY}_${userId}_${todayStr}`)
      if (saved) localOverrides = JSON.parse(saved)
    }
  } catch {
    // ignore
  }

  const items: DailyActionItem[] = [
    {
      id: 'action-workout',
      title: isWorkoutDone ? `Completed: ${status.scheduledWorkout.name}` : `Train: ${status.scheduledWorkout.name}`,
      category: 'workout',
      description: isWorkoutDone
        ? 'Great work! Workout volume and XP have been recorded.'
        : `${status.scheduledWorkout.exerciseCount} exercises targeting ${status.scheduledWorkout.split}.`,
      actionHref: isWorkoutDone ? '/workout' : '/workout/session',
      actionLabel: isWorkoutDone ? 'View Summary' : 'Launch Workout',
      completed: isWorkoutDone || Boolean(localOverrides['action-workout']),
      priority: 'high',
      isKeyGoal: true,
    },
    {
      id: 'action-recovery',
      title: isRecoveryDone ? 'Morning Recovery Checked In' : 'Daily Recovery & Sleep Check-in',
      category: 'recovery',
      description: isRecoveryDone
        ? `Readiness: ${status.readinessScore}/100 (${status.readinessLabel})`
        : 'Rate your sleep hours, soreness, and stress levels.',
      actionHref: '/recovery',
      actionLabel: isRecoveryDone ? 'Update Check-in' : 'Log Recovery',
      completed: isRecoveryDone || Boolean(localOverrides['action-recovery']),
      priority: isRecoveryDone ? 'normal' : 'high',
    },
    {
      id: 'action-hydration',
      title: `Hit Hydration Goal: ${status.hydration.loggedLiters}L / ${status.hydration.targetLiters}L`,
      category: 'hydration',
      description: isHydrationDone
        ? 'Target reached! Optimal cellular hydration maintained.'
        : `Drink ${(status.hydration.targetLiters - status.hydration.loggedLiters).toFixed(1)}L more water throughout the day.`,
      actionHref: '/nutrition',
      actionLabel: 'Log Water',
      completed: isHydrationDone || Boolean(localOverrides['action-hydration']),
      priority: isHydrationDone ? 'normal' : 'medium',
    },
    {
      id: 'action-nutrition',
      title: `Meet Protein Goal (${status.nutrition.proteinTargetGrams}g)`,
      category: 'nutrition',
      description: 'Fuel muscle repair with budget-friendly high-protein Indian meal options.',
      actionHref: '/meals',
      actionLabel: 'View Meal Plans',
      completed: Boolean(localOverrides['action-nutrition']),
      priority: 'medium',
    },
    {
      id: 'action-quests',
      title: 'Review Active Daily Quests',
      category: 'quest',
      description: 'Claim your earned XP and keep your quest completion streak active.',
      actionHref: '/quests',
      actionLabel: 'Open Quests',
      completed: Boolean(localOverrides['action-quests']),
      priority: 'normal',
    },
    {
      id: 'action-measurement',
      title: 'Log Weekly Body Measurements',
      category: 'measurement',
      description: 'Track waist, chest, or scale weight in your Digital Twin records.',
      actionHref: '/digital-twin',
      actionLabel: 'Update Metrics',
      completed: Boolean(localOverrides['action-measurement']),
      priority: 'normal',
    },
  ]

  return items
}

/**
 * Saves toggled action item state in browser localStorage.
 */
export function toggleDailyAction(userId: string, actionId: string, completed: boolean): void {
  const todayStr = new Date().toISOString().slice(0, 10)
  const key = `${DAILY_ACTIONS_STORAGE_KEY}_${userId}_${todayStr}`
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '{}')
    existing[actionId] = completed
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.warn('Unable to persist daily action state:', err)
  }
}

/**
 * Generates conservative, transparent, explainable workout recommendations.
 */
export function generateAdaptiveWorkoutRecommendation(
  profile: UserProfile | null,
  workouts: TwinWorkout[],
  recovery: RecoveryEntry[],
  defaultRoutineId: string
): AdaptiveWorkoutRecommendation {
  const latestRecovery = recovery[0] || null
  const readiness = latestRecovery?.readinessScore ?? 75
  const sleep = latestRecovery?.sleepHours ?? 7
  const soreness = (latestRecovery?.soreness || 'Low').toLowerCase()
  const userEquipment: EquipmentOption[] = profile?.available_equipment && profile.available_equipment.length > 0
    ? profile.available_equipment
    : ['Dumbbells', 'Barbell', 'Bench']

  // Safety Critical: Severe Soreness or Readiness < 50 -> Recovery Day
  if (soreness === 'severe' || readiness < 50 || (sleep !== null && sleep < 5.0)) {
    return {
      id: 'rec-recovery-day',
      recommendationType: 'recovery_day',
      title: 'Recommend Rest or Light Active Mobility Day',
      summary: 'High systemic fatigue markers suggest delaying heavy resistance training today.',
      explanation: 'Attempting high-threshold motor unit recruitment with acute sleep debt (<5h) or severe muscle soreness sharply increases soft-tissue injury risk without providing an adaptive stimulus.',
      supportingData: `Readiness check-in is ${readiness}/100, sleep is ${sleep}h, and muscle soreness is "${soreness}".`,
      actionText: 'Shift workout by 24h and take an active recovery walk.',
      actionHref: '/recovery',
      safetyDisclaimer: 'If soreness is accompanied by joint swelling or sharp localized pain, seek medical guidance before resuming weight training.',
      limitations: 'Calculated from self-reported recovery check-ins and recent sessions. External physical demands outside the gym are not factored.',
      targetRoutineId: defaultRoutineId,
      volumeAdjustmentPercent: -100,
      status: 'pending',
    }
  }

  // Moderate Fatigue: Readiness 50-65 or High Soreness -> Reduce Volume / Deload
  if (readiness < 65 || soreness === 'high' || (sleep !== null && sleep < 6.0)) {
    return {
      id: 'rec-reduce-volume',
      recommendationType: 'reduce_intensity',
      title: 'Conservative Deload: Reduce Set Volume by 20%',
      summary: 'Execute scheduled workout with 1 fewer set per exercise and stop 2 reps shy of failure.',
      explanation: 'Training at RPE 7-8 allows stimulus maintenance while facilitating glycogen resynthesis and connective tissue recovery.',
      supportingData: `Readiness is ${readiness}/100, sleep is ${sleep}h. Previous 3 sessions averaged ${Math.round(workouts.slice(0, 3).reduce((acc, w) => acc + (Number(w.totalVolume) || 0), 0) / 3)} kg volume.`,
      actionText: 'Execute planned session with conservative volume.',
      actionHref: `/workout/session?routineId=${defaultRoutineId}`,
      safetyDisclaimer: 'Do not attempt maximum 1RM lifts or drop sets during fatigued states.',
      limitations: 'Volume reduction does not alter exercise selection or equipment requirements.',
      targetRoutineId: defaultRoutineId,
      volumeAdjustmentPercent: -20,
      status: 'pending',
    }
  }

  // Check equipment constraints
  const targetRoutine = PRESET_WORKOUT_ROUTINES.find((r) => r.id === defaultRoutineId) || PRESET_WORKOUT_ROUTINES[0]
  const hasBarbellOrMachines = userEquipment.includes('Barbell') || userEquipment.includes('Machines') || userEquipment.includes('Cable Machine')
  const substitutions: Record<string, string> = {}

  if (!hasBarbellOrMachines) {
    targetRoutine.exercises.forEach((ex) => {
      const match = EXERCISE_DATABASE.find((e) => e.name === ex.exerciseName)
      if (match && match.equipment !== 'No Equipment' && !userEquipment.includes(match.equipment as EquipmentOption)) {
        // Find alternative
        const alt = EXERCISE_DATABASE.find(
          (cand) =>
            cand.primaryMuscle === match.primaryMuscle &&
            cand.id !== match.id &&
            (cand.equipment === 'No Equipment' || userEquipment.includes(cand.equipment as EquipmentOption))
        )
        if (alt) {
          substitutions[ex.exerciseId] = alt.id
        }
      }
    })
  }

  if (Object.keys(substitutions).length > 0) {
    return {
      id: 'rec-substitute-exercises',
      recommendationType: 'substitute_exercise',
      title: 'Adaptive Equipment Substitutions Active',
      summary: `Automated substitutions for ${Object.keys(substitutions).length} exercises matching your ${userEquipment.join(', ')} setup.`,
      explanation: 'Maintains target muscle fiber stimulus without requiring unavailable gym machines.',
      supportingData: `Available equipment: ${userEquipment.join(', ')}. Target routine: ${targetRoutine.name}.`,
      actionText: 'Launch session with substituted exercises.',
      actionHref: `/workout/session?routineId=${defaultRoutineId}&exerciseOverrides=${encodeURIComponent(JSON.stringify(substitutions))}`,
      safetyDisclaimer: 'Verify proper form and setup before attempting dumbbell and bodyweight variations.',
      limitations: 'Calculated using biomechanical muscle match; load progression differs between barbells and dumbbells.',
      targetRoutineId: defaultRoutineId,
      substitutions,
      status: 'pending',
    }
  }

  // Optimal Readiness -> Train as planned with progressive overload
  return {
    id: 'rec-train-as-planned',
    recommendationType: 'train_as_planned',
    title: 'Optimal Recovery: Train as Planned + Progressive Overload',
    summary: 'Recovery markers are optimal. Aim for +1 extra repetition on your first compound working set.',
    explanation: 'Your nervous system and muscles are fully recovered, making this an ideal window for micro-progression.',
    supportingData: `Readiness score: ${readiness}/100. Soreness: "${soreness}". Sleep: ${sleep} hours.`,
    actionText: `Launch ${targetRoutine.name} now.`,
    actionHref: `/workout/session?routineId=${defaultRoutineId}`,
    safetyDisclaimer: 'Warm up thoroughly with 2 progressive warm-up sets before your working loads.',
    limitations: 'Progressive overload assumes previous session was completed with full range of motion.',
    targetRoutineId: defaultRoutineId,
    status: 'pending',
  }
}

/**
 * Generates historical trend and cautious forecast data points filtered by time horizon.
 */
export function computeTrendForecastPoints(
  workouts: TwinWorkout[],
  horizon: TrendHorizon
): TrendForecastPoint[] {
  const points: TrendForecastPoint[] = []
  const now = Date.now()
  let daysCutoff = 30

  if (horizon === '7d') daysCutoff = 7
  else if (horizon === '30d') daysCutoff = 30
  else if (horizon === '90d') daysCutoff = 90
  else if (horizon === 'all') daysCutoff = 365

  const cutoffTime = now - daysCutoff * 86400000

  // Filter workouts in horizon
  const validWorkouts = workouts
    .filter((w) => {
      const time = Date.parse(w.date)
      return Number.isFinite(time) && time >= cutoffTime
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

  // Aggregate by calendar date
  const dateMap = new Map<string, number>()
  validWorkouts.forEach((w) => {
    const key = w.date.slice(0, 10)
    const vol = Number(w.totalVolume) || 0
    dateMap.set(key, (dateMap.get(key) || 0) + vol)
  })

  // Build measured points
  dateMap.forEach((vol, dateStr) => {
    const d = new Date(dateStr)
    points.push({
      date: dateStr,
      label: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      measuredValue: vol,
      isProjected: false,
    })
  })

  // Add cautious forward projection if we have at least 3 historical points
  if (points.length >= 3) {
    const lastPoint = points[points.length - 1]
    const avgRecent = Math.round(
      points.slice(-4).reduce((sum, p) => sum + (p.measuredValue || 0), 0) / Math.min(points.length, 4)
    )

    // Forecast date: +7 days from last point
    const forecastDate = new Date(Date.parse(lastPoint.date) + 7 * 86400000)
    const forecastKey = forecastDate.toISOString().slice(0, 10)

    // Modest conservative +2.5% progression assumption
    const projected = Math.round(avgRecent * 1.025)
    points.push({
      date: forecastKey,
      label: `${forecastDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} (Est.)`,
      forecastValue: projected,
      lowerBound: Math.round(projected * 0.88), // -12% uncertainty
      upperBound: Math.round(projected * 1.12), // +12% uncertainty
      isProjected: true,
    })
  }

  return points
}

/**
 * Computes strength progression trajectories across key compound lifts.
 */
export function computeStrengthProgression(workouts: TwinWorkout[]): StrengthProgressionItem[] {
  const targetExercises = ['Barbell Bench Press', 'Barbell Squat', 'Barbell Deadlift', 'Overhead Press', 'Pull-ups', 'Dumbbell Curl']
  const items: StrengthProgressionItem[] = []

  targetExercises.forEach((name) => {
    const history: { date: string; weightKg: number; reps: number }[] = []

    workouts.forEach((w) => {
      w.exercises?.forEach((ex) => {
        if (ex.exerciseName.toLowerCase() === name.toLowerCase()) {
          const bestSet = ex.sets
            .filter((s) => s.completed && s.weightKg && s.weightKg > 0)
            .sort((a, b) => b.weightKg - a.weightKg)[0]

          if (bestSet) {
            history.push({
              date: w.date.slice(0, 10),
              weightKg: bestSet.weightKg,
              reps: bestSet.reps,
            })
          }
        }
      })
    })

    if (history.length >= 2) {
      history.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
      const first = history[0].weightKg
      const latest = history[history.length - 1].weightKg
      const diff = ((latest - first) / (first || 1)) * 100

      items.push({
        exerciseName: name,
        history,
        trendPercent: Number(diff.toFixed(1)),
      })
    }
  })

  return items
}
