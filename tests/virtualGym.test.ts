import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  cyclicProgress,
  getExercise3DConfig,
  EXERCISE_3D_CONFIGS,
} from '../src/lib/virtual-gym/exerciseKinematics'
import {
  calculateWeeklyMuscleOverview,
  getRecommendedExercisesForMuscle,
  ALL_MUSCLE_GROUPS,
} from '../src/lib/virtual-gym/muscleIntelligenceService'
import type { TwinWorkout } from '../src/lib/digitalTwin'

describe('Virtual Gym — Kinematics and Movement Solver', () => {
  it('cyclicProgress produces smooth sinusoidal 0 to 1 to 0 curve', () => {
    assert.strictEqual(cyclicProgress(0), 0)
    assert.strictEqual(cyclicProgress(1), Math.sin(Math.PI) < 1e-10 ? 0 : cyclicProgress(1))
    // Midpoint should be approximately 1.0
    const mid = cyclicProgress(0.5)
    assert.ok(Math.abs(mid - 1.0) < 1e-6, `Expected ~1.0 at midpoint, got ${mid}`)

    // Clamping test
    assert.strictEqual(cyclicProgress(-0.5), 0)
    assert.strictEqual(cyclicProgress(1.5), cyclicProgress(1))
  })

  it('Squat kinematics produces valid joint angles without NaN', () => {
    const squatConfig = EXERCISE_3D_CONFIGS['ex-barbell-back-squat']
    assert.ok(squatConfig, 'Squat config must exist')

    const topAngles = squatConfig.kinematics(0)
    const bottomAngles = squatConfig.kinematics(0.5)

    // At top: torso lean should be minimal (~10°), knees unbent (0°)
    assert.ok(!Number.isNaN(topAngles.torsoPitch))
    assert.ok(!Number.isNaN(topAngles.leftKneePitch))
    assert.strictEqual(topAngles.leftKneePitch, 0)
    assert.strictEqual(topAngles.showBarbell, true)

    // At bottom: knees flexed to ~95°, hips flexed, torso pitched forward ~35°
    assert.ok(bottomAngles.leftKneePitch > 80, 'Knees must be flexed at parallel squat depth')
    assert.ok(bottomAngles.torsoPitch > 25, 'Torso must hinge forward for balance')
    assert.ok(bottomAngles.torsoHeight < -0.3, 'Torso height must descend in squat')
  })

  it('Push-up kinematics bends elbows from extended to 90 degrees', () => {
    const pushUpConfig = EXERCISE_3D_CONFIGS['ex-push-ups']
    assert.ok(pushUpConfig, 'Push-up config must exist')

    const topAngles = pushUpConfig.kinematics(0)
    const bottomAngles = pushUpConfig.kinematics(0.5)

    assert.ok(topAngles.leftElbowPitch <= 25, 'Elbows extended at top')
    assert.ok(bottomAngles.leftElbowPitch >= 85, 'Elbows flexed to ~90° at bottom')
    assert.strictEqual(topAngles.showBarbell, false)
  })

  it('Fallback exercise config safely resolves unknown IDs with valid kinematics', () => {
    const customConfig = getExercise3DConfig('ex-custom-unknown-movement', 'Cable Woodchopper', 'Core')
    assert.strictEqual(customConfig.name, 'Cable Woodchopper')
    assert.deepStrictEqual(customConfig.primaryMuscles, ['Core'])

    const angles = customConfig.kinematics(0.5)
    assert.ok(!Number.isNaN(angles.torsoPitch))
    assert.ok(!Number.isNaN(angles.leftShoulderPitch))
  })
})

describe('Virtual Gym — Weekly Muscle Intelligence Service', () => {
  it('Returns untrained status for all muscles when workout log is empty', () => {
    const result = calculateWeeklyMuscleOverview([])

    assert.strictEqual(result.totalLoggedSets, 0)
    assert.strictEqual(result.undertrainedMuscles.length, ALL_MUSCLE_GROUPS.length)
    assert.strictEqual(result.wellTrainedMuscles.length, 0)

    ALL_MUSCLE_GROUPS.forEach((m) => {
      assert.strictEqual(result.muscleMetrics[m].status, 'untrained')
      assert.strictEqual(result.muscleMetrics[m].loggedSetsLast7Days, 0)
    })
  })

  it('Correctly counts sets within 7 days and excludes older workouts', () => {
    const today = new Date().toISOString()
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString()

    const mockWorkouts: TwinWorkout[] = [
      {
        routineName: 'Heavy Leg Day',
        date: today,
        durationSeconds: 3000,
        totalVolume: 3240,
        totalCompletedSets: 4,
        exercises: [
          {
            exerciseId: 'ex-squat',
            exerciseName: 'Barbell Back Squat',
            sets: [
              { reps: 10, weightKg: 100, completed: true },
              { reps: 10, weightKg: 100, completed: true },
              { reps: 10, weightKg: 100, completed: true },
              { reps: 8, weightKg: 105, completed: true },
            ],
          },
        ],
      },
      {
        routineName: 'Quad Hypertrophy',
        date: today,
        durationSeconds: 2700,
        totalVolume: 10800,
        totalCompletedSets: 6,
        exercises: [
          {
            exerciseId: 'ex-leg-press',
            exerciseName: 'Leg Press',
            sets: [
              { reps: 12, weightKg: 180, completed: true },
              { reps: 12, weightKg: 180, completed: true },
              { reps: 12, weightKg: 180, completed: true },
              { reps: 12, weightKg: 180, completed: true },
              { reps: 12, weightKg: 180, completed: true },
              { reps: 12, weightKg: 180, completed: true },
            ],
          },
        ],
      },
      {
        routineName: 'Past Bench Day',
        date: tenDaysAgo, // older than 7 days
        durationSeconds: 2700,
        totalVolume: 1600,
        totalCompletedSets: 2,
        exercises: [
          {
            exerciseId: 'ex-bench',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { reps: 10, weightKg: 80, completed: true },
              { reps: 10, weightKg: 80, completed: true },
            ],
          },
        ],
      },
    ]

    const overview = calculateWeeklyMuscleOverview(mockWorkouts)

    // Total logged sets in past 7 days: 4 (squat) + 6 (leg press) = 10 sets
    assert.strictEqual(overview.totalLoggedSets, 10)

    // Quads should have 10 sets (optimal)
    assert.ok(overview.muscleMetrics.Quads.loggedSetsLast7Days >= 10)
    assert.strictEqual(overview.muscleMetrics.Quads.status, 'optimal')

    // Chest should have 0 sets because its workout was 10 days ago
    assert.strictEqual(overview.muscleMetrics.Chest.loggedSetsLast7Days, 0)
    assert.strictEqual(overview.muscleMetrics.Chest.status, 'untrained')

    // Suggestions should identify under-trained muscles (e.g. Hamstrings / Glutes / Back)
    assert.ok(overview.balancedSuggestions.length > 0)
  })

  it('Provides valid recommended exercises for any specified muscle group', () => {
    ALL_MUSCLE_GROUPS.forEach((muscle) => {
      const recs = getRecommendedExercisesForMuscle(muscle)
      assert.ok(Array.isArray(recs) && recs.length > 0, `Recommendations for ${muscle} must exist`)
    })
  })
})
