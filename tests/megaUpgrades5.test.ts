import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  calculateScannedMealTotals,
  getScannedMealHistory,
  saveScannedMeal,
  deleteScannedMeal,
  COMMON_INDIAN_DISHES_CATALOG,
} from '../src/lib/food-scanner/foodScannerService'
import {
  combineDuplicateIngredients,
  generateWeeklyGroceryList,
  applySubstitution,
  toggleItemPurchased,
  calculatePlanTotals,
  addCustomGroceryItem,
} from '../src/lib/smart-grocery/smartGroceryService'
import {
  getTrainerProfile,
  getTrainerClients,
  assignPlanToClient,
  addTrainerNote,
  getTrainerNotes,
  sendTrainerFeedback,
  submitClientCheckIn,
  getClientCheckIns,
  updateClientConsent,
  revokeTrainerAccess,
} from '../src/lib/trainer/trainerService'
import {
  getDataCategoriesAudit,
  getSecurityOverview,
  terminateActiveSession,
  getPrivacyPreferences,
  savePrivacyPreferences,
  buildFullDataExport,
} from '../src/lib/privacy-center/privacyCenterService'
import type { DetectedFoodItem, ScannedMealResult } from '../src/types/foodScanner'
import type { SmartGroceryItem } from '../src/types/smartGrocery'

