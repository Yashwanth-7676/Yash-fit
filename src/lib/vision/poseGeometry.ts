import type { PoseLandmark, JointAngles } from '@/types/pose'

export const LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

// Skeletal bone connections for rendering
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Torso
  [LANDMARK_INDEX.LEFT_SHOULDER, LANDMARK_INDEX.RIGHT_SHOULDER],
  [LANDMARK_INDEX.LEFT_SHOULDER, LANDMARK_INDEX.LEFT_HIP],
  [LANDMARK_INDEX.RIGHT_SHOULDER, LANDMARK_INDEX.RIGHT_HIP],
  [LANDMARK_INDEX.LEFT_HIP, LANDMARK_INDEX.RIGHT_HIP],
  // Left Arm
  [LANDMARK_INDEX.LEFT_SHOULDER, LANDMARK_INDEX.LEFT_ELBOW],
  [LANDMARK_INDEX.LEFT_ELBOW, LANDMARK_INDEX.LEFT_WRIST],
  // Right Arm
  [LANDMARK_INDEX.RIGHT_SHOULDER, LANDMARK_INDEX.RIGHT_ELBOW],
  [LANDMARK_INDEX.RIGHT_ELBOW, LANDMARK_INDEX.RIGHT_WRIST],
  // Left Leg
  [LANDMARK_INDEX.LEFT_HIP, LANDMARK_INDEX.LEFT_KNEE],
  [LANDMARK_INDEX.LEFT_KNEE, LANDMARK_INDEX.LEFT_ANKLE],
  // Right Leg
  [LANDMARK_INDEX.RIGHT_HIP, LANDMARK_INDEX.RIGHT_KNEE],
  [LANDMARK_INDEX.RIGHT_KNEE, LANDMARK_INDEX.RIGHT_ANKLE],
]

/**
 * Calculates the internal angle (in degrees, 0 to 180) between three landmarks with joint B as vertex.
 */
export function calculateAngle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  if (!a || !b || !c) return 0
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)
  if (angle > 180.0) {
    angle = 360 - angle
  }
  return Math.round(angle)
}

/**
 * Calculates inclination angle of a vector (e.g. spine/torso) relative to true vertical (0 deg = straight upright).
 */
export function calculateVerticalAngle(top: PoseLandmark, bottom: PoseLandmark): number {
  if (!top || !bottom) return 0
  const dx = Math.abs(top.x - bottom.x)
  const dy = Math.abs(bottom.y - top.y)
  const radians = Math.atan2(dx, dy)
  return Math.round((radians * 180.0) / Math.PI)
}

/**
 * Calculates 2D Euclidean distance between two landmarks.
 */
export function calculateDistance(a: PoseLandmark, b: PoseLandmark): number {
  if (!a || !b) return 0
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Extracts comprehensive joint angles, bilateral metrics, and alignment from landmark array.
 */
export function extractJointAngles(landmarks: PoseLandmark[]): JointAngles | null {
  if (!landmarks || landmarks.length < 29) return null

  const lShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER]
  const rShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER]
  const lElbow = landmarks[LANDMARK_INDEX.LEFT_ELBOW]
  const rElbow = landmarks[LANDMARK_INDEX.RIGHT_ELBOW]
  const lWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST]
  const rWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST]
  const lHip = landmarks[LANDMARK_INDEX.LEFT_HIP]
  const rHip = landmarks[LANDMARK_INDEX.RIGHT_HIP]
  const lKnee = landmarks[LANDMARK_INDEX.LEFT_KNEE]
  const rKnee = landmarks[LANDMARK_INDEX.RIGHT_KNEE]
  const lAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE]
  const rAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE]

  if (!lShoulder || !rShoulder || !lHip || !rHip) return null

  // Calculate bilateral angles
  const leftKneeAngle = calculateAngle(lHip, lKnee, lAnkle)
  const rightKneeAngle = calculateAngle(rHip, rKnee, rAnkle)

  const leftHipAngle = calculateAngle(lShoulder, lHip, lKnee)
  const rightHipAngle = calculateAngle(rShoulder, rHip, rKnee)

  const leftElbowAngle = calculateAngle(lShoulder, lElbow, lWrist)
  const rightElbowAngle = calculateAngle(rShoulder, rElbow, rWrist)

  const leftShoulderAngle = calculateAngle(lElbow, lShoulder, lHip)
  const rightShoulderAngle = calculateAngle(rElbow, rShoulder, rHip)

  // Determine visibility-weighted side for primary 2D projection
  const leftVis = (lShoulder.visibility ?? 1) + (lHip.visibility ?? 1) + (lKnee.visibility ?? 1)
  const rightVis = (rShoulder.visibility ?? 1) + (rHip.visibility ?? 1) + (rKnee.visibility ?? 1)
  const useLeft = leftVis >= rightVis

  const primaryShoulder = useLeft ? lShoulder : rShoulder
  const primaryHip = useLeft ? lHip : rHip
  const primaryAnkle = useLeft ? lAnkle : rAnkle

  const kneeAngle = useLeft ? leftKneeAngle : rightKneeAngle
  const hipAngle = useLeft ? leftHipAngle : rightHipAngle
  const elbowAngle = useLeft ? leftElbowAngle : rightElbowAngle

  // Torso inclination relative to vertical
  const torsoAngle = calculateVerticalAngle(primaryShoulder, primaryHip)

  // Full spine/leg alignment angle
  const spineAlignmentAngle = calculateAngle(primaryShoulder, primaryHip, primaryAnkle)

  // Calculate Bilateral Symmetry (0 to 100%)
  const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle)
  const hipDiff = Math.abs(leftHipAngle - rightHipAngle)
  const elbowDiff = Math.abs(leftElbowAngle - rightElbowAngle)
  const avgBilateralDiff = (kneeDiff + hipDiff + elbowDiff) / 3
  const bilateralSymmetry = Math.max(0, Math.min(100, Math.round(100 - avgBilateralDiff * 1.5)))

  return {
    kneeAngle,
    hipAngle,
    elbowAngle,
    torsoAngle,
    spineAlignmentAngle,
    leftKneeAngle,
    rightKneeAngle,
    leftHipAngle,
    rightHipAngle,
    leftElbowAngle,
    rightElbowAngle,
    leftShoulderAngle,
    rightShoulderAngle,
    bilateralSymmetry,
  }
}

