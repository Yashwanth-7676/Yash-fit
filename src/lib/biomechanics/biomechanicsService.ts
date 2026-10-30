import type { SupportedVisionExercise } from '../../types/pose'
import type {
  BiomechanicsSessionRecord,
  ExerciseBiomechanicalGuidance,
} from '../../types/biomechanics'

const LOCAL_STORAGE_KEY = 'yashfit_biomechanics_sessions'

export const BIOMECHANICS_GUIDANCE_CATALOG: Record<
  SupportedVisionExercise,
  ExerciseBiomechanicalGuidance
> = {
  squat: {
    exercise: 'squat',
    name: 'Bodyweight / Goblet Squat',
    primaryMuscle: 'Quadriceps & Gluteus Maximus',
    targetJoints: ['Hip Joint (Coxofemoral)', 'Knee Joint (Tibiofemoral)', 'Talocrural (Ankle)'],
    planeOfMotion: 'Sagittal',
    cameraSetup: {
      recommendedDistance: '6 - 8 feet (2 - 2.5 meters)',
      recommendedAngle: '45° oblique or pure lateral side view',
      optimalHeight: 'Waist height (table or tripod)',
    },
    idealFormCriteria: [
      'Parallel Depth: Femur parallel or below parallel to floor (knee angle ≤ 95°)',
      'Spine Neutrality: Torso forward angle controlled (<40° relative to vertical)',
      'Knee Path: Knee tracks directly over 2nd and 3rd toes without valgus collapse',
      'Full Hip Lockout: Complete hip extension at apex (knee & hip angles ≥ 160°)',
    ],
    commonFaults: [
      {
        fault: 'Knee Valgus (Inward buckling)',
        cue: 'Screw your feet outward into the ground and push knees wide.',
        severity: 'high',
      },
      {
        fault: 'Excessive Forward Lean ("Good Morning Squat")',
        cue: 'Open your chest to the wall ahead; brace core to prevent chest dive.',
        severity: 'moderate',
      },
      {
        fault: 'Partial Depth (Above Parallel)',
        cue: 'Descend until hip crease is level with top of patella before driving up.',
        severity: 'moderate',
      },
    ],
    approximateNote:
      'Computer vision joint tracking operates on 2D projections. Clothing, camera tilt, and optical distortion may introduce ±5° variance.',
  },
  push_up: {
    exercise: 'push_up',
    name: 'Standard Push-Up',
    primaryMuscle: 'Pectoralis Major & Triceps Brachii',
    targetJoints: ['Glenohumeral (Shoulder)', 'Humeroulnar (Elbow)', 'Lumbar Spine'],
    planeOfMotion: 'Sagittal',
    cameraSetup: {
      recommendedDistance: '5 - 7 feet',
      recommendedAngle: 'Direct lateral side view at mat level',
      optimalHeight: '12 - 18 inches off floor',
    },
    idealFormCriteria: [
      'Chest Depth: Elbows flex to at least 90° or below at bottom inflection',
      'Rigid Trunk Plank: Straight line through shoulder, hip, and ankle (170° - 190°)',
      'Elbow Flare Angle: Upper arm at ~45° to torso, preventing 90° shoulder impingement',
      'Full Lockout: Full elbow extension without hyperextending or shrugging shoulders',
    ],
    commonFaults: [
      {
        fault: 'Sagging Lumbar Spine (Pike or Dip)',
        cue: 'Squeeze glutes and draw navel to spine; maintain rigid plank alignment.',
        severity: 'high',
      },
      {
        fault: 'Head Bobbing / Craning Neck',
        cue: 'Keep eyes on the floor 6 inches ahead of fingertips to maintain neutral cervical spine.',
        severity: 'low',
      },
      {
        fault: 'Flaring Elbows Perpendicular',
        cue: 'Tuck elbows to make an arrow shape (45°), not a T-shape.',
        severity: 'high',
      },
    ],
    approximateNote:
      'Floor reflections and low camera angles can intermittently obscure wrist landmarks.',
  },
  lunge: {
    exercise: 'lunge',
    name: 'Stationary / Forward Lunge',
    primaryMuscle: 'Quadriceps, Glutes & Hamstrings',
    targetJoints: ['Hip Joint', 'Knee Joint', 'Ankle'],
    planeOfMotion: 'Sagittal',
    cameraSetup: {
      recommendedDistance: '6 - 8 feet',
      recommendedAngle: 'Lateral side view',
      optimalHeight: 'Knee to waist height',
    },
    idealFormCriteria: [
      'Front Knee Flexion: 90° angle at bottom with tibia near vertical',
      'Rear Knee Clearance: Rear knee hovers 1-2 inches above floor without striking ground',
      'Upright Torso: Trunk lean strictly within 0° - 20° vertical plane',
      'Stable Dynamic Center: Torso remains centered between feet without sideways lean',
    ],
    commonFaults: [
      {
        fault: 'Front Knee Traveling Too Far Past Toes',
        cue: 'Step out far enough so your front shin remains nearly perpendicular to the ground.',
        severity: 'moderate',
      },
      {
        fault: 'Torso Collapsing Forward',
        cue: 'Stay tall like an elevator going straight down, not an escalator.',
        severity: 'moderate',
      },
      {
        fault: 'Narrow Stance ("Tightrope Walking")',
        cue: 'Keep feet hip-width apart throughout the step for balance.',
        severity: 'low',
      },
    ],
    approximateNote:
      'Back leg occlusion may occur during step return. Ensure direct side camera orientation.',
  },
  bicep_curl: {
    exercise: 'bicep_curl',
    name: 'Dumbbell Bicep Curl',
    primaryMuscle: 'Biceps Brachii & Brachialis',
    targetJoints: ['Humeroulnar (Elbow)', 'Glenohumeral (Shoulder)'],
    planeOfMotion: 'Sagittal',
    cameraSetup: {
      recommendedDistance: '5 - 7 feet',
      recommendedAngle: 'Front or 45° angle',
      optimalHeight: 'Chest height',
    },
    idealFormCriteria: [
      'Pinned Elbows: Elbow remains directly under shoulder without swinging forward',
      'Peak Contraction: Curl upward until elbow angle flexes below 55°',
      'Controlled Eccentric: 2-3 second lowering phase to complete extension (>155°)',
      'Torso Stillness: Zero backward torso sway during upward drive',
    ],
    commonFaults: [
      {
        fault: 'Torso Momentum / Hip Swing',
        cue: 'Lock your glutes and brace your abs. If you must swing, reduce dumbbell weight.',
        severity: 'high',
      },
      {
        fault: 'Elbow Drift Forward',
        cue: 'Keep your elbows glued to your ribcage throughout the movement.',
        severity: 'moderate',
      },
      {
        fault: 'Incomplete Lowering Extension',
        cue: 'Lower the weight all the way down until your triceps engage slightly at bottom.',
        severity: 'moderate',
      },
    ],
    approximateNote:
      'Small wrist angles and dumbbell grips can occlude wrist landmarks in frontal cameras.',
  },
  shoulder_press: {
    exercise: 'shoulder_press',
    name: 'Overhead Shoulder Press',
    primaryMuscle: 'Anterior & Lateral Deltoids, Triceps',
    targetJoints: ['Glenohumeral (Shoulder)', 'Scapulothoracic', 'Humeroulnar (Elbow)'],
    planeOfMotion: 'Multi-planar',
    cameraSetup: {
      recommendedDistance: '6 - 8 feet',
      recommendedAngle: 'Front view or 45° angle',
      optimalHeight: 'Chest height',
    },
    idealFormCriteria: [
      'Starting Rack Depth: Elbows flexed at ~90°, dumbbells/bar at collarbone height',
      'Overhead Lockout: Arms press directly upward to full extension (>160° elbow angle)',
      'Spine Neutrality: Ribcage pulled down, avoiding hyperextending lumbar spine (<20° lean)',
      'Vertical Bar Path: Weights press directly over mid-foot balance line',
    ],
    commonFaults: [
      {
        fault: 'Excessive Lumbar Arching',
        cue: 'Squeeze your glutes and pull your lower ribs down toward your hips.',
        severity: 'high',
      },
      {
        fault: 'Flaring Elbows Way Behind Ears',
        cue: 'Keep elbows slightly in front of your body (scapular plane ~30°).',
        severity: 'moderate',
      },
      {
        fault: 'Incomplete Overhead Lockout',
        cue: 'Press the ceiling away until your arms are fully extended and ears are framed by biceps.',
        severity: 'moderate',
      },
    ],
    approximateNote:
      'Ensure ceiling clearance and camera FOV captures the full overhead arm extension.',
  },
  plank: {
    exercise: 'plank',
    name: 'Forearm Plank Hold',
    primaryMuscle: 'Rectus Abdominis & Transverse Abdominis',
    targetJoints: ['Glenohumeral', 'Lumbar Spine', 'Hip'],
    planeOfMotion: 'Sagittal',
    cameraSetup: {
      recommendedDistance: '5 - 7 feet',
      recommendedAngle: 'Lateral side view at floor level',
      optimalHeight: '12 inches off floor',
    },
    idealFormCriteria: [
      'Shoulder Alignment: Elbows directly beneath glenohumeral shoulder joints',
      'Spinal Integrity: Straight line from occiput through thoracic, lumbar, to calcaneus',
      'Pelvic Positioning: Slight posterior pelvic tilt to activate core and protect lower back',
      'Breathing Rhythm: Continuous diaphragmatic breathing without holding breath',
    ],
    commonFaults: [
      {
        fault: 'Hips Sagging Toward Floor',
        cue: 'Squeeze glutes and tuck your pelvis up to create a rigid bridge.',
        severity: 'high',
      },
      {
        fault: 'Piking Hips in the Air',
        cue: 'Lower your hips until your back forms a level tabletop.',
        severity: 'moderate',
      },
      {
        fault: 'Winged Scapulae (Sinking Chest)',
        cue: 'Actively push the floor away through your forearms to spread shoulder blades.',
        severity: 'low',
      },
    ],
    approximateNote:
      'Camera must capture both shoulder and ankle to measure full longitudinal spine alignment.',
  },
}

