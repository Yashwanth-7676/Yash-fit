import type {
  AutopilotEngineInput,
  TodayWorkoutRecommendation,
  ExerciseAdaptation,
  DataSufficiencyLevel,
  OverloadActionType,
} from '@/types/autopilot'
import type { WorkoutExerciseItem, WorkoutRoutine } from '@/types/workout'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'
import { findBestSubstitutions } from './substitutionEngine'

export interface TargetRepBounds {
  minReps: number
  maxReps: number
}

/**
 * Safely parses rep string like "8-12", "10-15", or "5" into numeric bounds.
 */
export function parseTargetRepBounds(targetReps: string): TargetRepBounds {
  if (!targetReps) return { minReps: 8, maxReps: 12 }
  const clean = targetReps.replace(/[^0-9-]/g, '')
  if (clean.includes('-')) {
    const parts = clean.split('-')
    const min = parseInt(parts[0], 10)
    const max = parseInt(parts[1], 10)
    return {
      minReps: Number.isFinite(min) && min > 0 ? min : 8,
      maxReps: Number.isFinite(max) && max >= min ? max : 12,
    }
  }
  const single = parseInt(clean, 10)
  if (Number.isFinite(single) && single > 0) {
    return { minReps: single, maxReps: single }
  }
  return { minReps: 8, maxReps: 12 }
}

/**
 * Analyzes exercise history across all completed workouts.
 */
export function findExerciseHistory(
  exerciseId: string,
  exerciseName: string,
  workouts: TwinWorkout[]
): { weightKg: number; reps: number; completed: boolean }[] {
  const matchingSets: { weightKg: number; reps: number; completed: boolean }[] = []
  const normName = exerciseName.toLowerCase().trim()

  for (const w of workouts) {
    if (!w.exercises) continue
    for (const ex of w.exercises) {
      if (
        (ex.exerciseId && ex.exerciseId === exerciseId) ||
        ex.exerciseName.toLowerCase().trim() === normName
      ) {
        if (Array.isArray(ex.sets)) {
          ex.sets.forEach((s) => {
            if (s.completed) {
              matchingSets.push({
                weightKg: s.weightKg,
                reps: s.reps,
                completed: s.completed,
              })
            }
          })
        }
      }
    }
  }
  return matchingSets
}

/**
 * Core explainable Autopilot Training Recommendation Engine.
 */
