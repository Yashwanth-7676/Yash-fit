'use client'

import React, { useState, useMemo } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { Info, RotateCw, Flame, ShieldAlert, Sparkles, Activity } from 'lucide-react'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'
import { getMuscleGroup } from '@/lib/digitalTwin'
import type { MuscleGroup } from '@/types/workout'

interface InteractiveAvatarProps {
  workouts: TwinWorkout[]
  recovery: RecoveryEntry[]
  selectedMuscle?: MuscleGroup | null
  onSelectMuscle?: (muscle: MuscleGroup | null) => void
}

interface MuscleStats {
  sets14Days: number
  recentExercises: string[]
  isSore: boolean
  lastTrainedDate: string | null
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
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

export function InteractiveAvatar({
  workouts,
  recovery,
  selectedMuscle: externalSelectedMuscle,
  onSelectMuscle,
}: InteractiveAvatarProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [internalSelectedMuscle, setInternalSelectedMuscle] = useState<MuscleGroup | null>(null)
  const [colorMode, setColorMode] = useState<'volume' | 'recovery'>('volume')

  const activeMuscle = externalSelectedMuscle !== undefined ? externalSelectedMuscle : internalSelectedMuscle

  const handleSelect = (muscle: MuscleGroup | null) => {
    if (onSelectMuscle) {
      onSelectMuscle(muscle)
    } else {
      setInternalSelectedMuscle(muscle)
    }
  }

  // Calculate recent (last 14 days) muscle stats from workout logs
  const muscleData = useMemo(() => {
    const stats: Record<MuscleGroup, MuscleStats> = {
      Chest: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Back: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Shoulders: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Biceps: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Triceps: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Quads: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Hamstrings: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Glutes: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Calves: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
      Core: { sets14Days: 0, recentExercises: [], isSore: false, lastTrainedDate: null },
    }

    const twoWeeksAgo = Date.now() - 14 * 86400000

    workouts.forEach((workout) => {
      const workoutTime = Date.parse(workout.date)
      const isRecent = Number.isFinite(workoutTime) && workoutTime >= twoWeeksAgo

      workout.exercises?.forEach((exercise) => {
        const muscle = getMuscleGroup(exercise)
        if (!muscle || !stats[muscle]) return

        if (isRecent) {
          const completedSets = exercise.sets.filter((s) => s.completed).length
          stats[muscle].sets14Days += completedSets
          if (!stats[muscle].recentExercises.includes(exercise.exerciseName)) {
            stats[muscle].recentExercises.push(exercise.exerciseName)
          }
        }

        if (
          !stats[muscle].lastTrainedDate ||
          Date.parse(workout.date) > Date.parse(stats[muscle].lastTrainedDate!)
        ) {
          stats[muscle].lastTrainedDate = workout.date
        }
      })
    })

    // Check latest recovery soreness
    const latestRecovery = recovery[0]
    if (latestRecovery && latestRecovery.soreness) {
      const soreLower = latestRecovery.soreness.toLowerCase()
      if (soreLower === 'high' || soreLower === 'severe') {
        ALL_MUSCLE_GROUPS.forEach((m) => {
          if (stats[m].sets14Days >= 6) {
            stats[m].isSore = true
          }
        })
      }
    }

    return stats
  }, [workouts, recovery])

  // Get color for a muscle group based on mode
  const getMuscleFill = (muscle: MuscleGroup): string => {
    const isSelected = activeMuscle === muscle
    const data = muscleData[muscle]

    if (isSelected) {
      return '#bef264' // lime-300 highlight
    }

    if (colorMode === 'recovery') {
      if (data.isSore) return '#f87171' // rose-400 for high soreness
      if (data.sets14Days >= 10) return '#fbbf24' // amber-400 for fatigued
      if (data.sets14Days > 0) return '#4ade80' // green-400 ready
      return '#3f3f46' // zinc-700 rested / no recent load
    }

    // Volume Mode
    if (data.sets14Days >= 14) return '#a3e635' // lime-400 high volume
    if (data.sets14Days >= 6) return '#65a30d' // lime-600 moderate volume
    if (data.sets14Days > 0) return '#3f6212' // lime-900 light volume
    return '#27272a' // zinc-800 inactive
  }

  const selectedStats = activeMuscle ? muscleData[activeMuscle] : null

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 p-5">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Interactive Anatomy Avatar</h3>
            <Badge variant="accent">Schematic</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Reflects logged training volume &amp; recovery per muscle group (last 14 days)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Color Mode Toggle */}
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => setColorMode('volume')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                colorMode === 'volume'
                  ? 'bg-lime-400 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Volume
            </button>
            <button
              type="button"
              onClick={() => setColorMode('recovery')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                colorMode === 'recovery'
                  ? 'bg-lime-400 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Recovery
            </button>
          </div>

          {/* View Rotation Button */}
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCw size={13} />}
            onClick={() => setView(view === 'front' ? 'back' : 'front')}
          >
            {view === 'front' ? 'Back View' : 'Front View'}
          </Button>
        </div>
      </div>

