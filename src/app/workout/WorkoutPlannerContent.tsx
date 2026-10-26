'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Dumbbell,
  Play,
  Clock,
  Flame,
  Target,
  Sparkles,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  PlayCircle,
  X,
  Video,
  Box,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeading } from '@/components/ui'
import { PRESET_WORKOUT_ROUTINES, getRecommendedRoutineForProfile } from '@/data/routines'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { ExerciseVideoPlayer } from '@/components/video/ExerciseVideoPlayer'
import { getUserProfile } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import { activePlanKey, applyExerciseOverrides, getFitnessUserId } from '@/lib/digitalTwin'
import type { WorkoutRoutine, Exercise } from '@/types/workout'
import type { UserProfile } from '@/types/profile'

export function WorkoutPlannerContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine>(PRESET_WORKOUT_ROUTINES[0])
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasAppliedPlan, setHasAppliedPlan] = useState(false)
  const [appliedTrainingDays, setAppliedTrainingDays] = useState<number | null>(null)
  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const userId = data?.user?.id || 'demo-user'
        const p = await getUserProfile(userId)
        setProfile(p)
        const recommended = getRecommendedRoutineForProfile(p)
        let routine = recommended
        try {
          const fitnessUserId = await getFitnessUserId()
          const appliedPlan = JSON.parse(localStorage.getItem(activePlanKey(fitnessUserId)) || 'null')
          const appliedRoutine = PRESET_WORKOUT_ROUTINES.find((item) => item.id === appliedPlan?.routineId)
          if (appliedRoutine) {
            const overrides = appliedPlan.exerciseOverrides && typeof appliedPlan.exerciseOverrides === 'object'
              ? appliedPlan.exerciseOverrides as Record<string, string>
              : {}
            routine = applyExerciseOverrides(appliedRoutine, overrides, p?.available_equipment)
            setExerciseOverrides(overrides)
            setHasAppliedPlan(true)
            if (typeof appliedPlan.trainingDaysPerWeek === 'number') {
              setAppliedTrainingDays(appliedPlan.trainingDaysPerWeek)
            }
          }
        } catch (error) {
          console.warn('Unable to load the applied digital twin plan:', error)
        }
        setSelectedRoutine(routine)
      } catch {
        setSelectedRoutine(PRESET_WORKOUT_ROUTINES[0])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Workout Planner</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Adaptive workout programming tailored to your goals, frequency, and equipment.
          </p>
        </div>
        <Link href={`/workout/session?routineId=${selectedRoutine.id}${Object.keys(exerciseOverrides).length ? `&exerciseOverrides=${encodeURIComponent(JSON.stringify(exerciseOverrides))}` : ''}`}>
          <Button size="lg" icon={<Play size={18} />} className="shadow-lg shadow-lime-400/10">
            Start Today&apos;s Workout
          </Button>
        </Link>
      </div>

      {/* Routine Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PRESET_WORKOUT_ROUTINES.map((routine) => {
          const isSelected = selectedRoutine.id === routine.id
          return (
            <button
              key={routine.id}
              onClick={() => {
                setSelectedRoutine(routine)
                setExerciseOverrides({})
                setHasAppliedPlan(false)
                setAppliedTrainingDays(null)
              }}
              className={[
                'px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border',
                isSelected
                  ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700',
              ].join(' ')}
            >
              <span>{routine.targetSplit}</span>
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />}
            </button>
          )
        })}
      </div>

      {/* Selected Routine Hero Card */}
      <Card className="p-6 md:p-8 border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/20 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">{selectedRoutine.targetSplit}</Badge>
              <span className="text-xs text-zinc-500 font-medium">
                {hasAppliedPlan
                  ? `Confirmed scenario plan${appliedTrainingDays ? ` · ${appliedTrainingDays} days/week` : ''}`
                  : 'Recommended for today'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">{selectedRoutine.name}</h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              {selectedRoutine.description}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 shrink-0">
            <div>
              <span className="text-xs text-zinc-500 block">Est. Duration</span>
              <span className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Clock size={16} className="text-lime-400" />
                {selectedRoutine.durationMinutes} mins
              </span>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <span className="text-xs text-zinc-500 block">Exercises</span>
              <span className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5">
                <Dumbbell size={16} className="text-lime-400" />
                {selectedRoutine.exercises.length} moves
              </span>
            </div>
          </div>
        </div>

        {/* Exercises List in this routine */}
        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Workout Exercise Order
            </h3>
            <span className="text-xs text-zinc-500">Progressive Overload Scheme</span>
          </div>

          <div className="space-y-2.5">
            {selectedRoutine.exercises.map((item, index) => (
              <div
                key={item.exerciseId}
                className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 text-lime-400 font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.exerciseName}</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Target: {item.primaryMuscle} · Equipment: {item.equipment}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="text-xs">
                    <span className="text-zinc-500 block">Sets × Reps</span>
                    <span className="font-semibold text-white">
                      {item.targetSets} sets × {item.targetReps}
                    </span>
                  </div>
                  <div className="hidden sm:block text-xs">
                    <span className="text-zinc-500 block">Rest</span>
                    <span className="font-semibold text-zinc-300">{item.restSeconds}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const matched = EXERCISE_DATABASE.find((ex) => ex.id === item.exerciseId) || {
                        id: item.exerciseId,
                        name: item.exerciseName,
                        primaryMuscle: item.primaryMuscle,
                        equipment: item.equipment,
                        difficulty: 'Intermediate' as const,
                        instructions: ['Perform with strict control and full range of motion.'],
                      }
                      setPreviewExercise(matched)
                    }}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-lime-400 hover:border-lime-400/40 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                    title="Preview anime movement technique"
                    aria-label={`Preview movement technique for ${item.exerciseName}`}
                  >
                    <PlayCircle size={15} className="text-lime-400" />
                    <span className="hidden md:inline">Demo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="pt-2 flex justify-end">
          <Link href={`/workout/session?routineId=${selectedRoutine.id}${Object.keys(exerciseOverrides).length ? `&exerciseOverrides=${encodeURIComponent(JSON.stringify(exerciseOverrides))}` : ''}`}>
            <Button size="lg" icon={<Play size={18} />}>
              Launch Session Now
            </Button>
          </Link>
        </div>
      </Card>

      {/* Exercise Movement Preview Modal */}
      {previewExercise && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewExercise(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="accent">{previewExercise.primaryMuscle}</Badge>
                  <span className="text-xs text-zinc-500">{previewExercise.equipment}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{previewExercise.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video Player */}
            <ExerciseVideoPlayer
              exercise={previewExercise}
              autoPlay={true}
            />

            <div className="flex items-center justify-between pt-2">
              <Link href={`/virtual-gym?exercise=${previewExercise.id}`}>
                <Button size="sm" variant="secondary" icon={<Box size={14} className="text-lime-400" />}>
                  Open in 3D Virtual Gym
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => setPreviewExercise(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
