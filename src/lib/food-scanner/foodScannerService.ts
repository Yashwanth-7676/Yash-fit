import type {
  DetectedFoodItem,
  ScannedMealResult,
  MealType,
} from '../../types/foodScanner'

export const LOCAL_STORAGE_SCANNED_MEALS_KEY = 'yashfit_scanned_meals_history'

let inMemoryScannedMeals: ScannedMealResult[] = []

export const COMMON_INDIAN_DISHES_CATALOG: Omit<DetectedFoodItem, 'id' | 'confidence' | 'servingCount'>[] = [
  {
    name: 'Masala Dosa with Potato Filling',
    servingSize: '1 medium dosa (130g)',
    calories: 280,
    proteinGrams: 6,
    carbsGrams: 42,
    fatsGrams: 10,
    fiberGrams: 3,
    verifiedIndianDish: true,
  },
  {
    name: 'Steamed Idli (2 pieces)',
    servingSize: '2 idlis (100g)',
    calories: 140,
    proteinGrams: 4,
    carbsGrams: 28,
    fatsGrams: 1,
    fiberGrams: 2,
    verifiedIndianDish: true,
  },
  {
    name: 'Toor Dal Tadka / Yellow Dal',
    servingSize: '1 medium katori (150g)',
    calories: 160,
    proteinGrams: 8,
    carbsGrams: 22,
    fatsGrams: 4,
    fiberGrams: 4,
    verifiedIndianDish: true,
  },
  {
    name: 'Vegetable Sambar',
    servingSize: '1 bowl (150ml)',
    calories: 110,
    proteinGrams: 4,
    carbsGrams: 18,
    fatsGrams: 2.5,
    fiberGrams: 3,
    verifiedIndianDish: true,
  },
  {
    name: 'Whole Wheat Phulka / Roti',
    servingSize: '1 medium roti (35g)',
    calories: 85,
    proteinGrams: 3,
    carbsGrams: 17,
    fatsGrams: 0.5,
    fiberGrams: 2.5,
    verifiedIndianDish: true,
  },
  {
    name: 'Steamed Basmati Rice',
    servingSize: '1 medium katori (150g cooked)',
    calories: 195,
    proteinGrams: 4,
    carbsGrams: 44,
    fatsGrams: 0.5,
    fiberGrams: 1,
    verifiedIndianDish: true,
  },
  {
    name: 'Low-Fat Paneer Bhurji',
    servingSize: '1 medium bowl (120g)',
    calories: 240,
    proteinGrams: 21,
    carbsGrams: 5,
    fatsGrams: 15,
    fiberGrams: 2,
    verifiedIndianDish: true,
  },
  {
    name: 'Fresh Curd / Dahi (Plain)',
    servingSize: '1 katori (150g)',
    calories: 98,
    proteinGrams: 5,
    carbsGrams: 7,
    fatsGrams: 5,
    fiberGrams: 0,
    verifiedIndianDish: true,
  },
  {
    name: 'Mixed Vegetable Poriyal / Sabzi',
    servingSize: '1 katori (120g)',
    calories: 115,
    proteinGrams: 3,
    carbsGrams: 14,
    fatsGrams: 5,
    fiberGrams: 4,
    verifiedIndianDish: true,
  },
  {
    name: 'Spiced Egg Bhurji (2 eggs)',
    servingSize: '2 eggs with onions & tomatoes',
    calories: 190,
    proteinGrams: 14,
    carbsGrams: 4,
    fatsGrams: 13,
    fiberGrams: 1,
    verifiedIndianDish: true,
  },
  {
    name: 'Punjabi Chana Masala / Chickpeas',
    servingSize: '1 bowl (160g)',
    calories: 220,
    proteinGrams: 10,
    carbsGrams: 34,
    fatsGrams: 5,
    fiberGrams: 7,
    verifiedIndianDish: true,
  },
  {
    name: 'Grilled Chicken Tikka (Skinless)',
    servingSize: '5 pieces (150g)',
    calories: 230,
    proteinGrams: 35,
    carbsGrams: 4,
    fatsGrams: 8,
    fiberGrams: 1,
    verifiedIndianDish: true,
  },
]

