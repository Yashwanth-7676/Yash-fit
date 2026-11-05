import { describe, it, expect } from 'vitest'
import { calculateMacroTargets } from '@/lib/nutritionCalculator'
import { calculateScannedMealTotals } from '@/lib/food-scanner/foodScannerService'
import type { UserProfile } from '@/types/profile'
import type { DetectedFoodItem } from '@/types/foodScanner'

describe('Unit: Nutrition Calculations & Macro Engine', () => {
  const baseProfile: UserProfile = {
    user_id: 'test-nutrition-user',
    first_name: 'Test',
    age: 25,
    height_cm: 180,
    weight_kg: 80,
    primary_goal: 'Build Muscle',
    experience_level: 'Intermediate',
    training_days_per_week: 4,
    training_environment: 'Commercial Gym',
    available_equipment: ['Barbell', 'Dumbbells'],
    dietary_preference: 'Vegetarian',
    onboarding_completed: true,
  }

  it('calculates BMR and maintenance calories with Mifflin-St Jeor formula', () => {
    // 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 800 + 1125 - 125 + 5 = 1805
    // Activity multiplier for 4 days is 1.45: 1805 * 1.45 = 2617.25 -> round = 2617
    // Goal is 'Build Muscle': +300 surplus -> 2917 kcal
    const result = calculateMacroTargets(baseProfile)
    expect(result.calories).toBe(2917)
  })

  it('allocates 2.0g/kg protein for muscle building', () => {
    const result = calculateMacroTargets(baseProfile)
    // 80kg * 2.0 = 160g protein
    expect(result.protein).toBe(160)
  })

  it('allocates ~25% of calories to dietary fats', () => {
    const result = calculateMacroTargets(baseProfile)
    // 2917 kcal * 0.25 = 729.25 kcal / 9 = ~81g fat
    expect(result.fats).toBe(81)
  })

  it('allocates remaining calories to complex carbohydrates', () => {
    const result = calculateMacroTargets(baseProfile)
    // Protein kcal = 160 * 4 = 640
    // Fat kcal = 729.25
    // Remainder kcal = 2917 - 640 - 729.25 = 1547.75 / 4 = ~387g carbs
    expect(result.carbs).toBe(387)
  })

  it('calculates daily hydration needs based on bodyweight', () => {
    const result = calculateMacroTargets(baseProfile)
    // 80kg * 0.04 = 3.2 Liters
    expect(result.waterLiters).toBe(3.2)
  })

  it('applies caloric deficit and higher protein (2.2g/kg) for fat loss goals', () => {
    const fatLossProfile: UserProfile = {
      ...baseProfile,
      primary_goal: 'Lose Fat',
    }
    const result = calculateMacroTargets(fatLossProfile)
    // Maintenance 2617 - 450 = 2167 kcal
    expect(result.calories).toBe(2167)
    // 80kg * 2.2 = 176g protein
    expect(result.protein).toBe(176)
  })

  it('handles null profile gracefully with healthy adult defaults', () => {
    const result = calculateMacroTargets(null)
    expect(result.calories).toBeGreaterThan(1500)
    expect(result.protein).toBeGreaterThan(100)
    expect(result.waterLiters).toBe(2.8) // 70 * 0.04
  })

  it('accurately scales macronutrients by portion multiplier in food vision scanner', () => {
    const items: DetectedFoodItem[] = [
      {
        id: 'food-1',
        name: 'Paneer Bhurji',
        confidence: 0.95,
        servingSize: '1 bowl (150g)',
        servingCount: 2,
        calories: 280,
        proteinGrams: 18,
        carbsGrams: 8,
        fatsGrams: 20,
        fiberGrams: 3,
        verifiedIndianDish: true,
      },
      {
        id: 'food-2',
        name: 'Whole Wheat Roti',
        confidence: 0.98,
        servingSize: '2 rotis',
        servingCount: 1,
        calories: 160,
        proteinGrams: 6,
        carbsGrams: 32,
        fatsGrams: 1,
        fiberGrams: 4,
        verifiedIndianDish: true,
      },
    ]

    const totals = calculateScannedMealTotals(items)
    // Paneer (x2): 560 kcal, 36g P, 16g C, 40g F, 6g fiber
    // Roti (x1): 160 kcal, 6g P, 32g C, 1g F, 4g fiber
    // Totals: 720 kcal, 42g P, 48g C, 41g F, 10g fiber
    expect(totals.calories).toBe(720)
    expect(totals.protein).toBe(42)
    expect(totals.carbs).toBe(48)
    expect(totals.fats).toBe(41)
    expect(totals.fiber).toBe(10)
  })
})
