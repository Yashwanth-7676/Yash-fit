import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// 1. Upgrade #13 Imports
import {
  calculateLevelFromXp,
  xpToNextLevel,
  totalXpRequiredForLevel,
  getRankFromLevel,
  awardXp,
  recordRestDay,
  getUserRpgProgress,
  saveUserRpgProgress,
} from '../src/lib/rpg/rpgService'
import { DEFAULT_ACHIEVEMENTS } from '../src/data/achievements'

// 2. Upgrade #14 Imports
import {
  generateMealPlanCourses,
  generateWeeklyGroceryList,
  generateMealPrepNotes,
  STANDARD_SUBSTITUTIONS,
} from '../src/lib/nutrition/nutritionPlannerService'
import { calculateMacroTargets } from '../src/lib/nutritionCalculator'
import type { UserProfile } from '../src/types/profile'
import type { RegionalPreference, BudgetTier } from '../src/types/nutritionPlanner'

// 3. Upgrade #15 Imports
import {
  calculateMetricTrend,
  extractTransformationMilestones,
  exportMeasurementsToCsv,
  exportMeasurementsToJson,
} from '../src/lib/transformation/transformationService'
import type { BodyMeasurementEntry, TransformationPhoto } from '../src/types/transformation'

// 4. Upgrade #16 Imports
import {
  generateDeterministicCoachResponse,
  type CoachUserContext,
} from '../src/lib/ai/providers'

// Mock User Profile for testing
const MOCK_PROFILE: UserProfile = {
  user_id: 'test-user-mega',
  first_name: 'Yash',
  age: 25,
  height_cm: 178,
  weight_kg: 74,
  primary_goal: 'Build Muscle',
  experience_level: 'Intermediate',
  training_days_per_week: 4,
  training_environment: 'Commercial Gym',
  available_equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cable Machine'],
  dietary_preference: 'Vegetarian',
  onboarding_completed: true,
}

