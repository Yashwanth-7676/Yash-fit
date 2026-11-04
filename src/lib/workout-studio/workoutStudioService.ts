import type {
  StudioExerciseDetail,
  StudioWorkoutState,
  WorkoutStudioSummary,
} from '@/types/workoutStudio'
import type { TwinWorkout, TwinExerciseLog } from '@/lib/digitalTwin'

const workoutHistoryKey = (userId: string) => `yashfit_completed_workouts_${userId}`

function readArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

export const DEFAULT_STUDIO_ROUTINES: {
  id: string
  name: string
  targetSplit: string
  estimatedMinutes: number
  exercises: StudioExerciseDetail[]
}[] = [
  {
    id: 'push-power-hypertrophy',
    name: 'Push Power & Chest Hypertrophy',
    targetSplit: 'Push (Chest, Shoulders, Triceps)',
    estimatedMinutes: 45,
    exercises: [
      {
        exerciseId: 'bench-press',
        name: 'Barbell Flat Bench Press',
        primaryMuscle: 'Chest',
        secondaryMuscles: ['Triceps', 'Front Delts'],
        motionCycleKey: 'bench_press',
        instructions: [
          'Lie flat on the bench with feet firmly planted into the floor.',
          'Retract your scapulae and grip the bar slightly wider than shoulder-width.',
          'Unrack and lower with control to the mid-sternum, keeping elbows tucked at 45°.',
          'Press aggressively upward to full lockout without shrugging shoulders.',
        ],
        cues: [
          'Pack your lats and squeeze the bar tight.',
          'Touch sternum softly, do not bounce the load.',
          'Drive through the heels into the floor.',
        ],
        breathingGuidance: 'Inhale and brace core on descent. Exhale forcefully through sticking point on ascent.',
        sets: [
          { setNumber: 1, targetReps: '8', targetWeightKg: 60, restSeconds: 90, isCompleted: false },
          { setNumber: 2, targetReps: '8', targetWeightKg: 70, restSeconds: 90, isCompleted: false },
          { setNumber: 3, targetReps: '6', targetWeightKg: 75, restSeconds: 120, isCompleted: false },
          { setNumber: 4, targetReps: '6', targetWeightKg: 80, restSeconds: 120, isCompleted: false },
        ],
        substitutions: [
          { id: 'db-bench-press', name: 'Dumbbell Flat Bench Press', reason: 'Allows greater wrist freedom and deeper chest stretch.' },
          { id: 'push-up', name: 'Weighted Push-Up', reason: 'Ideal calisthenics substitute without a barbell bench.' },
        ],
      },
      {
        exerciseId: 'overhead-press',
        name: 'Standing Overhead Barbell Press (OHP)',
        primaryMuscle: 'Shoulders',
        secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
        motionCycleKey: 'overhead_press',
        instructions: [
          'Stand with feet shoulder-width apart, holding the bar at upper clavicle level.',
          'Squeeze glutes and brace your abs to form a rigid vertical pillar.',
          'Press the bar in a straight vertical path, tilting head slightly back until bar clears nose.',
          'Lock elbows overhead with shoulders shrugged slightly upward to stabilize the scapula.',
        ],
        cues: [
          'Lock your glutes to eliminate lower back arching.',
          'Move your head forward through the window once bar passes the forehead.',
        ],
        breathingGuidance: 'Deep diaphragmatic inhale at bottom. Hold brace during press, exhale at lockout.',
        sets: [
          { setNumber: 1, targetReps: '8', targetWeightKg: 40, restSeconds: 90, isCompleted: false },
          { setNumber: 2, targetReps: '8', targetWeightKg: 45, restSeconds: 90, isCompleted: false },
          { setNumber: 3, targetReps: '6', targetWeightKg: 50, restSeconds: 120, isCompleted: false },
        ],
        substitutions: [
          { id: 'seated-db-press', name: 'Seated Dumbbell Shoulder Press', reason: 'Reduces lower back load with backrest support.' },
        ],
      },
      {
        exerciseId: 'cable-tricep-pushdown',
        name: 'Cable Tricep Rope Pushdown',
        primaryMuscle: 'Triceps',
        secondaryMuscles: ['Forearms'],
        motionCycleKey: 'tricep_pushdown',
        instructions: [
          'Grasp the rope attachment with palms facing inward, elbows tucked tightly at ribs.',
          'Hinge slightly at the hips, keeping chest elevated.',
          'Extend elbows downward, flaring the rope outward at the bottom of the movement.',
          'Control the eccentric return until forearms pass 90 degrees.',
        ],
        cues: [
          'Pin elbows to sides like hinges.',
          'Squeeze lateral tricep head for a full second at full extension.',
        ],
        breathingGuidance: 'Exhale extending downward, inhale returning upward.',
        sets: [
          { setNumber: 1, targetReps: '12', targetWeightKg: 25, restSeconds: 60, isCompleted: false },
          { setNumber: 2, targetReps: '10', targetWeightKg: 30, restSeconds: 60, isCompleted: false },
          { setNumber: 3, targetReps: '10', targetWeightKg: 35, restSeconds: 60, isCompleted: false },
        ],
        substitutions: [
          { id: 'tricep-dips', name: 'Parallel Bar Tricep Dips', reason: 'High-intensity bodyweight tricep builder.' },
        ],
      },
    ],
  },
  {
    id: 'pull-strength-width',
    name: 'Pull Strength & Back Thickness',
    targetSplit: 'Pull (Back, Biceps, Rear Delts)',
    estimatedMinutes: 50,
    exercises: [
      {
        exerciseId: 'deadlift',
        name: 'Conventional Barbell Deadlift',
        primaryMuscle: 'Back',
        secondaryMuscles: ['Hamstrings', 'Glutes', 'Core', 'Forearms'],
        motionCycleKey: 'deadlift',
        instructions: [
          'Stand with feet hip-width apart, bar over mid-foot.',
          'Hinge at hips, grip bar just outside knees without moving the bar.',
          'Pull chest up to pull slack out of the barbell and engage lats.',
          'Drive floor away through heels, extending hips and knees simultaneously to lockout.',
        ],
        cues: [
          'Imagine pushing the world away rather than lifting the bar.',
          'Keep bar glued against shins and thighs throughout.',
        ],
        breathingGuidance: 'Breathe into belly and brace 360° before pulling. Exhale at lockout.',
        sets: [
          { setNumber: 1, targetReps: '5', targetWeightKg: 100, restSeconds: 120, isCompleted: false },
          { setNumber: 2, targetReps: '5', targetWeightKg: 110, restSeconds: 150, isCompleted: false },
          { setNumber: 3, targetReps: '3', targetWeightKg: 120, restSeconds: 180, isCompleted: false },
        ],
        substitutions: [
          { id: 'trap-bar-deadlift', name: 'Trap Bar (Hex Bar) Deadlift', reason: 'More upright torso position with less lumbar strain.' },
          { id: 'romanian-deadlift', name: 'Barbell Romanian Deadlift (RDL)', reason: 'Direct hamstring and glute hypertrophy focus.' },
        ],
      },
      {
        exerciseId: 'pull-up',
        name: 'Overhand Wide Grip Pull-Up',
        primaryMuscle: 'Back',
        secondaryMuscles: ['Biceps', 'Rear Delts'],
        motionCycleKey: 'pull_up',
        instructions: [
          'Grip overhead pull-up bar slightly wider than shoulder width with palms facing away.',
          'Initiate the movement by depressing scapulae down and back.',
          'Drive elbows down towards hips until chin clearly clears the bar.',
          'Lower under control to full dead-hang without swinging.',
        ],
        cues: [
          'Drive elbows to back pockets.',
          'Lead with sternum, not chin.',
        ],
        breathingGuidance: 'Exhale pulling upward, inhale descending under control.',
        sets: [
          { setNumber: 1, targetReps: '8', targetWeightKg: 0, restSeconds: 90, isCompleted: false },
          { setNumber: 2, targetReps: '8', targetWeightKg: 0, restSeconds: 90, isCompleted: false },
          { setNumber: 3, targetReps: '6', targetWeightKg: 0, restSeconds: 90, isCompleted: false },
        ],
        substitutions: [
          { id: 'lat-pulldown', name: 'Cable Lat Pulldown', reason: 'Allows exact weight modulation for consistent volume.' },
        ],
      },
      {
        exerciseId: 'bicep-curl',
        name: 'Standing Barbell Bicep Curl',
        primaryMuscle: 'Biceps',
        secondaryMuscles: ['Forearms'],
        motionCycleKey: 'bicep_curl',
        instructions: [
          'Stand upright holding straight barbell with supinated shoulder-width grip.',
          'Keep elbows pinned slightly in front of torso.',
          'Curl bar upward toward upper chest, contracting biceps peak.',
          'Lower over 3 seconds under active tension to full elbow extension.',
        ],
        cues: [
          'Zero body momentum or hip swing.',
          'Keep wrists neutral or slightly extended to isolate biceps.',
        ],
        breathingGuidance: 'Exhale curling upward, inhale lowering down.',
        sets: [
          { setNumber: 1, targetReps: '10', targetWeightKg: 30, restSeconds: 60, isCompleted: false },
          { setNumber: 2, targetReps: '10', targetWeightKg: 32.5, restSeconds: 60, isCompleted: false },
          { setNumber: 3, targetReps: '8', targetWeightKg: 35, restSeconds: 75, isCompleted: false },
        ],
        substitutions: [
          { id: 'incline-db-curl', name: 'Incline Dumbbell Curl', reason: 'Extreme long-head biceps stretch.' },
        ],
      },
    ],
  },
  {
    id: 'leg-hypertrophy',
    name: 'Lower Body & Quadricep Dominance',
    targetSplit: 'Legs (Quads, Glutes, Hamstrings, Calves)',
    estimatedMinutes: 50,
    exercises: [
      {
        exerciseId: 'squat',
        name: 'Barbell High-Bar Back Squat',
        primaryMuscle: 'Quads',
        secondaryMuscles: ['Glutes', 'Hamstrings', 'Core'],
        motionCycleKey: 'squat',
        instructions: [
          'Rest barbell across upper trapezius, grip bar firmly with hands close to shoulders.',
          'Unrack, take two steps back into comfortable hip-to-shoulder width stance.',
          'Descend by breaking simultaneously at knees and hips, keeping knees tracking toes.',
          'Reach parallel or below (hip crease below top of patella), then reverse out of hole.',
        ],
        cues: [
          'Screw your feet into the floor to open hips.',
          'Maintain proud chest and upright thoracic spine.',
        ],
        breathingGuidance: 'Big diaphragmatic breath, brace core tight before descent. Exhale through sticking point.',
        sets: [
          { setNumber: 1, targetReps: '8', targetWeightKg: 80, restSeconds: 120, isCompleted: false },
          { setNumber: 2, targetReps: '8', targetWeightKg: 90, restSeconds: 120, isCompleted: false },
          { setNumber: 3, targetReps: '6', targetWeightKg: 100, restSeconds: 150, isCompleted: false },
        ],
        substitutions: [
          { id: 'goblet-squat', name: 'Dumbbell / Kettlebell Goblet Squat', reason: 'Easier on spine with anterior load counter-balance.' },
          { id: 'leg-press', name: '45-Degree Incline Leg Press', reason: 'Maximum quad overload without spinal compression.' },
        ],
      },
    ],
  },
]

