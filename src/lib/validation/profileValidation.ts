import type {
  PrimaryGoal,
  ExperienceLevel,
  TrainingEnvironment,
  DietaryPreference,
  ProfileFormData,
} from '@/types/profile'

export interface ProfileValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export const VALID_PRIMARY_GOALS: PrimaryGoal[] = [
  'Build Muscle',
  'Lose Fat',
  'Improve Fitness',
  'Increase Strength',
  'Maintain Fitness',
  'General Health/Fitness',
]

export const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced']

export const VALID_ENVIRONMENTS: TrainingEnvironment[] = [
  'Commercial Gym',
  'Home Gym',
  'Home / Minimal Equipment',
  'Bodyweight Only',
]

export const VALID_DIET_PREFERENCES: DietaryPreference[] = [
  'No Preference',
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'Non-Vegetarian',
]

export function validateProfileData(data: Partial<ProfileFormData>): ProfileValidationResult {
  const errors: Record<string, string> = {}

  // Name
  if (!data.first_name || data.first_name.toString().trim().length === 0) {
    errors.first_name = 'First name is required.'
  }

  // Age (14 - 100)
  const age = Number(data.age)
  if (data.age === undefined || data.age === '' || isNaN(age)) {
    errors.age = 'Age is required.'
  } else if (!Number.isInteger(age) || age < 14 || age > 100) {
    errors.age = 'Age must be an integer between 14 and 100.'
  }

  // Height (100 - 240 cm)
  const height = Number(data.height_cm)
  if (data.height_cm === undefined || data.height_cm === '' || isNaN(height)) {
    errors.height_cm = 'Height is required.'
  } else if (height < 100 || height > 240) {
    errors.height_cm = 'Height must be between 100 and 240 cm.'
  }

  // Weight (30 - 250 kg)
  const weight = Number(data.weight_kg)
  if (data.weight_kg === undefined || data.weight_kg === '' || isNaN(weight)) {
    errors.weight_kg = 'Weight is required.'
  } else if (weight < 30 || weight > 250) {
    errors.weight_kg = 'Weight must be between 30 and 250 kg.'
  }

  // Training Days (1 - 7)
  const days = Number(data.training_days_per_week)
  if (data.training_days_per_week !== undefined && (!Number.isInteger(days) || days < 1 || days > 7)) {
    errors.training_days_per_week = 'Training days must be between 1 and 7 days per week.'
  }

  // Primary Goal
  if (data.primary_goal && !VALID_PRIMARY_GOALS.includes(data.primary_goal as PrimaryGoal)) {
    errors.primary_goal = 'Invalid primary fitness goal selected.'
  }

  // Experience Level
  if (data.experience_level && !VALID_EXPERIENCE_LEVELS.includes(data.experience_level as ExperienceLevel)) {
    errors.experience_level = 'Invalid experience level selected.'
  }

  // Training Environment
  if (data.training_environment && !VALID_ENVIRONMENTS.includes(data.training_environment as TrainingEnvironment)) {
    errors.training_environment = 'Invalid training environment selected.'
  }

  // Dietary Preference
  if (data.dietary_preference && !VALID_DIET_PREFERENCES.includes(data.dietary_preference as DietaryPreference)) {
    errors.dietary_preference = 'Invalid dietary preference selected.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

