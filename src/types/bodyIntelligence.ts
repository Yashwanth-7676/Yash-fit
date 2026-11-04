export type CompositionFormula = 'navy_method' | 'bmi_derived' | 'manual'

export interface BodyCompositionEstimate {
  bodyFatPercentage: number
  leanMassKg: number
  fatMassKg: number
  bmi: number
  formulaUsed: CompositionFormula
  isEstimated: true
  confidenceRating: 'high' | 'moderate' | 'approximate'
  explanation: string
}

export interface BodyIntelligencePhotoSet {
  frontUrl?: string
  sideUrl?: string
  backUrl?: string
}

export interface BodyIntelligenceRecord {
  id: string
  userId: string
  recordedDate: string // YYYY-MM-DD
  weightKg: number
  heightCm: number
  gender: 'male' | 'female' | 'other'
  age: number
  waistCm?: number
  neckCm?: number
  hipsCm?: number
  chestCm?: number
  armCm?: number
  thighCm?: number
  photos?: BodyIntelligencePhotoSet
  composition: BodyCompositionEstimate
  notes?: string
  createdAt: string
}

export interface BodyIntelligenceGoal {
  currentWeightKg: number
  targetWeightKg: number
  targetBodyFatPercent?: number
  targetWaistCm?: number
  targetDate?: string
  weeklyRateGoalKg: number // e.g. -0.5 for deficit or +0.25 for lean bulk
}

export interface MeasurementComparisonDelta {
  baselineDate: string
  currentDate: string
  daysElapsed: number
  weightDeltaKg: number
  waistDeltaCm?: number
  neckDeltaCm?: number
  chestDeltaCm?: number
  hipsDeltaCm?: number
  armDeltaCm?: number
  thighDeltaCm?: number
  bodyFatDeltaPercent?: number
  leanMassDeltaKg?: number
  fatMassDeltaKg?: number
}

export interface MonthlyCompositionSummary {
  monthKey: string // YYYY-MM
  monthLabel: string
  startWeightKg: number
  endWeightKg: number
  netWeightChangeKg: number
  bodyFatChangePercent?: number
  photosLoggedCount: number
  measurementsLoggedCount: number
  keyMilestone: string
}

