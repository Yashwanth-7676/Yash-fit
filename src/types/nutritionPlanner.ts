import type { DietaryPreference } from './profile'
import type { FoodItem, MealType } from './nutrition'

export type RegionalPreference =
  | 'North Indian'
  | 'South Indian'
  | 'East Indian'
  | 'West Indian'
  | 'High-Protein Modern'

export type BudgetTier = 'Budget-Friendly' | 'Moderate' | 'Premium'

export interface PlannedMealCourse {
  type: MealType
  name: string
  foods: FoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  estimatedCostInr: number
  prepTip?: string
}

export interface GroceryItem {
  id: string
  name: string
  quantityText: string
  category: 'Produce & Veggies' | 'Dairy & Alternatives' | 'Grains & Pulses' | 'Meat & Eggs' | 'Pantry & Spices'
  estimatedCostInr: number
  isEssential: boolean
}

export interface IngredientSubstitution {
  originalId: string
  originalName: string
  substituteId: string
  substituteName: string
  macroDelta: string
  costDelta: string
  reason: string
}

export interface MealPrepNote {
  dayWindow: 'Sunday Prep' | 'Mid-Week Batch' | 'Daily Night Prep'
  title: string
  timeMinutes: number
  instruction: string
}

export interface NutritionPlanV2 {
  id: string
  userId: string
  regionalPreference: RegionalPreference
  dietaryPreference: DietaryPreference
  budgetTier: BudgetTier
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFats: number
  dailyWaterLiters: number
  meals: PlannedMealCourse[]
  groceryList: GroceryItem[]
  mealPrepNotes: MealPrepNote[]
  substitutions: IngredientSubstitution[]
  createdAt: string
  updatedAt: string
}
