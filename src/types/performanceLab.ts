export type PerformanceTestCategory =
  | 'strength_progression'
  | 'repetition_endurance'
  | 'timed_endurance'
  | 'workload_capacity'

export type MeasurementUnit = 'kg' | 'reps' | 'seconds' | 'meters'

export interface PerformanceTestDefinition {
  id: string
  title: string
  subtitle: string
  category: PerformanceTestCategory
  unit: MeasurementUnit
  isMaximal: boolean
  targetMuscleGroups: string[]
  equipmentRequired: string[]
  instructions: string[]
  standardConditions: string[]
  safetyScreening: string[]
  contraindications: string[]
  calculationFormula?: string
  scoringExplanation: string
}

export interface PerformanceTestLog {
  id: string
  userId: string
  testId: string
  testTitle: string
  category: PerformanceTestCategory
  date: string
  resultValue: number
  unit: MeasurementUnit
  estimated1RM?: number // Calculated for submaximal strength tests
  isBaseline: boolean
  conditionsMet: boolean
  notes?: string
}

export interface PerformanceBenchmarkReport {
  testId: string
  testTitle: string
  category: PerformanceTestCategory
  unit: MeasurementUnit
  baselineValue: number | null
  personalBest: number | null
  latestValue: number | null
  historicalImprovementPct: number | null
  testCount: number
  recentLogs: PerformanceTestLog[]
  periodComparison: {
    lastWeekDiffPct: number | null
    lastMonthDiffPct: number | null
  }
}

