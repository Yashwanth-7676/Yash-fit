import type {
  SmartGroceryItem,
  SmartGroceryCategory,
  GroceryBudgetSettings,
  WeeklyGroceryPlan,
} from '../../types/smartGrocery'

export const LOCAL_STORAGE_GROCERY_PLAN_KEY = 'yashfit_smart_grocery_plan'
export const LOCAL_STORAGE_GROCERY_BUDGET_KEY = 'yashfit_grocery_budget_settings'
export const LOCAL_STORAGE_GROCERY_HISTORY_KEY = 'yashfit_grocery_shopping_history'

export const DEFAULT_BUDGET_SETTINGS: GroceryBudgetSettings = {
  weeklyBudgetInr: 2200,
  monthlyBudgetInr: 9000,
  currencySymbol: '₹',
}

let inMemoryPlan: WeeklyGroceryPlan | null = null
let inMemoryBudget: GroceryBudgetSettings = { ...DEFAULT_BUDGET_SETTINGS }

export const INGREDIENT_KNOWLEDGE_BASE: {
  name: string
  category: SmartGroceryCategory
  unit: string
  standardPriceInr: number
  dietaryPreference: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'All'
  substitution?: {
    alternativeName: string
    savingsInr: number
    reason: string
  }
}[] = [
  // Dairy & High-Cost Proteins
  {
    name: 'Low-Fat Paneer',
    category: 'dairy',
    unit: 'g',
    standardPriceInr: 0.45, // ₹45 per 100g
    dietaryPreference: 'Vegetarian',
    substitution: {
      alternativeName: 'Nutrela Soya Chunks',
      savingsInr: 120,
      reason: 'Soya chunks deliver 52g protein per 100g at 1/3rd the cost of paneer.',
    },
  },
  {
    name: 'Greek Yogurt / Hung Curd',
    category: 'dairy',
    unit: 'g',
    standardPriceInr: 0.35,
    dietaryPreference: 'Vegetarian',
    substitution: {
      alternativeName: 'Homemade Set Curd (Dahi)',
      savingsInr: 80,
      reason: 'Strain regular fresh curd through a muslin cloth for high-protein hung curd.',
    },
  },
  {
    name: 'Cow Milk (Toned)',
    category: 'dairy',
    unit: 'liters',
    standardPriceInr: 60,
    dietaryPreference: 'Vegetarian',
  },

  // Poultry & Eggs
  {
    name: 'Chicken Breast (Boneless)',
    category: 'protein',
    unit: 'kg',
    standardPriceInr: 320,
    dietaryPreference: 'Non-Vegetarian',
    substitution: {
      alternativeName: 'Farm Fresh Whole Eggs (Tray of 30)',
      savingsInr: 140,
      reason: 'Eggs provide complete amino acid profile at a very competitive INR cost per gram.',
    },
  },
  {
    name: 'Farm Eggs',
    category: 'protein',
    unit: 'pcs',
    standardPriceInr: 7, // ₹7 per egg
    dietaryPreference: 'Eggetarian',
  },

  // Grains & Lentils
  {
    name: 'Toor Dal / Yellow Pigeon Peas',
    category: 'grains',
    unit: 'kg',
    standardPriceInr: 160,
    dietaryPreference: 'All',
  },
  {
    name: 'Yellow Moong Dal (Split)',
    category: 'grains',
    unit: 'kg',
    standardPriceInr: 145,
    dietaryPreference: 'All',
  },
  {
    name: 'Brown Basmati Rice',
    category: 'grains',
    unit: 'kg',
    standardPriceInr: 110,
    dietaryPreference: 'All',
    substitution: {
      alternativeName: 'Regular Sona Masoori Rice',
      savingsInr: 50,
      reason: 'Standard parboiled or sona masoori rice fits fitness macros at lower cost.',
    },
  },
  {
    name: 'Whole Wheat Atta (Chakki Fresh)',
    category: 'grains',
    unit: 'kg',
    standardPriceInr: 45,
    dietaryPreference: 'All',
  },
  {
    name: 'Rolled Oats',
    category: 'grains',
    unit: 'kg',
    standardPriceInr: 180,
    dietaryPreference: 'All',
    substitution: {
      alternativeName: 'Daliya (Broken Wheat)',
      savingsInr: 110,
      reason: 'Daliya offers similar complex carbs and dietary fiber at nearly half the price.',
    },
  },
  {
    name: 'Nutrela Soya Chunks',
    category: 'protein',
    unit: 'g',
    standardPriceInr: 0.15, // ₹15 per 100g
    dietaryPreference: 'Vegetarian',
  },

  // Vegetables
  {
    name: 'Spinach (Palak)',
    category: 'vegetables',
    unit: 'bunches',
    standardPriceInr: 25,
    dietaryPreference: 'All',
  },
  {
    name: 'Tomatoes',
    category: 'vegetables',
    unit: 'kg',
    standardPriceInr: 40,
    dietaryPreference: 'All',
  },
  {
    name: 'Onions',
    category: 'vegetables',
    unit: 'kg',
    standardPriceInr: 35,
    dietaryPreference: 'All',
  },
  {
    name: 'Green Beans (French Beans)',
    category: 'vegetables',
    unit: 'kg',
    standardPriceInr: 60,
    dietaryPreference: 'All',
  },
  {
    name: 'Broccoli',
    category: 'vegetables',
    unit: 'kg',
    standardPriceInr: 160,
    dietaryPreference: 'All',
    substitution: {
      alternativeName: 'Cauliflower (Gobi)',
      savingsInr: 110,
      reason: 'Local cauliflower provides identical cruciferous benefits at a fraction of broccoli cost.',
    },
  },

  // Fruits
  {
    name: 'Bananas',
    category: 'fruits',
    unit: 'pcs',
    standardPriceInr: 5, // ₹5 per banana
    dietaryPreference: 'All',
  },
  {
    name: 'Apples (Kinnaur/Shimla)',
    category: 'fruits',
    unit: 'kg',
    standardPriceInr: 160,
    dietaryPreference: 'All',
  },

  // Pantry & Spices
  {
    name: 'Cold-Pressed Mustard Oil / Olive Oil',
    category: 'pantry_spices',
    unit: 'liters',
    standardPriceInr: 190,
    dietaryPreference: 'All',
  },
  {
    name: 'Desi Ghee (Cow)',
    category: 'pantry_spices',
    unit: 'g',
    standardPriceInr: 0.75, // ₹375 per 500g
    dietaryPreference: 'Vegetarian',
  },
  {
    name: 'Turmeric, Cumin & Garam Masala',
    category: 'pantry_spices',
    unit: 'pack',
    standardPriceInr: 120,
    dietaryPreference: 'All',
  },
]

