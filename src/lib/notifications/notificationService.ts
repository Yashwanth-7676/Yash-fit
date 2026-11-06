import type {
  SmartNotification,
  SmartNotificationCategory,
  NotificationPreferences,
  QuietHoursConfig,
} from '@/types/notifications'

const STORAGE_KEYS = {
  PREFS_PREFIX: 'yashfit_notification_preferences_',
  NOTIFS_PREFIX: 'yashfit_smart_notifications_',
  COOLDOWN_PREFIX: 'yashfit_notification_cooldown_',
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enableInApp: true,
  enableBrowserPush: false,
  categories: {
    workout: true,
    hydration: true,
    recovery: true,
    achievement: true,
    weekly_summary: true,
  },
  quietHours: {
    enabled: true,
    startHour: 22, // 10:00 PM
    endHour: 7, // 7:00 AM
  },
  timezone:
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
      : 'Asia/Kolkata',
  maxDailyReminders: 6,
}

// Initial demo notifications seed
const SEED_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'seed-workout-1',
    userId: 'demo-user',
    category: 'workout',
    priority: 'normal',
    title: "Today's Training Session Scheduled",
    message: 'Upper Body Hypertrophy is queued for your daily workout. 6 exercises programmed.',
    link: '/workout-studio',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
  },
  {
    id: 'seed-hydration-1',
    userId: 'demo-user',
    category: 'hydration',
    priority: 'low',
    title: 'Hydration Checkpoint',
    message: 'You have logged 2.1L today. Drink 900ml more to achieve your 3.0L milestone.',
    link: '/dashboard',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
  },
  {
    id: 'seed-recovery-1',
    userId: 'demo-user',
    category: 'recovery',
    priority: 'normal',
    title: 'Morning Readiness Calibrated',
    message: 'Readiness score is 78/100 (Optimal). Your central nervous system is recovered for progressive overload.',
    link: '/recovery',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6h ago
  },
  {
    id: 'seed-achievement-1',
    userId: 'demo-user',
    category: 'achievement',
    priority: 'high',
    title: 'New Anime Badge Unlocked! 🏆',
    message: 'Unlocked "Iron Consistency" badge for completing 4 consecutive weekly workouts.',
    link: '/achievements',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18h ago
  },
]

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

/**
 * Checks whether a given timestamp falls within quiet hours.
 * Handles both overnight spans (e.g. 22:00 -> 07:00) and same-day spans (e.g. 13:00 -> 15:00).
 */
export function isWithinQuietHours(date: Date, quietHours: QuietHoursConfig): boolean {
  if (!quietHours.enabled) return false

  const hour = date.getHours()
  const { startHour, endHour } = quietHours

  if (startHour > endHour) {
    // Overnight quiet hours, e.g. 22 to 7
    return hour >= startHour || hour < endHour
  } else if (startHour < endHour) {
    // Same-day quiet hours, e.g. 13 to 15
    return hour >= startHour && hour < endHour
  } else {
    // startHour === endHour, 24-hour quiet hours
    return true
  }
}

/**
 * Retrieves persisted notification preferences.
 */
export function getNotificationPreferences(userId: string = 'demo-user'): NotificationPreferences {
  if (!hasLocalStorage()) return DEFAULT_NOTIFICATION_PREFERENCES

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PREFS_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...parsed,
        categories: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.categories,
          ...(parsed.categories || {}),
        },
        quietHours: {
          ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
          ...(parsed.quietHours || {}),
        },
      }
    }
  } catch (err) {
    console.warn('Unable to read notification preferences:', err)
  }

  return DEFAULT_NOTIFICATION_PREFERENCES
}

/**
 * Saves notification preferences.
 */
export function saveNotificationPreferences(
  prefs: NotificationPreferences,
  userId: string = 'demo-user'
): void {
  if (!hasLocalStorage()) return

  try {
    localStorage.setItem(`${STORAGE_KEYS.PREFS_PREFIX}${userId}`, JSON.stringify(prefs))
  } catch (err) {
    console.warn('Unable to save notification preferences:', err)
  }
}

/**
 * Gets all smart notifications for a user, sorted newest first.
 */
