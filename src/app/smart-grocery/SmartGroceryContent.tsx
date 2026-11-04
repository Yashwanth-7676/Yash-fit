'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  ArrowRight,
  Carrot,
  Apple,
  Wheat,
  Milk,
  Beef,
  Flame,
  Package,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  getSavedGroceryPlan,
  saveGroceryPlan,
  toggleItemPurchased,
  applySubstitution,
  addCustomGroceryItem,
  deleteGroceryItem,
  getSavedBudgetSettings,
  saveBudgetSettings,
  generateWeeklyGroceryList,
  DEFAULT_BUDGET_SETTINGS,
} from '@/lib/smart-grocery/smartGroceryService'
import type {
  SmartGroceryCategory,
  GroceryBudgetSettings,
  WeeklyGroceryPlan,
} from '@/types/smartGrocery'

const CATEGORY_ICONS: Record<SmartGroceryCategory, React.ElementType> = {
  vegetables: Carrot,
  fruits: Apple,
  grains: Wheat,
  dairy: Milk,
  protein: Beef,
  pantry_spices: Flame,
  other: Package,
}

const CATEGORY_COLORS: Record<SmartGroceryCategory, string> = {
  vegetables: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  fruits: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  grains: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  dairy: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  protein: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
  pantry_spices: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  other: 'text-zinc-400 bg-zinc-800 border-zinc-700',
}

