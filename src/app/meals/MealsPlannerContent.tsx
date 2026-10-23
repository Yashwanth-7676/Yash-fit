'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Utensils,
  Search,
  Sparkles,
  Flame,
  Target,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  ShoppingCart,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import { INDIAN_FOOD_DATABASE, PRESET_MEAL_PLANS } from '@/data/indianFoods'
import type { FoodItem, MealPlanDay } from '@/types/nutrition'
import type { DietaryPreference } from '@/types/profile'
import type { GroceryItem } from '@/types/grocery'

const DIET_FILTER_TABS: (DietaryPreference | 'All')[] = [
  'All',
  'Vegetarian',
  'Eggetarian',
  'Non-Vegetarian',
]

interface CustomMeal {
  id: string
  name: string
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
  items: { foodId: string; name: string; quantity: number; protein: number; calories: number; carbs: number; fats: number; cost: number }[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  estimatedCostInr: number
  createdAt: string
}

export function MealsPlannerContent() {
  const toast = useToast()
  const [selectedPlanId, setSelectedPlanId] = useState(PRESET_MEAL_PLANS[0].id)
  const [foodSearch, setFoodSearch] = useState('')
  const [dietFilter, setDietFilter] = useState<DietaryPreference | 'All'>('All')
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null)

  // Custom meal modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customMealName, setCustomMealName] = useState('')
  const [customCategory, setCustomCategory] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Lunch')
  const [selectedIngredients, setSelectedIngredients] = useState<{ foodId: string; quantity: number }[]>([])
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([])

  // Load custom meals from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yashfit_custom_meals')
      if (stored) {
        setCustomMeals(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const activePlan =
    PRESET_MEAL_PLANS.find((p) => p.id === selectedPlanId) || PRESET_MEAL_PLANS[0]

  const filteredFoods = useMemo(() => {
    return INDIAN_FOOD_DATABASE.filter((food) => {
      const matchQuery = food.name.toLowerCase().includes(foodSearch.toLowerCase())
      const matchDiet = dietFilter === 'All' || food.dietaryPreference === dietFilter
      return matchQuery && matchDiet
    })
  }, [foodSearch, dietFilter])

  // Calculated totals for modal preview
  const currentModalTotals = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0
    let cost = 0

    selectedIngredients.forEach(({ foodId, quantity }) => {
      const food = INDIAN_FOOD_DATABASE.find((f) => f.id === foodId)
      if (food) {
        calories += food.calories * quantity
        protein += food.proteinGrams * quantity
        carbs += food.carbsGrams * quantity
        fats += food.fatsGrams * quantity
        cost += (food.costPerServingInr || 20) * quantity
      }
    })

    return {
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
      cost: Math.round(cost),
    }
  }, [selectedIngredients])

  const handleAddIngredient = (foodId: string) => {
    setSelectedIngredients((prev) => {
      const existing = prev.find((item) => item.foodId === foodId)
      if (existing) {
        return prev.map((item) =>
          item.foodId === foodId ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { foodId, quantity: 1 }]
    })
  }

  const handleRemoveIngredient = (foodId: string) => {
    setSelectedIngredients((prev) => prev.filter((item) => item.foodId !== foodId))
  }

  const handleSaveCustomMeal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customMealName.trim() || selectedIngredients.length === 0) {
      toast.warning('Please enter a meal name and add at least one ingredient.')
      return
    }

    const items = selectedIngredients.map(({ foodId, quantity }) => {
      const food = INDIAN_FOOD_DATABASE.find((f) => f.id === foodId)!
      return {
        foodId,
        name: food.name,
        quantity,
        protein: Math.round(food.proteinGrams * quantity),
        calories: Math.round(food.calories * quantity),
        carbs: Math.round(food.carbsGrams * quantity),
        fats: Math.round(food.fatsGrams * quantity),
        cost: Math.round((food.costPerServingInr || 20) * quantity),
      }
    })

    const newMeal: CustomMeal = {
      id: `custom-${Date.now()}`,
      name: customMealName.trim(),
      category: customCategory,
      items,
      totalCalories: currentModalTotals.calories,
      totalProtein: currentModalTotals.protein,
      totalCarbs: currentModalTotals.carbs,
      totalFats: currentModalTotals.fats,
      estimatedCostInr: currentModalTotals.cost,
      createdAt: new Date().toISOString(),
    }

    const updated = [newMeal, ...customMeals]
    setCustomMeals(updated)
    try {
      localStorage.setItem('yashfit_custom_meals', JSON.stringify(updated))
    } catch {
      // ignore
    }

