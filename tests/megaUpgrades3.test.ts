import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  buildDailyTrainingGuidance,
  buildPeriodicReview,
  getVoiceConfig,
  saveVoiceConfig,
  DEFAULT_VOICE_CONFIG,
} from '../src/lib/virtual-trainer/virtualTrainerService'
import {
  BIOMECHANICS_GUIDANCE_CATALOG,
  exportBiomechanicsToCsv,
  exportBiomechanicsToJson,
  saveBiomechanicsSession,
  getSavedBiomechanicsSessions,
  deleteBiomechanicsSession,
} from '../src/lib/biomechanics/biomechanicsService'
import {
  calculateBrzycki1RM,
  calculateEpley1RM,
  buildTestBenchmarkReport,
  exportPerformanceLogsToCsv,
  PERFORMANCE_TEST_CATALOG,
} from '../src/lib/performance-lab/performanceLabService'
import {
  calculatePearsonCorrelation,
  buildFitnessIntelligenceSnapshot,
} from '../src/lib/fitness-intelligence/intelligenceGraphService'
import {
  analyzeMovementFrame,
  createInitialTrackerState,
} from '../src/lib/vision/exerciseRules'
import type { CoachUserContext } from '../src/lib/ai/providers'
import type { PerformanceTestLog } from '../src/types/performanceLab'
import type { BiomechanicsSessionRecord } from '../src/types/biomechanics'

