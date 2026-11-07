export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export type SupportedVisionExercise =
  | 'squat'
  | 'push_up'
  | 'lunge'
  | 'plank'
  | 'bicep_curl'
  | 'shoulder_press'
  | 'deadlift'
  | 'jumping_jack'

export type MovementPhase =
  | 'READY'
  | 'ECCENTRIC'
  | 'BOTTOM_INFLECTION'
  | 'CONCENTRIC'
  | 'LOCKOUT'
  | 'COMPLETED'

export type FeedbackSeverity = 'good' | 'warning' | 'error' | 'info'

export interface FormFeedback {
  id: string
  message: string
  severity: FeedbackSeverity
  timestamp: number
  joint?: string
}

export interface JointAngles {
  kneeAngle: number // degrees (Hip - Knee - Ankle)
  hipAngle: number // degrees (Shoulder - Hip - Knee)
  elbowAngle: number // degrees (Shoulder - Elbow - Wrist)
  torsoAngle: number // degrees relative to vertical
  spineAlignmentAngle?: number // degrees (Shoulder - Hip - Ankle)
  // Bilateral specific angles
  leftKneeAngle?: number
  rightKneeAngle?: number
  leftHipAngle?: number
  rightHipAngle?: number
  leftElbowAngle?: number
  rightElbowAngle?: number
  leftShoulderAngle?: number
  rightShoulderAngle?: number
  bilateralSymmetry?: number // 0 to 100%
  cadenceRpm?: number // Estimated repetitions per minute cadence
}

export interface FormAnalysisResult {
  exercise: SupportedVisionExercise
  phase: MovementPhase
  angles: JointAngles
  feedback: FormFeedback[]
  repCompleted: boolean
  isPartialRep: boolean
  formScore: number // 0 to 100
  isBodyFullyVisible: boolean
  bilateralSymmetryScore?: number // 0 to 100%
  primaryFault?: string | null
  confidence: number // 0 to 1.0 landmark tracking confidence
}

export interface ExerciseFormConfig {
  id: SupportedVisionExercise
  name: string
  recommendedDistance: string
  recommendedAngle: string
  cues: string[]
  criteria: {
    readyAngle: number
    targetDepthAngle: number
    minDepthTolerance: number
    maxLeanAngle?: number
    hysteresisBuffer?: number
  }
}
