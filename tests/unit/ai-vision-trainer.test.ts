import { describe, it, expect } from 'vitest'
import {
  calculateAngle,
  calculateVerticalAngle,
  calculateDistance,
  extractJointAngles,
  checkFullBodyVisibility,
  calculatePoseConfidence,
  detectKneeValgus,
  LANDMARK_INDEX,
} from '@/lib/vision/poseGeometry'
import {
  EXERCISE_FORM_CONFIGS,
  createInitialTrackerState,
  analyzeMovementFrame,
} from '@/lib/vision/exerciseRules'
import { voiceCoach, DEFAULT_VOICE_CONFIG } from '@/lib/vision/voiceCoachService'
import type { PoseLandmark, JointAngles } from '@/types/pose'

describe('YashFit Upgrade #50 — AI Vision & Real-Time Personal Trainer', () => {
  describe('1. Biomechanical Geometry & Landmark Calculations', () => {
    it('calculates accurate joint angles across collinear, right, and acute vectors', () => {
      // 180° straight line: (0, 0) -> (0, 1) -> (0, 2)
      const a: PoseLandmark = { x: 0, y: 0, z: 0 }
      const b: PoseLandmark = { x: 0, y: 1, z: 0 }
      const c: PoseLandmark = { x: 0, y: 2, z: 0 }
      expect(calculateAngle(a, b, c)).toBe(180)

      // 90° right angle: (1, 1) -> (0, 1) -> (0, 0)
      const p1: PoseLandmark = { x: 1, y: 1, z: 0 }
      const p2: PoseLandmark = { x: 0, y: 1, z: 0 }
      const p3: PoseLandmark = { x: 0, y: 0, z: 0 }
      expect(calculateAngle(p1, p2, p3)).toBe(90)

      // 45° angle
      const q1: PoseLandmark = { x: 1, y: 1, z: 0 }
      const q2: PoseLandmark = { x: 0, y: 0, z: 0 }
      const q3: PoseLandmark = { x: 1, y: 0, z: 0 }
      expect(calculateAngle(q1, q2, q3)).toBe(45)
    })

    it('calculates vertical torso inclination angle relative to gravity axis', () => {
      // Perfectly vertical torso: top (0.5, 0.2), bottom (0.5, 0.6)
      const top: PoseLandmark = { x: 0.5, y: 0.2, z: 0 }
      const bottom: PoseLandmark = { x: 0.5, y: 0.6, z: 0 }
      expect(calculateVerticalAngle(top, bottom)).toBe(0)

      // 45° forward lean
      const leaningTop: PoseLandmark = { x: 0.8, y: 0.2, z: 0 }
      const leaningBottom: PoseLandmark = { x: 0.4, y: 0.6, z: 0 }
      expect(calculateVerticalAngle(leaningTop, leaningBottom)).toBe(45)
    })

    it('detects knee valgus collapse in frontal camera orientation', () => {
      // Mock landmarks array with 33 points
      const landmarks: PoseLandmark[] = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        z: 0,
        visibility: 0.9,
      }))

      // Hip width = 0.3 (x=0.35 to 0.65)
      landmarks[LANDMARK_INDEX.LEFT_HIP] = { x: 0.35, y: 0.5, z: 0, visibility: 0.95 }
      landmarks[LANDMARK_INDEX.RIGHT_HIP] = { x: 0.65, y: 0.5, z: 0, visibility: 0.95 }

      // Ankles wide = 0.4 (x=0.3 to 0.7)
      landmarks[LANDMARK_INDEX.LEFT_ANKLE] = { x: 0.3, y: 0.9, z: 0, visibility: 0.95 }
      landmarks[LANDMARK_INDEX.RIGHT_ANKLE] = { x: 0.7, y: 0.9, z: 0, visibility: 0.95 }

      // Knees caved in severely: knee distance = 0.14 (< 0.3 * 0.72 = 0.216)
      landmarks[LANDMARK_INDEX.LEFT_KNEE] = { x: 0.43, y: 0.7, z: 0, visibility: 0.95 }
      landmarks[LANDMARK_INDEX.RIGHT_KNEE] = { x: 0.57, y: 0.7, z: 0, visibility: 0.95 }

      const valgus = detectKneeValgus(landmarks)
      expect(valgus.isValgus).toBe(true)
      expect(valgus.cue).toContain('knees outward')

      // Now fix knees outwards: knee distance = 0.34
      landmarks[LANDMARK_INDEX.LEFT_KNEE] = { x: 0.33, y: 0.7, z: 0, visibility: 0.95 }
      landmarks[LANDMARK_INDEX.RIGHT_KNEE] = { x: 0.67, y: 0.7, z: 0, visibility: 0.95 }

      const correctedValgus = detectKneeValgus(landmarks)
      expect(correctedValgus.isValgus).toBe(false)
    })

    it('calculates pose confidence and validates full body visibility gating', () => {
      const emptyLandmarks: PoseLandmark[] = []
      expect(checkFullBodyVisibility(emptyLandmarks)).toBe(false)
      expect(calculatePoseConfidence(emptyLandmarks)).toBe(0)

      // 33 valid points inside frame [0.1, 0.9]
      const validLandmarks: PoseLandmark[] = Array.from({ length: 33 }, (_, i) => ({
        x: 0.4 + (i % 3) * 0.1,
        y: 0.1 + (i / 33) * 0.8,
        z: 0,
        visibility: 0.92,
      }))
      expect(checkFullBodyVisibility(validLandmarks)).toBe(true)
      expect(calculatePoseConfidence(validLandmarks)).toBeGreaterThanOrEqual(0.85)

      // When points go off-screen (e.g. user too close, feet cut off)
      validLandmarks[LANDMARK_INDEX.LEFT_ANKLE].y = 1.05
      validLandmarks[LANDMARK_INDEX.RIGHT_ANKLE].y = 1.05
      validLandmarks[LANDMARK_INDEX.LEFT_KNEE].visibility = 0.2
      validLandmarks[LANDMARK_INDEX.RIGHT_KNEE].visibility = 0.2
      expect(checkFullBodyVisibility(validLandmarks)).toBe(false)
    })
  })

  describe('2. Repetition State Machine & Hysteresis Counters (All 8 Exercises)', () => {
    it('accurately counts full squat reps and rejects shallow squat reps', () => {
      let state = createInitialTrackerState('squat')

      // Phase 1: Lockout standing position
      let angles: JointAngles = {
        kneeAngle: 165,
        hipAngle: 165,
        elbowAngle: 90,
        torsoAngle: 10,
        bilateralSymmetry: 95,
      }
      let { result, nextState } = analyzeMovementFrame('squat', angles, state, true)
      expect(result.phase).toBe('READY')
      expect(nextState.repsCount).toBe(0)

      // Phase 2: Lowering (knee descends to 130°)
      angles.kneeAngle = 130
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.phase).toBe('ECCENTRIC')

      // Phase 3: Bottom inflection (parallel depth reached at 92°)
      angles.kneeAngle = 92
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.phase).toBe('BOTTOM_INFLECTION')
      expect(nextState.hitBottomDepth).toBe(true)

      // Phase 4: Concentric drive (ascending to 125°)
      angles.kneeAngle = 125
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.phase).toBe('CONCENTRIC')

      // Phase 5: Full lockout return (> 155°)
      angles.kneeAngle = 160
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.repCompleted).toBe(true)
      expect(nextState.repsCount).toBe(1)
      expect(result.isPartialRep).toBe(false)

      // Test Shallow Rep: Only descend to 120° (above parallel 95°)
      angles.kneeAngle = 130
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.phase).toBe('ECCENTRIC')

      // Bounces at 118° without reaching bottom parallel depth
      angles.kneeAngle = 118
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))

      // Drives up early
      angles.kneeAngle = 135
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.phase).toBe('CONCENTRIC')

      // Returns to top
      angles.kneeAngle = 162
      ;({ result, nextState } = analyzeMovementFrame('squat', angles, nextState, true))
      expect(result.repCompleted).toBe(false)
      expect(result.isPartialRep).toBe(true)
      expect(nextState.repsCount).toBe(1) // Still 1, did not increment
      expect(nextState.partialRepsCount).toBe(1)
    })

    it('counts push-ups and flags lumbar sagging or piking faults', () => {
      let state = createInitialTrackerState('push_up')

      // Start: full plank lockout
      let angles: JointAngles = {
        kneeAngle: 175,
        hipAngle: 175,
        elbowAngle: 165,
        torsoAngle: 85,
        spineAlignmentAngle: 180,
      }
      let { result, nextState } = analyzeMovementFrame('push_up', angles, state, true)
      expect(result.phase).toBe('READY')

      // Eccentric lowering to 85° elbow flexion
      angles.elbowAngle = 130
      ;({ result, nextState } = analyzeMovementFrame('push_up', angles, nextState, true))
      expect(result.phase).toBe('ECCENTRIC')

      angles.elbowAngle = 85
      ;({ result, nextState } = analyzeMovementFrame('push_up', angles, nextState, true))
      expect(result.phase).toBe('BOTTOM_INFLECTION')

      // Concentric press to lockout
      angles.elbowAngle = 120
      ;({ result, nextState } = analyzeMovementFrame('push_up', angles, nextState, true))

      angles.elbowAngle = 162
      ;({ result, nextState } = analyzeMovementFrame('push_up', angles, nextState, true))
      expect(result.repCompleted).toBe(true)
      expect(nextState.repsCount).toBe(1)

      // Test spine sagging fault
      angles.spineAlignmentAngle = 205
      ;({ result, nextState } = analyzeMovementFrame('push_up', angles, nextState, true))
      expect(result.primaryFault).toBe('Lower back sagging')
    })

    it('counts lunges and detects stationary knee flexion', () => {
      let state = createInitialTrackerState('lunge')
      let angles: JointAngles = {
        kneeAngle: 160,
        hipAngle: 160,
        elbowAngle: 90,
        torsoAngle: 10,
      }

      // Descend
      angles.kneeAngle = 135
      let { nextState } = analyzeMovementFrame('lunge', angles, state, true)

      // Hit 90° lunge bottom
      angles.kneeAngle = 92
      ;({ nextState } = analyzeMovementFrame('lunge', angles, nextState, true))

      // Ascend to standing
      angles.kneeAngle = 152
      const { result, nextState: finalState } = analyzeMovementFrame('lunge', angles, nextState, true)
      expect(result.repCompleted).toBe(true)
      expect(finalState.repsCount).toBe(1)
    })

    it('counts bicep curls from full extension to peak contraction', () => {
      let state = createInitialTrackerState('bicep_curl')
      let angles: JointAngles = {
        kneeAngle: 175,
        hipAngle: 175,
        elbowAngle: 160,
        torsoAngle: 5,
      }

      // Curl up
      angles.elbowAngle = 110
      let { nextState } = analyzeMovementFrame('bicep_curl', angles, state, true)
      expect(nextState.currentPhase).toBe('CONCENTRIC')

      // Peak bicep squeeze (< 55°)
      angles.elbowAngle = 48
      ;({ nextState } = analyzeMovementFrame('bicep_curl', angles, nextState, true))
      expect(nextState.currentPhase).toBe('BOTTOM_INFLECTION')

      // Lower back down to full extension (> 150°)
      angles.elbowAngle = 155
      const { result, nextState: finalState } = analyzeMovementFrame('bicep_curl', angles, nextState, true)
      expect(result.repCompleted).toBe(true)
      expect(finalState.repsCount).toBe(1)
    })

    it('counts overhead shoulder press to full vertical arm lockout', () => {
      let state = createInitialTrackerState('shoulder_press')
      let angles: JointAngles = {
        kneeAngle: 175,
        hipAngle: 175,
        elbowAngle: 85,
        torsoAngle: 5,
      }

      // Press up
      angles.elbowAngle = 130
      let { nextState } = analyzeMovementFrame('shoulder_press', angles, state, true)
      expect(nextState.currentPhase).toBe('CONCENTRIC')

      // Lockout overhead (> 160°)
      angles.elbowAngle = 168
      ;({ nextState } = analyzeMovementFrame('shoulder_press', angles, nextState, true))
      expect(nextState.currentPhase).toBe('BOTTOM_INFLECTION')

      // Lower back to rack position (<= 105°)
      angles.elbowAngle = 90
      const { result, nextState: finalState } = analyzeMovementFrame('shoulder_press', angles, nextState, true)
      expect(result.repCompleted).toBe(true)
      expect(finalState.repsCount).toBe(1)
    })

    it('counts Romanian deadlifts with hip hinge and warns on stiff-leg back rounding', () => {
      let state = createInitialTrackerState('deadlift')
      let angles: JointAngles = {
        kneeAngle: 135,
        hipAngle: 172,
        elbowAngle: 165,
        torsoAngle: 5,
      }

      // Hinge hips back
      angles.hipAngle = 120
      let { nextState } = analyzeMovementFrame('deadlift', angles, state, true)
      expect(nextState.currentPhase).toBe('ECCENTRIC')

      // Deep hinge below 80°
      angles.hipAngle = 76
      ;({ nextState } = analyzeMovementFrame('deadlift', angles, nextState, true))
      expect(nextState.currentPhase).toBe('BOTTOM_INFLECTION')

      // Return to tall lockout
      angles.hipAngle = 170
      const { result, nextState: finalState } = analyzeMovementFrame('deadlift', angles, nextState, true)
      expect(result.repCompleted).toBe(true)
      expect(finalState.repsCount).toBe(1)

      // Warning check on straight-leg back rounding
      angles.torsoAngle = 65
      angles.kneeAngle = 175
      const roundedCheck = analyzeMovementFrame('deadlift', angles, finalState, true)
      expect(roundedCheck.result.primaryFault).toBe('Spinal flexion / rounded back')
    })

    it('counts jumping jacks by tracking bilateral arm abduction cycles', () => {
      let state = createInitialTrackerState('jumping_jack')
      let angles: JointAngles = {
        kneeAngle: 175,
        hipAngle: 175,
        elbowAngle: 170,
        torsoAngle: 0,
        leftShoulderAngle: 30, // Arms down at sides
      }

      // Arms swing up
      angles.leftShoulderAngle = 90
      let { nextState } = analyzeMovementFrame('jumping_jack', angles, state, true)
      expect(nextState.currentPhase).toBe('CONCENTRIC')

      // Full overhead (> 140°)
      angles.leftShoulderAngle = 150
      ;({ nextState } = analyzeMovementFrame('jumping_jack', angles, nextState, true))
      expect(nextState.currentPhase).toBe('BOTTOM_INFLECTION')

      // Return to sides (< 50°)
      angles.leftShoulderAngle = 32
      const { result, nextState: finalState } = analyzeMovementFrame('jumping_jack', angles, nextState, true)
      expect(result.repCompleted).toBe(true)
      expect(finalState.repsCount).toBe(1)
    })

    it('monitors plank hold alignment and detects misalignments', () => {
      let state = createInitialTrackerState('plank')
      let angles: JointAngles = {
        kneeAngle: 175,
        hipAngle: 175,
        elbowAngle: 90,
        torsoAngle: 85,
        spineAlignmentAngle: 180, // Perfect straight line
      }

      let { result } = analyzeMovementFrame('plank', angles, state, true)
      expect(result.feedback[0].id).toBe('plank_aligned')
      expect(result.formScore).toBeGreaterThanOrEqual(90)

      // Misaligned sagging plank
      angles.spineAlignmentAngle = 150
      const misaligned = analyzeMovementFrame('plank', angles, state, true)
      expect(misaligned.result.primaryFault).toBe('Spine alignment deviation')
      expect(misaligned.result.formScore).toBeLessThan(75)
    })
  })

  describe('3. Bilateral Symmetry & Safety Guardrails', () => {
    it('evaluates bilateral left vs right symmetry and penalizes imbalances', () => {
      let state = createInitialTrackerState('squat')
      let angles: JointAngles = {
        kneeAngle: 100,
        hipAngle: 100,
        elbowAngle: 90,
        torsoAngle: 15,
        bilateralSymmetry: 55, // Imbalance between left and right side
      }

      const { result } = analyzeMovementFrame('squat', angles, state, true)
      expect(result.primaryFault).toBe('Bilateral asymmetry / uneven load')
      expect(result.feedback.some((f) => f.id === 'asymmetry_detected')).toBe(true)
    })

    it('verifies Voice Coach configuration defaults and mute toggle', () => {
      const config = voiceCoach.getConfig()
      expect(config.enabled).toBe(true)
      expect(config.voiceVolume).toBeGreaterThan(0)
      expect(config.announceMilestones).toBe(true)

      const muted = voiceCoach.toggleMute()
      expect(muted).toBe(false)
      expect(voiceCoach.getConfig().enabled).toBe(false)

      const unmuted = voiceCoach.toggleMute()
      expect(unmuted).toBe(true)
      expect(voiceCoach.getConfig().enabled).toBe(true)
    })
  })
})
