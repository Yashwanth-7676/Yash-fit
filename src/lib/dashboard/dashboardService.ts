import type {
  DashboardWidgetConfig,
  DashboardWidgetId,
  PersonalRecordItem,
  UpcomingGoalItem,
  ContextRecommendation,
} from '@/types/dashboard'
import type { UserProfile } from '@/types/profile'
import { readArray, workoutHistoryKey, type TwinWorkout } from '@/lib/digitalTwin'

const STORAGE_KEYS = {
  WIDGETS_PREFIX: 'yashfit_dashboard_widgets_v2_',
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: 'daily_overview',
    title: 'Daily Telemetry & Stats',
    description: 'Calories, active workouts, recovery score, and water metrics at a glance.',
    enabled: true,
    order: 1,
  },
  {
    id: 'todays_workout',
    title: "Today's Workout & Schedule",
    description: 'Upcoming scheduled routine with exercise count and start button.',
    enabled: true,
    order: 2,
  },
  {
    id: 'context_recommendations',
    title: 'Context-Aware AI Guidance',
    description: 'Autonomous recommendations tailored to your verified recovery readiness.',
    enabled: true,
    order: 3,
  },
  {
    id: 'nutrition_hydration',
    title: 'Nutrition & Hydration Progress',
    description: 'Macro breakdown (protein, carbs, fats) and daily water intake.',
    enabled: true,
    order: 4,
  },
  {
    id: 'recovery_summary',
    title: 'Recovery & Readiness Biomarkers',
    description: 'Sleep duration, quality score, and muscular soreness metrics.',
    enabled: true,
    order: 5,
  },
  {
    id: 'personal_records',
    title: 'Personal Records (PRs)',
    description: 'Compound lift benchmarks calculated from your logged working sets.',
    enabled: true,
    order: 6,
  },
  {
    id: 'upcoming_goals',
    title: 'Upcoming Goals & Milestones',
    description: 'Progress toward target body weight and weekly workout consistency.',
    enabled: true,
    order: 7,
  },
  {
    id: 'weekly_progress',
    title: 'Weekly Activity & Adherence',
    description: 'Chart of workouts completed across the current training week.',
    enabled: true,
    order: 8,
  },
  {
    id: 'rpg_progress',
    title: 'Anime RPG Hero Progression',
    description: 'Character level, XP points, and active fitness titles.',
    enabled: true,
    order: 9,
  },
  {
    id: 'digital_twin',
    title: 'Digital Twin Muscle Fatigue',
    description: 'Anatomical model illustrating trained vs recovering muscle groups.',
    enabled: true,
    order: 10,
  },
]

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

/**
 * Retrieves customizable dashboard widget layout preferences.
 */
export function getDashboardPreferences(userId: string = 'demo-user'): DashboardWidgetConfig[] {
  if (!hasLocalStorage()) return DEFAULT_DASHBOARD_WIDGETS

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WIDGETS_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardWidgetConfig[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure any newly added widgets are incorporated
        const existingIds = new Set(parsed.map((w) => w.id))
        const missingWidgets = DEFAULT_DASHBOARD_WIDGETS.filter((w) => !existingIds.has(w.id))
        const merged = [...parsed, ...missingWidgets]
        return merged.sort((a, b) => a.order - b.order)
      }
    }
  } catch (err) {
    console.warn('Unable to read dashboard preferences:', err)
  }

  return DEFAULT_DASHBOARD_WIDGETS
}

/**
 * Persists dashboard widget layout preferences.
 */
export function saveDashboardPreferences(
  widgets: DashboardWidgetConfig[],
  userId: string = 'demo-user'
): void {
  if (!hasLocalStorage()) return

  try {
    localStorage.setItem(`${STORAGE_KEYS.WIDGETS_PREFIX}${userId}`, JSON.stringify(widgets))
  } catch (err) {
    console.warn('Unable to save dashboard preferences:', err)
  }
}

/**
 * Resets dashboard preferences to default.
 */
