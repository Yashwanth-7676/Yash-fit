import type { MuscleGroup } from './workout'

export type TrendHorizon = '7d' | '30d' | '90d' | 'all'

export type RecommendationType =
  | 'train_as_planned'
  | 'reduce_intensity'
  | 'substitute_exercise'
  | 'recovery_day'

export type AttentionCategory = 'recovery' | 'nutrition' | 'training' | 'consistency' | 'hydration'
export type AttentionSeverity = 'high' | 'medium' | 'info'

export interface AttentionArea {
  id: string
  category: AttentionCategory
  severity: AttentionSeverity
  title: string
  description: string
  metricValue?: string
  actionLabel: string
  actionHref: string
}

export interface TodayFitnessStatus {
  readinessScore: number
  readinessLabel: 'Optimal' | 'Good' | 'Moderate' | 'Low / Fatigued' | 'Unrecorded'
  sleepHours: number | null
  soreness: string | null
  scheduledWorkout: {
    id: string
    name: string
    split: string
    exerciseCount: number
    status: 'completed' | 'in_progress' | 'scheduled' | 'rest'
  }
  hydration: {
    loggedLiters: number
    targetLiters: number
    percentage: number
  }
  nutrition: {
    caloriesTarget: number
    proteinTargetGrams: number
    isAdherenceAvailable: boolean
  }
  streakDays: number
  level: number
  rank: string
  totalXp: number
}

export interface PersonalRecordItem {
  exerciseId: string
  exerciseName: string
  primaryMuscle: MuscleGroup | string
  bestWeightKg: number
  repsAtBestWeight: number
  estimated1RmKg: number
  achievedDate: string
  isRecent: boolean // achieved in the last 14 days
}

export interface DailyActionItem {
  id: string
  title: string
  category: 'workout' | 'nutrition' | 'hydration' | 'recovery' | 'measurement' | 'quest'
  description: string
  actionHref: string
  actionLabel: string
  completed: boolean
  priority: 'high' | 'medium' | 'normal'
  isKeyGoal?: boolean
}

export interface AdaptiveWorkoutRecommendation {
  id: string
  recommendationType: RecommendationType
  title: string
  summary: string
  explanation: string
  supportingData: string
  actionText: string
  actionHref: string
  safetyDisclaimer: string
  limitations: string
  targetRoutineId: string
  substitutions?: Record<string, string>
  volumeAdjustmentPercent?: number // e.g. -20 for 20% reduced sets
  status: 'pending' | 'accepted' | 'edited' | 'dismissed'
}

export interface StructuredCoachResponse {
  recommendation: string
  supportingData: string
  explanation: string
  nextAction: string
  actionHref?: string
  limitations: string
  provider: 'gemini' | 'openai' | 'rule_based'
}

export interface AiCoachMessage {
  id: string
  sender: 'user' | 'coach'
  text: string
  timestamp: string
  structured?: StructuredCoachResponse
}

export interface TrendForecastPoint {
  date: string
  label: string
  measuredValue?: number
  forecastValue?: number
  lowerBound?: number
  upperBound?: number
  isProjected: boolean
}

export interface StrengthProgressionItem {
  exerciseName: string
  history: { date: string; weightKg: number; reps: number }[]
  trendPercent: number // e.g. +5.2%
}

