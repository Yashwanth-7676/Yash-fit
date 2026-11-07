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
      'Knees track over mid-foot without caving in',
      'Full hip and knee extension at top (lockout > 160°)',
    ],
    criteria: {
      readyAngle: 160,
      targetDepthAngle: 95,
      minDepthTolerance: 110,
      maxLeanAngle: 45,
      hysteresisBuffer: 10,
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
      hysteresisBuffer: 10,
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
      hysteresisBuffer: 10,
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
      hysteresisBuffer: 5,
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
      hysteresisBuffer: 10,
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
      hysteresisBuffer: 10,
    },
  },
  deadlift: {
    id: 'deadlift',
    name: 'Barbell / Dumbbell Romanian Deadlift',
    recommendedDistance: '6 - 8 feet',
    recommendedAngle: 'Strict side view (90°)',
    cues: [
      'Hinge hips backwards with soft knees',
      'Maintain a neutral, flat spine with shoulder blades pinned back',
      'Lower bar to mid-shin level (hip hinge angle < 80°)',
      'Drive hips forward and squeeze glutes at top lockout (> 165°)',
    ],
    criteria: {
      readyAngle: 165,
      targetDepthAngle: 80,
      minDepthTolerance: 100,
      maxLeanAngle: 60,
      hysteresisBuffer: 10,
    },
  },
  jumping_jack: {
    id: 'jumping_jack',
    name: 'Dynamic Jumping Jacks',
    recommendedDistance: '6 - 9 feet',
    recommendedAngle: 'Front facing camera',
    cues: [
      'Start standing with arms at sides and feet together',
      'Jump spreading legs while raising arms fully overhead (> 140°)',
      'Spring off balls of feet with rhythm',
      'Return arms to sides and feet together to complete each rep',
    ],
    criteria: {
      readyAngle: 35,
      targetDepthAngle: 140,
      minDepthTolerance: 120,
      hysteresisBuffer: 15,
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
  lastRepTimestamp: number
  repStartTimestamp: number
  holdDurationSeconds: number
  lastPlankCheckTime: number
  activeFaults: string[]
}

export function createInitialTrackerState(exercise: SupportedVisionExercise): MovementTrackerState {
  const initialAngle = exercise === 'shoulder_press' || exercise === 'jumping_jack' ? 35 : 180
  return {
    currentPhase: 'READY',
    lowestAngleReached: initialAngle,
    highestAngleReached: initialAngle,
    hitBottomDepth: false,
    hasWarnedDepth: false,
    repsCount: 0,
    partialRepsCount: 0,
    lastRepTimestamp: Date.now(),
    repStartTimestamp: Date.now(),
    holdDurationSeconds: 0,
    lastPlankCheckTime: Date.now(),
    activeFaults: [],
  }
}

/**
 * Evaluates current frame joint angles against biomechanical rules and advances the hysteresis rep counter.
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
  let primaryFault: string | null = null

  const nextState: MovementTrackerState = {
    ...state,
    activeFaults: [...state.activeFaults],
  }

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

  // Check 2: Bilateral symmetry if available
  if (angles.bilateralSymmetry !== undefined && angles.bilateralSymmetry < 70) {
    feedback.push({
      id: 'asymmetry_detected',
      message: 'Asymmetry detected: distribute weight evenly between left and right sides.',
      severity: 'warning',
      timestamp: Date.now(),
      joint: 'Balance',
    })
    formScore -= 15
    primaryFault = 'Bilateral asymmetry / uneven load'
    if (!nextState.activeFaults.includes(primaryFault)) {
      nextState.activeFaults.push(primaryFault)
    }
  }

  // EXERCISE-SPECIFIC EVALUATION
  switch (exercise) {
    case 'squat': {
      const knee = angles.kneeAngle
      const torso = angles.torsoAngle

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
        primaryFault = 'Excessive torso lean'
        if (!nextState.activeFaults.includes(primaryFault)) {
          nextState.activeFaults.push(primaryFault)
        }
      }

      // Rep state transitions with hysteresis
      if (nextState.currentPhase === 'READY') {
        if (knee < config.criteria.readyAngle - 15) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = knee
          nextState.hitBottomDepth = false
          nextState.repStartTimestamp = Date.now()
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
        } else if (knee > nextState.lowestAngleReached + (config.criteria.hysteresisBuffer || 12)) {
          // Began standing up before hitting parallel depth
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (knee >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'rep_confirmed',
              message: `Rep ${nextState.repsCount} Complete! Perfect depth.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        } else if (knee > config.criteria.targetDepthAngle + (config.criteria.hysteresisBuffer || 10)) {
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
            nextState.lastRepTimestamp = Date.now()
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
            primaryFault = 'Shallow squat depth'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
          }
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
        primaryFault = 'Hips piking upward'
      } else if (spine > 195) {
        feedback.push({
          id: 'hip_sagging',
          message: 'Engage core: avoid lower back sagging.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Core',
        })
        formScore -= 20
        primaryFault = 'Lower back sagging'
      }

      if (primaryFault && !nextState.activeFaults.includes(primaryFault)) {
        nextState.activeFaults.push(primaryFault)
      }

      if (nextState.currentPhase === 'READY') {
        if (elbow < config.criteria.readyAngle - 15) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = elbow
          nextState.hitBottomDepth = false
          nextState.repStartTimestamp = Date.now()
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
        } else if (elbow > nextState.lowestAngleReached + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'rep_good',
              message: `Rep ${nextState.repsCount} Complete! Full lockout.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        } else if (elbow > config.criteria.targetDepthAngle + (config.criteria.hysteresisBuffer || 10)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
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
            primaryFault = 'Incomplete chest depth'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
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
          nextState.repStartTimestamp = Date.now()
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
        } else if (knee > nextState.lowestAngleReached + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (knee >= 148) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        } else if (knee > config.criteria.targetDepthAngle + (config.criteria.hysteresisBuffer || 10)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (knee >= 148) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            primaryFault = 'Shallow lunge step'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
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
          nextState.repStartTimestamp = Date.now()
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
        } else if (elbow > nextState.lowestAngleReached + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        } else if (elbow > config.criteria.targetDepthAngle + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (elbow >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            primaryFault = 'Incomplete curl contraction'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
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
        primaryFault = 'Lumbar hyperextension'
        if (!nextState.activeFaults.includes(primaryFault)) {
          nextState.activeFaults.push(primaryFault)
        }
      }

      if (nextState.currentPhase === 'READY' || nextState.currentPhase === 'COMPLETED') {
        if (elbow > 110) {
          nextState.currentPhase = 'CONCENTRIC'
          nextState.highestAngleReached = elbow
          nextState.hitBottomDepth = false
          nextState.repStartTimestamp = Date.now()
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (elbow >= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'overhead_lockout',
            message: 'Full overhead lockout achieved. Lower with control.',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (elbow < nextState.highestAngleReached - 18) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (elbow <= 105) {
          repCompleted = true
          nextState.repsCount += 1
          nextState.lastRepTimestamp = Date.now()
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
            nextState.lastRepTimestamp = Date.now()
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            primaryFault = 'Short overhead reach'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
          }
          nextState.currentPhase = 'READY'
          nextState.highestAngleReached = 90
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'deadlift': {
      const hip = angles.hipAngle
      const knee = angles.kneeAngle
      const torso = angles.torsoAngle

      if (hip < nextState.lowestAngleReached) {
        nextState.lowestAngleReached = hip
      }

      // Check spinal rounding / excessive forward bending without hip hinge
      if (torso > (config.criteria.maxLeanAngle || 60) && knee > 165) {
        feedback.push({
          id: 'stiff_leg_rounding',
          message: 'Soft knees! Avoid straight-leg back rounding.',
          severity: 'warning',
          timestamp: Date.now(),
          joint: 'Spine',
        })
        formScore -= 20
        primaryFault = 'Spinal flexion / rounded back'
        if (!nextState.activeFaults.includes(primaryFault)) {
          nextState.activeFaults.push(primaryFault)
        }
      }

      if (nextState.currentPhase === 'READY') {
        if (hip < config.criteria.readyAngle - 20) {
          nextState.currentPhase = 'ECCENTRIC'
          nextState.lowestAngleReached = hip
          nextState.hitBottomDepth = false
          nextState.repStartTimestamp = Date.now()
          feedback.push({
            id: 'hinging_down',
            message: 'Hinging back: push hips towards the wall behind you.',
            severity: 'good',
            timestamp: Date.now(),
          })
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (hip <= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
          feedback.push({
            id: 'deadlift_bottom',
            message: 'Full hinge depth reached. Drive hips forward!',
            severity: 'good',
            timestamp: Date.now(),
          })
        } else if (hip > nextState.lowestAngleReached + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (hip >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'deadlift_lockout',
              message: `Rep ${nextState.repsCount} Complete! Glute lockout.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        } else if (hip > config.criteria.targetDepthAngle + (config.criteria.hysteresisBuffer || 12)) {
          nextState.currentPhase = 'CONCENTRIC'
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (hip >= config.criteria.readyAngle - 10) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'deadlift_lockout',
              message: `Rep ${nextState.repsCount} Complete! Glute lockout.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
            primaryFault = 'Shallow hip hinge'
            if (!nextState.activeFaults.includes(primaryFault)) {
              nextState.activeFaults.push(primaryFault)
            }
          }
          nextState.currentPhase = 'READY'
          nextState.lowestAngleReached = 180
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'jumping_jack': {
      // For jumping jacks, arm abduction angle: shoulder angle or elbow angle
      const armAbduction = angles.leftShoulderAngle ?? angles.elbowAngle

      if (armAbduction > nextState.highestAngleReached) {
        nextState.highestAngleReached = armAbduction
      }

      if (nextState.currentPhase === 'READY' || nextState.currentPhase === 'COMPLETED') {
        if (armAbduction > 60) {
          nextState.currentPhase = 'CONCENTRIC'
          nextState.highestAngleReached = armAbduction
          nextState.hitBottomDepth = false
          nextState.repStartTimestamp = Date.now()
        }
      } else if (nextState.currentPhase === 'CONCENTRIC') {
        if (armAbduction >= config.criteria.targetDepthAngle) {
          nextState.currentPhase = 'BOTTOM_INFLECTION'
          nextState.hitBottomDepth = true
        } else if (armAbduction < nextState.highestAngleReached - 20) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'BOTTOM_INFLECTION') {
        if (armAbduction <= config.criteria.readyAngle + 15) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'jack_rep',
              message: `Rep ${nextState.repsCount} complete! Keep up the rhythm.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          }
          nextState.currentPhase = 'READY'
          nextState.highestAngleReached = 35
          nextState.hitBottomDepth = false
        } else if (armAbduction < config.criteria.targetDepthAngle - 15) {
          nextState.currentPhase = 'ECCENTRIC'
        }
      } else if (nextState.currentPhase === 'ECCENTRIC') {
        if (armAbduction <= config.criteria.readyAngle + 15) {
          if (nextState.hitBottomDepth) {
            repCompleted = true
            nextState.repsCount += 1
            nextState.lastRepTimestamp = Date.now()
            feedback.push({
              id: 'jack_rep',
              message: `Rep ${nextState.repsCount} complete! Keep up the rhythm.`,
              severity: 'good',
              timestamp: Date.now(),
            })
          } else {
            isPartialRep = true
            nextState.partialRepsCount += 1
          }
          nextState.currentPhase = 'READY'
          nextState.highestAngleReached = 35
          nextState.hitBottomDepth = false
        }
      }
      break
    }

    case 'plank': {
      const spine = angles.spineAlignmentAngle ?? 180
      const now = Date.now()
      const isAligned = Math.abs(spine - 180) < 18

      if (isAligned) {
        feedback.push({
          id: 'plank_aligned',
          message: 'Solid alignment: spine straight, core engaged.',
          severity: 'good',
          timestamp: now,
        })
        // Increment plank hold timer every second
        if (now - nextState.lastPlankCheckTime >= 1000) {
          nextState.holdDurationSeconds += 1
          nextState.lastPlankCheckTime = now
          // Count a confirmed 5-second interval as a rep unit
          if (nextState.holdDurationSeconds > 0 && nextState.holdDurationSeconds % 5 === 0) {
            repCompleted = true
            nextState.repsCount = Math.floor(nextState.holdDurationSeconds / 5)
          }
        }
      } else {
        feedback.push({
          id: 'plank_misaligned',
          message: 'Align spine: avoid hip sagging or excessive piking.',
          severity: 'warning',
          timestamp: now,
        })
        formScore -= 25
        primaryFault = 'Spine alignment deviation'
        if (!nextState.activeFaults.includes(primaryFault)) {
          nextState.activeFaults.push(primaryFault)
        }
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
      bilateralSymmetryScore: angles.bilateralSymmetry ?? 100,
      primaryFault,
      confidence: isBodyFullyVisible ? 0.95 : 0.65,
    },
    nextState,
  }
}
