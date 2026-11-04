export type SmartGroceryCategory =
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'dairy'
  | 'protein'
  | 'pantry_spices'
  | 'other'

export interface SmartGroceryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: SmartGroceryCategory
  estimatedPriceInr: number
  actualPriceInr?: number
  isPurchased: boolean
  isCustomItem: boolean
  isVerifiedPrice: boolean
  suggestedSubstitution?: {
    alternativeName: string
    savingsInr: number
    reason: string
  }
}

export interface GroceryBudgetSettings {
  weeklyBudgetInr: number
  monthlyBudgetInr: number
  currencySymbol: string
}

export interface WeeklyGroceryPlan {
  id: string
  weekStartDate: string
  dietaryPreference: string
  items: SmartGroceryItem[]
  totalEstimatedCostInr: number
  totalActualCostInr: number
  budgetLimitInr: number
  isArchived: boolean
  lastUpdated: string
}

