import { describe, it, expect, beforeEach } from 'vitest'

// #45 — AI Personalization Engine
import {
  generatePersonalizedRecommendations,
  submitRecommendationFeedback,
  getPersonalizationPreferences,
  savePersonalizationPreferences,
  resetPersonalization,
} from '@/lib/personalization/personalizationEngine'

// #46 — Accessibility & Inclusive Fitness
import {
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
  DEFAULT_ACCESSIBILITY_PREFS,
} from '@/types/accessibility'

// #47 — Multilingual Indian Fitness Experience
import {
  TRANSLATIONS,
  REGIONAL_INDIAN_FOODS,
  kgToLbs,
  lbsToKg,
  cmToFtIn,
  ftInToCm,
  litersToFlOz,
  flOzToLiters,
  formatWeight,
  formatHeight,
  formatVolume,
  getRegionalFoodName,
} from '@/lib/i18n/localizationService'

// #48 — Reliability & Offline-First Intelligence
import {
  enqueueOfflineAction,
  getOfflineQueue,
  saveOfflineQueue,
  detectConflict,
  processSyncQueue,
  getSyncHistory,
} from '@/lib/offline/syncEngine'
import { SyncQueueItem } from '@/types/offline'

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

setupMockStorage()

describe('YashFit Upgrade #45 — AI Personalization Engine', () => {
  const testUserId = 'test-personalization-user'

  beforeEach(() => {
    resetPersonalization(testUserId)
  })

  it('generates goal-aware and equipment-aware recommendations with explainable rationales', async () => {
    const summary = await generatePersonalizedRecommendations(testUserId)
    expect(summary).toBeDefined()
    expect(summary.workoutRecommendations.length).toBeGreaterThan(0)
    expect(summary.mealRecommendations.length).toBeGreaterThan(0)

    // Check workout recommendations and rationales
    const firstWorkout = summary.workoutRecommendations[0]
    expect(firstWorkout.rationale.length).toBeGreaterThan(10)
    expect(firstWorkout.dataDrivers.length).toBeGreaterThan(0)
    expect(firstWorkout.exercises.length).toBeGreaterThan(0)

    // Check meal recommendations
    const firstMeal = summary.mealRecommendations[0]
    expect(firstMeal.rationale.length).toBeGreaterThan(10)
    expect(firstMeal.proteinGrams).toBeGreaterThan(0)
    expect(firstMeal.calories).toBeGreaterThan(0)
  })

  it('records user feedback and allows consent update and reset', () => {
    const recId = 'test-rec-1'
    submitRecommendationFeedback(recId, 'liked', 'Great pump', testUserId)

    let prefs = getPersonalizationPreferences(testUserId)
    expect(prefs.feedbackHistory).toHaveLength(1)
    expect(prefs.feedbackHistory[0].recommendationId).toBe(recId)
    expect(prefs.feedbackHistory[0].feedback).toBe('liked')

    // Dismiss feedback
    submitRecommendationFeedback('test-rec-2', 'dismissed', 'Not relevant today', testUserId)
    prefs = getPersonalizationPreferences(testUserId)
    expect(prefs.feedbackHistory).toHaveLength(2)

    // Consent toggle
    savePersonalizationPreferences({ ...prefs, consentToLearn: false }, testUserId)
    prefs = getPersonalizationPreferences(testUserId)
    expect(prefs.consentToLearn).toBe(false)

    // Reset personalization
    resetPersonalization(testUserId)
    prefs = getPersonalizationPreferences(testUserId)
    expect(prefs.feedbackHistory).toHaveLength(0)
    expect(prefs.consentToLearn).toBe(true)
  })
})

describe('YashFit Upgrade #46 — Accessibility & Inclusive Fitness', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('loads default accessibility preferences and persists customizations', () => {
    const initial = getAccessibilityPreferences()
    expect(initial.highContrast).toBe(false)
    expect(initial.reducedMotion).toBe(false)
    expect(initial.fontScale).toBe('normal')
    expect(initial.showBeginnerCues).toBe(true)

    saveAccessibilityPreferences({
      ...initial,
      highContrast: true,
      reducedMotion: true,
      fontScale: 'xl',
      colorBlindMode: 'protanopia',
    })

    const updated = getAccessibilityPreferences()
    expect(updated.highContrast).toBe(true)
    expect(updated.reducedMotion).toBe(true)
    expect(updated.fontScale).toBe('xl')
    expect(updated.colorBlindMode).toBe('protanopia')
  })
})

