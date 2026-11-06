'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Clock,
  Heart,
  Droplet,
  Salad,
  RotateCcw,
  Check,
} from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button, Card, Input, Badge, InlineErrorBanner, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { saveUserProfile, getUserProfile } from '@/lib/profileService'
import {
  synthesizePersonalizedPlan,
  DEFAULT_SCHEDULED_DAYS,
  type OnboardingDraftData,
  type IndianCuisinePreference,
  type FitnessLimitation,
} from '@/lib/onboarding/onboardingPlanService'
import type {
  PrimaryGoal,
  ExperienceLevel,
  TrainingEnvironment,
  EquipmentOption,
  DietaryPreference,
} from '@/types/profile'

const TOTAL_STEPS = 10
const DRAFT_STORAGE_KEY = 'yashfit_onboarding_draft_v2'

const GOAL_OPTIONS: { id: PrimaryGoal; label: string; desc: string }[] = [
  { id: 'Build Muscle', label: 'Build Muscle', desc: 'Hypertrophy focused training for mass, density and definition' },
  { id: 'Lose Fat', label: 'Lose Fat', desc: 'Caloric deficit, metabolic burn and preserved lean muscle' },
  { id: 'Increase Strength', label: 'Increase Strength', desc: 'Compound lifting, neural drive and progressive overload power' },
  { id: 'Improve Fitness', label: 'Improve Fitness', desc: 'Conditioning, stamina, and cardiovascular work capacity' },
  { id: 'Maintain Fitness', label: 'Maintain Physique', desc: 'Keep present physique and healthy habitual consistency' },
  { id: 'General Health/Fitness', label: 'General Health & Energy', desc: 'Functional daily energy, posture, and longevity wellness' },
]

const EXPERIENCE_OPTIONS: { id: ExperienceLevel; label: string; desc: string }[] = [
  { id: 'Beginner', label: 'Beginner (< 1 Year)', desc: 'New to progressive gym training or returning after a prolonged layoff' },
  { id: 'Intermediate', label: 'Intermediate (1–3 Years)', desc: 'Consistent training with solid exercise technique and compound movement fluency' },
  { id: 'Advanced', label: 'Advanced (3+ Years)', desc: 'Experienced lifter dialing in periodization, fatigue management, and peak intensity' },
]

const ENVIRONMENT_OPTIONS: { id: TrainingEnvironment; label: string; desc: string }[] = [
  { id: 'Commercial Gym', label: 'Commercial Gym', desc: 'Full access to squat racks, barbells, dumbbells, and selectorized machines' },
  { id: 'Home Gym', label: 'Home Gym', desc: 'Barbells, rack, bench, and adjustable weight plates at home' },
  { id: 'Home / Minimal Equipment', label: 'Minimal Equipment', desc: 'A pair of dumbbells, resistance bands, or pull-up bar' },
  { id: 'Bodyweight Only', label: 'Bodyweight Only', desc: 'Calisthenics, floor conditioning, no external weights required' },
]

