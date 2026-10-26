'use client'

import React, { useState, useMemo } from 'react'
import type { Exercise, MuscleGroup } from '@/types/workout'
import type { EquipmentOption } from '@/types/profile'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { Search, Dumbbell, Filter, Sparkles, Check, ChevronRight } from 'lucide-react'

interface ExerciseBrowserProps {
  selectedExerciseId: string
  onSelectExercise: (exercise: Exercise) => void
  filterMuscle?: MuscleGroup | null
  onFilterMuscleChange?: (muscle: MuscleGroup | null) => void
}

const MUSCLE_GROUPS: (MuscleGroup | 'All')[] = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
]

const EQUIPMENT_OPTIONS: (EquipmentOption | 'All')[] = [
  'All',
  'Barbell',
  'Dumbbells',
  'Cable Machine',
  'Machines',
  'No Equipment',
]

export function ExerciseBrowser({
  selectedExerciseId,
  onSelectExercise,
  filterMuscle,
  onFilterMuscleChange,
}: ExerciseBrowserProps) {
  const [search, setSearch] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption | 'All'>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')

  const filteredExercises = useMemo(() => {
    return EXERCISE_DATABASE.filter((ex) => {
      // Search text filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = ex.name.toLowerCase().includes(q)
        const matchesMuscle =
          ex.primaryMuscle.toLowerCase().includes(q) ||
          (ex.secondaryMuscles || []).some((m) => m.toLowerCase().includes(q))
        if (!matchesName && !matchesMuscle) return false
      }

      // Muscle group filter
      if (filterMuscle) {
        const matchesPrimary = ex.primaryMuscle === filterMuscle
        const matchesSecondary = (ex.secondaryMuscles || []).includes(filterMuscle)
        if (!matchesPrimary && !matchesSecondary) return false
      }

      // Equipment filter
      if (selectedEquipment !== 'All') {
        if (ex.equipment !== selectedEquipment) return false
      }

      // Difficulty filter
      if (selectedDifficulty !== 'All') {
        if (ex.difficulty !== selectedDifficulty) return false
      }

      return true
    })
  }, [search, filterMuscle, selectedEquipment, selectedDifficulty])

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Exercise Biomechanics Library</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {filteredExercises.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-400">
            Select an exercise to preview joint rotations, kinematics, and activated muscles.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercise or muscle..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400"
          />
        </div>
      </div>

      {/* Filter Row 1: Muscle Groups */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MUSCLE_GROUPS.map((m) => {
          const isActive = m === 'All' ? !filterMuscle : filterMuscle === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (onFilterMuscleChange) {
                  onFilterMuscleChange(m === 'All' ? null : m)
                }
              }}
              className={`text-xs px-3 py-1 rounded-lg shrink-0 font-medium transition-all ${
                isActive
                  ? 'bg-lime-400 text-zinc-950 font-bold shadow-sm shadow-lime-400/20'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Filter Row 2: Equipment & Difficulty */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-xs">
        <span className="text-zinc-500 font-medium">Equipment:</span>
        {EQUIPMENT_OPTIONS.map((eq) => (
          <button
            key={eq}
            type="button"
            onClick={() => setSelectedEquipment(eq)}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
              selectedEquipment === eq
                ? 'bg-zinc-700 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {eq}
          </button>
        ))}

        <div className="w-px h-3.5 bg-zinc-800 mx-1 hidden sm:block" />

        <span className="text-zinc-500 font-medium hidden sm:inline">Level:</span>
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map((diff) => (
          <button
            key={diff}
            type="button"
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
              selectedDifficulty === diff
                ? 'bg-zinc-700 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {diff}
          </button>
        ))}
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-2">
          <p className="font-semibold text-zinc-300">No exercises match your current filters.</p>
          <p>Try clearing your search query or selecting &quot;All&quot; muscles.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSelectedEquipment('All')
              setSelectedDifficulty('All')
              if (onFilterMuscleChange) onFilterMuscleChange(null)
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs font-semibold hover:bg-zinc-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredExercises.map((ex) => {
            const isSelected = ex.id === selectedExerciseId
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelectExercise(ex)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-zinc-800/90 border-lime-400 shadow-md shadow-lime-400/10'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-lime-400">
                      {ex.name}
                    </span>
                    {isSelected && <Check size={14} className="text-lime-400 shrink-0" />}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <span className="text-lime-400 font-medium">{ex.primaryMuscle}</span>
                    <span>•</span>
                    <span>{ex.equipment}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60">
                  <span>{ex.difficulty}</span>
                  <span className="flex items-center gap-0.5 text-zinc-400 group-hover:text-lime-400">
                    Preview 3D <ChevronRight size={11} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