export function getSmartNotifications(userId: string = 'demo-user'): SmartNotification[] {
  if (!hasLocalStorage()) return SEED_NOTIFICATIONS

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.NOTIFS_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw) as SmartNotification[]
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    }
    // Initialize with seed if first time
    localStorage.setItem(`${STORAGE_KEYS.NOTIFS_PREFIX}${userId}`, JSON.stringify(SEED_NOTIFICATIONS))
    return SEED_NOTIFICATIONS
  } catch (err) {
    console.warn('Unable to read smart notifications:', err)
    return SEED_NOTIFICATIONS
  }
}

/**
 * Persists notifications array.
 */
function saveNotificationsList(notifications: SmartNotification[], userId: string = 'demo-user'): void {
  if (!hasLocalStorage()) return

  try {
    localStorage.setItem(`${STORAGE_KEYS.NOTIFS_PREFIX}${userId}`, JSON.stringify(notifications))
  } catch (err) {
    console.warn('Unable to save smart notifications list:', err)
  }
}

/**
 * Mark a single notification as read.
 */
export function markNotificationAsRead(id: string, userId: string = 'demo-user'): void {
  const list = getSmartNotifications(userId)
  const updated = list.map((item) => (item.id === id ? { ...item, isRead: true } : item))
  saveNotificationsList(updated, userId)
}

/**
 * Mark all notifications as read.
 */
export function markAllNotificationsAsRead(userId: string = 'demo-user'): void {
  const list = getSmartNotifications(userId)
  const updated = list.map((item) => ({ ...item, isRead: true }))
  saveNotificationsList(updated, userId)
}

/**
 * Clear a single notification.
 */
export function clearNotification(id: string, userId: string = 'demo-user'): void {
  const list = getSmartNotifications(userId)
  const filtered = list.filter((item) => item.id !== id)
  saveNotificationsList(filtered, userId)
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications(userId: string = 'demo-user'): void {
  saveNotificationsList([], userId)
}

/**
 * Creates and registers a new notification with deduplication, quiet hours check, and category gating.
 */
export function createNotification(
  params: Omit<SmartNotification, 'id' | 'createdAt' | 'isRead'>,
  userId: string = 'demo-user'
): SmartNotification | null {
  const prefs = getNotificationPreferences(userId)

  // 1. Check in-app enabled
  if (!prefs.enableInApp) return null

  // 2. Check category preference
  if (params.category !== 'system' && !prefs.categories[params.category]) {
    return null
  }

  const now = new Date()

  // 3. Check quiet hours (exempt high priority alarms)
  if (params.priority !== 'high' && isWithinQuietHours(now, prefs.quietHours)) {
    return null
  }

  // 4. Deduplication / Cooldown check (prevent same category message within 90 minutes)
  if (typeof window !== 'undefined') {
    const cooldownKey = `${STORAGE_KEYS.COOLDOWN_PREFIX}${userId}_${params.category}`
    const lastSent = localStorage.getItem(cooldownKey)
    if (lastSent) {
      const diffMs = now.getTime() - parseInt(lastSent, 10)
      if (diffMs < 90 * 60 * 1000 && params.priority !== 'high') {
        return null // Suppressed by cooldown
      }
    }
    localStorage.setItem(cooldownKey, now.getTime().toString())
  }

  const newNotification: SmartNotification = {
    ...params,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now.toISOString(),
    isRead: false,
    deliveredAt: now.toISOString(),
  }

  const currentList = getSmartNotifications(userId)
  // Keep up to 50 notifications in history
  const updatedList = [newNotification, ...currentList].slice(0, 50)
  saveNotificationsList(updatedList, userId)

  // 5. Native Browser Notification (if opted in and permission granted)
  if (
    prefs.enableBrowserPush &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    try {
      new Notification(params.title, {
        body: params.message,
        icon: '/favicon.ico',
      })
    } catch (e) {
      console.warn('Native notification trigger failed:', e)
    }
  }

  return newNotification
}

/**
 * Request real browser notification permission with honest status reporting.
 */
export async function requestBrowserNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted' ? 'granted' : 'denied'
  } catch (err) {
    console.warn('Notification permission request error:', err)
    return 'denied'
  }
}
