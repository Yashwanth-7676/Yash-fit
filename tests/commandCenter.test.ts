import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  calculateTodayFitnessStatus,
  computePersonalRecords,
  detectAttentionAreas,
  generateAdaptiveWorkoutRecommendation,
  computeTrendForecastPoints,
} from '../src/lib/command-center/commandCenterService'
import { generateDeterministicCoachResponse } from '../src/lib/ai/providers'
import type { TwinWorkout, RecoveryEntry } from '../src/lib/digitalTwin'
import type { UserProfile } from '../src/types/profile'

const MOCK_PROFILE: UserProfile = {
  user_id: 'test-user-1',
  first_name: 'Antigravity',
  age: 26,
  height_cm: 178,
  weight_kg: 74,
  primary_goal: 'Build Muscle',
  experience_level: 'Intermediate',
  training_days_per_week: 4,
  training_environment: 'Commercial Gym',
  available_equipment: ['Dumbbells', 'Barbell', 'Bench'],
  dietary_preference: 'Vegetarian',
  onboarding_completed: true,
}

const MOCK_WORKOUTS: TwinWorkout[] = [
  {
    routineName: 'Push Day',
    durationSeconds: 3200,
    totalVolume: 4200,
    totalCompletedSets: 14,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    exercises: [
      {
        exerciseId: 'ex-bench-press',
        exerciseName: 'Barbell Bench Press',
        primaryMuscle: 'Chest',
        sets: [
          { weightKg: 80, reps: 8, completed: true },
          { weightKg: 85, reps: 6, completed: true },
        ],
      },
    ],
  },
  {
    routineName: 'Pull Day',
    durationSeconds: 3000,
    totalVolume: 3900,
    totalCompletedSets: 12,
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    exercises: [
      {
        exerciseId: 'ex-deadlift',
        exerciseName: 'Barbell Deadlift',
        primaryMuscle: 'Back',
        sets: [
          { weightKg: 120, reps: 5, completed: true },
        ],
      },
    ],
  },
  {
    routineName: 'Leg Day',
    durationSeconds: 3400,
    totalVolume: 4500,
    totalCompletedSets: 15,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    exercises: [
      {
        exerciseId: 'ex-squat',
        exerciseName: 'Barbell Squat',
        primaryMuscle: 'Quads',
        sets: [
          { weightKg: 100, reps: 6, completed: true },
        ],
      },
    ],
  },
]

const MOCK_OPTIMAL_RECOVERY: RecoveryEntry[] = [
  {
    date: new Date().toISOString(),
    sleepHours: 8.0,
    readinessScore: 88,
    soreness: 'Low',
  },
]

const MOCK_FATIGUED_RECOVERY: RecoveryEntry[] = [
  {
    date: new Date().toISOString(),
    sleepHours: 4.5,
    readinessScore: 42,
    soreness: 'Severe',
  },
]

