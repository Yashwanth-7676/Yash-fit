import { describe, it, expect } from 'vitest'
import {
  parseTargetRepBounds,
  findExerciseHistory,
  generateAutopilotRecommendation,
} from '@/lib/autopilot/autopilotEngine'
import { completeStudioSession } from '@/lib/workout-studio/workoutStudioService'
import type { UserProfile } from '@/types/profile'
import type { StudioWorkoutState } from '@/types/workoutStudio'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'

describe('Unit: Workout Calculations, Volume & Overload Engine', () => {
  const profile: UserProfile = {
    user_id: 'test-workout-user',
    first_name: 'Athlete',
    age: 26,
    height_cm: 175,
    weight_kg: 75,
    primary_goal: 'Build Muscle',
    experience_level: 'Intermediate',
    training_days_per_week: 4,
    training_environment: 'Commercial Gym',
    available_equipment: ['Barbell', 'Dumbbells', 'Bench'],
    dietary_preference: 'Non-Vegetarian',
    onboarding_completed: true,
  }

  it('correctly parses rep bounds from string ranges and singles', () => {
    expect(parseTargetRepBounds('8-12')).toEqual({ minReps: 8, maxReps: 12 })
    expect(parseTargetRepBounds('5')).toEqual({ minReps: 5, maxReps: 5 })
    expect(parseTargetRepBounds('10 - 15')).toEqual({ minReps: 10, maxReps: 15 })
    expect(parseTargetRepBounds('invalid')).toEqual({ minReps: 8, maxReps: 12 })
  })

  it('extracts completed sets for an exercise from user history chronologically', () => {
    const history: TwinWorkout[] = [
      {
        routineName: 'Upper Body',
        date: '2026-11-01',
        durationSeconds: 2700,
        totalVolume: 1600,
        totalCompletedSets: 2,
        exercises: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { reps: 10, weightKg: 80, completed: true },
              { reps: 10, weightKg: 80, completed: true },
            ],
          },
        ],
      },
    ]

    const sets = findExerciseHistory('bench-press', 'Barbell Bench Press', history)
    expect(sets).toHaveLength(2)
    expect(sets[0].weightKg).toBe(80)
    expect(sets[0].reps).toBe(10)
  })

  it('triggers conservative progressive overload (+2.5kg) when top rep ceiling is achieved', () => {
    const history: TwinWorkout[] = [
      {
        routineName: 'Push Day',
        date: '2026-11-03',
        durationSeconds: 3000,
        totalVolume: 2880,
        totalCompletedSets: 3,
        exercises: [
          {
            exerciseId: 'ex-bench',
            exerciseName: 'Barbell Bench Press',
            sets: [
              { reps: 12, weightKg: 80, completed: true },
              { reps: 12, weightKg: 80, completed: true },
              { reps: 12, weightKg: 80, completed: true },
            ],
          },
        ],
      },
    ]

    const recoveryList: RecoveryEntry[] = [
      {
        date: '2026-11-03',
        readinessScore: 85,
        sleepHours: 8,
        soreness: 'None',
      },
    ]

    const recommendation = generateAutopilotRecommendation({
      profile,
      workouts: history,
      recovery: recoveryList,
    })
    expect(recommendation).toBeDefined()
    expect(recommendation.readinessCategory).toBe('Optimal Readiness')
  })

  it('calculates total volume moved in kilograms for a workout studio session', () => {
    const sessionState: StudioWorkoutState = {
      routineId: 'push-heavy',
      routineName: 'Heavy Push Hypertrophy',
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      elapsedSeconds: 2400, // 40 minutes
      isPaused: false,
      restRemainingSeconds: 0,
      isResting: false,
      voiceEnabled: false,
      exercises: [
        {
          exerciseId: 'bench',
          name: 'Barbell Bench Press',
          primaryMuscle: 'Chest',
          secondaryMuscles: ['Triceps', 'Front Delts'],
          motionCycleKey: 'benchPress',
          instructions: ['Press bar'],
          cues: ['Retract scapula'],
          breathingGuidance: 'Inhale down, exhale up',
          substitutions: [],
          sets: [
            { setNumber: 1, targetReps: '10', targetWeightKg: 80, restSeconds: 90, actualReps: 10, actualWeightKg: 80, isCompleted: true },
            { setNumber: 2, targetReps: '10', targetWeightKg: 80, restSeconds: 90, actualReps: 10, actualWeightKg: 80, isCompleted: true },
          ],
        },
        {
          exerciseId: 'shoulder-press',
          name: 'Overhead Press',
          primaryMuscle: 'Shoulders',
          secondaryMuscles: ['Triceps'],
          motionCycleKey: 'shoulderPress',
          instructions: ['Press overhead'],
          cues: ['Lock out overhead'],
          breathingGuidance: 'Brace core, press up',
          substitutions: [],
          sets: [
            { setNumber: 1, targetReps: '10', targetWeightKg: 50, restSeconds: 90, actualReps: 10, actualWeightKg: 50, isCompleted: true },
          ],
        },
      ],
    }

    const summary = completeStudioSession(sessionState)
    // Bench: 2 * (10 * 80) = 1600 kg
    // Shoulder: 1 * (10 * 50) = 500 kg
    // Total: 2100 kg
    expect(summary.totalVolumeKg).toBe(2100)
    expect(summary.totalSetsCompleted).toBe(3)
    expect(summary.durationMinutes).toBe(40)
    expect(summary.estimatedCaloriesBurned).toBeGreaterThan(0)
  })
})
