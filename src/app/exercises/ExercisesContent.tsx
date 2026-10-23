'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Dumbbell,
  Filter,
  Info,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
  Star,
  Shuffle,
  PlayCircle,
  Video,
} from 'lucide-react'
import { Card, Badge, Button, Input, SectionHeading, useToast } from '@/components/ui'
import { ExerciseVideoPlayer } from '@/components/video/ExerciseVideoPlayer'
import { EXERCISE_DATABASE } from '@/data/exercises'
import type { Exercise, MuscleGroup } from '@/types/workout'
import type { EquipmentOption } from '@/types/profile'

const MUSCLE_FILTERS: (MuscleGroup | 'All')[] = [
  'All',
  'Chest',
  'Back',
  'Quads',
  'Hamstrings',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Glutes',
  'Core',
]

const EQUIPMENT_FILTERS: (EquipmentOption | 'All')[] = [
  'All',
  'Dumbbells',
  'Barbell',
  'Cable Machine',
  'Machines',
  'Pull-up Bar',
  'No Equipment',
]

const DIFFICULTY_FILTERS: ('All' | 'Beginner' | 'Intermediate' | 'Advanced')[] = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
]

export function ExercisesContent() {
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All')
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | 'All'>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yashfit_favorite_exercises')
      if (stored) {
        setFavorites(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  const toggleFavorite = (exerciseId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const exists = favorites.includes(exerciseId)
    const updated = exists
      ? favorites.filter((id) => id !== exerciseId)
      : [...favorites, exerciseId]

    setFavorites(updated)
    try {
      localStorage.setItem('yashfit_favorite_exercises', JSON.stringify(updated))
      if (exists) {
        toast.info('Removed from Favorites', name)
      } else {
        toast.success('Favorited! ⭐', `${name} saved to your favorites.`)
      }
    } catch {
      // ignore
    }
  }

  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((exercise) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMuscle =
        selectedMuscle === 'All' ||
        exercise.primaryMuscle === selectedMuscle ||
        exercise.secondaryMuscles?.includes(selectedMuscle as MuscleGroup)

      const matchesEquipment =
        selectedEquipment === 'All' || exercise.equipment === selectedEquipment

      const matchesDifficulty =
        selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty

      const matchesFavorites = !showFavoritesOnly || favorites.includes(exercise.id)

      return matchesSearch && matchesMuscle && matchesEquipment && matchesDifficulty && matchesFavorites
    })
  }, [searchQuery, selectedMuscle, selectedEquipment, selectedDifficulty, showFavoritesOnly, favorites])

  // Suggested substitutions for the active exercise
  const substitutions = useMemo(() => {
    if (!activeExercise) return []
    return EXERCISE_DATABASE.filter(
      (e) =>
        e.id !== activeExercise.id &&
        (e.primaryMuscle === activeExercise.primaryMuscle ||
          e.secondaryMuscles?.includes(activeExercise.primaryMuscle as MuscleGroup))
    ).slice(0, 3)
  }, [activeExercise])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Exercise Library</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Explore {EXERCISE_DATABASE.length}+ movements with execution steps, proper form cues, and muscle activation targets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search exercise by name or muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={[
              'h-10 px-4 rounded-lg border text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer',
              showFavoritesOnly
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            <Star size={16} className={showFavoritesOnly ? 'fill-amber-400 text-amber-400' : ''} />
            Favorites {favorites.length > 0 && `(${favorites.length})`}
          </button>
        </div>

        {/* Difficulty quick chips */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Difficulty:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {DIFFICULTY_FILTERS.map((d) => {
              const active = selectedDifficulty === d
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-lime-400 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700',
                  ].join(' ')}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        {/* Muscle group quick chips */}
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Target Muscle:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {MUSCLE_FILTERS.map((m) => {
              const active = selectedMuscle === m
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMuscle(m)}
                  className={[
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-lime-400 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700',
                  ].join(' ')}
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>

        {/* Equipment quick chips */}
        <div className="space-y-2 pt-1 border-t border-zinc-800">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Equipment:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {EQUIPMENT_FILTERS.map((eq) => {
              const active = selectedEquipment === eq
              return (
                <button
                  key={eq}
                  onClick={() => setSelectedEquipment(eq)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    active
                      ? 'bg-lime-400/20 text-lime-400 border border-lime-400/40'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700',
                  ].join(' ')}
                >
                  {eq}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => {
          const isFav = favorites.includes(exercise.id)
          return (
            <div
              key={exercise.id}
              onClick={() => setActiveExercise(exercise)}
              className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 hover:bg-zinc-850/60 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20">
                      {exercise.primaryMuscle}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium bg-zinc-800 px-2 py-0.5 rounded">
                      {exercise.difficulty}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(exercise.id, exercise.name, e)}
                    className="p-1 rounded-md text-zinc-500 hover:text-amber-400 transition-colors"
                    aria-label={isFav ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star
                      size={16}
                      className={isFav ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}
                    />
                  </button>
                </div>
                <h3 className="text-base font-semibold text-white group-hover:text-lime-400 transition-colors">
                  {exercise.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Equipment: <span className="text-zinc-300 font-medium">{exercise.equipment}</span>
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Video size={13} className="text-lime-400" />
                  <span>Anime Demo</span>
                </span>
                <span className="flex items-center gap-1 text-lime-400 font-medium group-hover:translate-x-0.5 transition-transform">
                  <PlayCircle size={14} />
                  <span>Watch Demo</span>
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filteredExercises.length === 0 && (
        <Card className="text-center py-16 space-y-3">
          <p className="text-zinc-400 font-medium">No exercises found matching your filter criteria.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedMuscle('All')
              setSelectedEquipment('All')
            }}
          >
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Exercise Detail Modal with Anime Video Player */}
      {activeExercise && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveExercise(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="accent">{activeExercise.primaryMuscle}</Badge>
                  <Badge variant="default">{activeExercise.equipment}</Badge>
                  <span className="text-xs text-zinc-500">{activeExercise.difficulty}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{activeExercise.name}</h2>
              </div>
              <button
                onClick={() => setActiveExercise(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            {/* Anime Animated Demonstration Video Player */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Video size={14} className="text-lime-400" />
                  Technique Demonstration
                </span>
                <span className="text-zinc-500">60 FPS Cel Animation</span>
              </div>
              <ExerciseVideoPlayer
                exercise={activeExercise}
                autoPlay={true}
              />
            </div>

            {/* Target Muscles */}
            {activeExercise.secondaryMuscles && activeExercise.secondaryMuscles.length > 0 && (
              <div className="text-xs text-zinc-400">
                <span className="text-zinc-500 font-medium">Secondary Muscles: </span>
                {activeExercise.secondaryMuscles.join(', ')}
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-white">How to perform:</h3>
              <ol className="space-y-2 text-xs text-zinc-300 list-decimal list-inside leading-relaxed">
                {activeExercise.instructions.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips / Form Cues */}
            {activeExercise.tips && activeExercise.tips.length > 0 && (
              <div className="p-3.5 rounded-xl bg-lime-400/5 border border-lime-400/20 text-xs text-zinc-300 space-y-1">
                <span className="text-lime-400 font-semibold block">Pro Form Tips:</span>
                {activeExercise.tips.map((tip, idx) => (
                  <p key={idx} className="text-zinc-400">
                    • {tip}
                  </p>
                ))}
              </div>
            )}

            {/* Smart Substitutions */}
            {substitutions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shuffle size={13} className="text-lime-400" />
                  Equipment Alternatives &amp; Substitutions:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {substitutions.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveExercise(sub)}
                      className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-lime-400/50 text-left transition-colors cursor-pointer group"
                    >
                      <p className="text-xs font-semibold text-white group-hover:text-lime-400 truncate">
                        {sub.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{sub.equipment}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="md" onClick={() => setActiveExercise(null)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

