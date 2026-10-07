'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  User,
  Target,
  Flame,
  Calendar,
  Building2,
  Wrench,
  Utensils,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button, Card, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { saveUserProfile, getUserProfile } from '@/lib/profileService'
import type {
  PrimaryGoal,
  ExperienceLevel,
  TrainingEnvironment,
  EquipmentOption,
  DietaryPreference,
  ProfileFormData,
} from '@/types/profile'

const TOTAL_STEPS = 9

const GOAL_OPTIONS: { id: PrimaryGoal; label: string; desc: string }[] = [
  { id: 'Build Muscle', label: 'Build Muscle', desc: 'Hypertrophy focused training for mass and definition' },
  { id: 'Lose Fat', label: 'Lose Fat', desc: 'Caloric burn and sustained high-energy workout volume' },
  { id: 'Increase Strength', label: 'Increase Strength', desc: 'Compound lifting and progressive overload power' },
  { id: 'Improve Fitness', label: 'Improve Fitness', desc: 'Conditioning, stamina, and cardiovascular performance' },
  { id: 'Maintain Fitness', label: 'Maintain Fitness', desc: 'Keep present physique and healthy habitual consistency' },
  { id: 'General Health/Fitness', label: 'General Health', desc: 'Functional daily energy, posture, and balanced wellness' },
]

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner', desc: 'New to gym training or returning after a prolonged layoff (< 1 year)' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Regular training with solid exercise form and consistency (1–3 years)' },
  { id: 'Advanced', label: 'Advanced', desc: 'Experienced lifter dialing in periodization and peak intensity (3+ years)' },
]

const ENVIRONMENT_OPTIONS: { id: TrainingEnvironment; label: string; desc: string }[] = [
  { id: 'Commercial Gym', label: 'Commercial Gym', desc: 'Full access to racks, free weights, and selectorized machines' },
  { id: 'Home Gym', label: 'Home Gym', desc: 'Barbells, rack, bench, and adjustable plates at home' },
  { id: 'Home / Minimal Equipment', label: 'Minimal Equipment', desc: 'A pair of dumbbells, resistance bands, or pull-up bar' },
  { id: 'Bodyweight Only', label: 'Bodyweight Only', desc: 'Calisthenics, floor conditioning, no external weights required' },
]

const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  'Dumbbells',
  'Barbell',
  'Bench',
  'Cable Machine',
  'Machines',
  'Resistance Bands',
  'Pull-up Bar',
  'Kettlebells',
  'Cardio Equipment',
  'No Equipment',
]

