export type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner'

export interface DetectedFoodItem {
  id: string
  name: string
  confidence: number // 0.0 to 1.0
  servingSize: string
  servingCount: number // Multiplier (default 1.0)
  calories: number
  proteinGrams: number
  carbsGrams: number
  fatsGrams: number
  fiberGrams: number
  verifiedIndianDish: boolean
  isUserEdited?: boolean
}

export interface ScannedMealResult {
  id: string
  timestamp: string
  mealType: MealType
  imageUrl?: string
  detectedItems: DetectedFoodItem[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  totalFiber: number
  analysisMethod: 'ai_vision' | 'rule_fallback' | 'manual_entry'
  confidenceOverall: number
  isConfirmed: boolean
  notes?: string
}

export interface FoodVisionScanRequest {
  imageBase64?: string
  mealType?: MealType
  userNotes?: string
}

export interface FoodVisionScanResponse {
  success: boolean
  analysisMethod: 'ai_vision' | 'rule_fallback' | 'manual_entry'
  detectedItems: DetectedFoodItem[]
  disclaimer: string
  modelProvider?: string
}

