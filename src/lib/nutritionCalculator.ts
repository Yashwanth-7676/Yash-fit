import type { UserProfile } from '@/types/profile'
import type { DailyMacroTargets } from '@/types/nutrition'

/**
 * Calculates evidence-based daily caloric needs and macronutrient distribution
 * using Mifflin-St Jeor BMR formula adjusted for activity level and fitness goal.
 */
export function calculateMacroTargets(profile: UserProfile | null): DailyMacroTargets {
  const weight = profile?.weight_kg || 70
  const height = profile?.height_cm || 175
  const age = profile?.age || 24
  const goal = profile?.primary_goal || 'Build Muscle'
  const days = profile?.training_days_per_week || 4

  // Basal Metabolic Rate (BMR) - Mifflin-St Jeor
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5

  // Activity Multiplier based on weekly training frequency
  let activityMultiplier = 1.35
  if (days <= 2) activityMultiplier = 1.3
  else if (days === 3 || days === 4) activityMultiplier = 1.45
  else if (days >= 5) activityMultiplier = 1.6

  const maintenanceCalories = Math.round(bmr * activityMultiplier)

  let targetCalories = maintenanceCalories
  let proteinMultiplier = 1.8 // g per kg of bodyweight

  switch (goal) {
    case 'Build Muscle':
    case 'Increase Strength':
      targetCalories = maintenanceCalories + 300 // Slight caloric surplus for lean mass
      proteinMultiplier = 2.0
      break
    case 'Lose Fat':
      targetCalories = maintenanceCalories - 450 // Caloric deficit
      proteinMultiplier = 2.2 // Higher protein to preserve muscle in deficit
      break
    case 'Improve Fitness':
    case 'Maintain Fitness':
    case 'General Health/Fitness':
    default:
      targetCalories = maintenanceCalories
      proteinMultiplier = 1.6
      break
  }

  // Protein: 1.6 - 2.2g per kg (4 kcal per gram)
  const protein = Math.round(weight * proteinMultiplier)
  const proteinCalories = protein * 4

  // Fats: ~25% of total caloric intake (9 kcal per gram)
  const fatCalories = targetCalories * 0.25
  const fats = Math.round(fatCalories / 9)

  // Carbohydrates: Remainder of daily calories (4 kcal per gram)
  const carbCalories = Math.max(0, targetCalories - proteinCalories - fatCalories)
  const carbs = Math.round(carbCalories / 4)

  // Recommended daily water intake
  const waterLiters = Number((weight * 0.04).toFixed(1))

  return {
    calories: targetCalories,
    protein,
    carbs,
    fats,
    waterLiters,
  }
}