export function SmartGroceryContent() {
  const toast = useToast()

  // State
  const [plan, setPlan] = useState<WeeklyGroceryPlan | null>(null)
  const [budgetSettings, setBudgetSettings] = useState<GroceryBudgetSettings>(DEFAULT_BUDGET_SETTINGS)
  const [activeCategory, setActiveCategory] = useState<SmartGroceryCategory | 'all'>('all')
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Custom Item Form State
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState('1')
  const [customUnit, setCustomUnit] = useState('kg')
  const [customCategory, setCustomCategory] = useState<SmartGroceryCategory>('vegetables')
  const [customPrice, setCustomPrice] = useState('50')

  // Temp Settings State
  const [tempWeeklyBudget, setTempWeeklyBudget] = useState('2200')
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState('9000')

  useEffect(() => {
    const loadedPlan = getSavedGroceryPlan()
    const loadedBudget = getSavedBudgetSettings()
    setPlan(loadedPlan)
    setBudgetSettings(loadedBudget)
    setTempWeeklyBudget(String(loadedBudget.weeklyBudgetInr))
    setTempMonthlyBudget(String(loadedBudget.monthlyBudgetInr))
  }, [])

  // Toggle purchased state
  const handleToggle = (itemId: string) => {
    if (!plan) return
    const updated = toggleItemPurchased(plan, itemId)
    setPlan(updated)
  }

  // Apply affordable substitution
  const handleSubstitution = (itemId: string) => {
    if (!plan) return
    const updated = applySubstitution(plan, itemId)
    setPlan(updated)
    toast.success(
      'Affordable Substitution Applied',
      'Grocery item updated with reduced cost estimate.'
    )
  }

  // Remove item
  const handleDelete = (itemId: string) => {
    if (!plan) return
    const updated = deleteGroceryItem(plan, itemId)
    setPlan(updated)
    toast.info('Item Removed', 'Grocery item removed from current list.')
  }

  // Regenerate list
  const handleRegenerate = () => {
    const fresh = generateWeeklyGroceryList(plan?.dietaryPreference || 'Vegetarian', budgetSettings.weeklyBudgetInr)
    saveGroceryPlan(fresh)
    setPlan(fresh)
    toast.success('List Regenerated', 'Consolidated grocery list synthesized from meal plan.')
  }

  // Add Custom Item
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!plan || !customName.trim()) return

    const updated = addCustomGroceryItem(plan, {
      name: customName.trim(),
      quantity: Number(customQty) || 1,
      unit: customUnit,
      category: customCategory,
      estimatedPriceInr: Number(customPrice) || 0,
    })

    setPlan(updated)
    setCustomName('')
    setCustomQty('1')
    setCustomPrice('50')
    setIsCustomModalOpen(false)
    toast.success('Custom Item Added', `${customName} added to grocery checklist.`)
  }

  // Save budget settings
  const handleSaveBudget = () => {
    const newSettings: GroceryBudgetSettings = {
      ...budgetSettings,
      weeklyBudgetInr: Number(tempWeeklyBudget) || 2200,
      monthlyBudgetInr: Number(tempMonthlyBudget) || 9000,
    }
    saveBudgetSettings(newSettings)
    setBudgetSettings(newSettings)
    if (plan) {
      const updatedPlan = { ...plan, budgetLimitInr: newSettings.weeklyBudgetInr }
      saveGroceryPlan(updatedPlan)
      setPlan(updatedPlan)
    }
    setIsSettingsModalOpen(false)
    toast.success('Budget Settings Saved', 'Grocery targets calibrated.')
  }

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!plan) return []
    if (activeCategory === 'all') return plan.items
    return plan.items.filter((item) => item.category === activeCategory)
  }, [plan, activeCategory])

  // Items with available substitutions
  const substitutionItems = useMemo(() => {
    if (!plan) return []
    return plan.items.filter((item) => item.suggestedSubstitution && !item.isPurchased)
  }, [plan])

  if (!plan) return null

  const isUnderBudget = plan.totalEstimatedCostInr <= plan.budgetLimitInr
  const budgetSpentPct = Math.min(
    100,
    Math.round((plan.totalActualCostInr / plan.budgetLimitInr) * 100)
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Smart Grocery & Budget Intelligence
                <Badge variant="accent" className="text-xs font-semibold">
                  INR REGIONAL
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Automated weekly ingredient consolidation, budget tracking & affordable Indian substitutions
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Regenerate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsModalOpen(true)}
            icon={<Settings className="w-4 h-4" />}
          >
            Budget Target
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCustomModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Budget Tracking Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Budget Cap */}
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block">Weekly Budget Cap</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white">
              ₹{plan.budgetLimitInr.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-mono">allocated</span>
          </div>
          <span className="text-[11px] text-zinc-500 block pt-1">
            Monthly Target: ₹{budgetSettings.monthlyBudgetInr.toLocaleString()}
          </span>
        </Card>

        {/* Estimated Shopping Cost */}
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block">Estimated Total Cost</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-lime-400">
              ₹{plan.totalEstimatedCostInr.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-mono">INR</span>
          </div>
          <Badge variant={isUnderBudget ? 'success' : 'danger'} className="text-[10px] mt-1">
            {isUnderBudget
              ? `₹${plan.budgetLimitInr - plan.totalEstimatedCostInr} Under Target`
              : `₹${plan.totalEstimatedCostInr - plan.budgetLimitInr} Above Target`}
          </Badge>
        </Card>

        {/* Actual Spent so Far */}
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
          <span className="text-xs text-zinc-400 uppercase tracking-wider block">Actual Spent (Purchased)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-sky-400">
              ₹{plan.totalActualCostInr.toLocaleString()}
            </span>
            <span className="text-xs text-zinc-500 font-mono">confirmed</span>
          </div>
          <span className="text-[11px] text-zinc-500 block pt-1">
            {plan.items.filter((i) => i.isPurchased).length} of {plan.items.length} items checked
          </span>
        </Card>

        {/* Budget Progress Meter */}
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 uppercase tracking-wider">Budget Spent</span>
            <span className="font-mono text-white font-bold">{budgetSpentPct}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetSpentPct > 90 ? 'bg-rose-500' : 'bg-lime-400'
              }`}
              style={{ width: `${budgetSpentPct}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 block font-mono">
            ₹{Math.max(0, plan.budgetLimitInr - plan.totalActualCostInr)} remaining in weekly cap
          </span>
        </Card>
      </div>

      {/* Suggested Affordable Substitutions Banner */}
      {substitutionItems.length > 0 && (
        <Card className="p-5 border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <h3 className="text-sm font-bold text-white">
                Affordable Ingredient Substitutions Available
              </h3>
            </div>
            <Badge variant="accent" className="text-[10px]">
              BUDGET OPTIMIZER
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {substitutionItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-zinc-400 line-through">{item.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                    <span className="text-white font-semibold">
                      {item.suggestedSubstitution?.alternativeName}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {item.suggestedSubstitution?.reason}
                  </p>
                  <span className="inline-block text-[11px] font-mono font-bold text-emerald-400">
                    Saves ~₹{item.suggestedSubstitution?.savingsInr}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubstitution(item.id)}
                  className="shrink-0 text-xs text-lime-400 border-lime-400/30 hover:bg-lime-400/10"
                >
                  Apply
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-lime-400 text-zinc-950 font-bold'
              : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          All Items ({plan.items.length})
        </button>
        {(
          [
            'vegetables',
            'fruits',
            'grains',
            'dairy',
            'protein',
            'pantry_spices',
          ] as SmartGroceryCategory[]
        ).map((cat) => {
          const count = plan.items.filter((i) => i.category === cat).length
          if (count === 0) return null
          const active = activeCategory === cat

          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                active
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat.replace('_', ' ')} ({count})
            </button>
          )
        })}
      </div>

      {/* Interactive Grocery Checklist */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const Icon = CATEGORY_ICONS[item.category] || Package
          const colorClass = CATEGORY_COLORS[item.category] || 'text-zinc-400 bg-zinc-800'

          return (
            <Card
              key={item.id}
              className={`p-4 transition-all duration-200 border ${
                item.isPurchased
                  ? 'bg-zinc-900/40 border-zinc-800/50 opacity-60'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Checkbox & Name */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="text-zinc-500 hover:text-lime-400 transition-colors focus:outline-none shrink-0"
                    title={item.isPurchased ? 'Mark unpurchased' : 'Mark purchased'}
                  >
                    {item.isPurchased ? (
                      <CheckCircle2 className="w-5 h-5 text-lime-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colorClass}`}
                      >
                        <Icon className="w-3 h-3" />
                        {item.category.replace('_', ' ')}
                      </span>

                      {item.isCustomItem && (
                        <Badge variant="default" className="text-[10px]">
                          CUSTOM
                        </Badge>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold truncate ${
                        item.isPurchased ? 'line-through text-zinc-500' : 'text-white'
                      }`}
                    >
                      {item.name}
                    </h4>

                    <span className="text-xs text-zinc-400 font-mono">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                </div>

                {/* Right: Price & Delete */}
                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="text-right font-mono">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-sm font-bold text-white">
                        ₹{item.estimatedPriceInr}
                      </span>
                      <Badge
                        variant={item.isVerifiedPrice ? 'success' : 'default'}
                        className="text-[9px] px-1 py-0"
                      >
                        {item.isVerifiedPrice ? 'VERIFIED' : 'EST'}
                      </Badge>
                    </div>
                    {item.isPurchased && item.actualPriceInr !== undefined && (
                      <span className="text-[10px] text-zinc-500 block">
                        Paid: ₹{item.actualPriceInr}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Add Custom Item Modal */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Add Custom Grocery Item"
      >
        <form onSubmit={handleAddCustom} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Item Name</label>
            <Input
              type="text"
              required
              placeholder="e.g. Almond Milk, Chia Seeds, Flax Seeds"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Quantity</label>
              <Input
                type="number"
                step="any"
                min="0.1"
                required
                value={customQty}
                onChange={(e) => setCustomQty(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Unit</label>
              <select
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-lime-400"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="liters">liters</option>
                <option value="pack">pack</option>
                <option value="bunches">bunches</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Category</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as SmartGroceryCategory)}
                className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-lime-400"
              >
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="grains">Grains & Lentils</option>
                <option value="dairy">Dairy</option>
                <option value="protein">Protein</option>
                <option value="pantry_spices">Pantry & Spices</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Estimated Price (₹ INR)</label>
              <Input
                type="number"
                min="0"
                required
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCustomModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Add to Checklist
            </Button>
          </div>
        </form>
      </Modal>

      {/* Budget Preferences Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Grocery Budget Settings"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Configure your shopping spending ceilings. The smart optimizer alerts you when weekly ingredients approach budget thresholds.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Weekly Budget (₹ INR)</label>
              <Input
                type="number"
                value={tempWeeklyBudget}
                onChange={(e) => setTempWeeklyBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Monthly Budget (₹ INR)</label>
              <Input
                type="number"
                value={tempMonthlyBudget}
                onChange={(e) => setTempMonthlyBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveBudget}>
              Save Targets
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

