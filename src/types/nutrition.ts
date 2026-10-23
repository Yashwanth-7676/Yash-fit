import type { DietaryPreference } from './profile'

export type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'

export interface FoodItem {
  id: string
  name: string
  servingSize: string
  calories: number
  proteinGrams: number
  carbsGrams: number
  fatsGrams: number
  dietaryPreference: DietaryPreference
  isBudgetFriendly?: boolean
  costPerServingInr?: number
  recipeSteps?: string[]
}

export interface MealPlanDay {
  id: string
  title: string
  dietaryPreference: DietaryPreference
  targetCalories: number
  targetProtein: number
  meals: {
    type: MealType
    foods: FoodItem[]
  }[]
}

export interface DailyMacroTargets {
  calories: number
  protein: number
  carbs: number
  fats: number
  waterLiters: number
}

