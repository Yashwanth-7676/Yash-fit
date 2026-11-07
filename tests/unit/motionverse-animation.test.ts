import { describe, it, expect } from 'vitest'
import {
  MOTIONVERSE_EXERCISES,
  getMotionVerseExercise,
  calculateKinematicJoints,
} from '@/lib/motionverse/motionverseService'
import {
  ANATOMICAL_MUSCLES,
  getExerciseMuscleEngagement,
} from '@/lib/motionverse/muscleMapData'

describe('YashFit Feature #49 — MotionVerse AI Workout Animation Engine', () => {
  it('contains a complete library of at least 10 biomechanical exercises', () => {
    expect(MOTIONVERSE_EXERCISES.length).toBeGreaterThanOrEqual(10)

    const expectedExerciseIds = [
      'squat',
      'bench_press',
      'deadlift',
      'overhead_press',
      'push_up',
      'pull_up',
      'lunge',
      'bicep_curl',
      'barbell_row',
      'plank',
    ]

    for (const expectedId of expectedExerciseIds) {
      const ex = MOTIONVERSE_EXERCISES.find((e) => e.id === expectedId)
      expect(ex).toBeDefined()
      expect(ex?.name.length).toBeGreaterThan(0)
      expect(ex?.targetMuscles.primary.length).toBeGreaterThan(0)
      expect(ex?.phases.length).toBeGreaterThanOrEqual(1)
      expect(ex?.formCheckpoints.length).toBeGreaterThanOrEqual(1)
      expect(ex?.animeConfig).toBeDefined()
      expect(ex?.availableAngles.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('validates movement phase continuity and normalized boundaries', () => {
    for (const ex of MOTIONVERSE_EXERCISES) {
      expect(ex.phases.length).toBeGreaterThan(0)

      for (const phase of ex.phases) {
        expect(phase.phaseStartNorm).toBeGreaterThanOrEqual(0)
        expect(phase.phaseEndNorm).toBeLessThanOrEqual(1.0)
        expect(phase.phaseStartNorm).toBeLessThan(phase.phaseEndNorm)
        expect(phase.cue.length).toBeGreaterThan(5)
        expect(['inhale', 'exhale', 'brace', 'hold']).toContain(phase.breathing)
      }
    }
  })

  it('computes deterministic multi-angle kinematic joint positions for key lifts', () => {
    // 1. Squat (Side View)
    const squatLockout = calculateKinematicJoints('squat', 0.0, 'side', 'intermediate')
    const squatHole = calculateKinematicJoints('squat', 0.5, 'side', 'intermediate')

    expect(squatLockout.head.y).toBeLessThan(squatHole.head.y) // Head drops in hole
    expect(squatLockout.hipLeft.y).toBeLessThan(squatHole.hipLeft.y) // Hips descend
    expect(squatHole.jointAngles.kneeAngleDeg).toBeDefined()
    expect(squatHole.jointAngles.kneeAngleDeg!).toBeLessThan(squatLockout.jointAngles.kneeAngleDeg!)

    // 2. Bench Press (Side View)
    const benchTouch = calculateKinematicJoints('bench_press', 0.5, 'side', 'intermediate')
    const benchLockout = calculateKinematicJoints('bench_press', 0.0, 'side', 'intermediate')
    expect(benchTouch.barPathY!).toBeGreaterThan(benchLockout.barPathY!) // Lowering to chest
    expect(benchTouch.jointAngles.elbowFlexionDeg!).toBeLessThan(benchLockout.jointAngles.elbowFlexionDeg!)

    // 3. Deadlift (Side View)
    const deadliftFloor = calculateKinematicJoints('deadlift', 0.0, 'side', 'intermediate')
    const deadliftLockout = calculateKinematicJoints('deadlift', 0.5, 'side', 'intermediate')
    expect(deadliftFloor.barPathY!).toBeGreaterThan(deadliftLockout.barPathY!) // Bar is lower at floor than lockout
  })

  it('adjusts kinematic ranges according to user difficulty levels', () => {
    const beginnerSquat = calculateKinematicJoints('squat', 0.5, 'side', 'beginner')
    const advancedSquat = calculateKinematicJoints('squat', 0.5, 'side', 'advanced')

    // Advanced squat descends deeper than beginner squat
    expect(advancedSquat.hipLeft.y).toBeGreaterThan(beginnerSquat.hipLeft.y)
  })

  it('transforms coordinates across Front, Side, and Rear camera projections', () => {
    const sideView = calculateKinematicJoints('squat', 0.5, 'side')
    const frontView = calculateKinematicJoints('squat', 0.5, 'front')
    const rearView = calculateKinematicJoints('squat', 0.5, 'rear')

    expect(sideView).toBeDefined()
    expect(frontView).toBeDefined()
    expect(rearView).toBeDefined()

    // In front/rear view, left and right hips and knees spread symmetrically from center
    expect(frontView.hipLeft.x).toBeLessThan(150)
    expect(frontView.hipRight.x).toBeGreaterThan(150)
    expect(rearView.hipLeft.x).toBeLessThan(150)
    expect(rearView.hipRight.x).toBeGreaterThan(150)
  })

  it('maps anatomical muscle recruitment without fabricating synthetic percentages', () => {
    const squat = getMotionVerseExercise('squat')
    const engagement = getExerciseMuscleEngagement(
      squat.targetMuscles.primary,
      squat.targetMuscles.secondary,
      squat.targetMuscles.stabilizers
    )

    expect(engagement.length).toBeGreaterThan(0)

    const quads = engagement.find((m) => m.name.toLowerCase().includes('quadriceps'))
    expect(quads).toBeDefined()
    expect(quads?.role).toBe('agonist')

    const core = engagement.find((m) => m.name.toLowerCase().includes('core'))
    expect(core).toBeDefined()
    expect(core?.role).toBe('stabilizer')

    // Ensure every muscle definition exists in master anatomical map
    for (const m of engagement) {
      expect(ANATOMICAL_MUSCLES[m.muscleId]).toBeDefined()
      expect(m.functionDescription.length).toBeGreaterThan(10)
    }
  })

  it('contains anime hero persona configurations for all exercises', () => {
    for (const ex of MOTIONVERSE_EXERCISES) {
      expect(ex.animeConfig.characterName.length).toBeGreaterThan(0)
      expect(ex.animeConfig.heroTitle.length).toBeGreaterThan(0)
      expect(ex.animeConfig.specialTechnique.length).toBeGreaterThan(0)
      expect(ex.animeConfig.auraColor.startsWith('#')).toBe(true)
    }
  })

  it('falls back safely to default exercise when querying invalid ID', () => {
    const fallback = getMotionVerseExercise('non_existent_exercise_12345')
    expect(fallback).toBeDefined()
    expect(fallback.id).toBe(MOTIONVERSE_EXERCISES[0].id)
  })
})