    // Reset and close
    setCustomMealName('')
    setSelectedIngredients([])
    setIsModalOpen(false)
    toast.success('Custom meal saved!', `${newMeal.name} (${newMeal.totalProtein}g protein) added to your repertoire.`)
  }

  const handleDeleteCustomMeal = (id: string) => {
    const updated = customMeals.filter((m) => m.id !== id)
    setCustomMeals(updated)
    try {
      localStorage.setItem('yashfit_custom_meals', JSON.stringify(updated))
      toast.info('Meal removed')
    } catch {
      // ignore
    }
  }

  // Export custom meal ingredients directly to grocery list
  const handleExportToGrocery = (meal: CustomMeal) => {
    try {
      const existing: GroceryItem[] = JSON.parse(
        localStorage.getItem('yashfit_grocery_list') || '[]'
      )
      const newItems: GroceryItem[] = meal.items.map((item) => ({
        id: `grocery-${Date.now()}-${item.foodId}`,
        name: item.name,
        quantity: `${item.quantity} serving(s)`,
        category: 'Proteins',
        estimatedCostInr: item.cost,
        checked: false,
      }))
      const merged = [...existing, ...newItems]
      localStorage.setItem('yashfit_grocery_list', JSON.stringify(merged))
      toast.success('Grocery list updated!', `Added ${newItems.length} ingredients to your Smart Grocery Checklist.`)
    } catch {
      toast.error('Could not sync to grocery list')
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Indian Meal Planner &amp; Recipes</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore structured high-protein Indian diet plans, budget protein swaps, and custom meal creation.
          </p>
        </div>
        <Button size="md" onClick={() => setIsModalOpen(true)} icon={<Plus size={16} />}>
          Create Custom Meal
        </Button>
      </div>

      {/* Preset Meal Plans Selector Tabs */}
      <div className="space-y-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
          Curated Meal Plans
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_MEAL_PLANS.map((plan) => {
            const isSelected = plan.id === selectedPlanId
            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={[
                  'p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                  isSelected
                    ? 'border-lime-400 bg-lime-400/10 shadow-lg shadow-lime-400/5 ring-1 ring-lime-400'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-850',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {plan.dietaryPreference}
                    </span>
                    {isSelected && <CheckCircle2 size={16} className="text-lime-400" />}
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-snug">{plan.title}</h3>
                </div>
                <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span>~{plan.targetCalories} kcal</span>
                  <span className="text-lime-400 font-bold">{plan.targetProtein}g Protein</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Day Schedule Breakdown */}
      <Card className="p-6 md:p-8 space-y-6 border-zinc-800 bg-zinc-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <Badge variant="accent">{activePlan.dietaryPreference}</Badge>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">{activePlan.title}</h2>
          </div>
          <div className="text-right text-xs text-zinc-400">
            Total Target: <span className="font-bold text-lime-400">{activePlan.targetProtein}g Protein</span> / {activePlan.targetCalories} kcal
          </div>
        </div>

        {/* 4 Meal Timings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlan.meals.map((mealGroup) => (
            <div
              key={mealGroup.type}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Utensils size={15} className="text-lime-400" />
                  {mealGroup.type}
                </h3>
                <span className="text-xs text-zinc-500 font-medium">
                  {mealGroup.foods.reduce((acc, f) => acc + f.calories, 0)} kcal
                </span>
              </div>

              <div className="space-y-2">
                {mealGroup.foods.map((food, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{food.name}</span>
                      <span className="text-zinc-500">{food.servingSize}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lime-400 font-bold block">{food.proteinGrams}g P</span>
                      <span className="text-zinc-500">{food.calories} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Indian Food Explorer & Kitchen-to-Meal Recipes */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Indian Food &amp; Protein Database</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified macros, budget estimations in INR, and quick high-protein cooking cues.
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DIET_FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setDietFilter(tab)}
                className={[
                  'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  dietFilter === tab
                    ? 'bg-lime-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <Input
          placeholder="Search Indian foods (e.g. Soya chunks, Paneer, Boiled eggs, Dal)..."
          value={foodSearch}
          onChange={(e) => setFoodSearch(e.target.value)}
          leftIcon={<Search size={16} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFoods.map((food) => {
            const isExpanded = expandedRecipeId === food.id
            return (
              <div
                key={food.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {food.dietaryPreference}
                    </span>
                    {food.isBudgetFriendly && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 flex items-center gap-1">
                        Budget Hero · ₹{food.costPerServingInr}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white">{food.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Portion: {food.servingSize}</p>
                </div>

                {/* Macro Pills */}
                <div className="grid grid-cols-4 gap-1.5 bg-zinc-950/60 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Calories</span>
                    <span className="font-bold text-white">{food.calories}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Protein</span>
                    <span className="font-bold text-lime-400">{food.proteinGrams}g</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Carbs</span>
                    <span className="font-bold text-amber-400">{food.carbsGrams}g</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Fats</span>
                    <span className="font-bold text-rose-400">{food.fatsGrams}g</span>
                  </div>
                </div>

                {/* Recipe expansion */}
                {food.recipeSteps && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedRecipeId(isExpanded ? null : food.id)}
                      className="w-full text-xs text-zinc-400 hover:text-white pt-2 border-t border-zinc-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <ChefHat size={14} className="text-lime-400" />
                        Kitchen-to-Meal Prep
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800/90 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                        {food.recipeSteps.map((step, idx) => (
                          <p key={idx}>
                            <span className="text-lime-400 font-bold">{idx + 1}.</span> {step}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Your Custom Created Meals Section */}
      {customMeals.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-lime-400" /> Your Custom Meals
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Saved personalized recipes with calculated macros and one-click grocery checklist syncing.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)} icon={<Plus size={14} />}>
              Add Another
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customMeals.map((meal) => (
              <Card key={meal.id} className="p-5 space-y-4 border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="accent">{meal.category}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExportToGrocery(meal)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-lime-400 hover:bg-zinc-800 transition-colors"
                        title="Add ingredients to Grocery List"
                        aria-label="Add to grocery"
                      >
                        <ShoppingCart size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomMeal(meal.id)}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                        title="Delete meal"
                        aria-label="Delete meal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white">{meal.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {meal.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="grid grid-cols-4 gap-1.5 bg-zinc-950/70 p-2.5 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Calories</span>
                      <span className="font-bold text-white">{meal.totalCalories}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Protein</span>
                      <span className="font-bold text-lime-400">{meal.totalProtein}g</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Carbs</span>
                      <span className="font-bold text-amber-400">{meal.totalCarbs}g</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Cost</span>
                      <span className="font-bold text-emerald-400">₹{meal.estimatedCostInr}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    fullWidth
                    onClick={() => handleExportToGrocery(meal)}
                    icon={<ShoppingCart size={14} />}
                  >
                    Send to Grocery Planner
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Meal Creation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Custom Indian Meal"
        description="Select high-protein ingredients to automatically compute calories, macros, and estimated basket cost."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveCustomMeal} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Meal Name"
              placeholder="e.g. Soya & Paneer Power Bowl"
              value={customMealName}
              onChange={(e) => setCustomMealName(e.target.value)}
              required
            />
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-1.5">Meal Timing</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as any)}
                className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
          </div>

          {/* Selected Ingredients List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Selected Ingredients ({selectedIngredients.length})
            </span>
            {selectedIngredients.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Click ingredients below to add them to your custom meal.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {selectedIngredients.map(({ foodId, quantity }) => {
                  const food = INDIAN_FOOD_DATABASE.find((f) => f.id === foodId)
                  if (!food) return null
                  return (
                    <div
                      key={foodId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">{food.name}</span>
                        <span className="text-zinc-500">
                          {food.calories * quantity} kcal · {food.proteinGrams * quantity}g Protein · ₹{(food.costPerServingInr || 20) * quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300 font-semibold">
                          x{quantity} serving
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(foodId)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          aria-label="Remove ingredient"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Ingredient Selector Quick Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Add High-Protein Staples
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {INDIAN_FOOD_DATABASE.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleAddIngredient(food.id)}
                  className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:border-lime-400/50 hover:bg-zinc-850 text-left transition-colors cursor-pointer group"
                >
                  <p className="text-xs font-medium text-white truncate group-hover:text-lime-400">
                    + {food.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {food.proteinGrams}g P · {food.calories} kcal
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Live Nutrition Summary Strip */}
          <div className="p-3.5 rounded-xl bg-lime-400/10 border border-lime-400/20 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-zinc-400 text-[10px] block">Calories</span>
              <span className="font-bold text-white text-sm">{currentModalTotals.calories} kcal</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Protein</span>
              <span className="font-bold text-lime-400 text-sm">{currentModalTotals.protein}g</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Carbs</span>
              <span className="font-bold text-amber-400 text-sm">{currentModalTotals.carbs}g</span>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px] block">Est. Cost</span>
              <span className="font-bold text-emerald-400 text-sm">₹{currentModalTotals.cost}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedIngredients.length === 0 || !customMealName.trim()}>
              Save Custom Meal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

