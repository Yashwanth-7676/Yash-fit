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
  const dx = Math.abs(top.x - bottom.x)
  const dy = Math.abs(bottom.y - top.y)
  const radians = Math.atan2(dx, dy)
  return Math.round((radians * 180.0) / Math.PI)
}

/**
 * Extracts key joint angles for posture evaluation from landmark array.
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

  // Determine which side is more visible / closer to camera based on visibility
  const leftVis = (lShoulder.visibility ?? 1) + (lHip.visibility ?? 1) + (lKnee.visibility ?? 1)
  const rightVis = (rShoulder.visibility ?? 1) + (rHip.visibility ?? 1) + (rKnee.visibility ?? 1)
  const useLeft = leftVis >= rightVis

  const shoulder = useLeft ? lShoulder : rShoulder
  const elbow = useLeft ? lElbow : rElbow
  const wrist = useLeft ? lWrist : rWrist
  const hip = useLeft ? lHip : rHip
  const knee = useLeft ? lKnee : rKnee
  const ankle = useLeft ? lAnkle : rAnkle

  const kneeAngle = calculateAngle(hip, knee, ankle)
  const hipAngle = calculateAngle(shoulder, hip, knee)
  const elbowAngle = calculateAngle(shoulder, elbow, wrist)
  const torsoAngle = calculateVerticalAngle(shoulder, hip)
  const spineAlignmentAngle = calculateAngle(shoulder, hip, ankle)

  return {
    kneeAngle,
    hipAngle,
    elbowAngle,
    torsoAngle,
    spineAlignmentAngle,
  }
}

/**
 * Checks whether core landmarks are sufficiently visible in the camera frame.
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
    if (pt && (pt.visibility === undefined || pt.visibility > 0.45)) {
      if (pt.x >= 0.02 && pt.x <= 0.98 && pt.y >= 0.02 && pt.y <= 0.98) {
        visibleCount++
      }
    }
  }

  return visibleCount >= 6
}

