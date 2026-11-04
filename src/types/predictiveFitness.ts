export interface ConsistencyAnalysis {
  consistencyScorePercent: number
  plannedWorkoutsPerWeek: number
  actualWorkoutsPerWeek: number
  longestStreakWeeks: number
  consistencyRating: 'exceptional' | 'steady' | 'inconsistent'
}

export interface StrengthTrajectoryPrediction {
  exerciseId: string
  exerciseName: string
  currentEstimated1RMKg: number
  projected1RMIn4WeeksKg: number
  projected1RMIn8WeeksKg: number
  projected1RMIn12WeeksKg: number
  weeklyProgressionRateKg: number
  confidenceRating: 'high' | 'moderate' | 'low'
  uncertaintyBoundKg: number
}

export interface WeightTrajectoryProjection {
  currentWeightKg: number
  rolling7DayAverageKg: number
  targetWeightKg: number
  weeklyRateKg: number
  projectedWeeksToGoal: number
  projectedGoalDate: string
  uncertaintyWeeksBound: number
  direction: 'loss' | 'gain' | 'maintenance'
}

export interface NutritionAdherenceAnalysis {
  averageDailyCalories: number
  targetCalories: number
  averageDailyProteinG: number
  targetProteinG: number
  calorieAdherencePercent: number
  proteinAdherencePercent: number
}

export interface RecoveryTrendAnalysis {
  averageReadinessScore: number
  averageSleepHours: number
  trend: 'improving' | 'stable' | 'fatigued'
}

export interface MissingDataAuditItem {
  id: string
  domain: 'workouts' | 'nutrition' | 'recovery' | 'measurements'
  description: string
  impactOnForecast: string
  severity: 'low' | 'medium' | 'high'
}

export interface ActionableRecommendation {
  id: string
  title: string
  description: string
  category: 'training' | 'nutrition' | 'recovery'
  potentialImpact: string
}

export interface PredictiveFitnessOverview {
  consistency: ConsistencyAnalysis
  strength: StrengthTrajectoryPrediction[]
  weight: WeightTrajectoryProjection
  nutrition: NutritionAdherenceAnalysis
  recovery: RecoveryTrendAnalysis
  missingDataAudits: MissingDataAuditItem[]
  recommendations: ActionableRecommendation[]
  overallModelConfidence: number // 0-100%
  explainabilityDrivers: { factor: string; influence: string }[]
  lastCalculated: string
}

