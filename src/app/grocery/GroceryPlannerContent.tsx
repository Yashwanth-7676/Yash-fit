'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Trash2,
  RotateCcw,
  Check,
  SlidersHorizontal,
  Download,
} from 'lucide-react'
import { Card, Badge, Button, Input, SectionHeading, Modal, useToast } from '@/components/ui'
import { INITIAL_GROCERY_ITEMS } from '@/data/groceryItems'
import { PRESET_MEAL_PLANS } from '@/data/indianFoods'
import type { GroceryItem, GroceryCategory } from '@/types/grocery'

const CATEGORIES: (GroceryCategory | 'All')[] = [
  'All',
  'Proteins',
  'Carbs & Grains',
  'Produce & Vegetables',
  'Dairy & Pantry',
  'Supplements',
]

export function GroceryPlannerContent() {
  const toast = useToast()
  const [items, setItems] = useState<GroceryItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yashfit_grocery_list')
        if (saved) return JSON.parse(saved)
      } catch {
        // ignore
      }
    }
    return INITIAL_GROCERY_ITEMS
  })

  const [activeCategory, setActiveCategory] = useState<GroceryCategory | 'All'>('All')
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('')
  const [newItemCost, setNewItemCost] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<GroceryCategory>('Proteins')

  // Budget Limit state
  const [budgetLimit, setBudgetLimit] = useState<number>(1500)
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [tempBudgetInput, setTempBudgetInput] = useState('1500')

  useEffect(() => {
    try {
      const savedBudget = localStorage.getItem('yashfit_weekly_budget_limit')
      if (savedBudget) {
        const parsed = parseFloat(savedBudget)
        if (!isNaN(parsed) && parsed > 0) {
          setBudgetLimit(parsed)
          setTempBudgetInput(String(parsed))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Save to local state and localStorage
  const saveItems = (updated: GroceryItem[]) => {
    setItems(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yashfit_grocery_list', JSON.stringify(updated))
      } catch {
        // ignore
      }
    }
  }

  const handleToggle = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    saveItems(updated)
  }

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    saveItems(updated)
    toast.info('Item removed from shopping list')
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName.trim()) return

    const newItem: GroceryItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      quantity: newItemQty.trim() || '1 pack',
      category: newItemCategory,
      estimatedCostInr: parseFloat(newItemCost) || 50,
      checked: false,
    }

    saveItems([...items, newItem])
    setNewItemName('')
    setNewItemQty('')
    setNewItemCost('')
    toast.success('Item added! 🛒', `${newItem.name} added to ${newItem.category}.`)
  }

  const handleImportMealPlan = (planId: string) => {
    const plan = PRESET_MEAL_PLANS.find((p) => p.id === planId)
    if (!plan) return

    const imported: GroceryItem[] = []
    plan.meals.forEach((group) => {
      group.foods.forEach((food) => {
        imported.push({
          id: `imported-${Date.now()}-${food.id}`,
          name: food.name,
          quantity: food.servingSize,
          category: 'Proteins',
          estimatedCostInr: food.costPerServingInr || 40,
          checked: false,
        })
      })
    })

    // Merge without duplicates by name
    const existingNames = new Set(items.map((i) => i.name.toLowerCase()))
    const uniqueImported = imported.filter((i) => !existingNames.has(i.name.toLowerCase()))

    saveItems([...items, ...uniqueImported])
    toast.success('Meal plan imported! 🥗', `Added ${uniqueImported.length} items from ${plan.title}.`)
  }

  const handleResetDefaults = () => {
    saveItems(INITIAL_GROCERY_ITEMS)
    toast.info('List reset to weekly defaults')
  }

  const handleClearCompleted = () => {
    const remaining = items.filter((i) => !i.checked)
    saveItems(remaining)
    toast.info('Checked items cleared')
  }

  const handleSaveBudgetLimit = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(tempBudgetInput)
    if (!isNaN(val) && val > 0) {
      setBudgetLimit(val)
      try {
        localStorage.setItem('yashfit_weekly_budget_limit', String(val))
      } catch {
        // ignore
      }
      setIsEditingBudget(false)
      toast.success('Budget Limit Updated', `Weekly budget cap set to ₹${val.toLocaleString()}`)
    }
  }

  // Cost calculations
  const totalCost = items.reduce((acc, item) => acc + item.estimatedCostInr, 0)
  const checkedCost = items
    .filter((i) => i.checked)
    .reduce((acc, item) => acc + item.estimatedCostInr, 0)
  const totalItems = items.length
  const completedItems = items.filter((i) => i.checked).length
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
  const remainingBudget = budgetLimit - totalCost

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items
    return items.filter((i) => i.category === activeCategory)
  }, [items, activeCategory])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Smart Grocery Planner</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Budget-optimized Indian fitness shopping list calibrated directly from your meal plans.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setIsEditingBudget(true)} icon={<SlidersHorizontal size={14} />}>
            Set Budget Cap
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetDefaults} icon={<RotateCcw size={14} />}>
            Reset Defaults
          </Button>
          {completedItems > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearCompleted}>
              Clear Checked
            </Button>
          )}
        </div>
      </div>

      {/* Budget & Progress Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <Card className="p-5 space-y-2 border-lime-400/20 bg-gradient-to-br from-zinc-900 to-zinc-900/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-lime-400 block">
            Estimated Weekly Basket
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">₹{totalCost.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">/ week</span>
          </div>
          <p className="text-xs text-zinc-400">
            ~₹{Math.round(totalCost * 4.2).toLocaleString()} projected monthly nutrition.
          </p>
        </Card>

        {/* Budget Cap & Remaining */}
        <Card className="p-5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
              Budget Cap
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">₹{budgetLimit} target</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold ${
                remainingBudget >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              ₹{remainingBudget.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500">remaining</span>
          </div>
          <p className="text-xs text-zinc-400">
            {remainingBudget >= 0 ? 'Within weekly budget limit' : '⚠️ Exceeding weekly budget target'}
          </p>
        </Card>

        {/* Checked Total */}
        <Card className="p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
            Purchased in Basket
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">₹{checkedCost.toLocaleString()}</span>
            <span className="text-xs text-zinc-500">/ ₹{totalCost}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {completedItems} of {totalItems} items ticked off in store.
          </p>
        </Card>

        {/* Shopping Progress */}
        <Card className="p-5 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-300">Shopping Progress</span>
            <span className="text-lime-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-lime-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            {totalItems - completedItems > 0
              ? `${totalItems - completedItems} items remaining on shopping checklist`
              : 'All grocery shopping complete! 🛒'}
          </p>
        </Card>
      </div>

      {/* Quick Import from Curated Meal Plans Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-lime-400/10 text-lime-400 shrink-0">
            <Download size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Quick Sync from Curated Meal Plans</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Auto-generate shopping checklist ingredients based on your diet preferences.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleImportMealPlan('plan-veg-high-protein')}>
            + Vegetarian Plan
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleImportMealPlan('plan-eggetarian-muscle')}>
            + Eggetarian Plan
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleImportMealPlan('plan-nonveg-lean-gains')}>
            + Non-Veg Plan
          </Button>
        </div>
      </div>

      {/* Add Item Form */}
      <Card className="p-5 space-y-4">
        <SectionHeading title="Add Custom Item" subtitle="Insert custom staples, snacks, or supplements" />
        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <Input
              placeholder="Item name (e.g. Peanut Butter)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Input
              placeholder="Quantity (e.g. 1 kg)..."
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              type="number"
              placeholder="Est. ₹..."
              value={newItemCost}
              onChange={(e) => setNewItemCost(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as GroceryCategory)}
              className="w-full h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              <option value="Proteins">Proteins</option>
              <option value="Carbs & Grains">Carbs & Grains</option>
              <option value="Produce & Vegetables">Produce & Vegetables</option>
              <option value="Dairy & Pantry">Dairy & Pantry</option>
              <option value="Supplements">Supplements</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <Button type="submit" fullWidth icon={<Plus size={16} />}>
              Add
            </Button>
          </div>
        </form>
      </Card>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border',
                isSelected
                  ? 'border-lime-400 bg-lime-400/15 text-lime-400 ring-1 ring-lime-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700',
              ].join(' ')}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Interactive Grocery Checklist */}
      <div className="space-y-2.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={[
              'flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer',
              item.checked
                ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <div
                className={[
                  'w-5 h-5 rounded-md flex items-center justify-center border transition-colors',
                  item.checked
                    ? 'bg-lime-400 border-lime-400 text-zinc-950'
                    : 'border-zinc-700 bg-zinc-800',
                ].join(' ')}
              >
                {item.checked && <Check size={14} className="stroke-[3]" />}
              </div>

              <div>
                <span
                  className={[
                    'text-sm font-semibold transition-all',
                    item.checked ? 'line-through text-zinc-500' : 'text-white',
                  ].join(' ')}
                >
                  {item.name}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                  <span>{item.quantity}</span>
                  <span>•</span>
                  <span className="text-zinc-500">{item.category}</span>
                  {item.isEssentialProtein && (
                    <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                      High Protein
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm font-bold text-white font-mono">
                ₹{item.estimatedCostInr}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 transition-colors"
                aria-label="Delete item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <Card className="text-center py-12 text-zinc-400 text-sm">
            No items in this category. Click &quot;Add Custom Item&quot; above to add more.
          </Card>
        )}
      </div>
      {/* Budget Limit Modal */}
      <Modal
        isOpen={isEditingBudget}
        onClose={() => setIsEditingBudget(false)}
        title="Set Weekly Grocery Budget Target"
        description="Configure your weekly spend limit in INR. YashFit will calculate remaining funds and monitor spend."
        maxWidth="sm"
      >
        <form onSubmit={handleSaveBudgetLimit} className="space-y-4">
          <Input
            label="Weekly Budget Cap (₹ INR)"
            type="number"
            min="200"
            max="20000"
            step="50"
            value={tempBudgetInput}
            onChange={(e) => setTempBudgetInput(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsEditingBudget(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save Target
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