/**
 * Checks whether key movement landmarks meet minimal visibility thresholds.
 */
export function checkFullBodyVisibility(landmarks: PoseLandmark[]): boolean {
  if (!landmarks || landmarks.length < 29) return false
  const keyIndices = [
    LANDMARK_INDEX.LEFT_SHOULDER,
    LANDMARK_INDEX.RIGHT_SHOULDER,
    LANDMARK_INDEX.LEFT_HIP,
    LANDMARK_INDEX.RIGHT_HIP,
    LANDMARK_INDEX.LEFT_KNEE,
    LANDMARK_INDEX.RIGHT_KNEE,
    LANDMARK_INDEX.LEFT_ANKLE,
    LANDMARK_INDEX.RIGHT_ANKLE,
  ]

  let visibleCount = 0
  for (const idx of keyIndices) {
    const pt = landmarks[idx]
    if (pt && (pt.visibility === undefined || pt.visibility > 0.4)) {
      if (pt.x >= 0.01 && pt.x <= 0.99 && pt.y >= 0.01 && pt.y <= 0.99) {
        visibleCount++
      }
    }
  }

  return visibleCount >= 5
}

/**
 * Computes average confidence score of the current pose detection (0 to 1).
 */
export function calculatePoseConfidence(landmarks: PoseLandmark[]): number {
  if (!landmarks || landmarks.length < 29) return 0
  const keyIndices = [
    LANDMARK_INDEX.LEFT_SHOULDER,
    LANDMARK_INDEX.RIGHT_SHOULDER,
    LANDMARK_INDEX.LEFT_ELBOW,
    LANDMARK_INDEX.RIGHT_ELBOW,
    LANDMARK_INDEX.LEFT_WRIST,
    LANDMARK_INDEX.RIGHT_WRIST,
    LANDMARK_INDEX.LEFT_HIP,
    LANDMARK_INDEX.RIGHT_HIP,
    LANDMARK_INDEX.LEFT_KNEE,
    LANDMARK_INDEX.RIGHT_KNEE,
    LANDMARK_INDEX.LEFT_ANKLE,
    LANDMARK_INDEX.RIGHT_ANKLE,
  ]

  let totalVis = 0
  for (const idx of keyIndices) {
    totalVis += landmarks[idx]?.visibility ?? 0.85
  }
  return Number((totalVis / keyIndices.length).toFixed(2))
}

/**
 * Checks for Knee Valgus (knees collapsing inward).
 * Evaluates frontal view landmarks: distance between knees vs distance between hips & ankles.
 */
export function detectKneeValgus(landmarks: PoseLandmark[]): { isValgus: boolean; cue: string | null } {
  if (!landmarks || landmarks.length < 29) return { isValgus: false, cue: null }

  const lHip = landmarks[LANDMARK_INDEX.LEFT_HIP]
  const rHip = landmarks[LANDMARK_INDEX.RIGHT_HIP]
  const lKnee = landmarks[LANDMARK_INDEX.LEFT_KNEE]
  const rKnee = landmarks[LANDMARK_INDEX.RIGHT_KNEE]
  const lAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE]
  const rAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE]

  if (!lHip || !rHip || !lKnee || !rKnee || !lAnkle || !rAnkle) {
    return { isValgus: false, cue: null }
  }

  const hipWidth = Math.abs(rHip.x - lHip.x)
  const kneeWidth = Math.abs(rKnee.x - lKnee.x)
  const ankleWidth = Math.abs(rAnkle.x - lAnkle.x)

  // Only evaluate when facing camera (hips and ankles spaced horizontally)
  if (hipWidth > 0.08 && ankleWidth > 0.08) {
    if (kneeWidth < hipWidth * 0.72) {
      return {
        isValgus: true,
        cue: 'Push your knees outward over your mid-toes',
      }
    }
  }

  return { isValgus: false, cue: null }
}
