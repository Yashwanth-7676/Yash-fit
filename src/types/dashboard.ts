export type DashboardWidgetId =
  | 'daily_overview'
  | 'todays_workout'
  | 'nutrition_hydration'
  | 'recovery_summary'
  | 'personal_records'
  | 'weekly_progress'
  | 'upcoming_goals'
  | 'context_recommendations'
  | 'rpg_progress'
  | 'digital_twin'

export interface DashboardWidgetConfig {
  id: DashboardWidgetId
  title: string
  description: string
  enabled: boolean
  order: number
}

export interface PersonalRecordItem {
  exerciseId: string
  exerciseName: string
  maxWeightKg: number
  repsAtMax: number
  estimated1RmKg: number
  achievedDate: string
}

export interface UpcomingGoalItem {
  id: string
  title: string
  targetValue: string
  currentValue: string
  percentComplete: number
  category: 'weight' | 'workout' | 'nutrition' | 'recovery'
  dueDate?: string
}

export interface ContextRecommendation {
  id: string
  type: 'overload' | 'recovery' | 'nutrition' | 'form'
  title: string
  rationale: string
  actionLabel?: string
  actionHref?: string
  urgency: 'low' | 'normal' | 'high'
}