export function generateAutopilotRecommendation(
  input: AutopilotEngineInput
): TodayWorkoutRecommendation {
  const { profile, workouts, recovery, currentRoutine, activeOverrides } = input

  // 1. Select Active Routine
  const routine: WorkoutRoutine =
    currentRoutine ||
    PRESET_WORKOUT_ROUTINES[0]

  // 2. Evaluate Recovery Status
  const latestRecovery: RecoveryEntry | undefined = recovery[0]
  const hasRecoveryData = Boolean(latestRecovery && typeof latestRecovery.readinessScore === 'number')
  const readinessScore = hasRecoveryData ? latestRecovery!.readinessScore! : null
  const sleepHours = latestRecovery?.sleepHours ?? null
  const soreness = latestRecovery?.soreness || null

  let isRecoveryConstrained = false
  let readinessCategory = 'Unrecorded'

  if (readinessScore !== null) {
    if (readinessScore >= 80) readinessCategory = 'Optimal Readiness'
    else if (readinessScore >= 60) readinessCategory = 'Moderate Readiness'
    else {
      readinessCategory = 'Elevated Fatigue'
      isRecoveryConstrained = true
    }
  }

  if (soreness?.toLowerCase() === 'severe' || (sleepHours !== null && sleepHours < 5.5)) {
    isRecoveryConstrained = true
  }

  // 3. Process Each Exercise in the Routine
  const exerciseAdaptations: ExerciseAdaptation[] = []
  let progressionCount = 0
  let deloadCount = 0

  routine.exercises.forEach((item) => {
    // Check if exercise has an active override
    const effectiveExerciseId = activeOverrides?.[item.exerciseId] || item.exerciseId
    const history = findExerciseHistory(effectiveExerciseId, item.exerciseName, workouts)

    // Check equipment compatibility
    const availableEquipment = profile?.available_equipment
    const equipmentMismatch = Boolean(
      availableEquipment &&
      availableEquipment.length > 0 &&
      item.equipment !== 'No Equipment' &&
      !availableEquipment.includes(item.equipment)
    )

    // A. Equipment Substitution Required
    if (equipmentMismatch) {
      const subs = findBestSubstitutions(item, availableEquipment, profile?.primary_goal)
      const bestSub = subs[0]
      if (bestSub) {
        exerciseAdaptations.push({
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          originalItem: item,
          proposedItem: {
            ...item,
            exerciseId: bestSub.exercise.id,
            exerciseName: bestSub.exercise.name,
            equipment: bestSub.exercise.equipment,
          },
          actionType: 'substitute',
          weightDeltaKg: 0,
          repDelta: 0,
          setDelta: 0,
          reason: `Equipment substitution: ${bestSub.reason}`,
          supportingData: `Equipment constraint: '${item.equipment}' is unavailable in user profile.`,
          sufficiency: 'high',
          limitations: 'Estimated substitution; adjust load to match target intensity.',
          substituteReason: bestSub.reason,
        })
        return
      }
    }

    // B. Insufficient Performance History
    if (history.length === 0) {
      exerciseAdaptations.push({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        originalItem: item,
        proposedItem: item,
        actionType: 'maintain',
        weightDeltaKg: 0,
        repDelta: 0,
        setDelta: 0,
        reason: 'No completed session logs found for this exercise. Establish a baseline load today.',
        supportingData: '0 logged historical sets.',
        sufficiency: 'insufficient',
        limitations: 'Autopilot requires at least 1 verified completed workout before proposing progressive overload.',
      })
      return
    }

    // Parse target reps
    const bounds = parseTargetRepBounds(item.targetReps)
    const recentSets = history.slice(-item.targetSets)
    const avgRecentReps = Math.round(recentSets.reduce((acc, s) => acc + s.reps, 0) / recentSets.length)
    const lastWeight = recentSets[recentSets.length - 1]?.weightKg || 0
    const allSetsMetMax = recentSets.length >= item.targetSets && recentSets.every((s) => s.reps >= bounds.maxReps)

    // C. Elevated Fatigue / Deload Constraint
    if (isRecoveryConstrained) {
      deloadCount++
      const deloadWeight = lastWeight > 0 ? -Math.max(2.5, Math.round(lastWeight * 0.1)) : 0
      exerciseAdaptations.push({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        originalItem: item,
        proposedItem: {
          ...item,
          targetSets: Math.max(2, item.targetSets - 1),
        },
        actionType: 'decrease_load',
        weightDeltaKg: deloadWeight,
        repDelta: 0,
        setDelta: -1,
        reason: `Elevated fatigue detected (Readiness: ${readinessScore ?? 'N/A'}/100). Reducing volume by 1 set and load by ~10% to prevent overreaching.`,
        supportingData: `Readiness score: ${readinessScore ?? 'Low'}, Soreness: ${soreness ?? 'Unrecorded'}, Sleep: ${sleepHours ? `${sleepHours}h` : 'Unrecorded'}.`,
        sufficiency: hasRecoveryData ? 'high' : 'medium',
        limitations: 'Conservative fatigue guard. If feeling recovered, you can edit or dismiss.',
      })
      return
    }

    // D. Progressive Overload Triggered
    if (allSetsMetMax) {
      progressionCount++
      const isBodyweight = item.equipment === 'No Equipment'
      const weightDelta = isBodyweight ? 0 : 2.5
      const repDelta = isBodyweight ? 1 : 0

      exerciseAdaptations.push({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        originalItem: item,
        proposedItem: {
          ...item,
          targetReps: isBodyweight
            ? `${bounds.minReps + 1}-${bounds.maxReps + 1}`
            : item.targetReps,
        },
        actionType: isBodyweight ? 'increase_reps' : 'increase_weight',
        weightDeltaKg: weightDelta,
        repDelta,
        setDelta: 0,
        reason: `Successfully completed all ${item.targetSets} sets at or above the top rep target (${bounds.maxReps} reps). Ready for conservative progressive overload.`,
        supportingData: `Recent sets: ${recentSets.map((s) => `${s.reps}r @ ${s.weightKg}kg`).join(', ')}. Target ceiling was ${bounds.maxReps} reps.`,
        sufficiency: 'high',
        limitations: 'Respect technical form. If rep quality breaks down, maintain current load.',
      })
      return
    }

    // E. Maintain Load (Within rep bracket)
    exerciseAdaptations.push({
      exerciseId: item.exerciseId,
      exerciseName: item.exerciseName,
      originalItem: item,
      proposedItem: item,
      actionType: 'maintain',
      weightDeltaKg: 0,
      repDelta: 0,
      setDelta: 0,
      reason: `Recent sets averaged ${avgRecentReps} reps within the target ${item.targetReps} range. Maintain current load until all sets reach the top rep ceiling.`,
      supportingData: `Last recorded sets: ${recentSets.map((s) => `${s.reps}r`).join(', ')}. Target: ${item.targetReps}.`,
      sufficiency: 'high',
      limitations: 'Focus on explosive concentric drive and a controlled 2-3 second eccentric tempo.',
    })
  })

  // 4. Overall Rationale & Confidence Evaluation
  let dataSufficiency: DataSufficiencyLevel = 'high'
  if (workouts.length === 0) dataSufficiency = 'insufficient'
  else if (workouts.length < 3 || !hasRecoveryData) dataSufficiency = 'medium'

  let confidenceScore = 85
  if (!hasRecoveryData) confidenceScore -= 15
  if (workouts.length < 3) confidenceScore -= 20
  confidenceScore = Math.max(30, Math.min(100, confidenceScore))

  let overallRationale = `Autopilot evaluated ${routine.name} across ${exerciseAdaptations.length} movements.`
  if (isRecoveryConstrained) {
    overallRationale += ` Elevated systemic fatigue was detected (${readinessCategory}). Proposing conservative volume adjustments (-${deloadCount} sets) to stimulate recovery.`
  } else if (progressionCount > 0) {
    overallRationale += ` Performance history supports progressive overload across ${progressionCount} exercise(s) (+2.5kg / +1 rep). Remaining exercises maintained at current working baseline.`
  } else {
    overallRationale += ` Exercises are maintained at current working loads to build consistency within target rep brackets.`
  }

  // 5. Safety Warnings
  const safetyWarnings: string[] = [
    'Autopilot provides athletic progression recommendations based on user-logged records, not medical diagnosis.',
    'Never push through sharp joint pain, dizziness, or acute musculoskeletal strain. Stop immediately and seek professional medical guidance.',
  ]
  if (!hasRecoveryData) {
    safetyWarnings.push(
      'Recovery biomarkers (sleep, soreness, readiness) are unrecorded today. Operating on conservative baseline training parameters.'
    )
  }

  return {
    routineId: routine.id,
    routineName: routine.name,
    targetSplit: routine.targetSplit,
    estimatedDurationMinutes: routine.durationMinutes,
    readinessScore,
    readinessCategory,
    isRecoveryConstrained,
    overallRationale,
    dataSufficiency,
    confidenceScore,
    exerciseAdaptations,
    safetyWarnings,
    recommendedRestDaysAhead: isRecoveryConstrained ? 1 : 0,
    status: 'pending',
    proposedAt: new Date().toISOString(),
  }
}