      {/* Main Avatar Display & Detail Panel */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 mt-5 items-center">
        {/* SVG Humanoid Silhouette */}
        <div className="relative flex flex-col items-center justify-center p-3 bg-zinc-950/70 rounded-xl border border-zinc-800/80">
          <svg
            viewBox="0 0 200 360"
            className="w-44 h-80 drop-shadow-md select-none transition-all duration-300"
            role="img"
            aria-label={`Interactive muscular anatomy model (${view} view)`}
          >
            {/* Head */}
            <circle cx="100" cy="30" r="18" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            {/* Neck */}
            <rect x="94" y="48" width="12" height="12" rx="2" fill="#27272a" />

            {view === 'front' ? (
              /* FRONT VIEW MUSCLES */
              <g className="cursor-pointer">
                {/* Shoulders */}
                <g onClick={() => handleSelect('Shoulders')}>
                  <path
                    d="M 64 64 C 52 70 48 88 56 102 C 64 96 68 84 66 68 Z"
                    fill={getMuscleFill('Shoulders')}
                    stroke={activeMuscle === 'Shoulders' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 136 64 C 148 70 152 88 144 102 C 136 96 132 84 134 68 Z"
                    fill={getMuscleFill('Shoulders')}
                    stroke={activeMuscle === 'Shoulders' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Chest */}
                <g onClick={() => handleSelect('Chest')}>
                  <path
                    d="M 68 66 C 82 64 96 70 98 94 C 82 98 70 90 68 66 Z"
                    fill={getMuscleFill('Chest')}
                    stroke={activeMuscle === 'Chest' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 132 66 C 118 64 104 70 102 94 C 118 98 130 90 132 66 Z"
                    fill={getMuscleFill('Chest')}
                    stroke={activeMuscle === 'Chest' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Biceps */}
                <g onClick={() => handleSelect('Biceps')}>
                  <path
                    d="M 54 104 C 48 116 48 136 56 146 C 62 136 62 118 56 106 Z"
                    fill={getMuscleFill('Biceps')}
                    stroke={activeMuscle === 'Biceps' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 146 104 C 152 116 152 136 144 146 C 138 136 138 118 144 106 Z"
                    fill={getMuscleFill('Biceps')}
                    stroke={activeMuscle === 'Biceps' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Forearms (Neutral/Support) */}
                <path
                  d="M 52 148 C 44 162 44 186 50 198 C 58 186 58 162 54 148 Z"
                  fill="#27272a"
                  stroke="#3f3f46"
                  strokeWidth="1"
                />
                <path
                  d="M 148 148 C 156 162 156 186 150 198 C 142 186 142 162 146 148 Z"
                  fill="#27272a"
                  stroke="#3f3f46"
                  strokeWidth="1"
                />

                {/* Core */}
                <g onClick={() => handleSelect('Core')}>
                  <path
                    d="M 78 98 C 90 96 110 96 122 98 C 120 128 116 156 114 166 C 100 168 100 168 86 166 C 84 156 80 128 78 98 Z"
                    fill={getMuscleFill('Core')}
                    stroke={activeMuscle === 'Core' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <line x1="85" y1="120" x2="115" y2="120" stroke="#18181b" strokeWidth="1.5" />
                  <line x1="87" y1="140" x2="113" y2="140" stroke="#18181b" strokeWidth="1.5" />
                  <line x1="100" y1="98" x2="100" y2="162" stroke="#18181b" strokeWidth="1.5" />
                </g>

                {/* Quads */}
                <g onClick={() => handleSelect('Quads')}>
                  <path
                    d="M 76 172 C 68 200 66 230 74 254 C 84 256 94 250 96 226 C 96 196 94 176 92 172 Z"
                    fill={getMuscleFill('Quads')}
                    stroke={activeMuscle === 'Quads' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 124 172 C 132 200 134 230 126 254 C 116 256 106 250 104 226 C 104 196 106 176 108 172 Z"
                    fill={getMuscleFill('Quads')}
                    stroke={activeMuscle === 'Quads' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Calves */}
                <g onClick={() => handleSelect('Calves')}>
                  <path
                    d="M 72 262 C 66 280 68 316 76 332 C 84 330 88 314 86 286 C 86 270 82 262 72 262 Z"
                    fill={getMuscleFill('Calves')}
                    stroke={activeMuscle === 'Calves' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 128 262 C 134 280 132 316 124 332 C 116 330 112 314 114 286 C 114 270 118 262 128 262 Z"
                    fill={getMuscleFill('Calves')}
                    stroke={activeMuscle === 'Calves' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1"
                    className="transition-colors hover:brightness-125"
                  />
                </g>
              </g>
            ) : (
              /* BACK VIEW MUSCLES */
              <g className="cursor-pointer">
                {/* Rear Deltoids */}
                <g onClick={() => handleSelect('Shoulders')}>
                  <path
                    d="M 64 64 C 52 70 48 88 56 102 C 64 96 68 84 66 68 Z"
                    fill={getMuscleFill('Shoulders')}
                    stroke={activeMuscle === 'Shoulders' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 136 64 C 148 70 152 88 144 102 C 136 96 132 84 134 68 Z"
                    fill={getMuscleFill('Shoulders')}
                    stroke={activeMuscle === 'Shoulders' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Back (Upper Back, Traps, Lats) */}
                <g onClick={() => handleSelect('Back')}>
                  <path
                    d="M 86 52 C 100 56 114 52 114 52 L 132 72 C 122 108 108 136 100 148 C 92 136 78 108 68 72 Z"
                    fill={getMuscleFill('Back')}
                    stroke={activeMuscle === 'Back' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 84 146 C 94 148 106 148 116 146 L 114 170 C 104 172 96 172 86 170 Z"
                    fill={getMuscleFill('Back')}
                    stroke={activeMuscle === 'Back' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Triceps */}
                <g onClick={() => handleSelect('Triceps')}>
                  <path
                    d="M 54 104 C 48 116 48 136 56 146 C 62 136 62 118 56 106 Z"
                    fill={getMuscleFill('Triceps')}
                    stroke={activeMuscle === 'Triceps' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 146 104 C 152 116 152 136 144 146 C 138 136 138 118 144 106 Z"
                    fill={getMuscleFill('Triceps')}
                    stroke={activeMuscle === 'Triceps' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Glutes */}
                <g onClick={() => handleSelect('Glutes')}>
                  <path
                    d="M 76 170 C 88 170 98 174 98 196 C 88 206 74 198 72 178 Z"
                    fill={getMuscleFill('Glutes')}
                    stroke={activeMuscle === 'Glutes' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 124 170 C 112 170 102 174 102 196 C 112 206 126 198 128 178 Z"
                    fill={getMuscleFill('Glutes')}
                    stroke={activeMuscle === 'Glutes' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Hamstrings */}
                <g onClick={() => handleSelect('Hamstrings')}>
                  <path
                    d="M 74 200 C 72 226 74 246 80 258 C 90 254 94 242 96 218 C 96 202 88 198 74 200 Z"
                    fill={getMuscleFill('Hamstrings')}
                    stroke={activeMuscle === 'Hamstrings' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 126 200 C 128 226 126 246 120 258 C 110 254 106 242 104 218 C 104 202 112 198 126 200 Z"
                    fill={getMuscleFill('Hamstrings')}
                    stroke={activeMuscle === 'Hamstrings' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1.5"
                    className="transition-colors hover:brightness-125"
                  />
                </g>

                {/* Calves */}
                <g onClick={() => handleSelect('Calves')}>
                  <path
                    d="M 72 262 C 66 280 68 316 76 332 C 84 330 88 314 86 286 C 86 270 82 262 72 262 Z"
                    fill={getMuscleFill('Calves')}
                    stroke={activeMuscle === 'Calves' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1"
                    className="transition-colors hover:brightness-125"
                  />
                  <path
                    d="M 128 262 C 134 280 132 316 124 332 C 116 330 112 314 114 286 C 114 270 118 262 128 262 Z"
                    fill={getMuscleFill('Calves')}
                    stroke={activeMuscle === 'Calves' ? '#a3e635' : '#3f3f46'}
                    strokeWidth="1"
                    className="transition-colors hover:brightness-125"
                  />
                </g>
              </g>
            )}
          </svg>

          <p className="text-[10px] text-zinc-500 mt-2 text-center">
            Click any muscle to inspect logged volume &amp; readiness
          </p>
        </div>

        {/* Selected Muscle Detail Panel */}
        <div className="space-y-4">
          {activeMuscle && selectedStats ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                    Target Muscle Group
                  </span>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    {activeMuscle}
                    {selectedStats.sets14Days >= 10 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 font-semibold flex items-center gap-1">
                        <Flame size={11} /> High Volume
                      </span>
                    )}
                  </h4>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleSelect(null)}>
                  Clear
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 block">Logged Sets (14d)</span>
                  <span className="text-base font-bold text-white">
                    {selectedStats.sets14Days} sets
                  </span>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                  <span className="text-[11px] text-zinc-500 block">Last Trained</span>
                  <span className="text-xs font-semibold text-zinc-300">
                    {selectedStats.lastTrainedDate
                      ? new Date(selectedStats.lastTrainedDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'No recent log'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-zinc-400 block mb-1 font-medium">
                  Recent Exercises:
                </span>
                {selectedStats.recentExercises.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStats.recentExercises.map((name) => (
                      <span
                        key={name}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500 italic">
                    No recent exercises logged for this muscle.
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs flex items-start gap-2">
                {selectedStats.isSore ? (
                  <ShieldAlert size={14} className="text-rose-400 mt-0.5 shrink-0" />
                ) : (
                  <Sparkles size={14} className="text-lime-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-zinc-200">
                    {selectedStats.isSore
                      ? 'Fatigued / Elevated Soreness'
                      : selectedStats.sets14Days >= 10
                      ? 'Optimal Weekly Stimulus Reached'
                      : selectedStats.sets14Days > 0
                      ? 'Moderate Volume · Ready for progressive load'
                      : 'Rested · Under-stimulated recently'}
                  </span>
                  <p className="text-zinc-500 text-[11px] mt-0.5">
                    {selectedStats.isSore
                      ? 'Allow 24-48 hours rest or light active mobility before next hard session.'
                      : 'Deterministic recommendation based on logged sets and check-in score.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-center space-y-2">
              <Info size={20} className="mx-auto text-zinc-500" />
              <h4 className="text-sm font-semibold text-zinc-300">Click a muscle group on the avatar</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Select Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, or Core to view exact volume history, recent movements, and recovery state.
              </p>
            </div>
          )}

          {/* Color Legend */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-1">
            <span className="font-medium text-zinc-400">Legend ({colorMode}):</span>
            {colorMode === 'volume' ? (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800 inline-block border border-zinc-700" /> 0 sets
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-900 inline-block" /> 1-5 sets
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-600 inline-block" /> 6-13 sets
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400 inline-block" /> 14+ sets
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" /> Rested
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" /> Ready
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Fatigued
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Sore
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1.5">
        <Info size={12} className="shrink-0 text-zinc-400" />
        <span>
          <strong>Schematic Model:</strong> Colors represent exercise volume and reported soreness.
          This does not represent actual anatomical body composition, body fat percentage, or medical measurements.
        </span>
      </div>
    </Card>
  )
}

