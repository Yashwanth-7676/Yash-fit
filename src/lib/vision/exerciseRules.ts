import type {
  SupportedVisionExercise,
  MovementPhase,
  JointAngles,
  FormFeedback,
  FormAnalysisResult,
  ExerciseFormConfig,
} from '@/types/pose'

export const EXERCISE_FORM_CONFIGS: Record<SupportedVisionExercise, ExerciseFormConfig> = {
  squat: {
    id: 'squat',
    name: 'Bodyweight / Goblet Squat',
    recommendedDistance: '6 - 8 feet',
    recommendedAngle: 'Side profile or 45° angle',
    cues: [
      'Hips descend below knees (parallel depth ≈ 90°)',
      'Keep chest elevated and spine neutral',
      'Knees track over mid-foot',
      'Full hip and knee extension at top (lockout > 160°)',
    ],
    criteria: {
      readyAngle: 160,
      targetDepthAngle: 95,
      minDepthTolerance: 110,
      maxLeanAngle: 45,
    },
  },
  push_up: {
    id: 'push_up',
    name: 'Standard Push-Up',
    recommendedDistance: '5 - 7 feet',
    recommendedAngle: 'Side view at floor level',
    cues: [
      'Elbows flex to at least 90° at bottom',
      'Straight line from heels through hips to crown (170° - 190°)',
      'Avoid sagging lower back or piking hips',
      'Press through chest to full elbow extension (lockout > 160°)',
    ],
    criteria: {
      readyAngle: 160,
      targetDepthAngle: 90,
      minDepthTolerance: 105,
    },
  },
  lunge: {
    id: 'lunge',
    name: 'Stationary / Forward Lunge',
    recommendedDistance: '6 - 8 feet',
    recommendedAngle: 'Side profile view',
    cues: [
      'Front knee flexes to 90° angle',
      'Rear knee lowers toward floor without hitting',
      'Keep torso upright without excessive forward lean',
      'Drive through front heel back to standing position',
    ],
    criteria: {
      readyAngle: 155,
      targetDepthAngle: 95,
      minDepthTolerance: 110,
      maxLeanAngle: 30,
    },
  },
  plank: {
    id: 'plank',
    name: 'Forearm Plank Hold',
    recommendedDistance: '5 - 7 feet',
    recommendedAngle: 'Direct side view',
    cues: [
      'Elbows directly beneath shoulders',
      'Neutral spine alignment: straight line from ears to heels',
      'Engage glutes and brace abdominal wall',
      'Steady nasal breathing without holding breath',
    ],
    criteria: {
      readyAngle: 180,
      targetDepthAngle: 180,
      minDepthTolerance: 20,
    },
  },
  bicep_curl: {
    id: 'bicep_curl',
    name: 'Dumbbell Bicep Curl',
    recommendedDistance: '5 - 7 feet',
    recommendedAngle: 'Front or 45° angle',
    cues: [
      'Elbows pinned securely at ribs',
      'Curl weight up until forearm nears bicep (elbow angle < 55°)',
      'Avoid swinging torso to generate momentum',
      'Lower weights with control to full extension (lockout > 155°)',
    ],
    criteria: {
      readyAngle: 155,
      targetDepthAngle: 55,
      minDepthTolerance: 75,
    },
  },
  shoulder_press: {
    id: 'shoulder_press',
    name: 'Overhead Shoulder Press',
    recommendedDistance: '5 - 7 feet',
    recommendedAngle: 'Front or 45° angle',
    cues: [
      'Start with weights at clavicle/shoulder level, elbows around 90°',
      'Press directly overhead to full arm lockout (>160°)',
      'Keep core braced and ribs down; avoid hyperextending lumbar spine',
      'Lower weights under control back to shoulder level',
    ],
    criteria: {
      readyAngle: 90,
      targetDepthAngle: 160,
      minDepthTolerance: 145,
      maxLeanAngle: 20,
    },
  },
}

export interface MovementTrackerState {
  currentPhase: MovementPhase
  lowestAngleReached: number
  highestAngleReached: number
  hitBottomDepth: boolean
  hasWarnedDepth: boolean
  repsCount: number
  partialRepsCount: number
}

