import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  parseTargetRepBounds,
  findExerciseHistory,
  generateAutopilotRecommendation,
} from '../src/lib/autopilot/autopilotEngine'
import { findBestSubstitutions } from '../src/lib/autopilot/substitutionEngine'
import { generateWeeklyAutopilotSchedule } from '../src/lib/autopilot/weeklyScheduler'
import type { UserProfile } from '../src/types/profile'
import type { TwinWorkout, RecoveryEntry } from '../src/lib/digitalTwin'
import type { WorkoutRoutine, WorkoutExerciseItem } from '../src/types/workout'
import { PRESET_WORKOUT_ROUTINES } from '../src/data/routines'

const MOCK_PROFILE: UserProfile = {
  user_id: 'test-user-autopilot',
  first_name: 'Antigravity',
  age: 27,
  height_cm: 180,
  weight_kg: 78,
  primary_goal: 'Build Muscle',
  experience_level: 'Intermediate',
  training_days_per_week: 4,
  training_environment: 'Commercial Gym',
  available_equipment: ['Barbell', 'Dumbbells', 'Bench'],
  dietary_preference: 'Vegetarian',
  onboarding_completed: true,
}

const BENCH_ITEM: WorkoutExerciseItem = {
  exerciseId: 'ex-barbell-bench-press',
  exerciseName: 'Barbell Bench Press',
  targetSets: 3,
  targetReps: '8-12',
  restSeconds: 90,
  primaryMuscle: 'Chest',
  equipment: 'Barbell',
}

const PUSHUP_ITEM: WorkoutExerciseItem = {
  exerciseId: 'ex-push-ups',
  exerciseName: 'Push-ups',
  targetSets: 3,
  targetReps: '10-15',
  restSeconds: 60,
  primaryMuscle: 'Chest',
  equipment: 'No Equipment',
}

const TEST_ROUTINE: WorkoutRoutine = {
  id: 'test-push-routine',
  name: 'Test Push Day',
  targetSplit: 'Push Day',
  description: 'Test chest and triceps focus',
  durationMinutes: 45,
  exercises: [BENCH_ITEM, PUSHUP_ITEM],
}

describe('Smart Training Autopilot — Rep Parsing and History Lookup', () => {
  it('parseTargetRepBounds correctly extracts min and max reps', () => {
    assert.deepStrictEqual(parseTargetRepBounds('8-12'), { minReps: 8, maxReps: 12 })
    assert.deepStrictEqual(parseTargetRepBounds('5'), { minReps: 5, maxReps: 5 })
    assert.deepStrictEqual(parseTargetRepBounds('10-15 reps'), { minReps: 10, maxReps: 15 })
  })

  it('findExerciseHistory extracts all completed sets matching an exercise', () => {
    const workouts: TwinWorkout[] = [
      {
        routineName: 'Chest Day',
        date: new Date().toISOString(),
        durationSeconds: 2700,
        totalVolume: 2400,
        totalCompletedSets: 3,
        exercises: [
          {
            exerciseId: 'ex-barbell-bench-press',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
            ],
          },
        ],
      },
    ]

    const history = findExerciseHistory('ex-barbell-bench-press', 'Barbell Bench Press', workouts)
    assert.strictEqual(history.length, 3)
    assert.strictEqual(history[0].weightKg, 80)
    assert.strictEqual(history[0].reps, 12)
  })
})