describe('YashFit Mega Upgrade Pack #13–#16 Test Suite', () => {
  // ==========================================================================
  // UPGRADE #13 — FITNESS RPG & STREAK PRESERVATION
  // ==========================================================================
  describe('Upgrade #13: Fitness RPG, Idempotency & Rest-Day Protection', () => {
    it('calculates deterministic level and rank boundaries', () => {
      const lvl1 = calculateLevelFromXp(0)
      assert.equal(lvl1.level, 1)
      assert.equal(lvl1.rank, 'Rookie')

      const lvl5 = calculateLevelFromXp(totalXpRequiredForLevel(5) + 10)
      assert.equal(lvl5.level, 5)
      assert.equal(lvl5.rank, 'Fighter')

      const lvl10 = calculateLevelFromXp(totalXpRequiredForLevel(10) + 50)
      assert.equal(lvl10.level, 10)
      assert.equal(lvl10.rank, 'Hunter')

      const lvl20 = calculateLevelFromXp(totalXpRequiredForLevel(20) + 100)
      assert.equal(lvl20.level, 20)
      assert.equal(lvl20.rank, 'Master')

      const lvl30 = calculateLevelFromXp(totalXpRequiredForLevel(30) + 500)
      assert.equal(lvl30.level, 30)
      assert.equal(lvl30.rank, 'Legend')
    })

    it('validates rest-day streak preservation without penalty', () => {
      // Setup base progress
      saveUserRpgProgress({
        userId: 'test-user-mega',
        totalXp: 500,
        currentLevel: 3,
        xpInCurrentLevel: 50,
        xpRequiredForNextLevel: 300,
        rank: 'Rookie',
        currentStreak: 5,
        longestStreak: 7,
        lastActiveDate: '2026-10-26',
        avatarId: 'avatar-kenji',
        equippedTitle: 'The Iron Disciple',
        unlockedAvatars: ['avatar-kenji'],
        unlockedTitles: ['The Iron Disciple'],
        completedQuestsCount: 3,
        unlockedAchievementsCount: 2,
      })

      // User logs rest day on 2026-10-27 (1 day difference)
      const res = recordRestDay('test-user-mega', '2026-10-27')
      assert.equal(res.success, true)
      assert.equal(res.streakPreserved, true)
      // Streak must increment from 5 to 6, protecting recovery!
      assert.equal(res.newProgress.currentStreak, 6)
      assert.equal(res.newProgress.lastActiveDate, '2026-10-27')
    })

    it('contains new recovery, transformation, and nutrition achievements in catalog', () => {
      const recoveryAch = DEFAULT_ACHIEVEMENTS.find((a) => a.id === 'ach-zen-recovery')
      assert.ok(recoveryAch, 'ach-zen-recovery must exist')
      assert.equal(recoveryAch?.category, 'recovery')

      const deloadAch = DEFAULT_ACHIEVEMENTS.find((a) => a.id === 'ach-smart-deload')
      assert.ok(deloadAch, 'ach-smart-deload must exist')

      const chroniclerAch = DEFAULT_ACHIEVEMENTS.find((a) => a.id === 'ach-body-chronicler')
      assert.ok(chroniclerAch, 'ach-body-chronicler must exist')

      const plannerAch = DEFAULT_ACHIEVEMENTS.find((a) => a.id === 'ach-nutrition-planner')
      assert.ok(plannerAch, 'ach-nutrition-planner must exist')
    })
  })

  // ==========================================================================
  // UPGRADE #14 — INDIAN NUTRITION & MEAL INTELLIGENCE 2.0
  // ==========================================================================
  describe('Upgrade #14: Indian Nutrition Intelligence 2.0', () => {
    it('calculates evidence-based macro targets for profile', () => {
      const macros = calculateMacroTargets(MOCK_PROFILE)
      assert.ok(macros.calories >= 2000 && macros.calories <= 3200)
      assert.ok(macros.protein >= 130 && macros.protein <= 170)
      assert.ok(macros.waterLiters >= 2.5)
    })

    it('generates complete meal plans across all 5 regional Indian cuisines', () => {
      const regions: RegionalPreference[] = [
        'North Indian',
        'South Indian',
        'East Indian',
        'West Indian',
        'High-Protein Modern',
      ]
      const budgets: BudgetTier[] = ['Budget-Friendly', 'Moderate', 'Premium']

      for (const reg of regions) {
        for (const bg of budgets) {
          const courses = generateMealPlanCourses(reg, 'Vegetarian', bg, 2400, 150)
          assert.equal(courses.length, 4, `${reg} must have 4 planned courses`)

          const types = courses.map((c) => c.type)
          assert.deepEqual(types, ['Breakfast', 'Lunch', 'Snack', 'Dinner'])

          const totalP = courses.reduce((sum, c) => sum + c.totalProtein, 0)
          assert.ok(totalP >= 130 && totalP <= 170, `Protein total for ${reg} must align with target`)

          const totalCost = courses.reduce((sum, c) => sum + c.estimatedCostInr, 0)
          assert.ok(totalCost > 0, `Cost must be non-zero for ${reg} (${bg})`)
        }
      }
    })

    it('builds consolidated weekly grocery list and meal prep notes', () => {
      const courses = generateMealPlanCourses('South Indian', 'Vegetarian', 'Moderate', 2200, 140)
      const grocery = generateWeeklyGroceryList(courses, 'South Indian', 'Moderate', 'Vegetarian')

      assert.ok(grocery.length >= 5, 'Grocery list must contain at least 5 consolidated staples')
      const totalWeeklyCost = grocery.reduce((sum, g) => sum + g.estimatedCostInr, 0)
      assert.ok(totalWeeklyCost > 500, 'Weekly grocery cost must be realistic (> ₹500)')

      const prepNotes = generateMealPrepNotes('South Indian')
      assert.equal(prepNotes.length, 4, 'Must provide 4 meal prep scheduling strategies')
      assert.ok(STANDARD_SUBSTITUTIONS.length >= 4, 'Must provide smart Indian substitutions')
    })
  })

  // ==========================================================================
  // UPGRADE #15 — BODY TRANSFORMATION INTELLIGENCE
  // ==========================================================================
  describe('Upgrade #15: Body Transformation Intelligence', () => {
    const mockEntries: BodyMeasurementEntry[] = [
      {
        id: 'entry-1',
        userId: 'test-user-mega',
        recordedDate: '2026-08-01',
        weightKg: 76.0,
        waistCm: 85.0,
        chestCm: 98.0,
        armCm: 35.0,
        thighCm: 56.0,
        neckCm: 38.0,
      },
      {
        id: 'entry-2',
        userId: 'test-user-mega',
        recordedDate: '2026-08-29', // 4 weeks later
        weightKg: 74.4,
        waistCm: 83.4,
        chestCm: 98.5,
        armCm: 35.4,
        thighCm: 56.5,
        neckCm: 38.0,
      },
    ]

    it('computes linear regression rate and uncertainty margins accurately', () => {
      const weightTrend = calculateMetricTrend(mockEntries, 'weight_kg')
      assert.ok(weightTrend, 'Weight trend must compute')
      assert.equal(weightTrend?.startValue, 76.0)
      assert.equal(weightTrend?.currentValue, 74.4)
      assert.equal(weightTrend?.netChange, -1.6)
      assert.equal(weightTrend?.direction, 'decreasing')
      assert.ok(weightTrend?.weeklyRate < 0, 'Weekly weight rate must be negative')
      assert.equal(weightTrend?.uncertaintyMargin, 0.6)

      const waistTrend = calculateMetricTrend(mockEntries, 'waist_cm')
      assert.ok(waistTrend, 'Waist trend must compute')
      assert.equal(waistTrend?.startValue, 85.0)
      assert.equal(waistTrend?.currentValue, 83.4)
      assert.equal(waistTrend?.netChange, -1.6)
      assert.equal(waistTrend?.direction, 'decreasing')
      assert.equal(waistTrend?.uncertaintyMargin, 0.8)
    })

    it('extracts transformation milestones from data', () => {
      const mockPhotos: TransformationPhoto[] = [
        {
          id: 'p1',
          userId: 'test-user-mega',
          recordedDate: '2026-08-01',
          poseType: 'front',
          photoData: 'data:image/svg+xml;utf8,<svg></svg>',
          createdAt: '2026-08-01T00:00:00Z',
        },
        {
          id: 'p2',
          userId: 'test-user-mega',
          recordedDate: '2026-08-29',
          poseType: 'front',
          photoData: 'data:image/svg+xml;utf8,<svg></svg>',
          createdAt: '2026-08-29T00:00:00Z',
        },
      ]

      const milestones = extractTransformationMilestones(mockEntries, mockPhotos)
      assert.ok(milestones.length >= 2, 'Must extract at least consistency & photo milestones')
      assert.ok(milestones.some((m) => m.type === 'streak' || m.type === 'photo'))
    })

    it('exports measurement records to valid CSV and JSON text', () => {
      const csv = exportMeasurementsToCsv(mockEntries)
      assert.ok(csv.includes('Date,Weight (kg),Waist (cm)'), 'CSV must contain headers')
      assert.ok(csv.includes('2026-08-01,76,85'), 'CSV must contain row values')

      const json = exportMeasurementsToJson(mockEntries)
      const parsed = JSON.parse(json)
      assert.equal(parsed.length, 2)
      assert.equal(parsed[0].weightKg, 76.0)
    })
  })

  // ==========================================================================
  // UPGRADE #16 — PERSONAL AI FITNESS COACH 2.0
  // ==========================================================================
  describe('Upgrade #16: Personal AI Fitness Coach 2.0 Deterministic Engine', () => {
    const coachContext: CoachUserContext = {
      profile: MOCK_PROFILE,
      workouts: [
        {
          routineName: 'Upper Hypertrophy',
          durationSeconds: 3300,
          totalVolume: 4500,
          totalCompletedSets: 14,
          date: '2026-10-25',
        },
        {
          routineName: 'Lower Power',
          durationSeconds: 3600,
          totalVolume: 5200,
          totalCompletedSets: 12,
          date: '2026-10-23',
        },
      ],
      recovery: [
        {
          date: '2026-10-26',
          readinessScore: 82,
          sleepHours: 7.5,
          soreness: 'Low',
        },
      ],
      waterLoggedLiters: 2.4,
      waterTargetLiters: 3.0,
      activeStreak: 6,
      rpgLevel: 5,
      rpgRank: 'Fighter',
      measurements: [
        {
          id: 'm1',
          userId: 'test-user-mega',
          recordedDate: '2026-08-01',
          weightKg: 75.0,
          waistCm: 84.0,
        },
        {
          id: 'm2',
          userId: 'test-user-mega',
          recordedDate: '2026-10-25',
          weightKg: 73.5,
          waistCm: 82.0,
        },
      ],
      adaptations: [],
    }

    const testQuestions = [
      {
        q: 'Analyze my recent performance trend',
        expectedActionHref: '/progress',
      },
      {
        q: 'What should my next workout be and why?',
        expectedActionHref: '/workout',
      },
      {
        q: 'How is my recovery tracking and should I deload?',
        expectedActionHref: '/recovery',
      },
      {
        q: 'Recommend high-protein Indian meals fitting my budget',
        expectedActionHref: '/nutrition-planner',
      },
      {
        q: 'Explain recent training adaptations made by Autopilot',
        expectedActionHref: '/training-autopilot',
      },
      {
        q: 'Review my body measurement changes',
        expectedActionHref: '/transformation',
      },
      {
        q: 'Check for inconsistencies in my tracking habits',
        expectedActionHref: '/command-center',
      },
    ]

    for (const item of testQuestions) {
      it(`answers "${item.q}" with structured facts, calculations & link`, () => {
        const response = generateDeterministicCoachResponse(item.q, coachContext)
        assert.equal(response.provider, 'rule_based')
        assert.ok(response.recommendation.length > 10, 'Must provide concrete recommendation')
        assert.ok(response.explanation.length > 15, 'Must provide physiological explanation')
        assert.equal(response.actionHref, item.expectedActionHref, `Must deep-link to ${item.expectedActionHref}`)
        assert.ok(Array.isArray(response.facts), 'Must categorize facts array')
        assert.ok(Array.isArray(response.calculations), 'Must categorize calculations array')
        assert.ok(Array.isArray(response.suggestions), 'Must categorize suggestions array')
      })
    }
  })
})