describe('AI Fitness Command Center Service', () => {
  it('calculates today fitness status correctly with valid telemetry', () => {
    const status = calculateTodayFitnessStatus(
      MOCK_PROFILE,
      MOCK_WORKOUTS,
      MOCK_OPTIMAL_RECOVERY,
      2.0,
      3.0,
      { level: 5, rank: 'Fighter', totalXp: 1800, streak: 7 }
    )

    assert.equal(status.readinessScore, 88)
    assert.equal(status.readinessLabel, 'Optimal')
    assert.equal(status.hydration.percentage, 67)
    assert.equal(status.streakDays, 7)
    assert.equal(status.level, 5)
    assert.equal(status.rank, 'Fighter')
  })

  it('handles missing telemetry gracefully without NaN or runtime exceptions', () => {
    const status = calculateTodayFitnessStatus(
      null,
      [],
      [],
      0,
      0,
      { level: 1, rank: 'Rookie', totalXp: 0, streak: 0 }
    )

    assert.equal(status.readinessLabel, 'Unrecorded')
    assert.equal(status.hydration.percentage, 0)
    assert.equal(status.scheduledWorkout.status, 'scheduled')
  })

  it('correctly extracts personal records and estimates 1RM using Brzycki formula', () => {
    const prs = computePersonalRecords(MOCK_WORKOUTS)
    assert.ok(prs.length >= 3, 'Should discover PRs for Bench, Deadlift, and Squat')

    const bench = prs.find((p) => p.exerciseName === 'Barbell Bench Press')
    assert.ok(bench)
    assert.equal(bench.bestWeightKg, 85)
    assert.equal(bench.repsAtBestWeight, 6)
    // 85 * (36 / (37 - 6)) = 85 * (36 / 31) ≈ 99 kg
    assert.equal(bench.estimated1RmKg, 99)
    assert.equal(bench.isRecent, true)
  })

  it('detects high severity attention area when fatigue is elevated', () => {
    const status = calculateTodayFitnessStatus(
      MOCK_PROFILE,
      MOCK_WORKOUTS,
      MOCK_FATIGUED_RECOVERY,
      0.5,
      3.0,
      { level: 1, rank: 'Rookie', totalXp: 0, streak: 0 }
    )

    const areas = detectAttentionAreas(status, MOCK_WORKOUTS, MOCK_FATIGUED_RECOVERY)
    const fatigueAlert = areas.find((a) => a.category === 'recovery' && a.severity === 'high')
    assert.ok(fatigueAlert, 'Must flag high systemic fatigue')

    const hydrationAlert = areas.find((a) => a.category === 'hydration')
    assert.ok(hydrationAlert, 'Must flag lagging hydration')
  })

  it('never increases workout intensity when recovery data indicates fatigue', () => {
    const rec = generateAdaptiveWorkoutRecommendation(
      MOCK_PROFILE,
      MOCK_WORKOUTS,
      MOCK_FATIGUED_RECOVERY,
      'routine-push-day'
    )

    assert.equal(rec.recommendationType, 'recovery_day')
    assert.ok(rec.explanation.includes('soft-tissue injury risk') || rec.explanation.includes('acute sleep debt'))
    assert.equal(rec.volumeAdjustmentPercent, -100)
  })

  it('recommends progressive overload when readiness is optimal', () => {
    const rec = generateAdaptiveWorkoutRecommendation(
      MOCK_PROFILE,
      MOCK_WORKOUTS,
      MOCK_OPTIMAL_RECOVERY,
      'routine-push-day'
    )

    assert.equal(rec.recommendationType, 'train_as_planned')
    assert.ok(rec.title.includes('Progressive Overload') || rec.title.includes('Train as Planned'))
  })

  it('computes trend forecast points with explicit uncertainty bounds', () => {
    const points = computeTrendForecastPoints(MOCK_WORKOUTS, '30d')
    assert.ok(points.length >= 3, 'Should generate points from 3 historical sessions')

    const projectedPoint = points.find((p) => p.isProjected)
    assert.ok(projectedPoint, 'Should contain a forward projection point')
    assert.ok(projectedPoint.upperBound! > projectedPoint.forecastValue!)
    assert.ok(projectedPoint.lowerBound! < projectedPoint.forecastValue!)
  })

  it('deterministic AI Coach answers Indian meal queries matching vegetarian preference', () => {
    const res = generateDeterministicCoachResponse('Suggest high-protein Indian meals for muscle building', {
      profile: MOCK_PROFILE,
      workouts: MOCK_WORKOUTS,
      recovery: MOCK_OPTIMAL_RECOVERY,
      waterLoggedLiters: 2.0,
      waterTargetLiters: 3.0,
      activeStreak: 7,
      rpgLevel: 5,
      rpgRank: 'Fighter',
    })

    assert.equal(res.provider, 'rule_based')
    assert.ok(res.recommendation.length > 0)
    assert.ok(res.supportingData.length > 0)
    assert.ok(res.explanation.length > 0)
    assert.ok(res.nextAction.length > 0)
    assert.ok(res.limitations.length > 0)
    assert.ok(res.recommendation.toLowerCase().includes('paneer') || res.recommendation.toLowerCase().includes('soya') || res.recommendation.toLowerCase().includes('curd'))
  })
})