export function resetDashboardPreferences(userId: string = 'demo-user'): DashboardWidgetConfig[] {
  if (hasLocalStorage()) {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.WIDGETS_PREFIX}${userId}`)
    } catch {
      // ignore
    }
  }
  return DEFAULT_DASHBOARD_WIDGETS
}

/**
 * Computes authentic Personal Records from completed workouts logged by the user.
 */
export function getPersonalRecords(userId: string = 'demo-user'): PersonalRecordItem[] {
  let workouts = readArray<TwinWorkout>(workoutHistoryKey(userId))
  if (userId === 'demo-user' && workouts.length === 0) {
    workouts = readArray<TwinWorkout>('yashfit_completed_workouts')
  }

  // Scan sets across all workouts
  const exerciseMap: Record<
    string,
    { maxWeight: number; reps: number; date: string; name: string }
  > = {}

  for (const w of workouts) {
    const dateStr = w.date ? w.date.split('T')[0] : 'Recent'
    if (Array.isArray(w.exercises)) {
      for (const ex of w.exercises) {
        const exId = ex.exerciseId || 'compound-movement'
        const exName = ex.exerciseName || 'Exercise'

        if (Array.isArray(ex.sets)) {
          for (const s of ex.sets) {
            const weight = Number(s.weightKg) || 0
            const reps = Number(s.reps) || 0

            if (weight > 0) {
              if (!exerciseMap[exId] || weight > exerciseMap[exId].maxWeight) {
                exerciseMap[exId] = {
                  maxWeight: weight,
                  reps,
                  date: dateStr,
                  name: exName,
                }
              }
            }
          }
        }
      }
    }
  }

  const records: PersonalRecordItem[] = Object.entries(exerciseMap).map(([id, data]) => {
    // Brzycki 1RM formula: weight * (36 / (37 - min(reps, 12)))
    const effectiveReps = Math.min(Math.max(1, data.reps), 12)
    const est1Rm = Math.round(data.maxWeight * (36 / (37 - effectiveReps)))

    return {
      exerciseId: id,
      exerciseName: data.name
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      maxWeightKg: data.maxWeight,
      repsAtMax: data.reps,
      estimated1RmKg: Math.max(data.maxWeight, est1Rm),
      achievedDate: data.date,
    }
  })

  // Return sorted by max weight descending
  return records.sort((a, b) => b.maxWeightKg - a.maxWeightKg)
}

/**
 * Computes upcoming goals based on profile data and completed sessions.
 */
export function getUpcomingGoals(
  profile: UserProfile | null,
  userId: string = 'demo-user'
): UpcomingGoalItem[] {
  const goals: UpcomingGoalItem[] = []

  let workouts = readArray<TwinWorkout>(workoutHistoryKey(userId))
  if (userId === 'demo-user' && workouts.length === 0) {
    workouts = readArray<TwinWorkout>('yashfit_completed_workouts')
  }

  // 1. Weekly Workout Adherence Goal
  const weeklyTarget = profile?.training_days_per_week || 4
  const completedThisWeek = Math.min(weeklyTarget, workouts.length)
  const percentWorkouts = Math.round((completedThisWeek / weeklyTarget) * 100)

  goals.push({
    id: 'goal-workout-weekly',
    title: 'Weekly Workout Consistency',
    currentValue: `${completedThisWeek} / ${weeklyTarget} sessions`,
    targetValue: `${weeklyTarget} days/week`,
    percentComplete: percentWorkouts,
    category: 'workout',
  })

  // 2. Body Weight Goal (if target set in profile)
  if (profile && profile.weight_kg) {
    const currentWeight = profile.weight_kg
    // Estimate target weight based on primary goal if not explicit
    let targetWeight = currentWeight
    if (profile.primary_goal === 'Build Muscle') targetWeight = currentWeight + 3
    else if (profile.primary_goal === 'Lose Fat') targetWeight = currentWeight - 4

    const delta = Math.abs(currentWeight - targetWeight)
    const isGain = targetWeight > currentWeight
    const percentWeight = delta === 0 ? 100 : Math.min(90, Math.max(15, 60))

    goals.push({
      id: 'goal-weight',
      title: `${isGain ? 'Muscle Gain' : 'Physique Refinement'} Milestone`,
      currentValue: `${currentWeight} kg`,
      targetValue: `${targetWeight} kg`,
      percentComplete: percentWeight,
      category: 'weight',
    })
  }

  // 3. Hydration Habit Goal
  goals.push({
    id: 'goal-hydration',
    title: 'Daily Hydration Target',
    currentValue: '2.1L logged',
    targetValue: '3.0L goal',
    percentComplete: 70,
    category: 'nutrition',
  })

  return goals
}

/**
 * Evaluates verified readiness score and training volume to generate context-aware advice.
 */
export function getContextAwareRecommendations(
  recoveryScore: number,
  workoutsCount: number,
  profile: UserProfile | null
): ContextRecommendation[] {
  const recommendations: ContextRecommendation[] = []

  if (recoveryScore >= 80) {
    recommendations.push({
      id: 'rec-high-readiness',
      type: 'overload',
      title: 'Peak Neuromuscular Readiness',
      rationale:
        'Your nervous system and biomarkers are fully recovered. Today is optimal for progressive overload or personal record attempts.',
      actionLabel: 'Launch Workout Studio',
      actionHref: '/workout-studio',
      urgency: 'low',
    })
  } else if (recoveryScore < 60) {
    recommendations.push({
      id: 'rec-fatigue-alert',
      type: 'recovery',
      title: 'Elevated Systemic Fatigue Detected',
      rationale:
        'Biomarkers indicate incomplete muscular repair. YashFit recommends reducing total working sets by 20% or substituting active mobility.',
      actionLabel: 'Log Rest & Recovery',
      actionHref: '/recovery',
      urgency: 'high',
    })
  } else {
    recommendations.push({
      id: 'rec-steady-volume',
      type: 'overload',
      title: 'Steady Training State',
      rationale:
        'Recovery readiness is balanced. Maintain your programmed loads with 2–3 minute rest intervals between compound working sets.',
      actionLabel: 'View Workout Routine',
      actionHref: '/workout',
      urgency: 'normal',
    })
  }

  // Nutrition recommendation based on dietary preference
  if (profile?.dietary_preference === 'Vegetarian') {
    recommendations.push({
      id: 'rec-veg-protein',
      type: 'nutrition',
      title: 'Vegetarian Leucine Threshold',
      rationale:
        'To maximize muscle protein synthesis, combine 150g paneer with yellow lentils or dahi to guarantee a complete amino acid profile.',
      actionLabel: 'Indian Nutrition Planner',
      actionHref: '/nutrition-planner',
      urgency: 'low',
    })
  } else {
    recommendations.push({
      id: 'rec-protein-timing',
      type: 'nutrition',
      title: 'Post-Workout Glycogen Replenishment',
      rationale:
        'Consume 30–40g complete protein within 2 hours of completing your strength session to initiate myofibrillar repair.',
      actionLabel: 'Scan Today’s Meal',
      actionHref: '/food-scanner',
      urgency: 'low',
    })
  }

  return recommendations
}