describe('YashFit Mega Upgrade Pack #21–#24 Test Suite', () => {
  // UPGRADE #21
  describe('Upgrade #21: AI Virtual Personal Trainer', () => {
    const mockContext: CoachUserContext = {
      profile: {
        user_id: 'u-yash',
        first_name: 'Yash',
        age: 25,
        height_cm: 178,
        weight_kg: 74,
        primary_goal: 'Build Muscle',
        experience_level: 'Intermediate',
        training_days_per_week: 4,
        training_environment: 'Commercial Gym',
        available_equipment: ['Barbell', 'Dumbbells', 'Cable Machine'],
        dietary_preference: 'Vegetarian',
        onboarding_completed: true,
      },
      workouts: [
        {
          routineName: 'Upper Body Power',
          date: new Date().toISOString().slice(0, 10),
          totalVolume: 5200,
          totalCompletedSets: 12,
          durationSeconds: 55 * 60,
        },
        {
          routineName: 'Lower Body Strength',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          totalVolume: 6100,
          totalCompletedSets: 14,
          durationSeconds: 60 * 60,
        },
      ],
      recovery: [
        {
          date: new Date().toISOString().slice(0, 10),
          sleepHours: 5.5,
          sleepQuality: 5,
          soreness: 'High',
          readinessScore: 52,
        },
      ],
      waterLoggedLiters: 2.2,
      waterTargetLiters: 3.5,
      activeStreak: 6,
      rpgLevel: 5,
      rpgRank: 'Fighter',
    }

    it('synthesizes daily guidance with fatigue alerts and split recommendations', () => {
      const guidance = buildDailyTrainingGuidance(mockContext)
      assert.strictEqual(guidance.recommendedSplit, 'Upper / Lower Split')
      assert.strictEqual(guidance.readinessScore, 52)
      assert.ok(guidance.recoveryAlerts.length >= 2, 'Should flag sleep deficit and low readiness')
      assert.ok(guidance.suggestedQuickActions.length >= 3)
      assert.ok(guidance.nutritionAdvice.includes('Vegetarian') || guidance.nutritionAdvice.includes('Paneer'))
    })

    it('builds periodic review across custom time windows', () => {
      const reviewWeek = buildPeriodicReview('week', mockContext)
      assert.strictEqual(reviewWeek.periodLabel, 'Past 7 Days')
      assert.strictEqual(reviewWeek.totalWorkouts, 2)
      assert.strictEqual(reviewWeek.totalVolumeKg, 11300)
      assert.strictEqual(reviewWeek.averageReadiness, 52)
      assert.ok(reviewWeek.keyAccomplishments.length > 0)
      assert.ok(reviewWeek.recommendedAdjustments.length > 0)
    })

    it('preserves voice configurations and fallbacks', () => {
      const def = getVoiceConfig()
      assert.strictEqual(typeof def.speechRate, 'number')
      assert.strictEqual(typeof def.isMuted, 'boolean')

      saveVoiceConfig({ ...DEFAULT_VOICE_CONFIG, speechRate: 1.25, isMuted: true })
      const updated = getVoiceConfig()
      assert.strictEqual(updated.speechRate, 1.25)
      assert.strictEqual(updated.isMuted, true)
    })
  })

  // UPGRADE #22
  describe('Upgrade #22: Advanced Biomechanics Intelligence', () => {
    it('contains guidance for all 5 required movement patterns', () => {
      const required = ['squat', 'push_up', 'lunge', 'bicep_curl', 'shoulder_press'] as const
      required.forEach((ex) => {
        const guide = BIOMECHANICS_GUIDANCE_CATALOG[ex]
        assert.ok(guide, `Guidance for ${ex} must be defined`)
        assert.ok(guide.idealFormCriteria.length >= 3)
        assert.ok(guide.commonFaults.length >= 2)
        assert.ok(guide.approximateNote.length > 10)
      })
    })

    it('evaluates shoulder press kinematics and counts completed overhead reps', () => {
      let state = createInitialTrackerState('shoulder_press')

      // Frame 1: Starting at shoulder level, elbow at 90°
      let res = analyzeMovementFrame(
        'shoulder_press',
        { kneeAngle: 180, hipAngle: 180, elbowAngle: 90, torsoAngle: 5 },
        state,
        true
      )
      assert.strictEqual(res.nextState.currentPhase, 'READY')

      // Frame 2: Driving upward, elbow opens to 135°
      res = analyzeMovementFrame(
        'shoulder_press',
        { kneeAngle: 180, hipAngle: 180, elbowAngle: 135, torsoAngle: 8 },
        res.nextState,
        true
      )
      assert.strictEqual(res.nextState.currentPhase, 'CONCENTRIC')

      // Frame 3: Reaches full overhead lockout, elbow at 168°
      res = analyzeMovementFrame(
        'shoulder_press',
        { kneeAngle: 180, hipAngle: 180, elbowAngle: 168, torsoAngle: 10 },
        res.nextState,
        true
      )
      assert.strictEqual(res.nextState.currentPhase, 'BOTTOM_INFLECTION')
      assert.strictEqual(res.nextState.hitBottomDepth, true)

      // Frame 4: Lowering back down to 95°
      res = analyzeMovementFrame(
        'shoulder_press',
        { kneeAngle: 180, hipAngle: 180, elbowAngle: 95, torsoAngle: 6 },
        res.nextState,
        true
      )
      assert.strictEqual(res.result.repCompleted, true)
      assert.strictEqual(res.nextState.repsCount, 1)
      assert.strictEqual(res.nextState.currentPhase, 'READY')
    })

    it('deducts form score when excessive lumbar arch / torso lean occurs in shoulder press', () => {
      const state = createInitialTrackerState('shoulder_press')
      const res = analyzeMovementFrame(
        'shoulder_press',
        { kneeAngle: 180, hipAngle: 180, elbowAngle: 140, torsoAngle: 35 }, // 35° excessive lean
        state,
        true
      )
      assert.ok(res.result.formScore < 90)
      const warning = res.result.feedback.find((f) => f.id === 'excessive_arch')
      assert.ok(warning, 'Should emit excessive arch feedback')
    })

    it('exports biomechanics records to valid CSV and JSON text', () => {
      const sampleSession: BiomechanicsSessionRecord = {
        id: 'bio-test-1',
        userId: 'demo-user',
        date: '2026-10-30',
        exercise: 'squat',
        exerciseName: 'Bodyweight / Goblet Squat',
        totalReps: 12,
        cleanReps: 10,
        partialReps: 2,
        averageFormScore: 92,
        durationSeconds: 45,
        primaryFeedback: ['Parallel depth verified', 'Knees aligned'],
      }

      const csv = exportBiomechanicsToCsv([sampleSession])
      assert.ok(csv.startsWith('"Session ID","Date","Exercise"'))
      assert.ok(csv.includes('"bio-test-1"'))
      assert.ok(csv.includes('10'))

      const json = exportBiomechanicsToJson([sampleSession])
      const parsed = JSON.parse(json)
      assert.strictEqual(parsed[0].id, 'bio-test-1')
      assert.strictEqual(parsed[0].cleanReps, 10)
    })
  })

  // UPGRADE #23
  describe('Upgrade #23: Fitness Performance Lab', () => {
    it('calculates 1RM using validated Brzycki and Epley equations accurately', () => {
      // 80kg lifted for 5 reps
      // Brzycki: 80 / (1.0278 - (0.0278 * 5)) = 80 / 0.8888 = 90.0 kg
      const brz = calculateBrzycki1RM(80, 5)
      assert.strictEqual(brz, 90.0)

      // Epley: 80 * (1 + 0.0333 * 5) = 80 * 1.1665 = 93.3 kg
      const epley = calculateEpley1RM(80, 5)
      assert.strictEqual(epley, 93.3)

      // 1 rep should equal input load exactly
      assert.strictEqual(calculateBrzycki1RM(100, 1), 100)
      assert.strictEqual(calculateEpley1RM(100, 1), 100)
    })

    it('builds benchmark reports comparing strictly against personal baseline', () => {
      const sampleLogs: PerformanceTestLog[] = [
        {
          id: 'log-1',
          userId: 'demo-user',
          testId: 'test-1rm-bench',
          testTitle: '1RM Barbell Bench Press',
          category: 'strength_progression',
          date: '2026-09-01',
          resultValue: 70,
          unit: 'kg',
          isBaseline: true,
          conditionsMet: true,
        },
        {
          id: 'log-2',
          userId: 'demo-user',
          testId: 'test-1rm-bench',
          testTitle: '1RM Barbell Bench Press',
          category: 'strength_progression',
          date: '2026-10-01',
          resultValue: 77,
          unit: 'kg',
          isBaseline: false,
          conditionsMet: true,
        },
        {
          id: 'log-3',
          userId: 'demo-user',
          testId: 'test-1rm-bench',
          testTitle: '1RM Barbell Bench Press',
          category: 'strength_progression',
          date: '2026-10-30',
          resultValue: 80,
          unit: 'kg',
          isBaseline: false,
          conditionsMet: true,
        },
      ]

      const report = buildTestBenchmarkReport('test-1rm-bench', sampleLogs)
      assert.strictEqual(report.baselineValue, 70)
      assert.strictEqual(report.personalBest, 80)
      assert.strictEqual(report.latestValue, 80)
      // Improvement from 70 to 80: (80-70)/70 = +14%
      assert.strictEqual(report.historicalImprovementPct, 14)
      assert.strictEqual(report.testCount, 3)
    })

    it('exports performance logs to valid CSV table', () => {
      const logs: PerformanceTestLog[] = [
        {
          id: 'log-p1',
          userId: 'demo-user',
          testId: 'test-plank-hold',
          testTitle: 'Maximum Forearm Plank Hold',
          category: 'timed_endurance',
          date: '2026-10-15',
          resultValue: 95,
          unit: 'seconds',
          isBaseline: true,
          conditionsMet: true,
          notes: 'Solid core brace',
        },
      ]

      const csv = exportPerformanceLogsToCsv(logs)
      assert.ok(csv.startsWith('"Log ID","Date","Test ID"'))
      assert.ok(csv.includes('"log-p1"'))
      assert.ok(csv.includes('95'))
    })
  })

  // UPGRADE #24
  describe('Upgrade #24: Personal Fitness Intelligence Graph', () => {
    it('calculates Pearson correlation coefficient r accurately', () => {
      // Perfect positive correlation
      const x1 = [1, 2, 3, 4, 5]
      const y1 = [2, 4, 6, 8, 10]
      assert.strictEqual(calculatePearsonCorrelation(x1, y1), 1.0)

      // Perfect negative correlation
      const x2 = [1, 2, 3, 4, 5]
      const y2 = [10, 8, 6, 4, 2]
      assert.strictEqual(calculatePearsonCorrelation(x2, y2), -1.0)

      // Unpaired or small series
      assert.strictEqual(calculatePearsonCorrelation([1, 2], [2, 4]), null)
    })

    it('synthesizes intelligence snapshot with 10 nodes, edges, and causal distinction insights', () => {
      const snapshot = buildFitnessIntelligenceSnapshot({
        profile: {
          user_id: 'u-yash',
          first_name: 'Yash',
          age: 25,
          height_cm: 178,
          weight_kg: 74,
          primary_goal: 'Build Muscle',
          experience_level: 'Intermediate',
          training_days_per_week: 4,
          training_environment: 'Commercial Gym',
          available_equipment: ['Barbell', 'Dumbbells'],
          dietary_preference: 'Vegetarian',
          onboarding_completed: true,
        },
        workouts: [
          { routineName: 'Push', date: '2026-10-20', totalVolume: 4000, durationSeconds: 3000, totalCompletedSets: 12 },
          { routineName: 'Pull', date: '2026-10-22', totalVolume: 4500, durationSeconds: 3300, totalCompletedSets: 14 },
          { routineName: 'Legs', date: '2026-10-25', totalVolume: 5000, durationSeconds: 3600, totalCompletedSets: 15 },
          { routineName: 'Upper', date: '2026-10-28', totalVolume: 4800, durationSeconds: 3120, totalCompletedSets: 13 },
        ],
        recovery: [
          { date: '2026-10-20', sleepHours: 7.5, sleepQuality: 8, soreness: 'Low', readinessScore: 82 },
          { date: '2026-10-22', sleepHours: 6.0, sleepQuality: 6, soreness: 'Moderate', readinessScore: 68 },
          { date: '2026-10-25', sleepHours: 8.0, sleepQuality: 9, soreness: 'Low', readinessScore: 88 },
          { date: '2026-10-28', sleepHours: 7.0, sleepQuality: 8, soreness: 'Moderate', readinessScore: 78 },
        ],
        measurements: [
          { id: 'm1', userId: 'u1', recordedDate: '2026-10-01', weightKg: 74.0 },
          { id: 'm2', userId: 'u1', recordedDate: '2026-10-28', weightKg: 74.4 },
        ],
        performanceLogs: [
          { id: 'p1', userId: 'u1', testId: 'test-1rm-squat', testTitle: 'Squat', category: 'strength_progression', date: '2026-10-15', resultValue: 100, unit: 'kg', isBaseline: true, conditionsMet: true },
        ],
        nutritionPlan: null,
        waterLoggedLiters: 2.8,
        waterTargetLiters: 3.5,
        activeStreak: 7,
      })

      assert.strictEqual(snapshot.nodes.length, 10)
      assert.ok(snapshot.edges.length >= 6)
      assert.ok(snapshot.insights.length >= 4)
      assert.ok(snapshot.overallDataCompletenessPct > 50)

      // Verify strict causal distinction boundaries
      snapshot.insights.forEach((insight) => {
        assert.ok(insight.whatCannotBeConcluded.length > 15, 'Every insight must explain what cannot be concluded')
        assert.ok(insight.examinedRecordsDescription.length > 5)
        assert.ok(insight.actionableNextStep.length > 5)
        assert.ok(insight.relatedHref.startsWith('/'))
      })
    })

    it('identifies statistical tracking gaps when datasets are sparse', () => {
      const sparseSnapshot = buildFitnessIntelligenceSnapshot({
        profile: null,
        workouts: [],
        recovery: [],
        measurements: [],
        performanceLogs: [],
        nutritionPlan: null,
        waterLoggedLiters: 0,
        waterTargetLiters: 3.0,
        activeStreak: 0,
      })

      assert.ok(sparseSnapshot.missingDataSummaries.length >= 3)
      assert.ok(sparseSnapshot.missingDataSummaries.some((s) => s.includes('workout')))
      assert.ok(sparseSnapshot.missingDataSummaries.some((s) => s.includes('recovery')))
    })
  })
})
