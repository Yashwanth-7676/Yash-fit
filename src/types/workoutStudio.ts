export interface StudioExerciseSet {
  setNumber: number
  targetReps: string // e.g. "8-10"
  targetWeightKg: number
  actualReps?: number
  actualWeightKg?: number
  isCompleted: boolean
  rpe?: number // Rate of Perceived Exertion (6-10)
  restSeconds: number
}

export interface StudioExerciseSubstitution {
  id: string
  name: string
  reason: string
}

export interface StudioExerciseDetail {
  exerciseId: string
  name: string
  primaryMuscle: string
  secondaryMuscles: string[]
  motionCycleKey: string
  instructions: string[]
  cues: string[]
  breathingGuidance: string
  sets: StudioExerciseSet[]
  substitutions: StudioExerciseSubstitution[]
}

export interface StudioWorkoutState {
  routineId: string
  routineName: string
  currentExerciseIndex: number
  currentSetIndex: number
  elapsedSeconds: number
  isPaused: boolean
  restRemainingSeconds: number
  isResting: boolean
  voiceEnabled: boolean
  exercises: StudioExerciseDetail[]
}

export interface WorkoutStudioSummary {
  sessionId: string
  routineName: string
  durationMinutes: number
  totalVolumeKg: number
  totalSetsCompleted: number
  estimatedCaloriesBurned: number
  personalRecordsHit: string[]
}