export function createInitialTrackerState(_exercise: SupportedVisionExercise): MovementTrackerState {
  return {
    currentPhase: 'READY',
    lowestAngleReached: 180,
    highestAngleReached: 180,
    hitBottomDepth: false,
    hasWarnedDepth: false,
    repsCount: 0,
    partialRepsCount: 0,
  }
}

/**
 * Evaluates current frame joint angles against exercise rules and advances the rep counter state machine.
 */
export function analyzeMovementFrame(
  exercise: SupportedVisionExercise,
  angles: JointAngles,
  state: MovementTrackerState,
  isBodyFullyVisible: boolean
): { result: FormAnalysisResult; nextState: MovementTrackerState } {
  const config = EXERCISE_FORM_CONFIGS[exercise]
  const feedback: FormFeedback[] = []
  let repCompleted = false
  let isPartialRep = false
  let formScore = 95

  const nextState: MovementTrackerState = { ...state }

  // Check 1: Visibility
  if (!isBodyFullyVisible) {
    feedback.push({
      id: 'visibility_warning',
      message: 'Step back: full body not fully visible in camera frame.',
      severity: 'info',
      timestamp: Date.now(),
    })
    formScore -= 20
  }

  // EXERCISE-SPECIFIC EVALUATION
  switch (exercise) {
    case 'squat': {
      const knee = angles.kneeAngle
      const torso = angles.torsoAngle

      // Track peak inflection angle
      if (knee < nextState.lowestAngleReached) {
        nextState.lowestAngleReached = knee
      }

      // Check torso forward lean
      if (torso > (config.criteria.maxLeanAngle || 45)) {
        feedback.push({
          id: 'excessive_lean',
          message: 'Keep chest proud: excessive forward torso lean.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Spine',
        })
        formScore -= 15
      }

      // Rep state transitions: READY -> ECCENTRIC -> BOTTOM -> CONCENTRIC -> COMPLETED
      if (nextState.currentPhase === 'READY') {
        if (knee < config.criteria.readyAngle - 15) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = knee
          nextState.hitBottomDepth = false
          feedback.push({
            id: 'descending',
            message: 'Lowering: control the descent.',
            severity: 'good',
            timestamp: Date.now(),
          })
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (knee <= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'great_depth',
            message: 'Excellent depth! Hip crease reached parallel.',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (knee > nextState.lowestAngleReached + 15) {
          // Began standing up before hitting parallel depth
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (knee > config.criteria.targetDepthAngle + 10) {
          nextState.currentPhase = 'CONCENTRIC'
          feedback.push({
            id: 'driving_up',
            message: 'Drive through mid-foot to full lockout.',
            severity: 'good',
            timestamp: Date.now(),
          })
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (knee >= config.criteria.readyAngle - 10) {
          // Returned to top lockout
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            feedback.push({
              id: 'rep_confirmed',
              message: `Rep ${nextState.repsCount} Complete! Perfect depth.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            feedback.push({
              id: 'partial_rep',
              message: 'Partial rep: Squat deeper to parallel next rep.',
              severity: 'warning',
              timestamp: Date.now(),
            })
            formScore -= 30
          }
          // Reset cycle for next rep
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'push_up': {
      const elbow = angles.elbowAngle
      const spine = angles.spineAlignmentAngle ?? 180

      if (elbow < nextState.lowestAngleReached) {
        nextState.lowestAngleReached = elbow
      }

      // Check spine sagging / piking
      if (spine < 155) {
        feedback.push({
          id: 'hip_piking',
          message: 'Lower your hips: avoid piking upwards.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Core',
        })
        formScore -= 20
      } else if (spine > 195) {
        feedback.push({
          id: 'hip_sagging',
          message: 'Engage core: avoid lower back sagging.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Core',
        })
        formScore -= 20
      }

      // State machine for pushups
      if (nextState.currentPhase === 'READY') {
        if (elbow < config.criteria.readyAngle - 15) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = elbow
          nextState.hitBottomDepth = false
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (elbow <= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'pushup_depth_good',
            message: 'Chest depth reached (90° elbow). Press up!',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (elbow > nextState.lowestAngleReached + 15) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow > config.criteria.targetDepthAngle + 12) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            feedback.push({
              id: 'rep_good',
              message: `Rep ${nextState.repsCount} Complete! Full lockout.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            feedback.push({
              id: 'pushup_shallow',
              message: 'Shallow pushup: lower chest to floor level.',
              severity: 'warning',
              timestamp: Date.now(),
            })
            formScore -= 25
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'lunge': {
      const knee = angles.kneeAngle
      if (knee < nextState.lowestAngleReached) {
        nextState.lowestAngleReached = knee
      }

      if (nextState.currentPhase === 'READY') {
        if (knee < 145) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = knee
          nextState.hitBottomDepth = false
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (knee <= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'lunge_depth',
            message: 'Solid lunge depth: 90° front knee bend.',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (knee > nextState.lowestAngleReached + 12) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (knee > config.criteria.targetDepthAngle + 12) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (knee >= 148) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'bicep_curl': {
      const elbow = angles.elbowAngle
      if (elbow < nextState.lowestAngleReached) {
        nextState.lowestAngleReached = elbow
      }

      if (nextState.currentPhase === 'READY') {
        if (elbow < 135) {
          nextState.currentPhase = 'CONCENTRIC'
          nextState.lowestAngleReached = elbow
          nextState.hitBottomDepth = false
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (elbow <= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'curl_peak',
            message: 'Peak bicep contraction squeeze!',
            severity: 'good',
            timestamp: Date.now(),
          })
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow > config.criteria.targetDepthAngle + 15) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'shoulder_press': {
      const elbow = angles.elbowAngle
      const torso = angles.torsoAngle

      if (elbow > nextState.highestAngleReached) {
        nextState.highestAngleReached = elbow
      }

      if (torso > (config.criteria.maxLeanAngle || 20)) {
        feedback.push({
          id: 'excessive_arch',
          message: 'Avoid arching lower back. Brace your glutes and core.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Spine',
        })
        formScore -= 15
      }

      if (elbow >= config.criteria.targetDepthAngle) {
        nextState.hitBottomDepth = true
      }

      if (nextState.currentPhase === 'READY' || nextState.currentPhase === 'COMPLETED') {
        if (elbow > 115) {
          nextState.currentPhase = 'CONCENTRIC'
          nextState.highestAngleReached = elbow
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (elbow >= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          feedback.push({
            id: 'overhead_lockout',
            message: 'Full overhead lockout achieved. Lower with control.',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (elbow < nextState.highestAngleReached - 20 && !nextState.hitBottomDepth) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow <= 105) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
          }
          nextState.currentPhase = 'READY'
          nextState.highestAngleReached = 90
          nextState.hitBottomDepth = false
        } else if (elbow < 150) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (elbow <= 105) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
          }
          nextState.currentPhase = 'READY'
          nextState.highestAngleReached = 90
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'plank': {
      const spine = angles.spineAlignmentAngle ?? 180
      if (Math.abs(spine - 180) < 18) {
        feedback.push({
          id: 'plank_aligned',
          message: 'Spine aligned: solid core brace.',
          severity: 'good',
          timestamp: Date.now(),
        })
      } else {
        feedback.push({
          id: 'plank_misaligned',
          message: 'Keep body in a straight line from crown to heels.',
          severity: 'warning',
          timestamp: Date.now(),
        })
        formScore -= 25
      }
      break
    }
  }

  // Default neutral feedback if none generated
  if (feedback.length === 0) {
    feedback.push({
      id: 'steady',
      message: 'Movement on track. Maintain steady tempo.',
      severity: 'good',
      timestamp: Date.now(),
    })
  }

  return {
    result: {
      exercise,
      phase: nextState.currentPhase,
      angles,
      feedback,
      repCompleted,
      isPartialRep,
      formScore: Math.max(10, Math.min(100, formScore)),
      isBodyFullyVisible,
    },
    nextState,
  }
}

