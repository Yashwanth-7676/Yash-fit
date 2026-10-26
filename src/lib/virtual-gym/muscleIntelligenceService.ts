import type { TwinWorkout } from '@/lib/digitalTwin'
import type { UserProfile } from '@/types/profile'
import type { MuscleGroup } from '@/types/workout'
import type { WeeklyMuscleOverview, MuscleTrainingMetric } from '@/types/virtualGym'
import { EXERCISE_DATABASE } from '@/data/exercises'

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
]

/**
 * Builds a lookup map from exercise name/id to primary and secondary muscles
 */
const EXERCISE_MAP = new Map(
  EXERCISE_DATABASE.map((ex) => [
    ex.name.toLowerCase(),
    { primary: ex.primaryMuscle, secondary: ex.secondaryMuscles },
  ])
)

/**
 * Analyzes the user's past 7 days of completed workouts to generate a
 * weekly muscle intelligence report.
 */
export function calculateWeeklyMuscleOverview(
  workouts: TwinWorkout[],
  profile?: UserProfile | null
): WeeklyMuscleOverview {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 86400000

  // Filter workouts to past 7 days
  const recentWorkouts = workouts.filter((w) => {
    const timestamp = Date.parse(w.date)
    return Number.isFinite(timestamp) && timestamp >= sevenDaysAgo
  })

  // Initialize metric buckets for each muscle group
  const rawMetrics: Record<
    MuscleGroup,
    {
      loggedSets: number
      exercises: Set<string>
      activeDates: Set<string>
    }
  > = {
    Chest: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Back: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Shoulders: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Biceps: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Triceps: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Quads: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Hamstrings: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Glutes: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Calves: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
    Core: { loggedSets: 0, exercises: new Set(), activeDates: new Set() },
  }

  let totalLoggedSets = 0

  recentWorkouts.forEach((workout) => {
    const workoutDate = workout.date.split('T')[0]

    workout.exercises?.forEach((exercise) => {
      const exerciseKey = exercise.exerciseName.toLowerCase()
      const dbMatch = EXERCISE_MAP.get(exerciseKey)

      // Count completed sets
      const completedSets = exercise.sets
        ? exercise.sets.filter((s) => s.completed !== false).length
        : 3

      if (completedSets <= 0) return

      totalLoggedSets += completedSets

      // Primary muscle gets 100% of the completed sets
      const primaryMuscle = dbMatch ? dbMatch.primary : mapNameToMuscle(exercise.exerciseName)
      if (primaryMuscle && rawMetrics[primaryMuscle]) {
        rawMetrics[primaryMuscle].loggedSets += completedSets
        rawMetrics[primaryMuscle].exercises.add(exercise.exerciseName)
        rawMetrics[primaryMuscle].activeDates.add(workoutDate)
      }

      // Secondary muscles get fractional direct assister volume (0.5 set credit)
      if (dbMatch && dbMatch.secondary) {
        dbMatch.secondary.forEach((secMuscle) => {
          if (rawMetrics[secMuscle]) {
            rawMetrics[secMuscle].loggedSets += Math.round(completedSets * 0.5)
            rawMetrics[secMuscle].exercises.add(`${exercise.exerciseName} (Assister)`)
            rawMetrics[secMuscle].activeDates.add(workoutDate)
          }
        })
      }
    })
  })

  // Categorize status for each muscle group based on standard evidence-based hypertrophy thresholds
  // 10+ sets/week: Optimal hypertrophy stimulation
  // 6-9 sets/week: Moderate maintenance / progress
  // 1-5 sets/week: Under-trained
  // 0 sets/week: Untrained in the last 7 days
  const muscleMetrics = {} as Record<MuscleGroup, MuscleTrainingMetric>
  const undertrainedMuscles: MuscleGroup[] = []
  const wellTrainedMuscles: MuscleGroup[] = []

  ALL_MUSCLE_GROUPS.forEach((muscle) => {
    const entry = rawMetrics[muscle]
    const sets = entry.loggedSets
    let status: MuscleTrainingMetric['status'] = 'untrained'
    let recommendation = `No direct or assister sets recorded for ${muscle} this week. Add 2-3 compound or isolation exercises.`

    if (sets >= 10) {
      status = 'optimal'
      recommendation = `Target hypertrophy volume achieved (${sets} logged sets across ${entry.activeDates.size} sessions). Maintain recovery.`
      wellTrainedMuscles.push(muscle)
    } else if (sets >= 6) {
      status = 'moderate'
      recommendation = `Moderate volume (${sets} sets). Consider adding 2-4 more sets if ${muscle} is a primary development priority.`
      wellTrainedMuscles.push(muscle)
    } else if (sets >= 1) {
      status = 'undertrained'
      recommendation = `Low weekly stimulus (${sets} sets). Aim for at least 6-10 total sets per week to stimulate adaptation.`
      undertrainedMuscles.push(muscle)
    } else {
      status = 'untrained'
      undertrainedMuscles.push(muscle)
    }

    muscleMetrics[muscle] = {
      muscle,
      loggedSetsLast7Days: sets,
      exerciseNames: Array.from(entry.exercises),
      frequencyDays: entry.activeDates.size,
      status,
      recommendation,
    }
  })

  // Generate balanced workout suggestions
  const balancedSuggestions = []

  if (undertrainedMuscles.includes('Hamstrings') || undertrainedMuscles.includes('Glutes')) {
    balancedSuggestions.push({
      title: 'Posterior Chain Rebalance',
      reason: 'Hamstrings and Glutes have received low weekly training volume compared to anterior leg muscles.',
      suggestedExercises: ['Romanian Deadlift (RDL)', 'Barbell Hip Thrust', 'Walking Lunges'],
    })
  }

  if (undertrainedMuscles.includes('Back') && !undertrainedMuscles.includes('Chest')) {
    balancedSuggestions.push({
      title: 'Push-Pull Structural Balance',
      reason: 'Pushing volume (Chest/Delts) exceeds pulling volume this week. Adding horizontal and vertical rows protects shoulder joints.',
      suggestedExercises: ['Barbell Bent-over Row', 'Lat Pulldown', 'Seated Cable Row'],
    })
  }

  if (undertrainedMuscles.includes('Core')) {
    balancedSuggestions.push({
      title: 'Midsection & Spinal Stability',
      reason: 'Zero dedicated core sets logged in 7 days. Isometric anti-extension work enhances squat and overhead press power.',
      suggestedExercises: ['Isometric Forearm Plank', 'Hanging Leg Raise', 'Ab Wheel Rollout'],
    })
  }

  if (balancedSuggestions.length === 0 && undertrainedMuscles.length > 0) {
    const topNeglected = undertrainedMuscles.slice(0, 2)
    balancedSuggestions.push({
      title: `Targeted Accessory Focus (${topNeglected.join(' & ')})`,
      reason: `${topNeglected.join(' and ')} are currently below maintenance weekly set thresholds.`,
      suggestedExercises: topNeglected.flatMap((m) => getRecommendedExercisesForMuscle(m)),
    })
  }

  return {
    totalLoggedSets,
    muscleMetrics,
    undertrainedMuscles,
    wellTrainedMuscles,
    balancedSuggestions,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Training metrics reflect user-logged workout sets and rep completions. YashFit does not claim to measure real-time EMG muscle activation, biometric strain, or guaranteed hypertrophy outcomes.',
  }
}

