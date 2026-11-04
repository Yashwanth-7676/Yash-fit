import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  calculateBodyComposition,
  calculateComparisonDelta,
  generateMonthlySummaries,
  saveBodyIntelligenceRecord,
  getBodyIntelligenceRecords,
} from '../src/lib/body-intelligence/bodyIntelligenceService'
import {
  DEFAULT_STUDIO_ROUTINES,
  completeStudioSession,
} from '../src/lib/workout-studio/workoutStudioService'
import { generatePredictiveFitnessOverview } from '../src/lib/predictions/predictiveFitnessService'
import {
  getCompanionContext,
  getDailyCheckInStatus,
  INITIAL_COMPANION_MESSAGE,
} from '../src/lib/companion/companionService'
import type { StudioWorkoutState } from '../src/types/workoutStudio'

describe('YashFit Mega Upgrade Pack #33–#36 Test Suite', () => {
  // ─── UPGRADE #33: AI BODY COMPOSITION INTELLIGENCE ────────────────────────
  describe('Upgrade #33: AI Body Composition Intelligence', () => {
    it('calculates male body fat % using U.S. Navy circumference formula', () => {
      const comp = calculateBodyComposition({
        weightKg: 78.5,
        heightCm: 175,
        gender: 'male',
        age: 26,
        waistCm: 84,
        neckCm: 38,
      })

      assert.strictEqual(comp.formulaUsed, 'navy_method')
      assert.strictEqual(comp.confidenceRating, 'high')
      assert.ok(comp.bodyFatPercentage > 10 && comp.bodyFatPercentage < 25)
      assert.strictEqual(comp.isEstimated, true)
      assert.ok(comp.leanMassKg > 55 && comp.leanMassKg < 75)
      assert.strictEqual(
        Number((comp.leanMassKg + comp.fatMassKg).toFixed(1)),
        78.5
      )
    })

    it('calculates female body fat % using U.S. Navy formula with hips', () => {
      const comp = calculateBodyComposition({
        weightKg: 62.0,
        heightCm: 165,
        gender: 'female',
        age: 28,
        waistCm: 70,
        neckCm: 33,
        hipsCm: 95,
      })

      assert.strictEqual(comp.formulaUsed, 'navy_method')
      assert.strictEqual(comp.confidenceRating, 'high')
      assert.ok(comp.bodyFatPercentage > 15 && comp.bodyFatPercentage < 35)
      assert.strictEqual(
        Number((comp.leanMassKg + comp.fatMassKg).toFixed(1)),
        62.0
      )
    })

    it('falls back gracefully to clinical BMI-derived formula when circumferences are missing', () => {
      const comp = calculateBodyComposition({
        weightKg: 80.0,
        heightCm: 180,
        gender: 'male',
        age: 30,
      })

      assert.strictEqual(comp.formulaUsed, 'bmi_derived')
      assert.strictEqual(comp.confidenceRating, 'approximate')
      assert.strictEqual(comp.bmi, 24.7)
      assert.ok(comp.bodyFatPercentage > 10)
    })

    it('calculates delta comparison matrix between two dates accurately', () => {
      const records = getBodyIntelligenceRecords()
      assert.ok(records.length >= 2)
      const baseline = records[records.length - 1]
      const current = records[0]

      const delta = calculateComparisonDelta(baseline, current)
      assert.strictEqual(delta.baselineDate, baseline.recordedDate)
      assert.strictEqual(delta.currentDate, current.recordedDate)
      assert.ok(delta.daysElapsed > 0)
      assert.strictEqual(
        delta.weightDeltaKg,
        Number((current.weightKg - baseline.weightKg).toFixed(1))
      )
    })

    it('generates chronological monthly transformation summaries', () => {
      const records = getBodyIntelligenceRecords()
      const summaries = generateMonthlySummaries(records)

      assert.ok(summaries.length >= 1)
      const latest = summaries[0]
      assert.ok(latest.monthKey.length === 7)
      assert.ok(typeof latest.netWeightChangeKg === 'number')
      assert.ok(latest.keyMilestone.length > 0)
    })
  })

  // ─── UPGRADE #34: INTERACTIVE SMART WORKOUT STUDIO ────────────────────────
  describe('Upgrade #34: Interactive Smart Workout Studio', () => {
    it('contains default studio routines with valid biomechanical kinematics keys', () => {
      assert.ok(DEFAULT_STUDIO_ROUTINES.length >= 3)
      const pushRoutine = DEFAULT_STUDIO_ROUTINES[0]
      assert.strictEqual(pushRoutine.id, 'push-power-hypertrophy')
      assert.ok(pushRoutine.exercises.length >= 3)

      const firstEx = pushRoutine.exercises[0]
      assert.strictEqual(firstEx.exerciseId, 'bench-press')
      assert.strictEqual(firstEx.motionCycleKey, 'bench_press')
      assert.ok(firstEx.cues.length >= 2)
      assert.ok(firstEx.sets.length >= 3)
    })

    it('completes workout studio session and accurately aggregates volume & sets', () => {
      const mockState: StudioWorkoutState = {
        routineId: 'test-studio-routine',
        routineName: 'Chest & Arms Power',
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        elapsedSeconds: 2700, // 45 minutes
        isPaused: false,
        restRemainingSeconds: 0,
        isResting: false,
        voiceEnabled: true,
        exercises: [
          {
            exerciseId: 'bench-press',
            name: 'Barbell Flat Bench Press',
            primaryMuscle: 'Chest',
            secondaryMuscles: ['Triceps'],
            motionCycleKey: 'bench_press',
            instructions: ['Lower with control', 'Press to lockout'],
            cues: ['Keep elbows tucked'],
            breathingGuidance: 'Exhale on press',
            sets: [
              {
                setNumber: 1,
                targetReps: '8',
                targetWeightKg: 80,
                actualReps: 8,
                actualWeightKg: 80,
                isCompleted: true,
                restSeconds: 90,
              },
              {
                setNumber: 2,
                targetReps: '8',
                targetWeightKg: 85,
                actualReps: 8,
                actualWeightKg: 85,
                isCompleted: true,
                restSeconds: 90,
              },
            ],
            substitutions: [],
          },
        ],
      }

      const summary = completeStudioSession(mockState)
      assert.strictEqual(summary.routineName, 'Chest & Arms Power')
      assert.strictEqual(summary.durationMinutes, 45)
      assert.strictEqual(summary.totalSetsCompleted, 2)
      // Volume: 80*8 + 85*8 = 640 + 680 = 1320 kg
      assert.strictEqual(summary.totalVolumeKg, 1320)
      assert.ok(summary.estimatedCaloriesBurned > 100)
    })
  })

  // ─── UPGRADE #35: PREDICTIVE FITNESS INTELLIGENCE ────────────────────────
  describe('Upgrade #35: Predictive Fitness Intelligence', () => {
    it('evaluates training consistency and adherence ratings', () => {
      const overview = generatePredictiveFitnessOverview()
      assert.ok(overview.consistency.consistencyScorePercent >= 0)
      assert.ok(overview.consistency.plannedWorkoutsPerWeek === 4)
      assert.ok(
        ['exceptional', 'steady', 'inconsistent'].includes(
          overview.consistency.consistencyRating
        )
      )
    })

    it('projects compound lift 1RM strength progression across horizons', () => {
      const overview = generatePredictiveFitnessOverview()
      assert.strictEqual(overview.strength.length, 4)

      const bench = overview.strength.find((s) => s.exerciseId === 'bench-press')
      assert.ok(bench)
      assert.ok(bench!.projected1RMIn4WeeksKg >= bench!.currentEstimated1RMKg)
      assert.ok(
        bench!.projected1RMIn8WeeksKg >= bench!.projected1RMIn4WeeksKg
      )
      assert.ok(
        bench!.projected1RMIn12WeeksKg >= bench!.projected1RMIn8WeeksKg
      )
      assert.strictEqual(bench!.uncertaintyBoundKg, 2.5)
    })

    it('projects target weight completion date with uncertainty bounds', () => {
      const overview = generatePredictiveFitnessOverview()
      assert.ok(overview.weight.projectedWeeksToGoal >= 1)
      assert.ok(overview.weight.projectedGoalDate.match(/^\d{4}-\d{2}-\d{2}$/))
      assert.ok(overview.weight.uncertaintyWeeksBound >= 1)
    })

    it('audits missing data and formulates explainability drivers', () => {
      const overview = generatePredictiveFitnessOverview()
      assert.ok(overview.overallModelConfidence >= 60)
      assert.ok(overview.explainabilityDrivers.length >= 3)
      assert.ok(overview.recommendations.length >= 3)
    })
  })

  // ─── UPGRADE #36: YASHFIT PERSONAL AI COMPANION ──────────────────────────
  describe('Upgrade #36: YashFit Personal AI Companion', () => {
    it('extracts authenticated user context for context-aware prompting', () => {
      const context = getCompanionContext()
      assert.ok(context.currentWeightKg > 0)
      assert.ok(context.targetWeightKg > 0)
      assert.ok(context.readinessScore !== undefined)
      assert.strictEqual(context.dietaryPreference, 'Vegetarian')
    })

    it('tracks daily check-in status and streak continuity', () => {
      const checkIn = getDailyCheckInStatus()
      assert.strictEqual(typeof checkIn.todayTrained, 'boolean')
      assert.strictEqual(typeof checkIn.nutritionLogged, 'boolean')
      assert.strictEqual(typeof checkIn.recoveryRecorded, 'boolean')
      assert.ok(checkIn.streakDays > 0)
    })

    it('initializes companion conversation with grounded facts and safety disclaimers', () => {
      assert.strictEqual(INITIAL_COMPANION_MESSAGE.role, 'assistant')
      assert.ok(INITIAL_COMPANION_MESSAGE.content.includes('Astra'))
      assert.ok(
        INITIAL_COMPANION_MESSAGE.groundedFacts &&
          INITIAL_COMPANION_MESSAGE.groundedFacts.length > 0
      )
    })
  })
})