describe('YashFit Upgrade #47 — Multilingual Indian Fitness Experience', () => {
  it('provides translations for English, Kannada and Hindi navigation and common terms', () => {
    expect(TRANSLATIONS.en.nav.dashboard).toBe('Dashboard')
    expect(TRANSLATIONS.kn.nav.dashboard).toBe('ಡ್ಯಾಶ್‌ಬೋರ್ಡ್')
    expect(TRANSLATIONS.hi.nav.dashboard).toBe('डैशबोर्ड')

    expect(TRANSLATIONS.kn.common.streak).toBe('ದಿನಗಳ ಸತತ ಸಾಧನೆ')
    expect(TRANSLATIONS.hi.common.streak).toBe('लगातार दिन')

    expect(TRANSLATIONS.kn.common.offline).toBe('ಆಫ್‌ಲೈನ್ ಮೋಡ್')
    expect(TRANSLATIONS.hi.common.offline).toBe('ऑफलाइन मोड')
  })

  it('renders regional Indian food items with verified native Kannada and Hindi script and macros', () => {
    expect(REGIONAL_INDIAN_FOODS.length).toBeGreaterThanOrEqual(10)

    const dosa = REGIONAL_INDIAN_FOODS.find((f) => f.id === 'masala-dosa')
    expect(dosa).toBeDefined()
    expect(dosa?.kn).toContain('ಮಸಾಲೆ ದೋಸೆ')
    expect(dosa?.hi).toContain('मसाला डोसा')

    const paneer = REGIONAL_INDIAN_FOODS.find((f) => f.id === 'paneer-bhurji')
    expect(paneer).toBeDefined()
    expect(paneer?.kn).toBe('ಪನ್ನೀರ್ ಭುರ್ಜಿ')
    expect(paneer?.hi).toBe('पनीर भुर्जी')
    expect(paneer?.proteinPer100g).toBeGreaterThan(12)

    expect(getRegionalFoodName('paneer-bhurji', 'kn')).toBe('ಪನ್ನೀರ್ ಭುರ್ಜಿ')
    expect(getRegionalFoodName('paneer-bhurji', 'hi')).toBe('पनीर भुर्जी')
    expect(getRegionalFoodName('paneer-bhurji', 'en')).toContain('Paneer Bhurji')
  })

  it('converts units accurately between metric and imperial systems', () => {
    // Weight
    expect(kgToLbs(70)).toBe(154.3)
    expect(lbsToKg(154.3)).toBe(70)

    // Height
    const ftIn = cmToFtIn(175)
    expect(ftIn.feet).toBe(5)
    expect(ftIn.inches).toBe(9)
    expect(ftInToCm(5, 9)).toBe(175)

    // Hydration
    expect(litersToFlOz(2.5)).toBe(85)
    expect(flOzToLiters(85)).toBe(2.51)

    // Formatters
    expect(formatWeight(70, 'metric', 'en')).toBe('70 kg')
    expect(formatWeight(70, 'imperial', 'en')).toBe('154.3 lbs')
    expect(formatHeight(175, 'imperial', 'en')).toBe('5′ 9″')
    expect(formatHeight(175, 'metric', 'en')).toBe('175 cm')
    expect(formatVolume(2.5, 'metric', 'en')).toBe('2.5 L')
    expect(formatVolume(2.5, 'imperial', 'en')).toBe('85 fl oz')
  })
})

describe('YashFit Upgrade #48 — Reliability & Offline-First Intelligence', () => {
  beforeEach(() => {
    saveOfflineQueue([])
  })

  it('enqueues mutations with client UUID and prevents duplicate insertion', () => {
    const item1 = enqueueOfflineAction('LOG_HYDRATION', { amountLiters: 0.5 }, 'hydration-uuid-001')
    expect(item1.id).toBe('hydration-uuid-001')
    expect(item1.status).toBe('pending')

    const queueAfterFirst = getOfflineQueue()
    expect(queueAfterFirst).toHaveLength(1)

    // Attempt duplicate push with identical ID
    const duplicate = enqueueOfflineAction('LOG_HYDRATION', { amountLiters: 0.5 }, 'hydration-uuid-001')
    expect(duplicate.id).toBe('hydration-uuid-001')

    const queueAfterDuplicate = getOfflineQueue()
    expect(queueAfterDuplicate).toHaveLength(1) // Still exactly 1, duplicate prevented!
  })

  it('detects and resolves conflicts based on server updated_at vs local client timestamp', () => {
    const now = Date.now()
    const localItem: SyncQueueItem = {
      id: 'item-conflict-test',
      action: 'LOG_WORKOUT',
      payload: { reps: 10 },
      createdAt: new Date(now).toISOString(),
      clientTimestamp: now,
      retryCount: 0,
      status: 'pending',
    }

    // Case 1: Local is newer than server
    const olderServerRecord = {
      updated_at: new Date(now - 60000).toISOString(), // 1 min older
    }
    const res1 = detectConflict(localItem, olderServerRecord)
    expect(res1.hasConflict).toBe(true)
    expect(res1.winner).toBe('local')

    // Case 2: Server is newer than local
    const newerServerRecord = {
      updated_at: new Date(now + 60000).toISOString(), // 1 min newer
    }
    const res2 = detectConflict(localItem, newerServerRecord)
    expect(res2.hasConflict).toBe(true)
    expect(res2.winner).toBe('server')
    expect(res2.reason).toContain('Preserving server record')
  })

  it('processes pending queue and logs synchronized events to audit history', async () => {
    enqueueOfflineAction('LOG_WORKOUT', { routine: 'Leg Day' }, 'workout-sync-1')
    enqueueOfflineAction('LOG_MEAL', { meal: 'Masala Dosa' }, 'meal-sync-2')

    expect(getOfflineQueue()).toHaveLength(2)

    const result = await processSyncQueue(async () => true)
    expect(result.synced).toBe(2)
    expect(result.remaining).toBe(0)
    expect(getOfflineQueue()).toHaveLength(0)

    const history = getSyncHistory()
    expect(history.length).toBeGreaterThanOrEqual(2)
    expect(history[0].status).toBe('success')
  })
})
