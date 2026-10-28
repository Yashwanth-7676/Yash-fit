'use client'

import React, { useState, useEffect } from 'react'
import {
  Salad,
  Flame,
  Zap,
  Droplet,
  ShoppingCart,
  Calendar,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  IndianRupee,
  Layers,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import {
  getActiveNutritionPlan,
  createOrUpdateNutritionPlan,
} from '@/lib/nutrition/nutritionPlannerService'
import { getUserProfile } from '@/lib/profileService'
import { awardXp } from '@/lib/rpg/rpgService'
import type {
  NutritionPlanV2,
  RegionalPreference,
  BudgetTier,
} from '@/types/nutritionPlanner'
import type { UserProfile } from '@/types/profile'

const REGIONAL_OPTIONS: { id: RegionalPreference; label: string; tag: string }[] = [
  { id: 'North Indian', label: 'North Indian', tag: 'Paneer, Chana & Dals' },
  { id: 'South Indian', label: 'South Indian', tag: 'Pesarattu, Sambar & Millets' },
  { id: 'East Indian', label: 'East Indian', tag: 'Sattu, Fish & Sprouts' },
  { id: 'West Indian', label: 'West Indian', tag: 'Usal, Thepla & Bhakri' },
  { id: 'High-Protein Modern', label: 'High-Protein Modern', tag: 'Pro-Oats, Soya & Quinoa' },
]

const BUDGET_OPTIONS: { id: BudgetTier; label: string; desc: string }[] = [
  { id: 'Budget-Friendly', label: 'Budget-Friendly', desc: 'Soya, Sattu, Eggs, Chana (~₹120-180/day)' },
  { id: 'Moderate', label: 'Moderate', desc: 'Paneer, Curd, Dals, Sprouts (~₹200-280/day)' },
  { id: 'Premium', label: 'Premium', desc: 'Whey, Quinoa, Fish/Chicken, Nuts (~₹320-450/day)' },
]

export function NutritionPlannerContent() {
  const toast = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<NutritionPlanV2 | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'meals' | 'grocery' | 'substitutions' | 'prep'>('meals')
  const [copiedGrocery, setCopiedGrocery] = useState(false)
  const [adherenceLogged, setAdherenceLogged] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const p = await getUserProfile('demo-user')
      setProfile(p)
      const currentPlan = await getActiveNutritionPlan(p?.user_id || 'demo-user', p)
      setPlan(currentPlan)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleUpdatePreference = async (regional: RegionalPreference, budget: BudgetTier) => {
    setLoading(true)
    const newPlan = await createOrUpdateNutritionPlan(
      profile?.user_id || 'demo-user',
      profile,
      regional,
      budget
    )
    setPlan(newPlan)
    setLoading(false)
    toast.showToast({
      title: 'Nutrition Plan Updated',
      message: `Generated custom ${regional} meal schedule (${budget}).`,
      type: 'success',
    })
  }

  const handleCopyGroceryList = () => {
    if (!plan) return
    const text = plan.groceryList
      .map((g) => `- ${g.name}: ${g.quantityText} (~₹${g.estimatedCostInr})`)
      .join('\n')
    const total = plan.groceryList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0)
    const fullText = `YashFit Weekly Grocery List (${plan.regionalPreference})\nEstimated Total: ₹${total}\n\n${text}`

    navigator.clipboard.writeText(fullText)
    setCopiedGrocery(true)
    setTimeout(() => setCopiedGrocery(false), 2500)
    toast.showToast({
      title: 'Copied to Clipboard',
      message: 'Weekly grocery list ready to share on WhatsApp or Keep.',
      type: 'info',
    })
  }

  const handleLogAdherence = () => {
    if (adherenceLogged || !plan) return
    const today = new Date().toISOString().split('T')[0]
    const res = awardXp(
      'nutrition',
      60,
      `Hit Indian Nutrition Plan (${plan.regionalPreference})`,
      `nutrition_v2_${today}`
    )
    setAdherenceLogged(true)
    toast.showToast({
      title: res.success ? '+60 XP Awarded!' : 'Daily Check-in Recorded',
      message: 'Nutrition adherence logged. Consistency builds champions!',
      type: 'success',
    })
  }

  if (loading && !plan) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center space-y-4">
        <RefreshCw size={32} className="animate-spin text-lime-400 mx-auto" />
        <p className="text-zinc-400 text-sm">Synthesizing personalized Indian Nutrition Intelligence...</p>
      </div>
    )
  }

  const totalWeeklyGroceryCost = plan?.groceryList.reduce((sum, item) => sum + item.estimatedCostInr, 0) || 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Nutrition Intelligence 2.0</Badge>
            <span className="text-xs text-zinc-500 font-medium">Regional Indian Science</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Indian Nutrition Planner</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            High-protein, budget-aligned meal blueprints spanning North, South, East, West Indian, and Modern fitness cuisines.
          </p>
        </div>

        {/* Adherence Check-in button */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant={adherenceLogged ? 'outline' : 'primary'}
            className={
              adherenceLogged
                ? 'border-lime-500/50 text-lime-400 bg-lime-950/20'
                : 'bg-lime-400 hover:bg-lime-500 text-black font-bold'
            }
            onClick={handleLogAdherence}
            disabled={adherenceLogged}
          >
            {adherenceLogged ? (
              <>
                <CheckCircle2 size={16} className="mr-1.5" /> Adherence Logged (+60 XP)
              </>
            ) : (
              <>
                <Check size={16} className="mr-1.5" /> Mark Today&apos;s Meals Followed
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Macro Target Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 bg-zinc-900/90 border-zinc-800 text-center">
          <div className="flex items-center justify-center text-amber-400 mb-1">
            <Flame size={18} />
          </div>
          <span className="text-xl font-mono font-extrabold text-white block">
            {plan?.dailyCalories || 2200}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Calories</span>
        </Card>

        <Card className="p-4 bg-zinc-900/90 border-zinc-800 text-center">
          <div className="flex items-center justify-center text-lime-400 mb-1">
            <Zap size={18} />
          </div>
          <span className="text-xl font-mono font-extrabold text-lime-400 block">
            {plan?.dailyProtein || 140}g
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Protein Target</span>
        </Card>

        <Card className="p-4 bg-zinc-900/90 border-zinc-800 text-center">
          <div className="flex items-center justify-center text-sky-400 mb-1">
            <Layers size={18} />
          </div>
          <span className="text-xl font-mono font-extrabold text-white block">
            {plan?.dailyCarbs || 230}g
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Complex Carbs</span>
        </Card>

        <Card className="p-4 bg-zinc-900/90 border-zinc-800 text-center">
          <div className="flex items-center justify-center text-rose-400 mb-1">
            <Salad size={18} />
          </div>
          <span className="text-xl font-mono font-extrabold text-white block">
            {plan?.dailyFats || 65}g
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Healthy Fats</span>
        </Card>

        <Card className="p-4 bg-zinc-900/90 border-zinc-800 text-center col-span-2 sm:col-span-1">
          <div className="flex items-center justify-center text-cyan-400 mb-1">
            <Droplet size={18} />
          </div>
          <span className="text-xl font-mono font-extrabold text-cyan-400 block">
            {plan?.dailyWaterLiters || 3.0}L
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Hydration</span>
        </Card>
      </div>

      {/* Regional Preference & Budget Bar */}
      <Card className="p-5 bg-zinc-950 border-zinc-800 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
            Select Regional Cuisine
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {REGIONAL_OPTIONS.map((reg) => {
              const active = plan?.regionalPreference === reg.id
              return (
                <button
                  key={reg.id}
                  onClick={() => handleUpdatePreference(reg.id, plan?.budgetTier || 'Moderate')}
                  className={`p-3 rounded-xl border text-left transition ${
                    active
                      ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span className="text-xs font-bold block">{reg.label}</span>
                  <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{reg.tag}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
            Budget Tier
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {BUDGET_OPTIONS.map((bg) => {
              const active = plan?.budgetTier === bg.id
              return (
                <button
                  key={bg.id}
                  onClick={() => handleUpdatePreference(plan?.regionalPreference || 'North Indian', bg.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    active
                      ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{bg.label}</span>
                    <IndianRupee size={14} className={active ? 'text-lime-400' : 'text-zinc-500'} />
                  </div>
                  <span className="text-[11px] text-zinc-500 block mt-1">{bg.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('meals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'meals'
              ? 'bg-lime-400 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Calendar size={14} /> Daily Meal Schedule
        </button>

        <button
          onClick={() => setActiveTab('grocery')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'grocery'
              ? 'bg-lime-400 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <ShoppingCart size={14} /> Weekly Grocery List
        </button>

        <button
          onClick={() => setActiveTab('substitutions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'substitutions'
              ? 'bg-lime-400 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <ArrowRightLeft size={14} /> Ingredient Swaps
        </button>

        <button
          onClick={() => setActiveTab('prep')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'prep'
              ? 'bg-lime-400 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Clock size={14} /> Meal Prep Guide
        </button>
      </div>

      {/* TAB 1: MEAL SCHEDULE */}
      {activeTab === 'meals' && plan && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.meals.map((course) => (
              <Card
                key={course.type}
                className="p-5 bg-zinc-900/80 border-zinc-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-lime-400 px-2 py-0.5 rounded bg-lime-400/10 border border-lime-400/20">
                      {course.type}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      ~₹{course.estimatedCostInr} / serving
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-3">{course.name}</h3>

                  <div className="space-y-2 mb-4">
                    {course.foods.map((food) => (
                      <div
                        key={food.id}
                        className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-zinc-200 block">{food.name}</span>
                          <span className="text-[11px] text-zinc-500">{food.servingSize}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-lime-400 font-bold block">+{food.proteinGrams}g P</span>
                          <span className="text-[10px] text-zinc-500">{food.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {course.prepTip && (
                    <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed mb-4">
                      <span className="font-bold text-zinc-300">Culinary Tip: </span>
                      {course.prepTip}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Total: {course.totalCalories} kcal</span>
                  <span className="text-lime-400 font-bold">{course.totalProtein}g Protein</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GROCERY LIST */}
      {activeTab === 'grocery' && plan && (
        <Card className="p-6 bg-zinc-900/80 border-zinc-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white">Consolidated Weekly Grocery Basket</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Calculated quantities for 7 days of verified nutrition under {plan.regionalPreference} cuisine.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-lime-400 font-mono">
                Est. Total: ₹{totalWeeklyGroceryCost}
              </span>
              <Button
                variant="outline"
                className="text-xs border-zinc-700 text-zinc-200 hover:border-zinc-500"
                onClick={handleCopyGroceryList}
              >
                {copiedGrocery ? (
                  <>
                    <Check size={14} className="mr-1.5 text-lime-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" /> Copy List
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.groceryList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    {item.isEssential && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        Essential
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 block mt-0.5">{item.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-zinc-300 block font-mono">
                    {item.quantityText}
                  </span>
                  <span className="text-[11px] font-mono text-lime-400">
                    ~₹{item.estimatedCostInr}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: SMART INGREDIENT SUBSTITUTIONS */}
      {activeTab === 'substitutions' && plan && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/20 text-xs text-lime-300 leading-relaxed">
            <span className="font-bold">Indian Bio-Availability Engine: </span>
            Easily swap higher-cost or higher-fat ingredients with equivalent biological value (BV) protein sources without losing daily targets.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.substitutions.map((sub) => (
              <Card key={sub.originalId} className="p-5 bg-zinc-900 border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-400 line-through">{sub.originalName}</span>
                  <ArrowRightLeft size={14} className="text-lime-400 mx-2" />
                  <span className="font-bold text-lime-400">{sub.substituteName}</span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Macro Impact:</span>
                    <span className="text-white font-bold">{sub.macroDelta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cost Delta:</span>
                    <span className="text-lime-400 font-bold">{sub.costDelta}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{sub.reason}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MEAL PREP GUIDE */}
      {activeTab === 'prep' && plan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.mealPrepNotes.map((note, idx) => (
            <Card key={idx} className="p-5 bg-zinc-900 border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-lime-400 px-2 py-0.5 rounded bg-lime-400/10 border border-lime-400/20">
                  {note.dayWindow}
                </span>
                <span className="text-xs text-zinc-500 font-mono flex items-center gap-1">
                  <Clock size={12} /> {note.timeMinutes} mins
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{note.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{note.instruction}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