export function calculatePlanTotals(items: SmartGroceryItem[]): {
  totalEstimated: number
  totalActual: number
} {
  return items.reduce(
    (acc, item) => ({
      totalEstimated: acc.totalEstimated + (Number(item.estimatedPriceInr) || 0),
      totalActual:
        acc.totalActual +
        (item.isPurchased && item.actualPriceInr !== undefined
          ? Number(item.actualPriceInr)
          : 0),
    }),
    { totalEstimated: 0, totalActual: 0 }
  )
}

/**
 * Automatically merges duplicate ingredient entries, adding quantities and recalculating prices.
 */
export function combineDuplicateIngredients(items: SmartGroceryItem[]): SmartGroceryItem[] {
  const map = new Map<string, SmartGroceryItem>()

  for (const item of items) {
    const key = `${item.name.toLowerCase().trim()}_${item.unit.toLowerCase().trim()}`
    if (map.has(key)) {
      const existing = map.get(key)!
      const newQty = existing.quantity + item.quantity
      const pricePerUnit =
        existing.quantity > 0 ? existing.estimatedPriceInr / existing.quantity : 0
      existing.quantity = newQty
      existing.estimatedPriceInr = Math.round(newQty * pricePerUnit)
      if (item.actualPriceInr !== undefined) {
        existing.actualPriceInr = (existing.actualPriceInr ?? 0) + item.actualPriceInr
      }
      existing.isPurchased = existing.isPurchased && item.isPurchased
    } else {
      map.set(key, { ...item })
    }
  }

  return Array.from(map.values())
}