/**
 * Web Speech Synthesis voice assistant
 */
export function speakStudioCue(text: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  try {
    window.speechSynthesis.cancel() // Cancel prior queued utterance
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 0.9

    // Attempt to pick an English voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    )
    if (preferredVoice) utterance.voice = preferredVoice

    window.speechSynthesis.speak(utterance)
  } catch {
    // Non-fatal if speech synthesis fails
  }
}

/**
 * Web Audio synthetic rest timer chime
 */
export function playStudioChime(): void {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    // First beep 880 Hz
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.15, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.15)

    // Second higher tone 1174 Hz (D6)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.frequency.setValueAtTime(1174, now + 0.18)
    gain2.gain.setValueAtTime(0.2, now + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.4)
  } catch {
    // Audio context policy safe ignore
  }
}

/**
 * Persists completed studio workout into existing YashFit workoutService
 */
export function completeStudioSession(state: StudioWorkoutState): WorkoutStudioSummary {
  let totalVolumeKg = 0
  let totalSetsCompleted = 0

  const completedExercises: TwinExerciseLog[] = state.exercises.map((ex) => {
    const completedSets = ex.sets
      .filter((s) => s.isCompleted)
      .map((s) => {
        const weight = s.actualWeightKg ?? s.targetWeightKg
        const reps = s.actualReps ?? (parseInt(s.targetReps, 10) || 8)
        totalVolumeKg += weight * reps
        totalSetsCompleted++
        return {
          weightKg: weight,
          reps,
          completed: true,
        }
      })

    return {
      exerciseId: ex.exerciseId,
      exerciseName: ex.name,
      sets: completedSets,
    }
  })

  // Detect Personal Records (PRs) by querying historical workout logs
  const historyKey = workoutHistoryKey('demo-user')
  const historicalLogs = readArray<TwinWorkout>(historyKey)
  const prs: string[] = []

  for (const ex of completedExercises) {
    const bestSetThisSession = ex.sets.reduce(
      (max, s) => (s.weightKg > max ? s.weightKg : max),
      0
    )

    if (bestSetThisSession > 0) {
      let historicalMax = 0
      for (const log of historicalLogs) {
        const match = log.exercises?.find((e: TwinExerciseLog) => e.exerciseId === ex.exerciseId)
        if (match) {
          for (const s of match.sets) {
            if (s.weightKg > historicalMax) historicalMax = s.weightKg
          }
        }
      }

      if (bestSetThisSession > historicalMax && historicalMax > 0) {
        prs.push(`${ex.exerciseName}: New Best ${bestSetThisSession} kg! (+${(bestSetThisSession - historicalMax).toFixed(1)} kg)`)
      }
    }
  }

  const durationMinutes = Math.max(1, Math.round(state.elapsedSeconds / 60))
  // Estimated calories: roughly 6.5 kcal/min for high-intensity resistance training
  const estimatedCaloriesBurned = Math.round(durationMinutes * 6.5 + totalVolumeKg * 0.015)

  const sessionId = `studio-${Date.now()}`
  const sessionLog: TwinWorkout = {
    routineName: state.routineName,
    date: new Date().toISOString(),
    durationSeconds: state.elapsedSeconds,
    totalVolume: totalVolumeKg,
    totalCompletedSets: totalSetsCompleted,
    exercises: completedExercises,
  }

  // Save to core workout database & localStorage
  if (typeof window !== 'undefined') {
    try {
      const updated = [sessionLog, ...historicalLogs]
      localStorage.setItem(historyKey, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  return {
    sessionId,
    routineName: state.routineName,
    durationMinutes,
    totalVolumeKg,
    totalSetsCompleted,
    estimatedCaloriesBurned,
    personalRecordsHit: prs,
  }
}

