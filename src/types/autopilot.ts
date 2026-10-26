import type { MuscleGroup, ExerciseDifficulty, WorkoutRoutine, WorkoutExerciseItem } from './workout'
import type { EquipmentOption, UserProfile } from './profile'
import type { RecoveryEntry, TwinWorkout } from '@/lib/digitalTwin'

export type AutopilotDecisionStatus = 'pending' | 'accepted' | 'modified' | 'dismissed' | 'undone'
export type DataSufficiencyLevel = 'high' | 'medium' | 'low' | 'insufficient'
export type OverloadActionType = 'increase_weight' | 'increase_reps' | 'maintain' | 'decrease_load' | 'substitute' | 'rest'

export interface ExerciseAdaptation {
  exerciseId: string
  exerciseName: string
  originalItem: WorkoutExerciseItem
  proposedItem: WorkoutExerciseItem
  actionType: OverloadActionType
  weightDeltaKg: number
  repDelta: number
  setDelta: number
  reason: string
  supportingData: string
  sufficiency: DataSufficiencyLevel
  limitations: string
  substituteReason?: string
}

export interface TodayWorkoutRecommendation {
  routineId: string
  routineName: string
  targetSplit: string
  estimatedDurationMinutes: number
  readinessScore: number | null
  readinessCategory: string
  isRecoveryConstrained: boolean
  overallRationale: string
  dataSufficiency: DataSufficiencyLevel
  confidenceScore: number // 0 to 100
  exerciseAdaptations: ExerciseAdaptation[]
  safetyWarnings: string[]
  recommendedRestDaysAhead: number
  status: AutopilotDecisionStatus
  proposedAt: string
}

export interface DayScheduleItem {
  dayOfWeek: string // e.g. "Monday", "Tuesday"
  dayIndex: number  // 0 (Sun) to 6 (Sat) or 1 (Mon) to 7 (Sun)
  dateString: string
  isRestDay: boolean
  routineId?: string
  routineName?: string
  focusMuscles: MuscleGroup[]
  plannedMinutes: number
  conflictWarning?: string
}

export interface WeeklyAutopilotSchedule {
  trainingDaysPerWeek: number
  totalWeeklyMinutes: number
  totalWeeklySets: number
  days: DayScheduleItem[]
  tradeoffsAndTradeNotes: string[]
  muscleDistribution: Record<MuscleGroup, number>
}

export interface AutopilotAdaptationRecord {
  id: string
  userId: string
  date: string
  routineName: string
  previousPlanSummary: string
  proposedAdjustmentSummary: string
  reason: string
  userDecision: AutopilotDecisionStatus
  decisionTimestamp: string
  outcomeSummary?: string
  previousPlanSnapshot?: {
    routineId: string
    exerciseOverrides?: Record<string, string>
    trainingDaysPerWeek?: number
  }
}

export interface AutopilotEngineInput {
  profile: UserProfile | null
  workouts: TwinWorkout[]
  recovery: RecoveryEntry[]
  currentRoutine?: WorkoutRoutine | null
  activeOverrides?: Record<string, string>
}
