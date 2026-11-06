export type SmartNotificationCategory =
  | 'workout'
  | 'hydration'
  | 'recovery'
  | 'achievement'
  | 'weekly_summary'
  | 'system'

export type NotificationPriority = 'low' | 'normal' | 'high'

export interface SmartNotification {
  id: string
  userId: string
  category: SmartNotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string // ISO timestamp
  scheduledFor?: string // ISO timestamp
  deliveredAt?: string
  metadata?: Record<string, unknown>
}

export interface QuietHoursConfig {
  enabled: boolean
  startHour: number // 0-23, e.g., 22 (10:00 PM)
  endHour: number // 0-23, e.g., 7 (7:00 AM)
}

export interface NotificationPreferences {
  enableInApp: boolean
  enableBrowserPush: boolean
  categories: {
    workout: boolean
    hydration: boolean
    recovery: boolean
    achievement: boolean
    weekly_summary: boolean
  }
  quietHours: QuietHoursConfig
  timezone: string
  maxDailyReminders: number
}
