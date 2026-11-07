export type CameraViewAngle = 'front' | 'side' | 'rear'
export type MotionVerseTheme = 'anatomical' | 'anime'
export type MovementDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type PlaybackRate = 0.5 | 1.0 | 1.5 | 2.0

export type MuscleRole = 'agonist' | 'synergist' | 'stabilizer' | 'antagonist'

export interface MuscleEngagementInfo {
  muscleId: string
  name: string
  role: MuscleRole
  functionDescription: string
  anatomicalLocation: 'anterior' | 'posterior' | 'both'
}

export interface MovementPhase {
  id: string
  name: string
  phaseStartNorm: number // 0.0 to 1.0
  phaseEndNorm: number // 0.0 to 1.0
  cue: string
  breathing: 'inhale' | 'exhale' | 'brace' | 'hold'
  activeMuscles: string[]
  keyCheckpoints: string[]
}

export interface FormCheckpoint {
  joint: string
  targetAngleDescription: string
  optimalAngleDeg?: number
  commonMistake: string
  correctionCue: string
  severity: 'low' | 'moderate' | 'critical'
}

export interface AnimeThemeConfig {
  characterName: string
  heroTitle: string
  auraColor: string
  energyTier: string
  specialTechnique: string
  visualStyle: 'titan' | 'shinobi' | 'saiyan'
}

export interface MotionVerseExercise {
  id: string
  name: string
  category: 'compound' | 'isolation' | 'calisthenics' | 'core'
  targetMuscles: {
    primary: string[]
    secondary: string[]
    stabilizers: string[]
  }
  equipment: string
  defaultTempo: string // e.g. "3-1-1-0"
  cycleDurationSeconds: number
  availableAngles: CameraViewAngle[]
  phases: MovementPhase[]
  formCheckpoints: FormCheckpoint[]
  animeConfig: AnimeThemeConfig
  beginnerModifications?: string[]
  advancedProgressions?: string[]
}

export interface KinematicJointPositions {
  // Normalized 2D canvas coordinates (0 to 300 x, 0 to 240 y)
  head: { x: number; y: number }
  neck: { x: number; y: number }
  shoulderLeft: { x: number; y: number }
  shoulderRight: { x: number; y: number }
  elbowLeft: { x: number; y: number }
  elbowRight: { x: number; y: number }
  wristLeft: { x: number; y: number }
  wristRight: { x: number; y: number }
  spineMid: { x: number; y: number }
  hipLeft: { x: number; y: number }
  hipRight: { x: number; y: number }
  kneeLeft: { x: number; y: number }
  kneeRight: { x: number; y: number }
  ankleLeft: { x: number; y: number }
  ankleRight: { x: number; y: number }
  barbell?: { x1: number; y1: number; x2: number; y2: number }
  dumbbells?: Array<{ x: number; y: number; angle: number }>
  bench?: { x: number; y: number; width: number; height: number }
  jointAngles: {
    kneeAngleDeg?: number
    hipHingeDeg?: number
    elbowFlexionDeg?: number
    torsoAngleDeg?: number
  }
  barPathY?: number
}

export interface MotionVersePlayerState {
  exerciseId: string
  isPlaying: boolean
  playbackSpeed: PlaybackRate
  cycleProgress: number // 0.0 to 1.0
  cameraAngle: CameraViewAngle
  theme: MotionVerseTheme
  difficulty: MovementDifficulty
  repCount: number
  currentPhase: MovementPhase
  showFormGuide: boolean
  showMuscleMap: boolean
  showPoseCamera: boolean
  isFullscreen: boolean
  volumeMuted: boolean
}