function mapNameToMuscle(name: string): MuscleGroup | null {
  const lower = name.toLowerCase()
  if (lower.includes('squat') || lower.includes('quad') || lower.includes('leg press') || lower.includes('lunge')) return 'Quads'
  if (lower.includes('bench') || lower.includes('chest') || lower.includes('push-up') || lower.includes('flye')) return 'Chest'
  if (lower.includes('row') || lower.includes('pull-up') || lower.includes('lat') || lower.includes('deadlift')) return 'Back'
  if (lower.includes('shoulder') || lower.includes('overhead') || lower.includes('press') || lower.includes('lateral raise')) return 'Shoulders'
  if (lower.includes('curl') || lower.includes('bicep')) return 'Biceps'
  if (lower.includes('tricep') || lower.includes('skull') || lower.includes('dip')) return 'Triceps'
  if (lower.includes('rdl') || lower.includes('hamstring') || lower.includes('curl')) return 'Hamstrings'
  if (lower.includes('thrust') || lower.includes('glute')) return 'Glutes'
  if (lower.includes('calf') || lower.includes('calves')) return 'Calves'
  if (lower.includes('plank') || lower.includes('ab') || lower.includes('crunch')) return 'Core'
  return null
}

export function getRecommendedExercisesForMuscle(muscle: MuscleGroup): string[] {
  switch (muscle) {
    case 'Chest':
      return ['Barbell Flat Bench Press', 'Incline Dumbbell Press', 'Push-ups']
    case 'Back':
      return ['Barbell Bent-over Row', 'Lat Pulldown', 'Pull-ups']
    case 'Shoulders':
      return ['Standing Overhead Barbell Press', 'Dumbbell Lateral Raise', 'Face Pulls']
    case 'Biceps':
      return ['Dumbbell Bicep Curl', 'Hammer Curl', 'EZ-Bar Preacher Curl']
    case 'Triceps':
      return ['Tricep Cable Pushdown', 'Overhead Tricep Extension', 'Close-Grip Bench Press']
    case 'Quads':
      return ['Barbell Back Squat', 'Goblet Squat', 'Leg Extension']
    case 'Hamstrings':
      return ['Romanian Deadlift (RDL)', 'Lying Leg Curl', 'Glute Ham Raise']
    case 'Glutes':
      return ['Barbell Hip Thrust', 'Walking Lunges', 'Bulgarian Split Squat']
    case 'Calves':
      return ['Standing Calf Raise', 'Seated Calf Raise']
    case 'Core':
      return ['Isometric Forearm Plank', 'Hanging Knee Raise', 'Cable Woodchopper']
    default:
      return ['Standard Compound Movement']
  }
}

