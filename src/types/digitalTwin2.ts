import type { MuscleGroup } from './workout'
import type { TrainingScenario } from '@/lib/digitalTwin'

export type TimelineDataSource = 'logged_workout' | 'body_measurement' | 'recovery_entry' | 'nutrition_log' | 'autopilot_adaptation' | 'scenario_projection'

export interface UnifiedTimelineEvent {
  id: string
  date: string
  category: 'workout' | 'measurement' | 'recovery' | 'nutrition' | 'milestone'
  title: string
  summary: string
  isMeasured: boolean // true = real logged data; false = estimated / modeled
  source: TimelineDataSource
  metrics?: Record<string, string | number>
}

export interface ScenarioComparisonMatrix {
  scenarios: TrainingScenario[]
  metrics: {
    scenarioId: string
    scenarioName: string
    weeklyFrequency: number
    weeklyVolumeSets: number
    weeklyMinutes: number
    restDays: number
    dailyCalories: number
    dailyProteinGrams: number
    sleepHours: number
    muscleSets: { muscle: MuscleGroup | string; sets: number }[]
    projectedWeeklyStimulus: 'low' | 'moderate' | 'optimal' | 'high_fatigue'
    limitations: string[]
  }[]
}

export interface DigitalTwinExportData {
  exportedAt: string
  appVersion: string
  userId: string
  disclaimer: string
  profile: {
    primaryGoal?: string
    experienceLevel?: string
    targetWeightKg?: number
  }
  historySummary: {
    totalWorkouts: number
    totalMeasurements: number
    totalRecoveryEntries: number
  }
  savedScenarios: TrainingScenario[]
  timelineEvents: UnifiedTimelineEvent[]
}