const DIET_OPTIONS: { id: DietaryPreference; label: string; desc: string }[] = [
  { id: 'No Preference', label: 'No Preference', desc: 'Balanced nutrition with all food sources included' },
  { id: 'Vegetarian', label: 'Vegetarian', desc: 'Plant-based with dairy, paneer, and lentils' },
  { id: 'Eggetarian', label: 'Eggetarian', desc: 'Vegetarian diet enriched with eggs for high protein' },
  { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Includes chicken, fish, eggs, meat, and dairy' },
  { id: 'Vegan', label: 'Vegan', desc: '100% plant-exclusive foods with plant protein sources' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [userId, setUserId] = useState<string>('demo-user')
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    primary_goal: '',
    experience_level: '',
    training_days_per_week: 4,
    training_environment: '',
    available_equipment: [],
    dietary_preference: '',
  })

  // Detect authenticated user or prefill
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setUserId(data.user.id)
          const nameMeta = data.user.user_metadata?.full_name || ''
          const extractedFirst = nameMeta.split(' ')[0] || ''

          // Check if already completed onboarding in DB
          const existing = await getUserProfile(data.user.id)
          if (existing) {
            if (existing.onboarding_completed) {
              router.push('/dashboard')
              return
            }
            // Pre-fill existing partial fields
            setFormData({
              first_name: existing.first_name || extractedFirst,
              age: existing.age || '',
              height_cm: existing.height_cm || '',
              weight_kg: existing.weight_kg || '',
              primary_goal: existing.primary_goal || '',
              experience_level: existing.experience_level || '',
              training_days_per_week: existing.training_days_per_week || 4,
              training_environment: existing.training_environment || '',
              available_equipment: existing.available_equipment || [],
              dietary_preference: existing.dietary_preference || '',
            })
          } else if (extractedFirst) {
            setFormData((prev) => ({ ...prev, first_name: extractedFirst }))
          }
        }
      } catch {
        // Fallback for unconfigured dev
      } finally {
        setIsLoadingAuth(false)
      }
    }
    loadUser()
  }, [router])

  // Step Validation Check
  function validateCurrentStep(): boolean {
    setErrorMsg(null)
    if (currentStep === 1) return true

    if (currentStep === 2) {
      if (!formData.first_name.toString().trim()) {
        setErrorMsg('Please enter your first name.')
        return false
      }
      const ageNum = Number(formData.age)
      if (!formData.age || isNaN(ageNum) || ageNum < 14 || ageNum > 100) {
        setErrorMsg('Please enter a sensible age between 14 and 100.')
        return false
      }
      const heightNum = Number(formData.height_cm)
      if (!formData.height_cm || isNaN(heightNum) || heightNum < 100 || heightNum > 240) {
        setErrorMsg('Please enter a sensible height between 100 cm and 240 cm.')
        return false
      }
      const weightNum = Number(formData.weight_kg)
      if (!formData.weight_kg || isNaN(weightNum) || weightNum < 30 || weightNum > 250) {
        setErrorMsg('Please enter a sensible weight between 30 kg and 250 kg.')
        return false
      }
      return true
    }

    if (currentStep === 3) {
      if (!formData.primary_goal) {
        setErrorMsg('Please select a primary fitness goal.')
        return false
      }
      return true
    }

    if (currentStep === 4) {
      if (!formData.experience_level) {
        setErrorMsg('Please select your experience level.')
        return false
      }
      return true
    }

    if (currentStep === 5) {
      if (!formData.training_days_per_week || formData.training_days_per_week < 2 || formData.training_days_per_week > 7) {
        setErrorMsg('Please choose realistic training days between 2 and 7.')
        return false
      }
      return true
    }

    if (currentStep === 6) {
      if (!formData.training_environment) {
        setErrorMsg('Please select where you usually train.')
        return false
      }
      return true
    }

    if (currentStep === 7) {
      if (formData.available_equipment.length === 0) {
        setErrorMsg('Please select at least one equipment option (or "No Equipment").')
        return false
      }
      return true
    }

    if (currentStep === 8) {
      if (!formData.dietary_preference) {
        setErrorMsg('Please select your dietary preference.')
        return false
      }
      return true
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handleBack = () => {
    setErrorMsg(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleEquipmentToggle = (item: EquipmentOption) => {
    if (item === 'No Equipment') {
      setFormData((prev) => ({
        ...prev,
        available_equipment: prev.available_equipment.includes('No Equipment') ? [] : ['No Equipment'],
      }))
      return
    }
    setFormData((prev) => {
      const filtered = prev.available_equipment.filter((e) => e !== 'No Equipment')
      if (filtered.includes(item)) {
        return { ...prev, available_equipment: filtered.filter((e) => e !== item) }
      } else {
        return { ...prev, available_equipment: [...filtered, item] }
      }
    })
  }

  const handleFinishOnboarding = async () => {
    setIsSaving(true)
    setErrorMsg(null)

    const payload = {
      user_id: userId,
      first_name: formData.first_name.toString().trim() || 'Athlete',
      age: Number(formData.age) || 24,
      height_cm: Number(formData.height_cm) || 175,
      weight_kg: Number(formData.weight_kg) || 70,
      primary_goal: (formData.primary_goal || 'Build Muscle') as PrimaryGoal,
      experience_level: (formData.experience_level || 'Beginner') as ExperienceLevel,
      training_days_per_week: Number(formData.training_days_per_week) || 4,
      training_environment: (formData.training_environment || 'Commercial Gym') as TrainingEnvironment,
      available_equipment: (formData.available_equipment.length > 0 ? formData.available_equipment : ['Dumbbells']) as EquipmentOption[],
      dietary_preference: (formData.dietary_preference || 'No Preference') as DietaryPreference,
      onboarding_completed: true,
    }

    const { error } = await saveUserProfile(payload)

    setIsSaving(false)
    if (error) {
      setErrorMsg(`Could not save profile: ${error}`)
    } else {
      router.push('/dashboard')
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="animate-spin h-6 w-6 border-2 border-lime-400 border-t-transparent rounded-full mr-3" />
        Setting up your workspace...
      </div>
    )
  }

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-5 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between">
        <YashFitLogo />
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <div className="w-24 sm:w-32 bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-lime-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-xl">
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-800 text-sm text-red-300 flex items-center gap-2"
            >
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 mb-2">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Let&apos;s build your YashFit plan.
              </h1>
              <p className="text-zinc-400 text-base md:text-lg max-w-md mx-auto leading-relaxed">
                We will tailor your workouts, tracking targets, and nutrition recommendations based on your personal goals and schedule.
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <Button size="lg" fullWidth onClick={handleNext} icon={<ArrowRight size={18} />} iconPosition="right">
                  Get Started
                </Button>
                <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={14} className="text-lime-400" />
                  Takes less than 2 minutes. Information stays confidential.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Basic Information */}
          {currentStep === 2 && (
            <Card className="space-y-6 p-6 sm:p-8">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Basics</span>
                <h2 className="text-2xl font-bold mt-1">Tell us about yourself</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  These metrics help us calibrate your initial training targets.
                </p>
              </div>
              <div className="space-y-4">
                <Input
                  label="First Name"
                  placeholder="e.g. Yash"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  leftIcon={<User size={16} />}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Age"
                    type="number"
                    placeholder="24"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                  <Input
                    label="Height (cm)"
                    type="number"
                    placeholder="175"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    placeholder="72"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* STEP 3: Fitness Goal */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center sm:text-left">
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Objective</span>
                <h2 className="text-2xl font-bold mt-1">What is your primary goal?</h2>
                <p className="text-sm text-zinc-400 mt-1">Select the single key outcome you want to optimize for.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Primary fitness goal">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = formData.primary_goal === g.id
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, primary_goal: g.id })}
                      className={[
                        'p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 shadow-lg shadow-lime-400/5 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900/90 hover:border-zinc-700 hover:bg-zinc-800/60',
                      ].join(' ')}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-base">{g.label}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-lime-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{g.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Experience Level */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Background</span>
                <h2 className="text-2xl font-bold mt-1">What is your training experience?</h2>
                <p className="text-sm text-zinc-400 mt-1">Helps determine exercise complexity and volume curve.</p>
              </div>
              <div className="space-y-3" role="radiogroup" aria-label="Experience level">
                {EXPERIENCE_OPTIONS.map((exp) => {
                  const isSelected = formData.experience_level === exp.id
                  return (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, experience_level: exp.id })}
                      className={[
                        'w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-850',
                      ].join(' ')}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div>
                        <span className="font-semibold text-white text-base">{exp.label}</span>
                        <p className="text-xs text-zinc-400 mt-1">{exp.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={20} className="text-lime-400 shrink-0 ml-4 mt-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Training Frequency */}
          {currentStep === 5 && (
            <Card className="space-y-6 p-6 sm:p-8">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Commitment</span>
                <h2 className="text-2xl font-bold mt-1">How many days per week can you train?</h2>
                <p className="text-sm text-zinc-400 mt-1">Be realistic with your schedule — consistency beats overambition.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3" role="radiogroup" aria-label="Training days per week">
                {[2, 3, 4, 5, 6, 7].map((days) => {
                  const isSelected = formData.training_days_per_week === days
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, training_days_per_week: days })}
                      className={[
                        'p-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/15 text-white ring-1 ring-lime-400 font-bold'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800',
                      ].join(' ')}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <span className="text-xl font-bold">{days}</span>
                      <span className="text-[11px] text-zinc-400 mt-1">days</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-zinc-500 text-center">
                {formData.training_days_per_week <= 3
                  ? 'Great for full body routines and busy workweeks.'
                  : formData.training_days_per_week <= 5
                  ? 'Optimal sweet-spot for upper/lower or push-pull splits.'
                  : 'High-frequency dedicated athletic training.'}
              </p>
            </Card>
          )}

          {/* STEP 6: Training Environment */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Environment</span>
                <h2 className="text-2xl font-bold mt-1">Where do you normally train?</h2>
                <p className="text-sm text-zinc-400 mt-1">Ensures recommended routines match your space.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Training environment">
                {ENVIRONMENT_OPTIONS.map((env) => {
                  const isSelected = formData.training_environment === env.id
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, training_environment: env.id })}
                      className={[
                        'p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800',
                      ].join(' ')}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{env.label}</span>
                        {isSelected && <CheckCircle2 size={18} className="text-lime-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">{env.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 7: Available Equipment */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Gear</span>
                <h2 className="text-2xl font-bold mt-1">What equipment do you have access to?</h2>
                <p className="text-sm text-zinc-400 mt-1">Select all that apply to unlock matching exercises.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const isSelected = formData.available_equipment.includes(eq)
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => handleEquipmentToggle(eq)}
                      className={[
                        'p-3 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/15 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                      aria-pressed={isSelected}
                    >
                      <span>{eq}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-lime-400 shrink-0 ml-1.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 8: Dietary Preference */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">Nutrition</span>
                <h2 className="text-2xl font-bold mt-1">What is your dietary preference?</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  YashFit supports Indian diet staples, vegetarian splits, and macro targets.
                </p>
              </div>
              <div className="space-y-2.5" role="radiogroup" aria-label="Dietary preference">
                {DIET_OPTIONS.map((diet) => {
                  const isSelected = formData.dietary_preference === diet.id
                  return (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, dietary_preference: diet.id })}
                      className={[
                        'w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800',
                      ].join(' ')}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      <div>
                        <span className="font-semibold text-white text-sm">{diet.label}</span>
                        <p className="text-xs text-zinc-400 mt-0.5">{diet.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={18} className="text-lime-400 ml-3" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 9: Review & Completion */}
          {currentStep === 9 && (
            <Card className="p-8 text-center space-y-6 border-lime-400/30 bg-gradient-to-b from-zinc-900 to-zinc-950">
              <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 mx-auto flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">You&apos;re all set!</h2>
                <p className="text-zinc-400 text-sm mt-1 max-w-sm mx-auto">
                  Your YashFit experience has been personalized around your goals and routine.
                </p>
              </div>

              {/* Profile summary preview */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block">Name:</span>
                  <span className="text-white font-medium">{formData.first_name || 'Athlete'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Goal:</span>
                  <span className="text-lime-400 font-medium">{formData.primary_goal}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Frequency:</span>
                  <span className="text-white font-medium">{formData.training_days_per_week} days/week</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Diet:</span>
                  <span className="text-white font-medium">{formData.dietary_preference}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Experience:</span>
                  <span className="text-white font-medium">{formData.experience_level}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Location:</span>
                  <span className="text-white font-medium">{formData.training_environment}</span>
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                onClick={handleFinishOnboarding}
                loading={isSaving}
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Go to Dashboard
              </Button>
            </Card>
          )}

          {/* Navigation Controls (Steps 2 to 8) */}
          {currentStep > 1 && currentStep < 9 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-900">
              <Button variant="ghost" size="md" onClick={handleBack} icon={<ChevronLeft size={16} />}>
                Back
              </Button>
              <Button size="md" onClick={handleNext} icon={<ChevronRight size={16} />} iconPosition="right">
                Continue
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Safety Notice Footer */}
      <footer className="py-4 text-center text-[11px] text-zinc-600 border-t border-zinc-900 px-4">
        YashFit provides fitness tracking &amp; lifestyle recommendations. It does not provide medical diagnoses or medical advice.
      </footer>
    </div>
  )
}