describe('Smart Training Autopilot — Progressive Overload & Fatigue Engine', () => {
  it('Triggers conservative +2.5kg load increase when top rep ceiling is achieved', () => {
    const workouts: TwinWorkout[] = [
      {
        routineName: 'Push Day',
        date: new Date().toISOString(),
        durationSeconds: 2700,
        totalVolume: 2880,
        totalCompletedSets: 3,
        exercises: [
          {
            exerciseId: 'ex-barbell-bench-press',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
            ],
          },
        ],
      },
    ]

    const recovery: RecoveryEntry[] = [
      {
        date: new Date().toISOString(),
        sleepHours: 8,
        readinessScore: 85,
        soreness: 'None',
      },
    ]

    const rec = generateAutopilotRecommendation({
      profile: MOCK_PROFILE,
      workouts,
      recovery,
      currentRoutine: TEST_ROUTINE,
    })

    const benchAdaptation = rec.exerciseAdaptations.find(
      (a) => a.exerciseId === 'ex-barbell-bench-press'
    )
    assert.ok(benchAdaptation, 'Must have adaptation for bench press')
    assert.strictEqual(benchAdaptation.actionType, 'increase_weight')
    assert.strictEqual(benchAdaptation.weightDeltaKg, 2.5)
    assert.ok(benchAdaptation.reason.includes('top rep target'))
  })

  it('Maintains load without progression when history is insufficient (0 logged sets)', () => {
    const rec = generateAutopilotRecommendation({
      profile: MOCK_PROFILE,
      workouts: [], // No history
      recovery: [],
      currentRoutine: TEST_ROUTINE,
    })

    const benchAdaptation = rec.exerciseAdaptations.find(
      (a) => a.exerciseId === 'ex-barbell-bench-press'
    )
    assert.ok(benchAdaptation)
    assert.strictEqual(benchAdaptation.actionType, 'maintain')
    assert.strictEqual(benchAdaptation.sufficiency, 'insufficient')
    assert.strictEqual(benchAdaptation.weightDeltaKg, 0)
    assert.ok(benchAdaptation.reason.includes('baseline'))
  })

  it('Enforces volume/load reduction when systemic fatigue is elevated (Readiness < 60)', () => {
    const workouts: TwinWorkout[] = [
      {
        routineName: 'Push Day',
        date: new Date().toISOString(),
        durationSeconds: 2700,
        totalVolume: 2400,
        totalCompletedSets: 3,
        exercises: [
          {
            exerciseId: 'ex-barbell-bench-press',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
              { weightKg: 80, reps: 12, completed: true },
            ],
          },
        ],
      },
    ]

    const fatigueRecovery: RecoveryEntry[] = [
      {
        date: new Date().toISOString(),
        sleepHours: 4.5,
        readinessScore: 45, // High fatigue
        soreness: 'Severe',
      },
    ]

    const rec = generateAutopilotRecommendation({
      profile: MOCK_PROFILE,
      workouts,
      recovery: fatigueRecovery,
      currentRoutine: TEST_ROUTINE,
    })

    assert.strictEqual(rec.isRecoveryConstrained, true)
    const benchAdaptation = rec.exerciseAdaptations.find(
      (a) => a.exerciseId === 'ex-barbell-bench-press'
    )
    assert.ok(benchAdaptation)
    assert.strictEqual(benchAdaptation.actionType, 'decrease_load')
    assert.ok(benchAdaptation.setDelta < 0, 'Must reduce target sets')
    assert.ok(benchAdaptation.weightDeltaKg < 0, 'Must reduce working load')
  })

  it('Safely handles missing recovery without inventing scores', () => {
    const rec = generateAutopilotRecommendation({
      profile: MOCK_PROFILE,
      workouts: [],
      recovery: [], // Empty recovery biomarkers
      currentRoutine: TEST_ROUTINE,
    })

    assert.strictEqual(rec.readinessScore, null)
    assert.strictEqual(rec.readinessCategory, 'Unrecorded')
    assert.ok(rec.safetyWarnings.some((w) => w.includes('unrecorded')))
  })
})

describe('Smart Training Autopilot — Intelligent Exercise Substitutions', () => {
  it('Substitutes exercise when equipment is unavailable in profile', () => {
    const dumbbellOnlyProfile: UserProfile = {
      ...MOCK_PROFILE,
      available_equipment: ['Dumbbells', 'Bench'], // No Barbell
    }

    const rec = generateAutopilotRecommendation({
      profile: dumbbellOnlyProfile,
      workouts: [],
      recovery: [],
      currentRoutine: TEST_ROUTINE, // Has Barbell Bench Press
    })

    const benchAdaptation = rec.exerciseAdaptations.find(
      (a) => a.exerciseId === 'ex-barbell-bench-press'
    )
    assert.ok(benchAdaptation)
    assert.strictEqual(benchAdaptation.actionType, 'substitute')
    assert.strictEqual(benchAdaptation.proposedItem.primaryMuscle, 'Chest')
    assert.notStrictEqual(benchAdaptation.proposedItem.exerciseId, 'ex-barbell-bench-press')
  })

  it('findBestSubstitutions preserves primary muscle group', () => {
    const subs = findBestSubstitutions(BENCH_ITEM, ['Dumbbells', 'Bench'])
    assert.ok(subs.length > 0)
    subs.forEach((sub) => {
      assert.strictEqual(sub.preservesPrimaryMuscle, true)
      assert.strictEqual(sub.exercise.primaryMuscle, 'Chest')
    })
  })
})

describe('Smart Training Autopilot — Weekly Plan Optimization', () => {
  it('Generates 4 training days matching profile frequency', () => {
    const schedule = generateWeeklyAutopilotSchedule(
      MOCK_PROFILE,
      [],
      PRESET_WORKOUT_ROUTINES[0]
    )

    assert.strictEqual(schedule.trainingDaysPerWeek, 4)
    const trainingDays = schedule.days.filter((d) => !d.isRestDay)
    const restDays = schedule.days.filter((d) => d.isRestDay)

    assert.strictEqual(trainingDays.length, 4)
    assert.strictEqual(restDays.length, 3)
    assert.ok(schedule.totalWeeklyMinutes > 0)
    assert.ok(schedule.totalWeeklySets > 0)
  })
})

