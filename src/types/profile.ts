export type PrimaryGoal =
  | 'Build Muscle'
  | 'Lose Fat'
  | 'Improve Fitness'
  | 'Increase Strength'
  | 'Maintain Fitness'
  | 'General Health/Fitness'

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type TrainingEnvironment =
  | 'Commercial Gym'
  | 'Home Gym'
  | 'Home / Minimal Equipment'
  | 'Bodyweight Only'

export type DietaryPreference =
  | 'No Preference'
  | 'Vegetarian'
  | 'Vegan'
  | 'Eggetarian'
  | 'Non-Vegetarian'

export type EquipmentOption =
  | 'Dumbbells'
  | 'Barbell'
  | 'Bench'
  | 'Cable Machine'
  | 'Machines'
  | 'Resistance Bands'
  | 'Pull-up Bar'
  | 'Kettlebells'
  | 'Cardio Equipment'
  | 'No Equipment'

export interface UserProfile {
  id?: string
  user_id: string
  first_name: string
  age: number
  height_cm: number
  weight_kg: number
  primary_goal: PrimaryGoal
  experience_level: ExperienceLevel
  training_days_per_week: number
  training_environment: TrainingEnvironment
  available_equipment: EquipmentOption[]
  dietary_preference: DietaryPreference
  onboarding_completed: boolean
  created_at?: string
  updated_at?: string
}

export interface ProfileFormData {
  first_name: string
  age: string | number
  height_cm: string | number
  weight_kg: string | number
  primary_goal: PrimaryGoal | ''
  experience_level: ExperienceLevel | ''
  training_days_per_week: number
  training_environment: TrainingEnvironment | ''
  available_equipment: EquipmentOption[]
  dietary_preference: DietaryPreference | ''
}

