export interface PersonalizedWorkoutRecommendation {
  id: string
  routineName: string
  primaryMuscles: string[]
  recommendedDurationMin: number
  rationale: string
  dataDrivers: string[]
  exercises: Array<{
    name: string
    sets: number
    targetReps: string
    equipmentRequired: string
    alternativeOption?: string
  }>
  progressionCue?: string
  feedbackState?: 'liked' | 'disliked' | 'dismissed'
}

export interface PersonalizedMealRecommendation {
  id: string
  dishName: string
  hindiOrRegionalName?: string
  regionalCategory: string
  dietaryType: string
  calories: number
  proteinGrams: number
  carbsGrams: number
  fatsGrams: number
  rationale: string
  dataDrivers: string[]
  keyIngredients: string[]
  feedbackState?: 'liked' | 'disliked' | 'dismissed'
}

export interface PersonalizationPreferences {
  consentToLearn: boolean
  intensityPreference: 'conservative' | 'standard' | 'aggressive'
  preferredFocusMuscles: string[]
  excludedIngredients: string[]
  feedbackHistory: Array<{
    recommendationId: string
    feedback: 'liked' | 'disliked' | 'dismissed'
    timestamp: string
    reason?: string
  }>
}

export interface PersonalizationEngineSummary {
  workoutRecommendations: PersonalizedWorkoutRecommendation[]
  mealRecommendations: PersonalizedMealRecommendation[]
  preferences: PersonalizationPreferences
  lastCalibratedAt: string
}
