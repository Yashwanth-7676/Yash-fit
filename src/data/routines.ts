import type { WorkoutRoutine } from '@/types/workout'
import type { UserProfile } from '@/types/profile'

export const PRESET_WORKOUT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'routine-push-day',
    name: 'Upper Body Push Power',
    targetSplit: 'Push Day',
    description: 'Targeting chest, front delts, lateral delts, and triceps with progressive compound presses.',
    durationMinutes: 50,
    exercises: [
      {
        exerciseId: 'ex-barbell-bench-press',
        exerciseName: 'Barbell Bench Press',
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 120,
        primaryMuscle: 'Chest',
        equipment: 'Barbell',
      },
      {
        exerciseId: 'ex-incline-dumbbell-press',
        exerciseName: 'Incline Dumbbell Press',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 90,
        primaryMuscle: 'Chest',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-overhead-dumbbell-press',
        exerciseName: 'Overhead Dumbbell Press',
        targetSets: 3,
        targetReps: '8-12',
        restSeconds: 90,
        primaryMuscle: 'Shoulders',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-dumbbell-lateral-raise',
        exerciseName: 'Dumbbell Lateral Raise',
        targetSets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        primaryMuscle: 'Shoulders',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-tricep-rope-pushdown',
        exerciseName: 'Tricep Rope Pushdown',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 60,
        primaryMuscle: 'Triceps',
        equipment: 'Cable Machine',
      },
    ],
  },
  {
    id: 'routine-pull-day',
    name: 'Upper Body Pull Builder',
    targetSplit: 'Pull Day',
    description: 'Back thickness, lat width, rear deltoids, and biceps hypertrophy.',
    durationMinutes: 45,
    exercises: [
      {
        exerciseId: 'ex-barbell-bent-over-row',
        exerciseName: 'Barbell Bent-Over Row',
        targetSets: 4,
        targetReps: '8-10',
        restSeconds: 120,
        primaryMuscle: 'Back',
        equipment: 'Barbell',
      },
      {
        exerciseId: 'ex-lat-pulldown',
        exerciseName: 'Lat Pulldown',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        primaryMuscle: 'Back',
        equipment: 'Cable Machine',
      },
      {
        exerciseId: 'ex-seated-cable-row',
        exerciseName: 'Seated Cable Row',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 60,
        primaryMuscle: 'Back',
        equipment: 'Cable Machine',
      },
      {
        exerciseId: 'ex-dumbbell-bicep-curl',
        exerciseName: 'Dumbbell Bicep Curl',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 60,
        primaryMuscle: 'Biceps',
        equipment: 'Dumbbells',
      },
    ],
  },
  {
    id: 'routine-leg-day',
    name: 'Lower Body Strength & Hypertrophy',
    targetSplit: 'Leg Day',
    description: 'Quad development, hamstring power, and glute stabilization.',
    durationMinutes: 50,
    exercises: [
      {
        exerciseId: 'ex-barbell-squat',
        exerciseName: 'Barbell Back Squat',
        targetSets: 4,
        targetReps: '6-8',
        restSeconds: 120,
        primaryMuscle: 'Quads',
        equipment: 'Barbell',
      },
      {
        exerciseId: 'ex-romanian-deadlift',
        exerciseName: 'Romanian Deadlift (RDL)',
        targetSets: 3,
        targetReps: '8-10',
        restSeconds: 90,
        primaryMuscle: 'Hamstrings',
        equipment: 'Barbell',
      },
      {
        exerciseId: 'ex-leg-press',
        exerciseName: 'Leg Press',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        primaryMuscle: 'Quads',
        equipment: 'Machines',
      },
      {
        exerciseId: 'ex-dumbbell-walking-lunge',
        exerciseName: 'Dumbbell Walking Lunge',
        targetSets: 3,
        targetReps: '12 per leg',
        restSeconds: 60,
        primaryMuscle: 'Glutes',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-hanging-leg-raise',
        exerciseName: 'Hanging Leg Raise',
        targetSets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        primaryMuscle: 'Core',
        equipment: 'Pull-up Bar',
      },
    ],
  },
  {
    id: 'routine-full-body',
    name: 'Full Body Conditioning',
    targetSplit: 'Full Body',
    description: 'Efficient balanced total-body workout designed for 2–3 training days per week.',
    durationMinutes: 45,
    exercises: [
      {
        exerciseId: 'ex-dumbbell-goblet-squat',
        exerciseName: 'Dumbbell Goblet Squat',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 90,
        primaryMuscle: 'Quads',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-push-up',
        exerciseName: 'Standard Push-Up',
        targetSets: 3,
        targetReps: '12-15',
        restSeconds: 60,
        primaryMuscle: 'Chest',
        equipment: 'No Equipment',
      },
      {
        exerciseId: 'ex-seated-cable-row',
        exerciseName: 'Seated Cable Row',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 60,
        primaryMuscle: 'Back',
        equipment: 'Cable Machine',
      },
      {
        exerciseId: 'ex-overhead-dumbbell-press',
        exerciseName: 'Overhead Dumbbell Press',
        targetSets: 3,
        targetReps: '10-12',
        restSeconds: 60,
        primaryMuscle: 'Shoulders',
        equipment: 'Dumbbells',
      },
      {
        exerciseId: 'ex-plank',
        exerciseName: 'Forearm Plank',
        targetSets: 3,
        targetReps: '45-60 sec',
        restSeconds: 45,
        primaryMuscle: 'Core',
        equipment: 'No Equipment',
      },
    ],
  },
]

/**
 * Returns the best suggested routine for today based on the user's profile
 */
export function getRecommendedRoutineForProfile(profile: UserProfile | null): WorkoutRoutine {
  if (!profile) return PRESET_WORKOUT_ROUTINES[0]

  // If user trains only 2 or 3 days, full body is optimal
  if (profile.training_days_per_week <= 3) {
    return PRESET_WORKOUT_ROUTINES[3] // Full Body
  }

  // If user trains bodyweight / minimal equipment
  if (profile.training_environment === 'Bodyweight Only' || profile.training_environment === 'Home / Minimal Equipment') {
    return PRESET_WORKOUT_ROUTINES[3] // Full body / bodyweight friendly
  }

  // Default to Push day or rotation
  return PRESET_WORKOUT_ROUTINES[0]
}

