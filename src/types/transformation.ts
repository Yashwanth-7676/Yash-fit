export type PoseType = 'front' | 'side' | 'back'

export type MeasurementMetricKey =
  | 'weight_kg'
  | 'waist_cm'
  | 'chest_cm'
  | 'hips_cm'
  | 'arm_cm'
  | 'thigh_cm'
  | 'neck_cm'

export interface BodyMeasurementEntry {
  id: string
  userId: string
  recordedDate: string // YYYY-MM-DD
  weightKg?: number
  waistCm?: number
  chestCm?: number
  hipsCm?: number
  armCm?: number
  thighCm?: number
  neckCm?: number
  notes?: string
  createdAt?: string
}

export interface TransformationPhoto {
  id: string
  userId: string
  recordedDate: string // YYYY-MM-DD
  poseType: PoseType
  photoData: string // Base64 data URL or private cloud URI
  weightAtTime?: number
  notes?: string
  createdAt: string
}

export interface MetricTrendAnalysis {
  metric: MeasurementMetricKey
  metricLabel: string
  unit: string
  currentValue: number
  startValue: number
  netChange: number
  weeklyRate: number
  direction: 'decreasing' | 'increasing' | 'stable'
  uncertaintyMargin: number
  uncertaintyExplanation: string
}

export interface TransformationMilestone {
  id: string
  date: string
  title: string
  description: string
  type: 'weight' | 'waist' | 'photo' | 'streak'
}

