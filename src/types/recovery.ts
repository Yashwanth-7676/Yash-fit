export type EnergyRating = 'Low' | 'Moderate' | 'High' | 'Peak'
export type SorenessLevel = 'None' | 'Mild' | 'Moderate' | 'Severe'
export type StressLevel = 'Low' | 'Moderate' | 'High'

export interface DailyRecoveryLog {
  id: string
  userId: string
  date: string
  sleepHours: number
  sleepQuality: number // 1 to 5
  soreness: SorenessLevel
  energy: EnergyRating
  stress: StressLevel
  readinessScore: number // 0 to 100
  notes?: string
}

export interface RecoveryTrendPoint {
  day: string
  readiness: number
  sleepHours: number
}

