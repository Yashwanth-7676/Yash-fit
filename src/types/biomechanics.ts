import type { SupportedVisionExercise } from './pose'

export interface BiomechanicsSessionRecord {
  id: string
  userId: string
  date: string
  exercise: SupportedVisionExercise
  exerciseName: string
  totalReps: number
  cleanReps: number
  partialReps: number
  averageFormScore: number // 0 - 100
  durationSeconds: number
  maxKneeAngle?: number
  minKneeAngle?: number
  maxElbowAngle?: number
  minElbowAngle?: number
  maxTorsoLean?: number
  primaryFeedback: string[]
  notes?: string
}

export interface BiomechanicsConfidence {
  overallConfidence: number // 0 - 100
  landmarksDetectedCount: number // out of 33
  bodyVisibilityPct: number // 0 - 100
  lightingScore: 'optimal' | 'acceptable' | 'dim'
}

export interface ExerciseBiomechanicalGuidance {
  exercise: SupportedVisionExercise
  name: string
  primaryMuscle: string
  targetJoints: string[]
  planeOfMotion: 'Sagittal' | 'Frontal' | 'Transverse' | 'Multi-planar'
  cameraSetup: {
    recommendedDistance: string
    recommendedAngle: string
    optimalHeight: string
  }
  idealFormCriteria: string[]
  commonFaults: {
    fault: string
    cue: string
    severity: 'low' | 'moderate' | 'high'
  }[]
  approximateNote: string
}

