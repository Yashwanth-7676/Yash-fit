'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Exercise, MuscleGroup } from '@/types/workout'
import type { WeeklyMuscleOverview } from '@/types/virtualGym'
import type { TwinWorkout } from '@/lib/digitalTwin'
import type { UserProfile } from '@/types/profile'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { getExercise3DConfig } from '@/lib/virtual-gym/exerciseKinematics'
import { calculateWeeklyMuscleOverview } from '@/lib/virtual-gym/muscleIntelligenceService'
import { getFitnessUserId, workoutHistoryKey } from '@/lib/digitalTwin'
import { getUserProfile } from '@/lib/profileService'
import { ExerciseBrowser } from '@/components/virtual-gym/ExerciseBrowser'
import { ExerciseDetailsPanel } from '@/components/virtual-gym/ExerciseDetailsPanel'
import { MuscleIntelligenceCard } from '@/components/virtual-gym/MuscleIntelligenceCard'
import { Box, Layers, RotateCcw, ArrowLeft, Play, Dumbbell, Activity, Cpu } from 'lucide-react'

// Dynamically import 3D Viewport with SSR disabled to prevent WebGL/Window hydration issues
const VirtualGymViewport = dynamic(
  () =>
    import('@/components/virtual-gym/VirtualGymViewport').then(
      (mod) => mod.VirtualGymViewport
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[540px] rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-zinc-400">Loading 3D Biomechanical Viewport...</span>
      </div>
    ),
  }
)

export function VirtualGymContent() {
  const searchParams = useSearchParams()
  const initialExerciseParam = searchParams.get('exercise')
  const initialMuscleParam = searchParams.get('muscle') as MuscleGroup | null

  // Selection states
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(() => {
    if (initialExerciseParam) {
      const match = EXERCISE_DATABASE.find(
        (ex) => ex.id === initialExerciseParam || ex.name.toLowerCase() === initialExerciseParam.toLowerCase()
      )
      if (match) return match
    }
    return EXERCISE_DATABASE[0] // Barbell Bench Press or Squat
  })

  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(initialMuscleParam || null)
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')

  // Telemetry state
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load telemetry
  useEffect(() => {
    async function loadData() {
      try {
        const id = await getFitnessUserId()
        const userProf = await getUserProfile(id)
        setProfile(userProf)

        // Read stored completed workouts
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(workoutHistoryKey(id))
          if (raw) {
            try {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) setWorkouts(parsed)
            } catch {
              // fallback
            }
          } else {
            // Check demo key
            const demoRaw = localStorage.getItem('yashfit_completed_workouts')
            if (demoRaw) {
              try {
                const parsed = JSON.parse(demoRaw)
                if (Array.isArray(parsed)) setWorkouts(parsed)
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Error loading telemetry for virtual gym:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate weekly muscle overview
  const weeklyOverview: WeeklyMuscleOverview = useMemo(() => {
    return calculateWeeklyMuscleOverview(workouts, profile)
  }, [workouts, profile])

  // Resolve 3D configuration for selected exercise
  const exercise3DConfig = useMemo(() => {
    return getExercise3DConfig(
      selectedExercise.id,
      selectedExercise.name,
      selectedExercise.primaryMuscle
    )
  }, [selectedExercise])

  const handleQuickExerciseSelect = (exerciseName: string) => {
    const match = EXERCISE_DATABASE.find(
      (ex) => ex.name.toLowerCase().includes(exerciseName.toLowerCase())
    )
    if (match) {
      setSelectedExercise(match)
      window.scrollTo({ top: 380, behavior: 'smooth' })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Box size={13} />
              Upgrade #11
            </span>
            <span className="text-xs text-zinc-400">Interactive 3D Biomechanics</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            3D Virtual Gym & Muscle Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Simulate human joint mechanics in 3D, inspect target muscle activation paths, and calibrate your weekly volume balance against real training logs.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Mode toggle */}
          <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '3d'
                  ? 'bg-lime-400 text-zinc-950 shadow-sm shadow-lime-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Box size={13} />
              <span>3D Mannequin</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '2d'
                  ? 'bg-lime-400 text-zinc-950 shadow-sm shadow-lime-400/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>2D Anatomy</span>
            </button>
          </div>

          <Link
            href="/command-center"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Cpu size={13} className="text-lime-400" />
            <span className="hidden sm:inline">AI Command Center</span>
          </Link>
        </div>
      </div>

      {/* Muscle Intelligence Overview Card */}
      <MuscleIntelligenceCard
        overview={weeklyOverview}
        selectedMuscle={selectedMuscle}
        onSelectMuscle={setSelectedMuscle}
        onQuickExerciseSelect={handleQuickExerciseSelect}
      />

      {/* Main Interactive Viewport & Exercise Details (Two Columns on large screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Viewport / 2D Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <VirtualGymViewport
            config={exercise3DConfig}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={setSelectedMuscle}
            currentViewMode={viewMode}
            onToggleViewMode={setViewMode}
          />

          {/* Quick Helper Note */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between gap-3">
            <span>
              💡 <strong>Interaction tip:</strong> Drag to rotate mannequin in 3D, scroll to zoom, or click any muscle to filter exercises.
            </span>
            <button
              type="button"
              onClick={() => setSelectedMuscle(null)}
              className="text-xs text-lime-400 hover:underline shrink-0"
            >
              Reset Highlights
            </button>
          </div>
        </div>

        {/* Right Column: Exercise Details & Biomechanics Panel (5 cols) */}
        <div className="lg:col-span-5">
          <ExerciseDetailsPanel config={exercise3DConfig} />
        </div>
      </div>

      {/* Bottom Section: Exercise Biomechanics Library Browser */}
      <ExerciseBrowser
        selectedExerciseId={selectedExercise.id}
        onSelectExercise={(ex) => {
          setSelectedExercise(ex)
          // Scroll up to view 3D viewport smoothly on mobile
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            window.scrollTo({ top: 340, behavior: 'smooth' })
          }
        }}
        filterMuscle={selectedMuscle}
        onFilterMuscleChange={setSelectedMuscle}
      />
    </div>
  )
}
