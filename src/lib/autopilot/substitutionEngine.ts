import type { WorkoutExerciseItem, Exercise } from '@/types/workout'
import type { EquipmentOption } from '@/types/profile'
import { EXERCISE_DATABASE } from '@/data/exercises'

export interface SubstitutionOption {
  exercise: Exercise
  reason: string
  preservesPrimaryMuscle: boolean
  matchesEquipment: boolean
  difficultyDelta: 'easier' | 'similar' | 'harder'
}

/**
 * Finds intelligent, biomechanically sound exercise substitutions
 * that preserve primary muscle groups and match the user's available equipment.
 */
export function findBestSubstitutions(
  currentItem: WorkoutExerciseItem,
  availableEquipment?: EquipmentOption[],
  userGoal?: string
): SubstitutionOption[] {
  const currentDbExercise = EXERCISE_DATABASE.find((ex) => ex.id === currentItem.exerciseId)
  const currentDifficulty = currentDbExercise?.difficulty || 'Intermediate'

  // Filter candidates from database
  const candidates = EXERCISE_DATABASE.filter((ex) => {
    // Cannot substitute with the exact same exercise
    if (ex.id === currentItem.exerciseId) return false
    // Must target the same primary muscle group
    if (ex.primaryMuscle !== currentItem.primaryMuscle) return false
    // If available equipment is defined and not empty, exercise must use allowed equipment
    if (availableEquipment && availableEquipment.length > 0) {
      if (ex.equipment !== 'No Equipment' && !availableEquipment.includes(ex.equipment)) {
        return false
      }
    }
    return true
  })

  return candidates.map((candidate): SubstitutionOption => {
    const matchesEquip = Boolean(
      !availableEquipment ||
      availableEquipment.length === 0 ||
      candidate.equipment === 'No Equipment' ||
      availableEquipment.includes(candidate.equipment)
    )

    let difficultyDelta: SubstitutionOption['difficultyDelta'] = 'similar'
    if (currentDifficulty === 'Advanced' && candidate.difficulty !== 'Advanced') {
      difficultyDelta = 'easier'
    } else if (currentDifficulty === 'Beginner' && candidate.difficulty !== 'Beginner') {
      difficultyDelta = 'harder'
    }

    // Generate explainable reason
    let reason = `Targets ${candidate.primaryMuscle} using ${candidate.equipment}.`
    if (currentItem.equipment !== candidate.equipment) {
      reason = `Matches available equipment (${candidate.equipment}) while preserving primary ${candidate.primaryMuscle} hypertrophic stimulus.`
    } else if (difficultyDelta === 'easier') {
      reason = `Lower joint shear variation suitable for deloading or when joint fatigue is elevated.`
    } else if (userGoal === 'Build Muscle' || userGoal === 'Increase Strength') {
      reason = `Excellent alternative for ${candidate.primaryMuscle} tension with high stimulus-to-fatigue ratio.`
    }

    return {
      exercise: candidate,
      reason,
      preservesPrimaryMuscle: true,
      matchesEquipment: matchesEquip,
      difficultyDelta,
    }
  })
}