export const PRESET_MEAL_SAMPLES: {
  title: string
  mealType: MealType
  items: DetectedFoodItem[]
}[] = [
  {
    title: 'South Indian Breakfast Plate',
    mealType: 'Breakfast',
    items: [
      {
        id: 'det-1',
        name: 'Masala Dosa with Potato Filling',
        confidence: 0.94,
        servingSize: '1 medium dosa (130g)',
        servingCount: 1,
        calories: 280,
        proteinGrams: 6,
        carbsGrams: 42,
        fatsGrams: 10,
        fiberGrams: 3,
        verifiedIndianDish: true,
      },
      {
        id: 'det-2',
        name: 'Vegetable Sambar',
        confidence: 0.91,
        servingSize: '1 bowl (150ml)',
        servingCount: 1,
        calories: 110,
        proteinGrams: 4,
        carbsGrams: 18,
        fatsGrams: 2.5,
        fiberGrams: 3,
        verifiedIndianDish: true,
      },
    ],
  },
  {
    title: 'Balanced North Indian Lunch Thali',
    mealType: 'Lunch',
    items: [
      {
        id: 'det-3',
        name: 'Whole Wheat Phulka / Roti',
        confidence: 0.96,
        servingSize: '1 medium roti (35g)',
        servingCount: 2,
        calories: 85,
        proteinGrams: 3,
        carbsGrams: 17,
        fatsGrams: 0.5,
        fiberGrams: 2.5,
        verifiedIndianDish: true,
      },
      {
        id: 'det-4',
        name: 'Toor Dal Tadka / Yellow Dal',
        confidence: 0.92,
        servingSize: '1 medium katori (150g)',
        servingCount: 1,
        calories: 160,
        proteinGrams: 8,
        carbsGrams: 22,
        fatsGrams: 4,
        fiberGrams: 4,
        verifiedIndianDish: true,
      },
      {
        id: 'det-5',
        name: 'Low-Fat Paneer Bhurji',
        confidence: 0.89,
        servingSize: '1 medium bowl (120g)',
        servingCount: 1,
        calories: 240,
        proteinGrams: 21,
        carbsGrams: 5,
        fatsGrams: 15,
        fiberGrams: 2,
        verifiedIndianDish: true,
      },
      {
        id: 'det-6',
        name: 'Fresh Curd / Dahi (Plain)',
        confidence: 0.95,
        servingSize: '1 katori (150g)',
        servingCount: 1,
        calories: 98,
        proteinGrams: 5,
        carbsGrams: 7,
        fatsGrams: 5,
        fiberGrams: 0,
        verifiedIndianDish: true,
      },
    ],
  },
  {
    title: 'Post-Workout High Protein Meal',
    mealType: 'Dinner',
    items: [
      {
        id: 'det-7',
        name: 'Grilled Chicken Tikka (Skinless)',
        confidence: 0.95,
        servingSize: '5 pieces (150g)',
        servingCount: 1,
        calories: 230,
        proteinGrams: 35,
        carbsGrams: 4,
        fatsGrams: 8,
        fiberGrams: 1,
        verifiedIndianDish: true,
      },
      {
        id: 'det-8',
        name: 'Steamed Basmati Rice',
        confidence: 0.92,
        servingSize: '1 medium katori (150g cooked)',
        servingCount: 1,
        calories: 195,
        proteinGrams: 4,
        carbsGrams: 44,
        fatsGrams: 0.5,
        fiberGrams: 1,
        verifiedIndianDish: true,
      },
      {
        id: 'det-9',
        name: 'Mixed Vegetable Poriyal / Sabzi',
        confidence: 0.88,
        servingSize: '1 katori (120g)',
        servingCount: 1,
        calories: 115,
        proteinGrams: 3,
        carbsGrams: 14,
        fatsGrams: 5,
        fiberGrams: 4,
        verifiedIndianDish: true,
      },
    ],
  },
]

export function calculateScannedMealTotals(items: DetectedFoodItem[]): {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
} {
  return items.reduce(
    (acc, item) => {
      const mult = item.servingCount || 1.0
      return {
        calories: Math.round(acc.calories + item.calories * mult),
        protein: Math.round((acc.protein + item.proteinGrams * mult) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbsGrams * mult) * 10) / 10,
        fats: Math.round((acc.fats + item.fatsGrams * mult) * 10) / 10,
        fiber: Math.round((acc.fiber + item.fiberGrams * mult) * 10) / 10,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 }
  )
}

export function getScannedMealHistory(): ScannedMealResult[] {
  if (typeof window === 'undefined') {
    return inMemoryScannedMeals
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SCANNED_MEALS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // fallback
  }
  return inMemoryScannedMeals
}

export function saveScannedMeal(meal: ScannedMealResult): void {
  const current = getScannedMealHistory()
  const filtered = current.filter((m) => m.id !== meal.id)
  const updated = [meal, ...filtered]

  inMemoryScannedMeals = updated

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_SCANNED_MEALS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }
}

export function deleteScannedMeal(mealId: string): void {
  const current = getScannedMealHistory()
  const updated = current.filter((m) => m.id !== mealId)

  inMemoryScannedMeals = updated

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_SCANNED_MEALS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }
}

export function clearScannedMealHistory(): void {
  inMemoryScannedMeals = []
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_SCANNED_MEALS_KEY)
    } catch {
      // ignore
    }
  }
}