describe('YashFit Mega Upgrade Pack #29–#32 Test Suite', () => {
  // ─── UPGRADE #29: AI Food Vision & Meal Scanner ─────────────────────────────
  describe('Upgrade #29: AI Food Vision & Meal Scanner', () => {
    it('calculates macro totals accurately considering portion multipliers', () => {
      const items: DetectedFoodItem[] = [
        {
          id: 'item-1',
          name: 'Low-Fat Paneer Bhurji',
          confidence: 0.95,
          servingSize: '1 medium bowl (120g)',
          servingCount: 1.5, // 1.5 portions
          calories: 240,
          proteinGrams: 20,
          carbsGrams: 4,
          fatsGrams: 14,
          fiberGrams: 2,
          verifiedIndianDish: true,
        },
        {
          id: 'item-2',
          name: 'Whole Wheat Phulka / Roti',
          confidence: 0.98,
          servingSize: '1 medium roti (35g)',
          servingCount: 2.0, // 2 rotis
          calories: 85,
          proteinGrams: 3,
          carbsGrams: 17,
          fatsGrams: 0.5,
          fiberGrams: 2.5,
          verifiedIndianDish: true,
        },
      ]

      const totals = calculateScannedMealTotals(items)

      // Expected:
      // Calories: (240 * 1.5) + (85 * 2) = 360 + 170 = 530 kcal
      // Protein: (20 * 1.5) + (3 * 2) = 30 + 6 = 36g
      // Carbs: (4 * 1.5) + (17 * 2) = 6 + 34 = 40g
      // Fats: (14 * 1.5) + (0.5 * 2) = 21 + 1 = 22g
      // Fiber: (2 * 1.5) + (2.5 * 2) = 3 + 5 = 8g
      assert.strictEqual(totals.calories, 530)
      assert.strictEqual(totals.protein, 36)
      assert.strictEqual(totals.carbs, 40)
      assert.strictEqual(totals.fats, 22)
      assert.strictEqual(totals.fiber, 8)
    })

    it('contains regional Indian food staples in recognition catalog', () => {
      const names = COMMON_INDIAN_DISHES_CATALOG.map((d) => d.name.toLowerCase())
      assert.ok(names.some((n) => n.includes('dosa')))
      assert.ok(names.some((n) => n.includes('idli')))
      assert.ok(names.some((n) => n.includes('dal')))
      assert.ok(names.some((n) => n.includes('paneer')))
      assert.ok(names.some((n) => n.includes('roti') || n.includes('phulka')))
      assert.ok(names.some((n) => n.includes('curd') || n.includes('dahi')))
      assert.ok(names.some((n) => n.includes('sambar')))
    })

    it('saves and deletes confirmed scanned meals from local history', () => {
      const mockMeal: ScannedMealResult = {
        id: 'test-meal-101',
        timestamp: new Date().toISOString(),
        mealType: 'Dinner',
        detectedItems: [],
        totalCalories: 650,
        totalProtein: 42,
        totalCarbs: 65,
        totalFats: 18,
        totalFiber: 9,
        analysisMethod: 'rule_fallback',
        confidenceOverall: 0.94,
        isConfirmed: true,
      }

      saveScannedMeal(mockMeal)
      let history = getScannedMealHistory()
      assert.ok(history.some((m) => m.id === 'test-meal-101'))

      deleteScannedMeal('test-meal-101')
      history = getScannedMealHistory()
      assert.ok(!history.some((m) => m.id === 'test-meal-101'))
    })
  })

  // ─── UPGRADE #30: Smart Grocery & Budget Intelligence ───────────────────────
  describe('Upgrade #30: Smart Grocery & Budget Intelligence', () => {
    it('combines duplicate grocery items and aggregates quantities & prices', () => {
      const duplicates: SmartGroceryItem[] = [
        {
          id: 'item-paneer-1',
          name: 'Low-Fat Paneer',
          quantity: 200,
          unit: 'g',
          category: 'dairy',
          estimatedPriceInr: 90,
          isPurchased: false,
          isCustomItem: false,
          isVerifiedPrice: false,
        },
        {
          id: 'item-paneer-2',
          name: 'low-fat paneer',
          quantity: 300,
          unit: 'g',
          category: 'dairy',
          estimatedPriceInr: 135,
          isPurchased: true,
          actualPriceInr: 130,
          isCustomItem: false,
          isVerifiedPrice: true,
        },
      ]

      const combined = combineDuplicateIngredients(duplicates)
      assert.strictEqual(combined.length, 1)
      assert.strictEqual(combined[0].quantity, 500)
      assert.strictEqual(combined[0].estimatedPriceInr, 225)
      assert.strictEqual(combined[0].actualPriceInr, 130)
    })

    it('generates a weekly grocery list aligned with budget constraints', () => {
      const plan = generateWeeklyGroceryList('Vegetarian', 2500)
      assert.ok(plan.items.length >= 8)
      assert.strictEqual(plan.budgetLimitInr, 2500)
      assert.strictEqual(plan.dietaryPreference, 'Vegetarian')
      assert.ok(plan.totalEstimatedCostInr > 0)
    })

    it('applies affordable substitutions and reduces estimated expenditure', () => {
      const plan = generateWeeklyGroceryList('Vegetarian', 2200)
      const initialCost = plan.totalEstimatedCostInr
      const paneerItem = plan.items.find((i) => i.id === 'g-paneer')
      assert.ok(paneerItem)
      assert.ok(paneerItem?.suggestedSubstitution)

      const updatedPlan = applySubstitution(plan, 'g-paneer')
      const updatedItem = updatedPlan.items.find((i) => i.id === 'g-paneer')
      assert.strictEqual(updatedItem?.name, 'Nutrela Soya Chunks')
      assert.ok(updatedPlan.totalEstimatedCostInr < initialCost)
    })

    it('toggles item purchased status and calculates actual spend', () => {
      const plan = generateWeeklyGroceryList('Vegetarian', 2200)
      const targetItem = plan.items[0]
      const updated = toggleItemPurchased(plan, targetItem.id)

      const toggled = updated.items.find((i) => i.id === targetItem.id)
      assert.strictEqual(toggled?.isPurchased, !targetItem.isPurchased)
      assert.ok(updated.totalActualCostInr >= 0)
    })

    it('adds custom items to grocery checklist and updates totals', () => {
      const plan = generateWeeklyGroceryList('Vegetarian', 2200)
      const initialCount = plan.items.length

      const updated = addCustomGroceryItem(plan, {
        name: 'Chia Seeds',
        quantity: 250,
        unit: 'g',
        category: 'other',
        estimatedPriceInr: 120,
      })

      assert.strictEqual(updated.items.length, initialCount + 1)
      const added = updated.items.find((i) => i.name === 'Chia Seeds')
      assert.ok(added)
      assert.strictEqual(added?.isCustomItem, true)
    })
  })

  // ─── UPGRADE #31: Professional Trainer Workspace ─────────────────────────────
  describe('Upgrade #31: Professional Trainer Workspace', () => {
    it('retrieves trainer profile with unique invite code', () => {
      const profile = getTrainerProfile()
      assert.ok(profile.id)
      assert.ok(profile.fullName.includes('Yashwanth'))
      assert.ok(profile.inviteCode.startsWith('COACH-'))
    })

    it('allows assigning workout and nutrition programs to clients', () => {
      const clients = getTrainerClients()
      assert.ok(clients.length >= 2)

      const success = assignPlanToClient('client-rohan', {
        clientId: 'client-rohan',
        routineId: 'routine-pull-day',
        routineName: 'Upper Pull & Posterior Chain',
        targetCalories: 2600,
        targetProtein: 175,
      })

      assert.strictEqual(success, true)
      const updatedClients = getTrainerClients()
      const rohan = updatedClients.find((c) => c.clientId === 'client-rohan')
      assert.strictEqual(rohan?.assignedRoutineId, 'routine-pull-day')
      assert.strictEqual(rohan?.targetCalories, 2600)
      assert.strictEqual(rohan?.targetProtein, 175)
    })

    it('creates private trainer notes strictly isolated to coach view', () => {
      const note = addTrainerNote(
        'client-rohan',
        'Reviewing bench arch. Need to cue leg drive more actively.'
      )
      assert.ok(note.id.startsWith('note-'))
      assert.strictEqual(note.isPrivateToTrainer, true)

      const notes = getTrainerNotes('client-rohan')
      assert.ok(notes.some((n) => n.id === note.id))
    })

    it('submits client check-ins and allows trainer feedback response', () => {
      const checkin = submitClientCheckIn({
        clientId: 'client-rohan',
        clientName: 'Rohan Sharma',
        date: '2026-11-04',
        weightKg: 76.8,
        energyScore: 9,
        soreness: 'Low',
        comments: 'Hit all working sets on bench press smoothly.',
      })

      assert.ok(checkin.id.startsWith('checkin-'))

      const feedbackOk = sendTrainerFeedback(
        checkin.id,
        'Great work! Adding 2.5kg to your working sets next week.'
      )
      assert.strictEqual(feedbackOk, true)

      const checkins = getClientCheckIns('client-rohan')
      const target = checkins.find((c) => c.id === checkin.id)
      assert.ok(target?.trainerFeedback?.includes('Adding 2.5kg'))
    })

    it('updates client privacy consent scopes and supports revoking trainer access', () => {
      updateClientConsent('client-rohan', {
        shareMeasurements: true,
        shareTransformationPhotos: false,
      })

      let clients = getTrainerClients()
      let rohan = clients.find((c) => c.clientId === 'client-rohan')
      assert.strictEqual(rohan?.consentScopes.shareMeasurements, true)
      assert.strictEqual(rohan?.consentScopes.shareTransformationPhotos, false)

      revokeTrainerAccess('client-rohan')
      clients = getTrainerClients()
      rohan = clients.find((c) => c.clientId === 'client-rohan')
      assert.strictEqual(rohan?.status, 'revoked')
    })
  })

  // ─── UPGRADE #32: Privacy & Security Command Center ──────────────────────────
  describe('Upgrade #32: Privacy & Security Command Center', () => {
    it('generates a transparent personal data audit across all stored domains', () => {
      const audit = getDataCategoriesAudit()
      assert.ok(audit.length >= 5)

      const keys = audit.map((a) => a.key)
      assert.ok(keys.includes('auth_identity'))
      assert.ok(keys.includes('physical_profile'))
      assert.ok(keys.includes('workout_telemetry'))
      assert.ok(keys.includes('recovery_sleep'))
      assert.ok(keys.includes('nutrition_meals'))

      audit.forEach((cat) => {
        assert.ok(cat.purpose.length > 0)
        assert.ok(cat.retentionPeriod.length > 0)
      })
    })

    it('evaluates security posture and manages active sessions', () => {
      const overview = getSecurityOverview()
      assert.ok(overview.securityScore >= 80)
      assert.ok(overview.activeSessions.length >= 1)

      const initialCount = overview.activeSessions.length
      const nonCurrent = overview.activeSessions.find((s) => !s.isCurrent)
      if (nonCurrent) {
        const remaining = terminateActiveSession(nonCurrent.id)
        assert.strictEqual(remaining.length, initialCount - 1)
      }
    })

    it('persists and retrieves granular privacy sharing preferences', () => {
      const prefs = getPrivacyPreferences()
      assert.ok(prefs.profileVisibility)

      const updated = {
        ...prefs,
        anonymousInLeaderboards: true,
        encryptProgressPhotos: true,
      }

      savePrivacyPreferences(updated)
      const retrieved = getPrivacyPreferences()
      assert.strictEqual(retrieved.anonymousInLeaderboards, true)
      assert.strictEqual(retrieved.encryptProgressPhotos, true)
    })

    it('builds a complete GDPR Article 20 data portability JSON export archive', () => {
      const archive = buildFullDataExport()
      assert.ok(archive.exportMetadata)
      assert.ok(archive.privacyPreferences)
      assert.ok(archive.dataCategoriesAudit)
      assert.strictEqual(
        (archive.exportMetadata as Record<string, string>).gdprCompliance,
        'Article 20 Data Portability Certified'
      )
    })
  })
})

