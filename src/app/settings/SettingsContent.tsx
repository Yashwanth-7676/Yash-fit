'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Globe,
  Sliders,
  Zap,
  Type,
  BookOpen,
} from 'lucide-react'
import { Card, Button, Input, SectionHeading, Badge, Toggle } from '@/components/ui'
import { useAccessibility } from '@/lib/accessibility/accessibilityContext'
import { useLocalization } from '@/lib/i18n/localizationContext'
import { createClient } from '@/lib/supabase/client'
import { getUserProfile, saveUserProfile } from '@/lib/profileService'
import type {
  PrimaryGoal,
  ExperienceLevel,
  TrainingEnvironment,
  EquipmentOption,
  DietaryPreference,
  ProfileFormData,
} from '@/types/profile'

const GOAL_OPTIONS: PrimaryGoal[] = [
  'Build Muscle',
  'Lose Fat',
  'Improve Fitness',
  'Increase Strength',
  'Maintain Fitness',
  'General Health/Fitness',
]

const EXPERIENCE_OPTIONS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced']

const ENVIRONMENT_OPTIONS: TrainingEnvironment[] = [
  'Commercial Gym',
  'Home Gym',
  'Home / Minimal Equipment',
  'Bodyweight Only',
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

const DIET_OPTIONS: DietaryPreference[] = [
  'No Preference',
  'Vegetarian',
  'Vegan',
  'Eggetarian',
  'Non-Vegetarian',
]

export function SettingsContent() {
  const { preferences, setHighContrast, setReducedMotion, setFontScale, setShowBeginnerCues } = useAccessibility()
  const { language, unitSystem, setLanguage, setUnitSystem } = useLocalization()
  const [userId, setUserId] = useState<string>('demo-user')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    primary_goal: 'Build Muscle',
    experience_level: 'Intermediate',
    training_days_per_week: 4,
    training_environment: 'Commercial Gym',
    available_equipment: ['Dumbbells', 'Barbell', 'Bench'],
    dietary_preference: 'No Preference',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          setUserId(data.user.id)
          setUserEmail(data.user.email || '')
          const profile = await getUserProfile(data.user.id)
          if (profile) {
            setFormData({
              first_name: profile.first_name || '',
              age: profile.age || '',
              height_cm: profile.height_cm || '',
              weight_kg: profile.weight_kg || '',
              primary_goal: profile.primary_goal || 'Build Muscle',
              experience_level: profile.experience_level || 'Beginner',
              training_days_per_week: profile.training_days_per_week || 4,
              training_environment: profile.training_environment || 'Commercial Gym',
              available_equipment: profile.available_equipment || ['Dumbbells'],
              dietary_preference: profile.dietary_preference || 'No Preference',
            })
          }
        } else {
          // Demo fallback
          const profile = await getUserProfile('demo-user')
          if (profile) {
            setFormData({
              first_name: profile.first_name || '',
              age: profile.age || '',
              height_cm: profile.height_cm || '',
              weight_kg: profile.weight_kg || '',
              primary_goal: profile.primary_goal || 'Build Muscle',
              experience_level: profile.experience_level || 'Beginner',
              training_days_per_week: profile.training_days_per_week || 4,
              training_environment: profile.training_environment || 'Commercial Gym',
              available_equipment: profile.available_equipment || ['Dumbbells'],
              dietary_preference: profile.dietary_preference || 'No Preference',
            })
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSaveSuccess(false)

    // Validation
    if (!formData.first_name.toString().trim()) {
      setErrorMessage('First name is required.')
      return
    }
    const ageNum = Number(formData.age)
    if (!formData.age || isNaN(ageNum) || ageNum < 14 || ageNum > 100) {
      setErrorMessage('Please enter a sensible age between 14 and 100.')
      return
    }
    const heightNum = Number(formData.height_cm)
    if (!formData.height_cm || isNaN(heightNum) || heightNum < 100 || heightNum > 240) {
      setErrorMessage('Please enter a sensible height between 100 and 240 cm.')
      return
    }
    const weightNum = Number(formData.weight_kg)
    if (!formData.weight_kg || isNaN(weightNum) || weightNum < 30 || weightNum > 250) {
      setErrorMessage('Please enter a sensible weight between 30 and 250 kg.')
      return
    }

    setIsSaving(true)
    const payload = {
      user_id: userId,
      first_name: formData.first_name.toString().trim(),
      age: ageNum,
      height_cm: heightNum,
      weight_kg: weightNum,
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
      setErrorMessage(`Failed to save: ${error}`)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-zinc-400">
        <RefreshCw size={24} className="animate-spin text-lime-400 mr-3" />
        Loading your profile settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title & description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Profile &amp; Settings</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Update your body metrics, fitness goals, and training availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/profile/avatar">
            <Button variant="outline" size="sm" icon={<Sparkles size={14} className="text-lime-400" />}>
              Avatar Studio
            </Button>
          </Link>
          {userEmail && (
            <Badge variant="default" className="text-xs px-3 py-1">
              {userEmail}
            </Badge>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-sm text-emerald-300 flex items-center gap-2"
        >
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>Profile updated successfully! Your dashboard personalization has been refreshed.</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-sm text-red-300 flex items-center gap-2"
        >
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="space-y-5 p-6">
          <SectionHeading
            title="Personal Metrics"
            subtitle="Used to calculate training loads and caloric baseline."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              leftIcon={<User size={16} />}
              required
            />
            <Input
              label="Age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
            />
            <Input
              label="Height (cm)"
              type="number"
              value={formData.height_cm}
              onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={formData.weight_kg}
              onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              required
            />
          </div>
        </Card>

        {/* Section 2: Goals & Experience */}
        <Card className="space-y-5 p-6">
          <SectionHeading
            title="Fitness Goals &amp; Experience"
            subtitle="Defines your progression framework and exercise variety."
          />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">Primary Goal</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {GOAL_OPTIONS.map((g) => {
                  const isSelected = formData.primary_goal === g
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, primary_goal: g })}
                      className={[
                        'p-3 rounded-lg border text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      <span>{g}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-lime-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-zinc-300 block mb-2">Experience Level</label>
              <div className="grid grid-cols-3 gap-2.5">
                {EXPERIENCE_OPTIONS.map((exp) => {
                  const isSelected = formData.experience_level === exp
                  return (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setFormData({ ...formData, experience_level: exp })}
                      className={[
                        'p-3 rounded-lg border text-xs font-semibold transition-all text-center cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      {exp}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Training Schedule & Environment */}
        <Card className="space-y-5 p-6">
          <SectionHeading
            title="Schedule &amp; Training Location"
            subtitle="Match routines to where and how often you work out."
          />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">
                Training Days Per Week ({formData.training_days_per_week} days)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[2, 3, 4, 5, 6, 7].map((days) => {
                  const isSelected = formData.training_days_per_week === days
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFormData({ ...formData, training_days_per_week: days })}
                      className={[
                        'p-2.5 rounded-lg border text-center transition-all cursor-pointer font-bold',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/15 text-lime-400 ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      {days}d
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-zinc-300 block mb-2">Training Environment</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ENVIRONMENT_OPTIONS.map((env) => {
                  const isSelected = formData.training_environment === env
                  return (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setFormData({ ...formData, training_environment: env })}
                      className={[
                        'p-3 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      <span>{env}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-lime-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 4: Equipment & Dietary Preference */}
        <Card className="space-y-5 p-6">
          <SectionHeading
            title="Equipment &amp; Nutrition Preferences"
            subtitle="Available tools and dietary choices for future phase tracking."
          />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">Available Equipment</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => {
                  const isSelected = formData.available_equipment.includes(eq)
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => handleEquipmentToggle(eq)}
                      className={[
                        'p-2.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/15 text-white'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      <span className="truncate">{eq}</span>
                      {isSelected && <CheckCircle2 size={13} className="text-lime-400 shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-zinc-300 block mb-2">Dietary Preference</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DIET_OPTIONS.map((diet) => {
                  const isSelected = formData.dietary_preference === diet
                  return (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => setFormData({ ...formData, dietary_preference: diet })}
                      className={[
                        'p-3 rounded-lg border text-xs font-semibold transition-all text-left flex items-center justify-between cursor-pointer',
                        isSelected
                          ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white',
                      ].join(' ')}
                    >
                      <span>{diet}</span>
                      {isSelected && <CheckCircle2 size={14} className="text-lime-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Language & Unit Preferences */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Language & Regional Preferences</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Indian native script support and customized measurement systems.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                Interface Language
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'en', label: 'English', sub: 'Global' },
                    { id: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' },
                    { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      language === item.id
                        ? 'bg-lime-400/15 border-lime-400 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                Measurement System
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(
                  [
                    { id: 'metric', label: 'Metric', sub: 'kg, cm, liters' },
                    { id: 'imperial', label: 'Imperial', sub: 'lbs, ft/in, fl oz' },
                  ] as const
                ).map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setUnitSystem(unit.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      unitSystem === unit.id
                        ? 'bg-lime-400/15 border-lime-400 text-white font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm">{unit.label}</div>
                    <div className="text-[10px] text-zinc-500">{unit.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Accessibility & Inclusive Fitness */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center shrink-0">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Accessibility & Inclusive Fitness</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Sensory comfort, typography scaling, high contrast and beginner guidance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-sm font-semibold text-white block">High Contrast Mode</span>
                <span className="text-xs text-zinc-400">Deep black backdrops with high-luminance borders</span>
              </div>
              <Toggle checked={preferences.highContrast} onChange={setHighContrast} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-sm font-semibold text-white block">Reduced Motion</span>
                <span className="text-xs text-zinc-400">Disables animations and transitions for vestibular ease</span>
              </div>
              <Toggle checked={preferences.reducedMotion} onChange={setReducedMotion} />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div>
                <span className="text-sm font-semibold text-white block">Beginner Movement Cues</span>
                <span className="text-xs text-zinc-400">Provides form tips and safe exercise alternatives</span>
              </div>
              <Toggle checked={preferences.showBeginnerCues} onChange={setShowBeginnerCues} />
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                Font Scaling
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'normal', label: '100% Default' },
                    { id: 'large', label: '110% Large' },
                    { id: 'xl', label: '120% Extra Large' },
                  ] as const
                ).map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => setFontScale(scale.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition ${
                      preferences.fontScale === scale.id
                        ? 'bg-lime-400 text-zinc-950 border-lime-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            loading={isSaving}
            icon={<Save size={18} />}
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
