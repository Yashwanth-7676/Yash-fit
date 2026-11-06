import { describe, it, expect, beforeEach } from 'vitest'
import {
  synthesizePersonalizedPlan,
  type OnboardingDraftData,
} from '@/lib/onboarding/onboardingPlanService'
import {
  isWithinQuietHours,
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  saveNotificationPreferences,
  getSmartNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
  createNotification,
} from '@/lib/notifications/notificationService'
import {
  DEFAULT_DASHBOARD_WIDGETS,
  getDashboardPreferences,
  saveDashboardPreferences,
  resetDashboardPreferences,
  getUpcomingGoals,
  getContextAwareRecommendations,
} from '@/lib/dashboard/dashboardService'
import type { DashboardWidgetConfig } from '@/types/dashboard'
import type { UserProfile } from '@/types/profile'

// In-memory mock storage for Node environment
function setupMockStorage() {
  const store = new Map<string, string>()
  const mockStorage: Storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: store.size,
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true,
  })
}

describe('YashFit 2.0 — Premium Product Experience (#41–#44)', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  // ─── 1. Intelligent Onboarding 2.0 (#42) ────────────────────────────────────
  describe('Upgrade #42: Intelligent Onboarding 2.0 Plan & Nutrition Synthesis', () => {
    it('synthesizes customized 4-day Upper/Lower split and caloric surplus for muscle gain', () => {
      const draft: OnboardingDraftData = {
        first_name: 'Yash',
        age: 26,
        gender: 'male',
        height_cm: 178,
        weight_kg: 72,
        primary_goal: 'Build Muscle',
        experience_level: 'Intermediate',
        training_environment: 'Commercial Gym',
        available_equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cable Machine'],
        training_days_per_week: 4,
        scheduled_days: ['Mon', 'Tue', 'Thu', 'Sat'],
        preferred_workout_duration: 45,
        dietary_preference: 'Vegetarian',
        indian_cuisine_preference: 'North Indian',
        fitness_limitations: ['None'],
        onboarding_step: 10,
      }

      const result = synthesizePersonalizedPlan(draft)

      // Workout Plan assertions
      expect(result.workoutPlan.weeklyFrequency).toBe(4)
      expect(result.workoutPlan.sessionDurationMin).toBe(45)
      expect(result.workoutPlan.routines.length).toBe(4)
      expect(result.workoutPlan.routines[0].dayName).toBe('Mon')
      expect(result.workoutPlan.routines[1].dayName).toBe('Tue')

      // Nutrition assertions
      expect(result.nutritionTargets.bmr).toBeGreaterThan(1600)
      expect(result.nutritionTargets.tdee).toBeGreaterThan(result.nutritionTargets.bmr)
      // Surpus of +300 for Build Muscle
      expect(result.nutritionTargets.targetCalories).toBe(result.nutritionTargets.tdee + 300)
      // High protein multiplier (2.0g/kg * 72kg = ~144g)
      expect(result.nutritionTargets.targetProteinGrams).toBe(144)
      expect(result.nutritionTargets.hydrationLiters).toBeGreaterThanOrEqual(2.5)

      // Authentic Indian vegetarian staples
      const paneer = result.nutritionTargets.recommendedStaples.find((s) => s.name.includes('Paneer'))
      expect(paneer).toBeDefined()
    })

    it('synthesizes caloric deficit and posterior-chain cues for knee & lower back restrictions', () => {
      const draft: OnboardingDraftData = {
        first_name: 'Kavya',
        age: 29,
        gender: 'female',
        height_cm: 165,
        weight_kg: 68,
        primary_goal: 'Lose Fat',
        experience_level: 'Beginner',
        training_environment: 'Home Gym',
        available_equipment: ['Dumbbells', 'Resistance Bands'],
        training_days_per_week: 3,
        scheduled_days: ['Mon', 'Wed', 'Fri'],
        preferred_workout_duration: 30,
        dietary_preference: 'Non-Vegetarian',
        indian_cuisine_preference: 'South Indian',
        fitness_limitations: ['Lower Back Sensitivity', 'Knee Joint Discomfort'],
        onboarding_step: 10,
      }

      const result = synthesizePersonalizedPlan(draft)

      // Caloric deficit for fat loss (-450 kcal)
      expect(result.nutritionTargets.targetCalories).toBe(result.nutritionTargets.tdee - 450)
      expect(result.workoutPlan.weeklyFrequency).toBe(3)
      expect(result.workoutPlan.limitationCues.length).toBe(2)
      expect(result.workoutPlan.limitationCues.some((c) => c.includes('Spinal-Spared'))).toBe(true)
      expect(result.workoutPlan.limitationCues.some((c) => c.includes('Knee-Friendly'))).toBe(true)

      // Non-veg staple check
      const chicken = result.nutritionTargets.recommendedStaples.find((s) => s.name.includes('Chicken'))
      expect(chicken).toBeDefined()
    })
  })

  // ─── 2. Smart Notification Center (#43) ────────────────────────────────────
  describe('Upgrade #43: Smart Notification Center & Quiet Hours', () => {
    it('correctly evaluates overnight circadian quiet hours', () => {
      const overnightConfig = { enabled: true, startHour: 22, endHour: 7 }

      // 11:30 PM (Hour 23) -> Within quiet hours
      const nightDate = new Date('2026-11-06T23:30:00')
      expect(isWithinQuietHours(nightDate, overnightConfig)).toBe(true)

      // 5:15 AM (Hour 5) -> Within quiet hours
      const earlyMorning = new Date('2026-11-06T05:15:00')
      expect(isWithinQuietHours(earlyMorning, overnightConfig)).toBe(true)

      // 2:00 PM (Hour 14) -> Inactive / not quiet
      const afternoon = new Date('2026-11-06T14:00:00')
      expect(isWithinQuietHours(afternoon, overnightConfig)).toBe(false)

      // When disabled, always returns false
      expect(isWithinQuietHours(nightDate, { ...overnightConfig, enabled: false })).toBe(false)
    })

    it('manages notifications persistence, mark as read, and clear history', () => {
      const notifs = getSmartNotifications('test-user')
      expect(Array.isArray(notifs)).toBe(true)
      expect(notifs.length).toBeGreaterThan(0)

      const targetId = notifs[0].id
      markNotificationAsRead(targetId, 'test-user')

      const updated = getSmartNotifications('test-user')
      const target = updated.find((n) => n.id === targetId)
      expect(target?.isRead).toBe(true)

      // Mark all read
      markAllNotificationsAsRead('test-user')
      const allRead = getSmartNotifications('test-user')
      expect(allRead.every((n) => n.isRead)).toBe(true)

      // Clear single item
      clearNotification(targetId, 'test-user')
      const afterDelete = getSmartNotifications('test-user')
      expect(afterDelete.find((n) => n.id === targetId)).toBeUndefined()

      // Clear all
      clearAllNotifications('test-user')
      const empty = getSmartNotifications('test-user')
      expect(empty.length).toBe(0)
    })

    it('saves and retrieves customized notification preferences', () => {
      const prefs = getNotificationPreferences('test-user')
      expect(prefs.enableInApp).toBe(true)

      const customPrefs = {
        ...prefs,
        enableBrowserPush: true,
        quietHours: { enabled: true, startHour: 23, endHour: 6 },
      }
      saveNotificationPreferences(customPrefs, 'test-user')

      const retrieved = getNotificationPreferences('test-user')
      expect(retrieved.enableBrowserPush).toBe(true)
      expect(retrieved.quietHours.startHour).toBe(23)
      expect(retrieved.quietHours.endHour).toBe(6)
    })
  })

  // ─── 3. Adaptive Personal Dashboard (#41) ───────────────────────────────────
  describe('Upgrade #41: Adaptive Personal Dashboard Services', () => {
    it('retrieves default widget configs and persists reordered layout', () => {
      const initial = getDashboardPreferences('test-user')
      expect(initial.length).toBe(10)
      expect(initial[0].id).toBe('daily_overview')

      // Reorder widgets: move 'context_recommendations' to position 1
      const reordered: DashboardWidgetConfig[] = [
        { ...initial[2], order: 1 },
        { ...initial[0], order: 2 },
        ...initial.slice(1, 2).map((w) => ({ ...w, order: 3 })),
        ...initial.slice(3).map((w, i) => ({ ...w, order: i + 4 })),
      ]

      saveDashboardPreferences(reordered, 'test-user')
      const retrieved = getDashboardPreferences('test-user')
      expect(retrieved[0].id).toBe('context_recommendations')
      expect(retrieved[1].id).toBe('daily_overview')

      // Reset to defaults
      const reset = resetDashboardPreferences('test-user')
      expect(reset[0].id).toBe('daily_overview')
    })

    it('generates context-aware recommendations tailored to recovery readiness score', () => {
      const profile: UserProfile = {
        user_id: 'test-user',
        first_name: 'Athlete',
        age: 25,
        height_cm: 175,
        weight_kg: 72,
        primary_goal: 'Build Muscle',
        experience_level: 'Intermediate',
        training_days_per_week: 4,
        training_environment: 'Commercial Gym',
        available_equipment: ['Dumbbells', 'Barbell'],
        dietary_preference: 'Vegetarian',
        onboarding_completed: true,
      }

      // High readiness score (>= 80) -> Recommends progressive overload
      const highRecs = getContextAwareRecommendations(85, 4, profile)
      expect(highRecs[0].type).toBe('overload')
      expect(highRecs[0].title).toContain('Peak Neuromuscular Readiness')

      // Low readiness score (< 60) -> Alerts fatigue
      const lowRecs = getContextAwareRecommendations(52, 4, profile)
      expect(lowRecs[0].type).toBe('recovery')
      expect(lowRecs[0].title).toContain('Fatigue Detected')
    })

    it('evaluates upcoming goals and weekly adherence correctly', () => {
      const profile: UserProfile = {
        user_id: 'test-user',
        first_name: 'Athlete',
        age: 25,
        height_cm: 175,
        weight_kg: 72,
        primary_goal: 'Build Muscle',
        experience_level: 'Beginner',
        training_days_per_week: 4,
        training_environment: 'Commercial Gym',
        available_equipment: ['Dumbbells'],
        dietary_preference: 'Vegetarian',
        onboarding_completed: true,
      }

      const goals = getUpcomingGoals(profile, 'test-user')
      expect(goals.length).toBeGreaterThanOrEqual(2)

      const weeklyGoal = goals.find((g) => g.id === 'goal-workout-weekly')
      expect(weeklyGoal).toBeDefined()
      expect(weeklyGoal?.targetValue).toBe('4 days/week')

      const weightGoal = goals.find((g) => g.id === 'goal-weight')
      expect(weightGoal).toBeDefined()
      expect(weightGoal?.currentValue).toBe('72 kg')
    })
  })
})