/**
 * Synthesizes a weekly smart grocery plan tailored to dietary preferences and budget constraints.
 */
export function generateWeeklyGroceryList(
  dietaryPreference = 'Vegetarian',
  budgetWeeklyInr = 2200
): WeeklyGroceryPlan {
  const rawItems: SmartGroceryItem[] = [
    {
      id: 'g-paneer',
      name: 'Low-Fat Paneer',
      quantity: 600,
      unit: 'g',
      category: 'dairy',
      estimatedPriceInr: 270,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
      suggestedSubstitution: {
        alternativeName: 'Nutrela Soya Chunks',
        savingsInr: 180,
        reason: 'Soya chunks deliver 52g protein per 100g at 1/3rd the cost of paneer.',
      },
    },
    {
      id: 'g-curd',
      name: 'Greek Yogurt / Hung Curd',
      quantity: 800,
      unit: 'g',
      category: 'dairy',
      estimatedPriceInr: 220,
      isPurchased: true,
      actualPriceInr: 210,
      isCustomItem: false,
      isVerifiedPrice: true,
      suggestedSubstitution: {
        alternativeName: 'Homemade Set Curd (Dahi)',
        savingsInr: 80,
        reason: 'Strain regular fresh curd through a muslin cloth for high-protein hung curd.',
      },
    },
    {
      id: 'g-dal',
      name: 'Toor Dal / Yellow Pigeon Peas',
      quantity: 1,
      unit: 'kg',
      category: 'grains',
      estimatedPriceInr: 160,
      isPurchased: true,
      actualPriceInr: 155,
      isCustomItem: false,
      isVerifiedPrice: true,
    },
    {
      id: 'g-soya',
      name: 'Nutrela Soya Chunks',
      quantity: 500,
      unit: 'g',
      category: 'protein',
      estimatedPriceInr: 75,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
    },
    {
      id: 'g-atta',
      name: 'Whole Wheat Atta (Chakki Fresh)',
      quantity: 3,
      unit: 'kg',
      category: 'grains',
      estimatedPriceInr: 135,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
    },
    {
      id: 'g-rice',
      name: 'Brown Basmati Rice',
      quantity: 2,
      unit: 'kg',
      category: 'grains',
      estimatedPriceInr: 220,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
    },
    {
      id: 'g-spinach',
      name: 'Spinach (Palak)',
      quantity: 3,
      unit: 'bunches',
      category: 'vegetables',
      estimatedPriceInr: 75,
      isPurchased: true,
      actualPriceInr: 70,
      isCustomItem: false,
      isVerifiedPrice: true,
    },
    {
      id: 'g-veg-mix',
      name: 'Tomatoes & Onions',
      quantity: 3,
      unit: 'kg',
      category: 'vegetables',
      estimatedPriceInr: 120,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
    },
    {
      id: 'g-bananas',
      name: 'Bananas',
      quantity: 14,
      unit: 'pcs',
      category: 'fruits',
      estimatedPriceInr: 70,
      isPurchased: true,
      actualPriceInr: 70,
      isCustomItem: false,
      isVerifiedPrice: true,
    },
    {
      id: 'g-spices',
      name: 'Turmeric, Cumin & Garam Masala',
      quantity: 1,
      unit: 'pack',
      category: 'pantry_spices',
      estimatedPriceInr: 120,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
    },
  ]

  if (dietaryPreference === 'Non-Vegetarian') {
    rawItems.push({
      id: 'g-chicken',
      name: 'Chicken Breast (Boneless)',
      quantity: 1.5,
      unit: 'kg',
      category: 'protein',
      estimatedPriceInr: 480,
      isPurchased: false,
      isCustomItem: false,
      isVerifiedPrice: false,
      suggestedSubstitution: {
        alternativeName: 'Farm Fresh Whole Eggs (Tray of 30)',
        savingsInr: 270,
        reason: 'Eggs provide complete amino acids at nearly half the price.',
      },
    })
  }

  const items = combineDuplicateIngredients(rawItems)
  const totals = calculatePlanTotals(items)

  const plan: WeeklyGroceryPlan = {
    id: `gplan-${Date.now()}`,
    weekStartDate: new Date().toISOString().slice(0, 10),
    dietaryPreference,
    items,
    totalEstimatedCostInr: totals.totalEstimated,
    totalActualCostInr: totals.totalActual,
    budgetLimitInr: budgetWeeklyInr,
    isArchived: false,
    lastUpdated: new Date().toISOString(),
  }

  return plan
}