const ALL_EQUIPMENT_OPTIONS: EquipmentOption[] = [
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
  { id: 'Vegetarian', label: 'Vegetarian', desc: 'Plant-based enriched with paneer, milk, curd, and high-protein lentils' },
  { id: 'Eggetarian', label: 'Eggetarian', desc: 'Vegetarian diet enriched with eggs for high biological value protein' },
  { id: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Includes chicken, fish, eggs, meat, and dairy protein sources' },
  { id: 'Vegan', label: 'Vegan', desc: '100% plant-exclusive nutrition using soya chunks, tofu, chana, and beans' },
  { id: 'No Preference', label: 'No Specific Preference', desc: 'Flexible balanced nutrition with all whole food sources included' },
]

const CUISINE_OPTIONS: { id: IndianCuisinePreference; label: string; desc: string }[] = [
  { id: 'North Indian', label: 'North Indian', desc: 'Phulkas, Dal Tadka, Paneer Bhurji, Rajma Chawal, and Dahi' },
  { id: 'South Indian', label: 'South Indian', desc: 'Idli/Dosa, Sambar, Ragi Mudde, Pesarattu (Moong Dal Dosa), Curd Rice' },
  { id: 'Maharashtrian', label: 'Maharashtrian', desc: 'Jowar/Bajra Bhakri, Usal, Sprouts Khichdi, Matki, and Curd' },
  { id: 'East Indian', label: 'East Indian', desc: 'Dal, Chana Ghugni, High-protein Sattu, and Steamed Fish/Paneer' },
  { id: 'Mixed Regional', label: 'Mixed Indian Thali', desc: 'Balanced rotation of regional Indian curries, rotis, rice, and lentils' },
]

const LIMITATION_OPTIONS: { id: FitnessLimitation; label: string; desc: string }[] = [
  { id: 'None', label: 'No Physical Limitations', desc: 'Free to perform all compound and unilateral movements without modification' },
  { id: 'Lower Back Sensitivity', label: 'Lower Back Sensitivity', desc: 'Spinal-spared variations (chest-supported rows & split squats prioritized)' },
  { id: 'Knee Joint Discomfort', label: 'Knee Joint Discomfort', desc: 'Posterior chain focus (box squats, glute bridges, hamstring curls prioritized)' },
  { id: 'Shoulder Impingement', label: 'Shoulder Impingement', desc: 'Subacromial clearance (neutral-grip dumbbell presses & face pulls prioritized)' },
  { id: 'Wrist or Elbow Strain', label: 'Wrist or Elbow Strain', desc: 'Joint neutral grips (cable handles and ergonomic dumbbells prioritized)' },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [userId, setUserId] = useState<string>('demo-user')
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasResumedDraft, setHasResumedDraft] = useState(false)

  const [formData, setFormData] = useState<OnboardingDraftData>({
    first_name: '',
    age: '25',
    gender: 'male',
    height_cm: '175',
    weight_kg: '72',
    target_weight_kg: '70',
    primary_goal: 'Build Muscle',
    experience_level: 'Beginner',
    training_environment: 'Commercial Gym',
    available_equipment: ['Dumbbells', 'Barbell', 'Bench', 'Cable Machine'],
    training_days_per_week: 4,
    scheduled_days: ['Mon', 'Tue', 'Thu', 'Sat'],
    preferred_workout_duration: 45,
    dietary_preference: 'Vegetarian',
    indian_cuisine_preference: 'North Indian',
    fitness_limitations: ['None'],
    onboarding_step: 1,
  })

  // Detect authenticated user or check existing draft
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setUserId(data.user.id)
          const nameMeta = data.user.user_metadata?.full_name || ''
          const extractedFirst = nameMeta.split(' ')[0] || ''

          const existing = await getUserProfile(data.user.id)
          if (existing && existing.onboarding_completed) {
            router.push('/dashboard')
            return
          }

          if (extractedFirst) {
            setFormData((prev) => ({ ...prev, first_name: extractedFirst }))
          }
        }

        // Restore draft from localStorage if available
        if (typeof window !== 'undefined') {
          const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft) as OnboardingDraftData
              if (parsed && typeof parsed === 'object') {
                setFormData((prev) => ({
                  ...prev,
                  ...parsed,
                  scheduled_days: parsed.scheduled_days || DEFAULT_SCHEDULED_DAYS[parsed.training_days_per_week || 4],
                }))
                if (parsed.onboarding_step && parsed.onboarding_step > 1) {
                  setCurrentStep(parsed.onboarding_step)
                  setHasResumedDraft(true)
                }
              }
            } catch {
              // Ignore parse error
            }
          }
        }
      } catch {
        // Fallback for offline/demo
      } finally {
        setIsLoadingAuth(false)
      }
    }
    loadUser()
  }, [router])

  // Autosave draft to localStorage on every change
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoadingAuth) {
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            ...formData,
            onboarding_step: currentStep,
            saved_at: new Date().toISOString(),
          })
        )
      } catch {
        // ignore storage error
      }
    }
  }, [formData, currentStep, isLoadingAuth])

  // Computed synthesized plan for step 10 preview
  const synthesizedPlan = useMemo(() => {
    return synthesizePersonalizedPlan(formData)
  }, [formData])

  // Validation
  const validateCurrentStep = (): boolean => {
    setErrorMsg(null)

    if (currentStep === 1) {
      if (!formData.first_name.toString().trim()) {
        setErrorMsg('Please enter your first name or preferred athlete name.')
        return false
      }
      const ageNum = Number(formData.age)
      if (!ageNum || ageNum < 14 || ageNum > 99) {
        setErrorMsg('Please enter a valid age between 14 and 99.')
        return false
      }
      const hNum = Number(formData.height_cm)
      if (!hNum || hNum < 100 || hNum > 250) {
        setErrorMsg('Please enter a valid height in cm (100–250 cm).')
        return false
      }
      const wNum = Number(formData.weight_kg)
      if (!wNum || wNum < 30 || wNum > 300) {
        setErrorMsg('Please enter a valid weight in kg (30–300 kg).')
        return false
      }
      return true
    }

    if (currentStep === 2 && !formData.primary_goal) {
      setErrorMsg('Please select your primary fitness goal.')
      return false
    }

    if (currentStep === 3 && !formData.experience_level) {
      setErrorMsg('Please select your fitness experience level.')
      return false
    }

    if (currentStep === 4 && !formData.training_environment) {
      setErrorMsg('Please select where you plan to train.')
      return false
    }

    if (currentStep === 5) {
      if (formData.available_equipment.length === 0) {
        setErrorMsg('Please select at least one equipment option (or "No Equipment").')
        return false
      }
      return true
    }

    if (currentStep === 6) {
      if (!formData.training_days_per_week || formData.training_days_per_week < 2) {
        setErrorMsg('Please select your weekly training frequency (3–6 days recommended).')
        return false
      }
      return true
    }

    if (currentStep === 8 && !formData.dietary_preference) {
      setErrorMsg('Please select your dietary preference.')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setErrorMsg(null)
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const handleLimitationToggle = (item: FitnessLimitation) => {
    if (item === 'None') {
      setFormData((prev) => ({
        ...prev,
        fitness_limitations: ['None'],
      }))
      return
    }
    setFormData((prev) => {
      const filtered = prev.fitness_limitations.filter((l) => l !== 'None')
      if (filtered.includes(item)) {
        const next = filtered.filter((l) => l !== item)
        return { ...prev, fitness_limitations: next.length > 0 ? next : ['None'] }
      } else {
        return { ...prev, fitness_limitations: [...filtered, item] }
      }
    })
  }

  const handleToggleScheduledDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.scheduled_days.includes(day)
      if (exists) {
        if (prev.scheduled_days.length <= 1) return prev // keep at least 1
        return { ...prev, scheduled_days: prev.scheduled_days.filter((d) => d !== day) }
      } else {
        return { ...prev, scheduled_days: [...prev.scheduled_days, day] }
      }
    })
  }

  const handleFinishOnboarding = async () => {
    setIsSaving(true)
    setErrorMsg(null)

    const payload = {
      user_id: userId,
      first_name: formData.first_name.toString().trim() || 'Athlete',
      age: Number(formData.age) || 25,
      height_cm: Number(formData.height_cm) || 175,
      weight_kg: Number(formData.weight_kg) || 70,
      primary_goal: (formData.primary_goal || 'Build Muscle') as PrimaryGoal,
      experience_level: (formData.experience_level || 'Beginner') as ExperienceLevel,
      training_days_per_week: Number(formData.training_days_per_week) || 4,
      training_environment: (formData.training_environment || 'Commercial Gym') as TrainingEnvironment,
      available_equipment: (formData.available_equipment.length > 0
        ? formData.available_equipment
        : ['Dumbbells']) as EquipmentOption[],
      dietary_preference: (formData.dietary_preference || 'Vegetarian') as DietaryPreference,
      onboarding_completed: true,
    }

    const { error } = await saveUserProfile(payload)

    // Save extra synthesized parameters in localStorage for demo / local services
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`yashfit_onboarding_plan_${userId}`, JSON.stringify(synthesizedPlan))
        localStorage.setItem(`yashfit_water_target_${userId}`, synthesizedPlan.nutritionTargets.hydrationLiters.toString())
        localStorage.setItem('yashfit_water_target', synthesizedPlan.nutritionTargets.hydrationLiters.toString())
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      } catch {
        // ignore
      }
    }

    setIsSaving(false)
    if (error) {
      setErrorMsg(`Could not save profile: ${error}`)
    } else {
      router.push('/dashboard')
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-zinc-400">Loading YashFit Onboarding 2.0...</p>
      </div>
    )
  }

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100)

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between py-2 border-b border-zinc-800/80 mb-6">
        <Link href="/" aria-label="YashFit Home">
          <YashFitLogo />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 font-mono">Step {currentStep} of {TOTAL_STEPS}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
            {progressPercent}% Complete
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto flex-1 flex flex-col justify-center space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-lime-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Resumed Incomplete Setup Banner */}
        {hasResumedDraft && currentStep > 1 && (
          <div className="p-3 rounded-xl bg-lime-950/30 border border-lime-400/20 flex items-center justify-between text-xs text-lime-300">
            <div className="flex items-center gap-2">
              <RotateCcw size={14} className="text-lime-400" />
              <span>Resumed your saved setup draft from step {currentStep}.</span>
            </div>
            <button
              type="button"
              onClick={() => setHasResumedDraft(false)}
              className="text-zinc-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <InlineErrorBanner
            variant="error"
            message={errorMsg}
            onDismiss={() => setErrorMsg(null)}
          />
        )}

        {/* STEP 1: Biometric Baseline */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <User size={14} />
                <span>Athlete Baseline</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Let&apos;s build your fitness identity</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Your biometrics power precise BMR, progressive overload targets, and macro distribution.
              </p>
            </div>

            <Card className="p-5 sm:p-6 space-y-4">
              <Input
                label="Athlete First Name"
                placeholder="e.g. Yashwanth"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  placeholder="25"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  placeholder="70"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                />
                <Input
                  label="Target Weight (kg)"
                  type="number"
                  placeholder="74"
                  value={formData.target_weight_kg || ''}
                  onChange={(e) => setFormData({ ...formData, target_weight_kg: e.target.value })}
                />
              </div>
            </Card>
          </div>
        )}

        {/* STEP 2: Primary Goal */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Target size={14} />
                <span>Primary Objective</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">What is your core fitness goal?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                This dictates your weekly caloric surplus or deficit, volume thresholds, and repetition ranges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const isSelected = formData.primary_goal === goal.id
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, primary_goal: goal.id })}
                    className={`p-4 rounded-xl text-left border transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 shadow-lg ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-white">{goal.label}</span>
                        {isSelected && <CheckCircle2 size={16} className="text-lime-400" />}
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{goal.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Experience Level */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Flame size={14} />
                <span>Training Experience</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How long have you been lifting?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Novices build muscle rapidly with linear progression; advanced lifters require dedicated periodization.
              </p>
            </div>

            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map((exp) => {
                const isSelected = formData.experience_level === exp.id
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, experience_level: exp.id })}
                    className={`w-full p-4 rounded-xl text-left border transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 shadow-lg ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-sm text-white block">{exp.label}</span>
                      <span className="text-xs text-zinc-400 mt-0.5 block">{exp.desc}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={18} className="text-lime-400 shrink-0 ml-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Training Environment */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Building2 size={14} />
                <span>Training Facility</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Where do you perform your workouts?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                We calibrate exercise selections so you never get prescribed gear you don&apos;t have.
              </p>
            </div>

            <div className="space-y-3">
              {ENVIRONMENT_OPTIONS.map((env) => {
                const isSelected = formData.training_environment === env.id
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, training_environment: env.id })}
                    className={`w-full p-4 rounded-xl text-left border transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 shadow-lg ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-sm text-white block">{env.label}</span>
                      <span className="text-xs text-zinc-400 mt-0.5 block">{env.desc}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={18} className="text-lime-400 shrink-0 ml-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Available Equipment */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Wrench size={14} />
                <span>Gear Checklist</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Select your available equipment</h1>
              <p className="text-sm text-zinc-400 mt-1">Select all items you have access to. Choose multiple.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ALL_EQUIPMENT_OPTIONS.map((item) => {
                const isSelected = formData.available_equipment.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleEquipmentToggle(item)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400 text-lime-300'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span>{item}</span>
                    {isSelected && <Check size={14} className="text-lime-400" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 6: Weekly Training Frequency & Preferred Days */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Calendar size={14} />
                <span>Weekly Schedule</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How many days can you train weekly?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Consistency trumps extreme volume. Choose a realistic weekly frequency you can stick to.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[3, 4, 5, 6].map((days) => {
                const isSelected = formData.training_days_per_week === days
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        training_days_per_week: days,
                        scheduled_days: DEFAULT_SCHEDULED_DAYS[days] || ['Mon', 'Tue', 'Thu', 'Sat'],
                      })
                    }
                    className={`p-4 rounded-2xl border text-center transition-all duration-150 ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl font-extrabold block">{days}</span>
                    <span className="text-xs text-zinc-400 mt-1 block">Days/week</span>
                  </button>
                )
              })}
            </div>

            {/* Preferred Days Toggle */}
            <Card className="p-4 space-y-3">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Select your preferred workout days ({formData.training_days_per_week} days):
              </span>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const isScheduled = formData.scheduled_days.includes(d)
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleToggleScheduledDay(d)}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        isScheduled
                          ? 'bg-lime-400 text-zinc-950 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* STEP 7: Preferred Workout Duration */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Clock size={14} />
                <span>Session Duration</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How long do you prefer to train?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                We calibrate total working sets and rest timer durations to match your available time window.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { min: 30, label: '30 Minutes', desc: 'Fast, intense circuit or compound supersets' },
                { min: 45, label: '45 Minutes (Optimal)', desc: 'Balanced volume with adequate rest intervals' },
                { min: 60, label: '60 Minutes', desc: 'Comprehensive hypertrophy with accessory lifts' },
                { min: 75, label: '75 Minutes', desc: 'High-volume strength & powerlifting sessions' },
              ].map((item) => {
                const isSelected = formData.preferred_workout_duration === item.min
                return (
                  <button
                    key={item.min}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferred_workout_duration: item.min })}
                    className={`p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm text-white block">{item.label}</span>
                      <span className="text-xs text-zinc-400 mt-1 block">{item.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 8: Dietary & Indian Cuisine Preferences */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Utensils size={14} />
                <span>Nutrition &amp; Indian Cuisine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your dietary style &amp; regional tastes</h1>
              <p className="text-sm text-zinc-400 mt-1">
                We customize your high-protein targets with culturally authentic Indian staples.
              </p>
            </div>

            {/* Diet Style */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dietary Category</span>
              <div className="space-y-2">
                {DIET_OPTIONS.map((diet) => {
                  const isSelected = formData.dietary_preference === diet.id
                  return (
                    <button
                      key={diet.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, dietary_preference: diet.id })}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="font-semibold text-sm text-white block">{diet.label}</span>
                        <span className="text-xs text-zinc-400 mt-0.5 block">{diet.desc}</span>
                      </div>
                      {isSelected && <CheckCircle2 size={16} className="text-lime-400 shrink-0 ml-2" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Indian Cuisine Style */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Regional Indian Cuisine Focus
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUISINE_OPTIONS.map((c) => {
                  const isSelected = formData.indian_cuisine_preference === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, indian_cuisine_preference: c.id })}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 ${
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-semibold text-xs text-white block">{c.label}</span>
                      <span className="text-[11px] text-zinc-400 mt-0.5 block line-clamp-1">{c.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: Physical Limitations & Exercise Restrictions */}
        {currentStep === 9 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <ShieldCheck size={14} />
                <span>Joint Safety &amp; Restrictions</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Any exercise limitations or joint sensitivities?</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Our biomechanical kinematics solver will automatically substitute aggravating movements for safer joint-neutral alternatives.
              </p>
            </div>

            <div className="space-y-2.5">
              {LIMITATION_OPTIONS.map((lim) => {
                const isSelected = formData.fitness_limitations.includes(lim.id)
                return (
                  <button
                    key={lim.id}
                    type="button"
                    onClick={() => handleLimitationToggle(lim.id)}
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                      isSelected
                        ? 'border-lime-400 bg-lime-400/10 ring-1 ring-lime-400'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-sm text-white block">{lim.label}</span>
                      <span className="text-xs text-zinc-400 mt-0.5 block">{lim.desc}</span>
                    </div>
                    {isSelected && <CheckCircle2 size={18} className="text-lime-400 shrink-0 ml-3" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 10: Personalized Initial Plan & Nutrition Reveal */}
        {currentStep === 10 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-lime-400 mb-1">
                <Sparkles size={14} />
                <span>Tailored Synthesis</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Your YashFit 2.0 blueprint is ready!</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Here is your synthesized workout split and evidence-based Indian nutrition blueprint. Review and launch!
              </p>
            </div>

            {/* Workout Split Card */}
            <Card className="p-5 border-lime-400/30 bg-gradient-to-br from-zinc-900 to-lime-950/20 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="accent">Initial Workout Split</Badge>
                  <h3 className="text-lg font-bold text-white mt-1">{synthesizedPlan.workoutPlan.splitTitle}</h3>
                  <p className="text-xs text-zinc-400">{synthesizedPlan.workoutPlan.primaryFocus}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-white block">{synthesizedPlan.workoutPlan.weeklyFrequency} Days/Week</span>
                  <span className="text-xs text-lime-400">{synthesizedPlan.workoutPlan.sessionDurationMin} min/session</span>
                </div>
              </div>

              {/* Routines Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-zinc-800">
                {synthesizedPlan.workoutPlan.routines.map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-lime-400">{r.dayName}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">{r.targetMuscles}</span>
                    </div>
                    <p className="text-xs font-semibold text-white truncate">{r.routineTitle}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{r.keyExercises.join(', ')}</p>
                  </div>
                ))}
              </div>

              {/* Safety Cues if any limitations */}
              {synthesizedPlan.workoutPlan.limitationCues.length > 0 && (
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <ShieldCheck size={13} />
                    <span>Joint Safety Kinematics Applied:</span>
                  </span>
                  {synthesizedPlan.workoutPlan.limitationCues.map((cue, idx) => (
                    <p key={idx} className="text-[11px] text-zinc-400 leading-relaxed">• {cue}</p>
                  ))}
                </div>
              )}
            </Card>

            {/* Nutrition Targets Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="default">Daily Nutrition Blueprint</Badge>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {synthesizedPlan.nutritionTargets.targetCalories} kcal / day
                  </h3>
                  <p className="text-xs text-zinc-400">
                    BMR: {synthesizedPlan.nutritionTargets.bmr} kcal · TDEE: {synthesizedPlan.nutritionTargets.tdee} kcal
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{formData.dietary_preference}</Badge>
                  <Badge variant="default">{formData.indian_cuisine_preference}</Badge>
                </div>
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Protein</span>
                  <span className="text-base font-extrabold text-lime-400">{synthesizedPlan.nutritionTargets.targetProteinGrams}g</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Carbs</span>
                  <span className="text-base font-extrabold text-amber-400">{synthesizedPlan.nutritionTargets.targetCarbsGrams}g</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Fats</span>
                  <span className="text-base font-extrabold text-rose-400">{synthesizedPlan.nutritionTargets.targetFatsGrams}g</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-500 uppercase block font-medium">Water</span>
                  <span className="text-base font-extrabold text-sky-400">{synthesizedPlan.nutritionTargets.hydrationLiters}L</span>
                </div>
              </div>

              {/* Indian Food Staples */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300 block">Recommended Indian Staples:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {synthesizedPlan.nutritionTargets.recommendedStaples.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs">
                      <div className="flex items-center justify-between font-semibold text-zinc-200">
                        <span>{item.name}</span>
                        <span className="text-lime-400 font-mono text-[11px]">{item.proteinPer100g}</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{item.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Quick Edit Step Link */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span>Want to adjust anything in your profile?</span>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-lime-400 font-semibold hover:underline"
              >
                Edit Onboarding Answers
              </button>
            </div>
          </div>
        )}

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="md"
              onClick={handleBack}
              icon={<ChevronLeft size={16} />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < TOTAL_STEPS ? (
            <Button
              size="md"
              onClick={handleNext}
              icon={<ChevronRight size={16} />}
              iconPosition="right"
            >
              Continue
            </Button>
          ) : (
            <Button
              size="lg"
              loading={isSaving}
              onClick={handleFinishOnboarding}
              icon={<Sparkles size={18} />}
              className="bg-lime-400 text-zinc-950 font-bold px-8"
            >
              Launch My YashFit Journey
            </Button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center py-4 text-xs text-zinc-600">
        YashFit Personal Fitness OS · Evidence-Based Indian Nutrition &amp; Biomechanical Intelligence
      </footer>
    </div>
  )
}
