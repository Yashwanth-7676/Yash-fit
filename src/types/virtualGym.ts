import type { MuscleGroup, ExerciseDifficulty, MotionCycleKey, CameraAngle } from './workout'
import type { EquipmentOption } from './profile'

export type MuscleHighlightRole = 'primary' | 'secondary' | 'none'

export interface MovementPhase {
  name: string
  startProgress: number // 0.0 to 1.0
  endProgress: number   // 0.0 to 1.0
  cue: string
}

export interface JointAngles {
  // Spine & Torso
  torsoPitch: number // degrees (forward lean)
  torsoYaw: number   // degrees (twist)
  torsoHeight: number // relative vertical displacement in units

  // Left Leg
  leftHipPitch: number
  leftKneePitch: number
  leftAnklePitch: number

  // Right Leg
  rightHipPitch: number
  rightKneePitch: number
  rightAnklePitch: number

  // Left Arm
  leftShoulderPitch: number
  leftShoulderYaw: number
  leftShoulderRoll: number
  leftElbowPitch: number

  // Right Arm
  rightShoulderPitch: number
  rightShoulderYaw: number
  rightShoulderRoll: number
  rightElbowPitch: number

  // Props
  barbellPosition?: [number, number, number]
  dumbbellLeftPos?: [number, number, number]
  dumbbellRightPos?: [number, number, number]
  showBarbell?: boolean
  showDumbbells?: boolean
  showBench?: boolean
}

export interface Exercise3DConfig {
  id: string
  name: string
  motionKey: MotionCycleKey
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  equipment: EquipmentOption
  difficulty: ExerciseDifficulty
  tempo: string
  cycleDurationSeconds: number
  defaultCamera: 'front' | 'side' | 'isometric' | 'back'
  phases: MovementPhase[]
  startingPosition: string
  endingPosition: string
  instructions: string[]
  commonMistakes: string[]
  safetyTips: string[]
  kinematics: (progress: number) => JointAngles
}

export interface MuscleTrainingMetric {
  muscle: MuscleGroup
  loggedSetsLast7Days: number
  exerciseNames: string[]
  frequencyDays: number
  status: 'optimal' | 'moderate' | 'undertrained' | 'untrained'
  recommendation: string
}

export interface WeeklyMuscleOverview {
  totalLoggedSets: number
  muscleMetrics: Record<MuscleGroup, MuscleTrainingMetric>
  undertrainedMuscles: MuscleGroup[]
  wellTrainedMuscles: MuscleGroup[]
  balancedSuggestions: {
    title: string
    reason: string
    suggestedExercises: string[]
  }[]
  generatedAt: string
  disclaimer: string
}

