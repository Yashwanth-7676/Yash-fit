import type { WeeklyAutopilotSchedule, DayScheduleItem } from '@/types/autopilot'
import type { UserProfile } from '@/types/profile'
import type { WorkoutRoutine, MuscleGroup } from '@/types/workout'
import type { TwinWorkout } from '@/lib/digitalTwin'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ALL_MUSCLES: MuscleGroup[] = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core',
]

/**
 * Builds an optimal 7-day schedule calibrated to user frequency and recovery requirements.
 */
export function generateWeeklyAutopilotSchedule(
  profile: UserProfile | null,
  _workouts: TwinWorkout[],
  activeRoutine: WorkoutRoutine
): WeeklyAutopilotSchedule {
  const targetDaysCount = Math.max(2, Math.min(6, profile?.training_days_per_week ?? 4))
  const days: DayScheduleItem[] = []
  const muscleDistribution: Record<MuscleGroup, number> = {
    Chest: 0, Back: 0, Shoulders: 0, Biceps: 0, Triceps: 0,
    Quads: 0, Hamstrings: 0, Glutes: 0, Calves: 0, Core: 0,
  }

  // 1. Determine training day slots (0 = Mon, ..., 6 = Sun)
  // Standard ergonomic spacing to avoid excessive consecutive overload
  let trainingIndices: number[] = []
  if (targetDaysCount === 2) {
    trainingIndices = [0, 3] // Mon, Thu
  } else if (targetDaysCount === 3) {
    trainingIndices = [0, 2, 4] // Mon, Wed, Fri
  } else if (targetDaysCount === 4) {
    trainingIndices = [0, 1, 3, 4] // Mon, Tue, Thu, Fri (Upper/Lower or Push/Pull split)
  } else if (targetDaysCount === 5) {
    trainingIndices = [0, 1, 2, 4, 5] // Mon, Tue, Wed, Fri, Sat
  } else {
    trainingIndices = [0, 1, 2, 3, 4, 5] // 6 days: Mon - Sat
  }

  // 2. Select matching complementary routines from PRESET_WORKOUT_ROUTINES
  const complementaryRoutines: WorkoutRoutine[] = []
  complementaryRoutines.push(activeRoutine)

  const otherRoutines = PRESET_WORKOUT_ROUTINES.filter((r) => r.id !== activeRoutine.id)
  otherRoutines.forEach((r) => complementaryRoutines.push(r))

  let routineIdx = 0
  let totalWeeklyMinutes = 0
  let totalWeeklySets = 0
  const tradeoffsAndTradeNotes: string[] = []

  // 3. Assemble Day Schedule Items
  for (let i = 0; i < 7; i++) {
    const isTrainingDay = trainingIndices.includes(i)
    const dayName = DAY_NAMES[i]
    const date = new Date()
    date.setDate(date.getDate() + ((i + 1 - (date.getDay() || 7) + 7) % 7))
    const dateString = date.toISOString().split('T')[0]

    if (isTrainingDay) {
      const assigned = complementaryRoutines[routineIdx % complementaryRoutines.length]
      routineIdx++

      const focusMuscles = Array.from(
        new Set(assigned.exercises.map((e) => e.primaryMuscle))
      )
      const plannedMinutes = assigned.durationMinutes || 45
      totalWeeklyMinutes += plannedMinutes

      // Add to muscle distribution
      assigned.exercises.forEach((e) => {
        if (muscleDistribution[e.primaryMuscle] !== undefined) {
          muscleDistribution[e.primaryMuscle] += e.targetSets
          totalWeeklySets += e.targetSets
        }
      })

      days.push({
        dayOfWeek: dayName,
        dayIndex: i,
        dateString,
        isRestDay: false,
        routineId: assigned.id,
        routineName: assigned.name,
        focusMuscles,
        plannedMinutes,
      })
    } else {
      days.push({
        dayOfWeek: dayName,
        dayIndex: i,
        dateString,
        isRestDay: true,
        focusMuscles: [],
        plannedMinutes: 0,
      })
    }
  }

  // 4. Trade-offs & Scientific Insights
  if (targetDaysCount <= 3) {
    tradeoffsAndTradeNotes.push(
      'Conservative 3-day frequency maximizes systemic recovery and central nervous system replenishment between sessions.'
    )
  } else if (targetDaysCount >= 5) {
    tradeoffsAndTradeNotes.push(
      'High 5+ day training frequency requires strict adherence to sleep (7.5h+) and recovery check-ins to prevent overreaching.'
    )
  }

  // Check anterior vs posterior balance
  const pushVolume = (muscleDistribution.Chest || 0) + (muscleDistribution.Shoulders || 0)
  const pullVolume = muscleDistribution.Back || 0
  if (pushVolume > pullVolume + 6) {
    tradeoffsAndTradeNotes.push(
      'Push volume (Chest/Shoulders) exceeds Pull volume (Back). Autopilot recommends adding vertical or horizontal row sets to preserve glenohumeral stability.'
    )
  }

  return {
    trainingDaysPerWeek: targetDaysCount,
    totalWeeklyMinutes,
    totalWeeklySets,
    days,
    tradeoffsAndTradeNotes,
    muscleDistribution,
  }
}