/**
 * Storage helpers for Biomechanics session records.
 */
export function getSavedBiomechanicsSessions(): BiomechanicsSessionRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return []
}

export function saveBiomechanicsSession(session: BiomechanicsSessionRecord): void {
  if (typeof window === 'undefined') return
  try {
    const current = getSavedBiomechanicsSessions()
    const updated = [session, ...current.filter((s) => s.id !== session.id)].slice(0, 50)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function deleteBiomechanicsSession(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const current = getSavedBiomechanicsSessions()
    const updated = current.filter((s) => s.id !== id)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}

export function clearBiomechanicsSessions(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function exportBiomechanicsToCsv(sessions: BiomechanicsSessionRecord[]): string {
  const headers = [
    '"Session ID"',
    '"Date"',
    '"Exercise"',
    '"Exercise Name"',
    '"Clean Reps"',
    '"Partial Reps"',
    '"Total Reps"',
    '"Average Form Score"',
    '"Duration (s)"',
    '"Feedback Summary"',
  ]

  const rows = sessions.map((s) => [
    `"${s.id}"`,
    `"${s.date}"`,
    `"${s.exercise}"`,
    `"${s.exerciseName}"`,
    s.cleanReps,
    s.partialReps,
    s.totalReps,
    s.averageFormScore,
    s.durationSeconds,
    `"${(s.primaryFeedback || []).join('; ').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function exportBiomechanicsToJson(sessions: BiomechanicsSessionRecord[]): string {
  return JSON.stringify(sessions, null, 2)
}
