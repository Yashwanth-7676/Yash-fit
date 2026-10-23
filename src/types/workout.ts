import type { EquipmentOption } from './profile'

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core'

export type ExerciseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type AnimationType = 'anime_2d' | 'anime_3d' | 'procedural_anime' | 'live_action'
export type VideoProvider = 'html5' | 'youtube' | 'procedural_anime'
export type CameraAngle = 'Side' | 'Front' | 'Angle'
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5

export type MotionCycleKey =
  | 'squat'
  | 'push_up'
  | 'pull_up'
  | 'bench_press'
  | 'deadlift'
  | 'bicep_curl'
  | 'overhead_press'
  | 'plank'
  | 'bent_over_row'
  | 'leg_raise'
  | 'calf_raise'
  | 'lunge'
  | 'lateral_raise'
  | 'lat_pulldown'
  | 'cable_flye'
  | 'cable_row'
  | 'leg_press'
  | 'rdl'
  | 'tricep_pushdown'
  | 'goblet_squat'

export interface ExerciseVideoMetadata {
  provider: VideoProvider
  sourceUrl?: string // Direct MP4 URL or YouTube ID
  posterUrl?: string
  animationType: AnimationType
  title: string
  durationSeconds: number
  isVerified: boolean
  attribution?: string
  motionCycleKey: MotionCycleKey
  tempo?: string // e.g. "3-1-1-0"
  cameraAngles: CameraAngle[]
  activatedMuscles: MuscleGroup[]
  notes?: string
}

export interface Exercise {
  id: string
  name: string
  primaryMuscle: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  equipment: EquipmentOption
  difficulty: ExerciseDifficulty
  instructions: string[]
  tips?: string[]
  video?: ExerciseVideoMetadata
}

export interface WorkoutExerciseItem {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: string // e.g. "8-12"
  restSeconds: number
  primaryMuscle: MuscleGroup
  equipment: EquipmentOption
}

export interface WorkoutRoutine {
  id: string
  name: string
  targetSplit: string
  description: string
  durationMinutes: number
  exercises: WorkoutExerciseItem[]
}

export interface CompletedSetLog {
  setNumber: number
  weightKg: number
  reps: number
  completed: boolean
}

export interface CompletedExerciseLog {
  exerciseId: string
  exerciseName: string
  sets: CompletedSetLog[]
}

export interface WorkoutSessionLog {
  id: string
  userId: string
  workoutName: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  totalVolumeKg: number
  totalSetsCompleted: number
  exercises: CompletedExerciseLog[]
}

