import type { SupportedVisionExercise, FormAnalysisResult, FormFeedback } from './pose'

export interface CameraDeviceInfo {
  deviceId: string
  label: string
  facingMode?: 'user' | 'environment'
}

export interface RepPerformanceRecord {
  repNumber: number
  qualityScore: number
  durationSeconds: number
  peakDepthAngle: number
  wasFullRep: boolean
  bilateralSymmetry: number
  detectedFaults: string[]
  completedAt: number
}

export interface TrainerSessionSummary {
  id: string
  exercise: SupportedVisionExercise
  startTime: number
  endTime: number
  durationSeconds: number
  totalReps: number
  validReps: number
  partialReps: number
  averageScore: number
  averageSymmetry: number
  estimatedCalories: number
  repRecords: RepPerformanceRecord[]
  topFaults: { fault: string; count: number }[]
  personalRecordBeaten: boolean
  previousRecord: number
  feedbackSummary: string
  verifiedByAiVision: boolean
}

export interface VoiceCoachConfig {
  enabled: boolean
  voiceVolume: number // 0 to 1
  voiceRate: number // 0.8 to 1.3
  voicePitch: number // 0.8 to 1.2
  soundEffects: boolean
  announceMilestones: boolean
  announceFormCues: boolean
}

export interface TrainerLiveMetrics {
  currentReps: number
  targetReps: number
  partialReps: number
  currentPhase: string
  qualityScore: number
  bilateralSymmetry: number
  cadenceRpm: number
  elapsedSeconds: number
  confidence: number
  recentCue: string | null
  activeFault: string | null
}
