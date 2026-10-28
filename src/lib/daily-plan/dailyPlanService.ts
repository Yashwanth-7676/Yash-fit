import { PRESET_WORKOUT_ROUTINES } from '../../data/routines'
import { generateDailyQuests } from '../../data/quests'
import {
  readArray,
  recoveryHistoryKey,
  type RecoveryEntry,
} from '../digitalTwin'
import type {
  DailyPlanSummary,
  DailyPlanTask,
  ReminderPreferences,
} from '../../types/dailyPlan'

const STORAGE_KEYS = {
  DAILY_PLAN_TASKS: 'yashfit_daily_plan_tasks',
  REMINDERS: 'yashfit_reminder_preferences',
}

const inMemoryStorage = new Map<string, string>()

function getStoredItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key)
  }
  return inMemoryStorage.get(key) ?? null
}

function setStoredItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  }
  inMemoryStorage.set(key, value)
}

export const DEFAULT_REMINDER_PREFS: ReminderPreferences = {
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  timezone: 'Asia/Kolkata',
  workoutReminderTime: '06:30',
  mealReminderTime: '12:30',
  hydrationReminderIntervalHours: 2,
  quietHoursEnabled: true,
  browserPushEnabled: false,
  inAppNotifications: true,
}

export function getReminderPreferences(): ReminderPreferences {
  try {
    const raw = getStoredItem(STORAGE_KEYS.REMINDERS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return DEFAULT_REMINDER_PREFS
}

export function saveReminderPreferences(prefs: ReminderPreferences): void {
  setStoredItem(STORAGE_KEYS.REMINDERS, JSON.stringify(prefs))
}

/**
 * Checks whether a given HH:MM time falls inside the configured quiet hours range.
 */
export function isInsideQuietHours(
  timeStr: string,
  quietStart = '22:00',
  quietEnd = '07:00'
): boolean {
  const parseMin = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
  }

  const current = parseMin(timeStr)
  const start = parseMin(quietStart)
  const end = parseMin(quietEnd)

  if (start < end) {
    // Quiet hours within same calendar day (e.g., 01:00 to 06:00)
    return current >= start && current <= end
  }
  // Quiet hours crossing midnight (e.g., 22:00 to 07:00)
  return current >= start || current <= end
}

export function getCompletedTaskIds(dateStr: string): string[] {
  try {
    const raw = getStoredItem(`${STORAGE_KEYS.DAILY_PLAN_TASKS}_${dateStr}`)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return []
}

export function toggleTaskCompletion(dateStr: string, taskId: string): boolean {
  const completed = getCompletedTaskIds(dateStr)
  const exists = completed.includes(taskId)
  const updated = exists ? completed.filter((id) => id !== taskId) : [...completed, taskId]

  setStoredItem(`${STORAGE_KEYS.DAILY_PLAN_TASKS}_${dateStr}`, JSON.stringify(updated))
  return !exists
}

/**
 * Synthesizes a unified daily plan for any target date.
 */
export function buildDailyPlan(
  targetDate = new Date(),
  userId = 'demo-user'
): DailyPlanSummary {
  const dateStr = targetDate.toISOString().slice(0, 10)
  const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' })
  const dayIndex = targetDate.getDay() // 0 = Sun, 1 = Mon ...
  const isRestDay = dayIndex === 0 || dayIndex === 4 // Sunday & Thursday scheduled rest

  // Recovery lookup
  const recoveryLogs = readArray<RecoveryEntry>(recoveryHistoryKey(userId))
  const latestRecovery = recoveryLogs[0]
  const readiness = latestRecovery?.readinessScore ?? 84
  const readinessLabel =
    readiness >= 80 ? 'Optimal Readiness' : readiness >= 60 ? 'Moderate Recovery' : 'Fatigued / Rest Advised'

  // Routine selection
  const defaultRoutine = PRESET_WORKOUT_ROUTINES[0]
  const workoutTitle = isRestDay
    ? 'Scheduled Active Recovery & Mobility'
    : defaultRoutine.name

  // Daily Quests from RPG
  const quests = generateDailyQuests(dateStr)
  const completedIds = new Set(getCompletedTaskIds(dateStr))

  // Compile tasks
  const rawTasks: Omit<DailyPlanTask, 'completed' | 'completedAt'>[] = [
    {
      id: `task-morning-prep-${dateStr}`,
      category: 'recovery',
      period: 'morning',
      suggestedTime: '06:30',
      title: 'Morning Sunlight & Glass of Water',
      detail: 'Drink 500ml of water and get 10 minutes of natural light exposure for circadian alignment.',
      targetValue: '500ml',
      priority: 'high',
      linkedRoute: '/recovery',
    },
    {
      id: `task-breakfast-${dateStr}`,
      category: 'nutrition',
      period: 'morning',
      suggestedTime: '08:00',
      title: 'High-Protein Breakfast',
      detail: 'Moong Dal Chilla / Boiled Eggs / Greek Yogurt with sprouted seeds. Aim for 35g protein.',
      targetValue: '35g protein',
      priority: 'high',
      linkedRoute: '/nutrition-planner',
    },
    {
      id: `task-workout-session-${dateStr}`,
      category: 'workout',
      period: isRestDay ? 'afternoon' : 'morning',
      suggestedTime: isRestDay ? '16:00' : '09:00',
      title: isRestDay ? '20-Min Joint Mobility & Light Walk' : `Workout: ${workoutTitle}`,
      detail: isRestDay
        ? 'Focus on hip flexors, thoracic spine, and a brisk 2km walk to promote blood flow without muscle damage.'
        : `Execute ${defaultRoutine.exercises.length} compound movements with progressive overload. Record weights & reps.`,
      targetValue: isRestDay ? '20 mins' : `${defaultRoutine.exercises.length} exercises`,
      priority: 'high',
      linkedRoute: '/workout',
    },
    {
      id: `task-hydration-midday-${dateStr}`,
      category: 'hydration',
      period: 'midday',
      suggestedTime: '13:00',
      title: 'Hydration Checkpoint & Lunch',
      detail: 'Reach 1,500ml total water before lunch. Regional Dal, Paneer/Chicken, and fresh salad.',
      targetValue: '1,500ml',
      priority: 'medium',
      linkedRoute: '/nutrition',
    },
    {
      id: `task-afternoon-quest-${dateStr}`,
      category: 'quest',
      period: 'afternoon',
      suggestedTime: '16:30',
      title: quests[0]?.title || 'Daily Quest Milestone',
      detail: quests[0]?.description || 'Complete scheduled daily fitness quest for XP progression.',
      targetValue: `+${quests[0]?.rewardXp || 100} XP`,
      priority: 'medium',
      linkedRoute: '/quests',
    },
    {
      id: `task-evening-walk-${dateStr}`,
      category: 'recovery',
      period: 'evening',
      suggestedTime: '18:30',
      title: 'Post-Meal Digestive Walk & Water Catch-up',
      detail: 'Complete daily hydration target (3,000ml) and 15 minutes of light pace walking.',
      targetValue: '3,000ml',
      priority: 'medium',
      linkedRoute: '/recovery',
    },
    {
      id: `task-night-winddown-${dateStr}`,
      category: 'recovery',
      period: 'night',
      suggestedTime: '21:30',
      title: 'Digital Wind-Down & Sleep Log',
      detail: 'Dim screens 45 minutes before sleep. Check off your daily log to prepare for tomorrow.',
      targetValue: '7.5+ hrs sleep',
      priority: 'high',
      linkedRoute: '/recovery',
    },
  ]

  const tasks: DailyPlanTask[] = rawTasks.map((t) => ({
    ...t,
    completed: completedIds.has(t.id),
    completedAt: completedIds.has(t.id) ? `${dateStr}T12:00:00Z` : undefined,
  }))

  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const adherencePercentage = Math.round((completedCount / totalCount) * 100)

  return {
    date: dateStr,
    dayOfWeek,
    isRestDay,
    readinessScore: readiness,
    readinessLabel,
    workoutTitle,
    dailyCalorieTarget: 2200,
    dailyProteinTargetGrams: 140,
    dailyWaterTargetLiters: 3.0,
    tasks,
    completedCount,
    totalCount,
    adherencePercentage,
  }
}
