export type TaskCategory = 'workout' | 'nutrition' | 'hydration' | 'recovery' | 'quest'
export type DayPeriod = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface DailyPlanTask {
  id: string
  category: TaskCategory
  period: DayPeriod
  suggestedTime: string // e.g. "07:00"
  title: string
  detail: string
  targetValue?: string
  priority: TaskPriority
  completed: boolean
  completedAt?: string
  linkedRoute?: string
}

export interface DailyPlanSummary {
  date: string
  dayOfWeek: string
  isRestDay: boolean
  readinessScore?: number
  readinessLabel: string
  workoutTitle: string
  dailyCalorieTarget: number
  dailyProteinTargetGrams: number
  dailyWaterTargetLiters: number
  tasks: DailyPlanTask[]
  completedCount: number
  totalCount: number
  adherencePercentage: number
}

export interface ReminderPreferences {
  quietHoursStart: string // e.g. "22:00"
  quietHoursEnd: string // e.g. "07:00"
  timezone: string // e.g. "Asia/Kolkata"
  workoutReminderTime: string // e.g. "06:30"
  mealReminderTime: string // e.g. "12:30"
  hydrationReminderIntervalHours: number // e.g. 2
  quietHoursEnabled: boolean
  browserPushEnabled: boolean
  inAppNotifications: boolean
}
