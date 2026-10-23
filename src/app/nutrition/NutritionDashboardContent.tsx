'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Flame,
  Target,
  Droplets,
  Apple,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Scale,
  Zap,
  RotateCcw,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeading, Input, Modal, useToast } from '@/components/ui'
import { calculateMacroTargets } from '@/lib/nutritionCalculator'
import { getUserProfile } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/profile'
import type { DailyMacroTargets } from '@/types/nutrition'

export function NutritionDashboardContent() {
  const toast = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [macroTargets, setMacroTargets] = useState<DailyMacroTargets>({
    calories: 2200,
    protein: 140,
    carbs: 250,
    fats: 60,
    waterLiters: 3.0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Demo daily intake tracking
  const [loggedIntake, setLoggedIntake] = useState({
    calories: 1450,
    protein: 98,
    carbs: 165,
    fats: 42,
    waterLiters: 2.1,
  })

  // Hydration state
  const [waterHistory, setWaterHistory] = useState<number[]>([])
  const [customMlInput, setCustomMlInput] = useState('')
  const [isEditingWaterTarget, setIsEditingWaterTarget] = useState(false)
  const [tempWaterTarget, setTempWaterTarget] = useState('3.0')

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const userId = data?.user?.id || 'demo-user'
        const p = await getUserProfile(userId)
        setProfile(p)
        const targets = calculateMacroTargets(p)

        // Check if user set custom water target
        const savedTarget = localStorage.getItem('yashfit_water_target')
        if (savedTarget) {
          targets.waterLiters = parseFloat(savedTarget) || targets.waterLiters
        }

        setMacroTargets(targets)
        setTempWaterTarget(String(targets.waterLiters))
      } catch {
        const targets = calculateMacroTargets(null)
        setMacroTargets(targets)
      } finally {
        setIsLoading(false)
      }

      try {
        const savedWater = localStorage.getItem('yashfit_daily_water')
        if (savedWater) {
          const val = parseFloat(savedWater)
          if (!isNaN(val)) {
            setLoggedIntake((prev) => ({ ...prev, waterLiters: val }))
          }
        }
      } catch {
        // ignore
      }
    }
    loadData()
  }, [])

  const handleAddWater = (amountLiters: number) => {
    setLoggedIntake((prev) => {
      const next = Number((prev.waterLiters + amountLiters).toFixed(2))
      try {
        localStorage.setItem('yashfit_daily_water', String(next))
      } catch {
        // ignore
      }
      setWaterHistory((h) => [...h, amountLiters])

      if (next >= macroTargets.waterLiters && prev.waterLiters < macroTargets.waterLiters) {
        toast.success('Hydration Goal Reached! 💧', `You've achieved your daily ${macroTargets.waterLiters}L water target.`)
      } else {
        toast.info(`+${amountLiters >= 1 ? `${amountLiters}L` : `${Math.round(amountLiters * 1000)}ml`} added`)
      }

      return { ...prev, waterLiters: next }
    })
  }

  const handleCustomWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ml = parseFloat(customMlInput)
    if (isNaN(ml) || ml <= 0) return
    handleAddWater(ml / 1000)
    setCustomMlInput('')
  }

  const handleUndoWater = () => {
    if (waterHistory.length === 0) return
    const lastAmount = waterHistory[waterHistory.length - 1]
    const updatedHistory = waterHistory.slice(0, -1)
    setWaterHistory(updatedHistory)

    setLoggedIntake((prev) => {
      const next = Math.max(0, Number((prev.waterLiters - lastAmount).toFixed(2)))
      try {
        localStorage.setItem('yashfit_daily_water', String(next))
      } catch {
        // ignore
      }
      return { ...prev, waterLiters: next }
    })
    toast.info('Last water log undone')
  }

  const handleSaveWaterTarget = (e: React.FormEvent) => {
    e.preventDefault()
    const val = parseFloat(tempWaterTarget)
    if (!isNaN(val) && val >= 1.0 && val <= 10.0) {
      setMacroTargets((prev) => ({ ...prev, waterLiters: val }))
      try {
        localStorage.setItem('yashfit_water_target', String(val))
      } catch {
        // ignore
      }
      setIsEditingWaterTarget(false)
      toast.success('Target updated', `Daily hydration target set to ${val}L`)
    }
  }

  const proteinPercent = Math.min(100, Math.round((loggedIntake.protein / macroTargets.protein) * 100))
  const caloriesPercent = Math.min(100, Math.round((loggedIntake.calories / macroTargets.calories) * 100))
  const carbsPercent = Math.min(100, Math.round((loggedIntake.carbs / macroTargets.carbs) * 100))
  const fatsPercent = Math.min(100, Math.round((loggedIntake.fats / macroTargets.fats) * 100))
  const waterPercent = Math.min(100, Math.round((loggedIntake.waterLiters / macroTargets.waterLiters) * 100))

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Smart Nutrition Engine</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Calibrated daily energy balance &amp; macronutrient targets designed for {profile?.primary_goal || 'your fitness goal'}.
          </p>
        </div>
        <Link href="/meals">
          <Button size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
            Browse Indian Meal Plans
          </Button>
        </Link>
      </div>

      {/* Hero Caloric & Macro Overview Card */}
      <Card className="p-6 md:p-8 border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">Evidence-Based TDEE</Badge>
              <span className="text-xs text-zinc-400">
                Calibrated for {profile?.weight_kg || 70} kg · {profile?.dietary_preference || 'Balanced'}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              {macroTargets.calories.toLocaleString()} <span className="text-xl font-normal text-zinc-400">kcal / day</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Target energy intake to support {profile?.primary_goal?.toLowerCase() || 'healthy performance'}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 shrink-0">
            <div>
              <span className="text-xs text-zinc-500 block">Consumed Today</span>
              <span className="text-xl font-bold text-white mt-0.5 block">
                {loggedIntake.calories} kcal
              </span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <span className="text-xs text-zinc-500 block">Remaining</span>
              <span className="text-xl font-bold text-lime-400 mt-0.5 block">
                {Math.max(0, macroTargets.calories - loggedIntake.calories)} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Primary Macro Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          {/* Protein */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Target size={14} className="text-lime-400" /> Protein
              </span>
              <span className="text-lime-400 font-bold">
                {loggedIntake.protein} / {macroTargets.protein}g
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-400 rounded-full transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 block">
              {macroTargets.protein - loggedIntake.protein > 0
                ? `${macroTargets.protein - loggedIntake.protein}g to hit daily muscle threshold`
                : 'Target hit! Great job.'}
            </span>
          </div>

          {/* Carbs */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> Carbohydrates
              </span>
              <span className="text-amber-400 font-bold">
                {loggedIntake.carbs} / {macroTargets.carbs}g
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Glycogen replenishment &amp; training stamina
            </span>
          </div>

          {/* Fats */}
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Flame size={14} className="text-rose-400" /> Healthy Fats
              </span>
              <span className="text-rose-400 font-bold">
                {loggedIntake.fats} / {macroTargets.fats}g
              </span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{ width: `${fatsPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Hormonal health &amp; micronutrient absorption
            </span>
          </div>
        </div>
      </Card>

      {/* Hydration & Guidelines Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hydration Tracker */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider block">
                  Hydration Tracker
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingWaterTarget(true)}
                  className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                  aria-label="Adjust target"
                >
                  <SlidersHorizontal size={11} /> Edit Target
                </button>
              </div>
              <h3 className="text-2xl font-bold text-white mt-1">
                {loggedIntake.waterLiters}L <span className="text-sm font-normal text-zinc-400">/ {macroTargets.waterLiters}L</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {waterPercent >= 100
                  ? '🎯 Daily target achieved! Excellent cellular hydration.'
                  : `${(macroTargets.waterLiters - loggedIntake.waterLiters).toFixed(2)}L remaining today.`}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Droplets size={24} />
            </div>
          </div>

          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, waterPercent)}%` }}
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(0.25)}
            >
              + 250ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(0.50)}
            >
              + 500ml
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddWater(0.75)}
            >
              + 750ml
            </Button>
          </div>

          {/* Custom ml input & Undo */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
            <form onSubmit={handleCustomWaterSubmit} className="flex items-center gap-1.5 flex-1">
              <input
                type="number"
                min="50"
                max="2000"
                step="50"
                placeholder="Custom ml (e.g. 350)..."
                value={customMlInput}
                onChange={(e) => setCustomMlInput(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-400"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={!customMlInput}>
                Log
              </Button>
            </form>

            {waterHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUndoWater}
                icon={<RotateCcw size={12} />}
              >
                Undo
              </Button>
            )}
          </div>
        </Card>

        {/* Modal for adjusting hydration target */}
        <Modal
          isOpen={isEditingWaterTarget}
          onClose={() => setIsEditingWaterTarget(false)}
          title="Adjust Daily Hydration Target"
          description="Customize your water target based on workout sweat loss, weather, or coach guidance."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveWaterTarget} className="space-y-4">
            <Input
              label="Daily Water Target (Liters)"
              type="number"
              step="0.1"
              min="1.0"
              max="8.0"
              value={tempWaterTarget}
              onChange={(e) => setTempWaterTarget(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditingWaterTarget(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Target
              </Button>
            </div>
          </form>
        </Modal>

        {/* Nutritional Strategy & Indian Food Rulebook */}
        <Card className="p-6 space-y-4">
          <SectionHeading
            title="Nutrition Strategy"
            subtitle="Custom guidelines for Indian meal structures"
          />
          <ul className="space-y-2.5 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-bold">•</span>
              <span><strong>Prioritize Protein Density:</strong> Anchor every meal with a verified protein source (Paneer, Soya, Eggs, Chicken, or Hung Curd) before adding carbohydrates.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-bold">•</span>
              <span><strong>Mind Cooking Oils:</strong> Indian curries absorb ghee and oils rapidly. Keep cooking oil to 1–2 teaspoons per meal to prevent accidental caloric surplus.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lime-400 font-bold">•</span>
              <span><strong>Budget Hacks:</strong> Soya chunks offer 52g protein per 100g at ₹25-30, making them the most cost-efficient plant protein on the market.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