export function getSavedGroceryPlan(): WeeklyGroceryPlan {
  if (typeof window === 'undefined') {
    if (!inMemoryPlan) inMemoryPlan = generateWeeklyGroceryList()
    return inMemoryPlan
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GROCERY_PLAN_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  if (!inMemoryPlan) inMemoryPlan = generateWeeklyGroceryList()
  return inMemoryPlan
}

export function saveGroceryPlan(plan: WeeklyGroceryPlan): WeeklyGroceryPlan {
  const totals = calculatePlanTotals(plan.items)
  const updatedPlan: WeeklyGroceryPlan = {
    ...plan,
    totalEstimatedCostInr: totals.totalEstimated,
    totalActualCostInr: totals.totalActual,
    lastUpdated: new Date().toISOString(),
  }

  inMemoryPlan = updatedPlan

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_GROCERY_PLAN_KEY, JSON.stringify(updatedPlan))
    } catch {
      // ignore
    }
  }

  return updatedPlan
}

export function toggleItemPurchased(plan: WeeklyGroceryPlan, itemId: string): WeeklyGroceryPlan {
  const updatedItems = plan.items.map((item) => {
    if (item.id === itemId) {
      const willBePurchased = !item.isPurchased
      return {
        ...item,
        isPurchased: willBePurchased,
        actualPriceInr: willBePurchased
          ? item.actualPriceInr ?? item.estimatedPriceInr
          : item.actualPriceInr,
      }
    }
    return item
  })

  const newPlan: WeeklyGroceryPlan = {
    ...plan,
    items: updatedItems,
  }
  return saveGroceryPlan(newPlan)
}

export function applySubstitution(plan: WeeklyGroceryPlan, itemId: string): WeeklyGroceryPlan {
  const updatedItems = plan.items.map((item) => {
    if (item.id === itemId && item.suggestedSubstitution) {
      const savings = item.suggestedSubstitution.savingsInr
      const newEstimated = Math.max(20, item.estimatedPriceInr - savings)
      return {
        ...item,
        name: item.suggestedSubstitution.alternativeName,
        estimatedPriceInr: newEstimated,
        suggestedSubstitution: undefined,
        isUserEdited: true,
      }
    }
    return item
  })

  const newPlan: WeeklyGroceryPlan = {
    ...plan,
    items: updatedItems,
  }
  return saveGroceryPlan(newPlan)
}

export function addCustomGroceryItem(
  plan: WeeklyGroceryPlan,
  custom: Omit<SmartGroceryItem, 'id' | 'isCustomItem' | 'isPurchased' | 'isVerifiedPrice'>
): WeeklyGroceryPlan {
  const newItem: SmartGroceryItem = {
    ...custom,
    id: `custom-g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    isCustomItem: true,
    isPurchased: false,
    isVerifiedPrice: false,
  }

  const combined = combineDuplicateIngredients([...plan.items, newItem])
  const newPlan: WeeklyGroceryPlan = {
    ...plan,
    items: combined,
  }
  return saveGroceryPlan(newPlan)
}

export function deleteGroceryItem(plan: WeeklyGroceryPlan, itemId: string): WeeklyGroceryPlan {
  const updatedItems = plan.items.filter((item) => item.id !== itemId)
  const newPlan: WeeklyGroceryPlan = {
    ...plan,
    items: updatedItems,
  }
  return saveGroceryPlan(newPlan)
}

export function getSavedBudgetSettings(): GroceryBudgetSettings {
  if (typeof window === 'undefined') return inMemoryBudget
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GROCERY_BUDGET_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return inMemoryBudget
}

export function saveBudgetSettings(settings: GroceryBudgetSettings): void {
  inMemoryBudget = settings
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_GROCERY_BUDGET_KEY, JSON.stringify(settings))
    } catch {
      // ignore
    }
  }
}

