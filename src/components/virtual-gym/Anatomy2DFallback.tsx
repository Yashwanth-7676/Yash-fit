'use client'

import React, { useState } from 'react'
import type { MuscleGroup } from '@/types/workout'
import { RotateCw, ShieldCheck, Info } from 'lucide-react'

interface Anatomy2DFallbackProps {
  primaryMuscles: MuscleGroup[]
  secondaryMuscles: MuscleGroup[]
  selectedMuscle?: MuscleGroup | null
  onSelectMuscle?: (muscle: MuscleGroup | null) => void
  interactive?: boolean
}

export function Anatomy2DFallback({
  primaryMuscles,
  secondaryMuscles,
  selectedMuscle,
  onSelectMuscle,
  interactive = true,
}: Anatomy2DFallbackProps) {
  const [view, setView] = useState<'front' | 'back'>('front')

  const getMuscleColor = (muscle: MuscleGroup) => {
    if (selectedMuscle === muscle) {
      return '#f59e0b' // Amber-500
    }
    if (primaryMuscles.includes(muscle)) {
      return '#a3e635' // Lime-400
    }
    if (secondaryMuscles.includes(muscle)) {
      return '#38bdf8' // Sky-400
    }
    return '#27272a' // Zinc-800
  }

  const getMuscleStroke = (muscle: MuscleGroup) => {
    if (selectedMuscle === muscle) return '#d97706'
    if (primaryMuscles.includes(muscle)) return '#84cc16'
    if (secondaryMuscles.includes(muscle)) return '#0284c7'
    return '#3f3f46'
  }

  const handleClick = (muscle: MuscleGroup) => {
    if (!interactive || !onSelectMuscle) return
    onSelectMuscle(selectedMuscle === muscle ? null : muscle)
  }

  return (
    <div className="relative flex flex-col items-center justify-between p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 w-full h-full min-h-[420px]">
      {/* Top Bar / Controls */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300">
            <ShieldCheck size={12} className="text-lime-400" />
            2D Biomechanical Map
          </span>
          <span className="text-xs text-zinc-400 hidden sm:inline">
            {interactive ? 'Click any muscle to filter exercises' : 'Biomechanical target regions'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setView((v) => (v === 'front' ? 'back' : 'front'))}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white transition-colors"
        >
          <RotateCw size={13} className="text-lime-400" />
          <span>Flip to {view === 'front' ? 'Back View' : 'Front View'}</span>
        </button>
      </div>

      {/* SVG Canvas Stage */}
      <div className="relative my-auto flex items-center justify-center w-full max-w-[280px] h-[320px]">
        <svg
          viewBox="0 0 240 380"
          className="w-full h-full drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none"
          role="img"
          aria-label={`Interactive 2D human muscle map - ${view} view`}
        >
          <defs>
            <filter id="glow-lime" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a3e635" floodOpacity="0.6" />
            </filter>
            <filter id="glow-sky" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Neutral Head & Neck Base */}
          <ellipse cx="120" cy="38" rx="20" ry="24" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
          <path d="M112,62 L112,74 L128,74 L128,62 Z" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />

          {view === 'front' ? (
            /* FRONT VIEW */
            <g id="front-anatomy">
              {/* Shoulders (Deltoids) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleClick('Shoulders')}
                role="button"
                tabIndex={0}
                aria-label="Shoulders"
              >
                <path
                  d="M74,76 C65,82 58,98 62,112 C66,116 78,102 82,90 C84,84 80,78 74,76 Z"
                  fill={getMuscleColor('Shoulders')}
                  stroke={getMuscleStroke('Shoulders')}
                  strokeWidth="1.5"
                />
                <path
                  d="M166,76 C175,82 182,98 178,112 C174,116 162,102 158,90 C156,84 160,78 166,76 Z"
                  fill={getMuscleColor('Shoulders')}
                  stroke={getMuscleStroke('Shoulders')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Chest (Pectorals) */}
              <g
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleClick('Chest')}
                role="button"
                tabIndex={0}
                aria-label="Chest"
              >
                <path
                  d="M84,84 C92,82 114,84 117,90 L117,126 C105,128 86,122 80,108 C78,98 80,88 84,84 Z"
                  fill={getMuscleColor('Chest')}
                  stroke={getMuscleStroke('Chest')}
                  strokeWidth="1.5"
                />
                <path
                  d="M156,84 C148,82 126,84 123,90 L123,126 C135,128 154,122 160,108 C162,98 160,88 156,84 Z"
                  fill={getMuscleColor('Chest')}
                  stroke={getMuscleStroke('Chest')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Biceps */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Biceps')}
                role="button"
                tabIndex={0}
                aria-label="Biceps"
              >
                <path
                  d="M58,114 C52,125 50,145 56,155 C60,158 67,152 70,140 C72,130 68,118 58,114 Z"
                  fill={getMuscleColor('Biceps')}
                  stroke={getMuscleStroke('Biceps')}
                  strokeWidth="1.5"
                />
                <path
                  d="M182,114 C188,125 190,145 184,155 C180,158 173,152 170,140 C168,130 172,118 182,114 Z"
                  fill={getMuscleColor('Biceps')}
                  stroke={getMuscleStroke('Biceps')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Forearms */}
              <path
                d="M52,158 C46,175 42,198 48,212 C52,214 58,210 60,195 C62,180 62,165 52,158 Z"
                fill="#27272a"
                stroke="#3f3f46"
                strokeWidth="1.5"
              />
              <path
                d="M188,158 C194,175 198,198 192,212 C188,214 182,210 180,195 C178,180 178,165 188,158 Z"
                fill="#27272a"
                stroke="#3f3f46"
                strokeWidth="1.5"
              />

              {/* Core / Abdominals */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Core')}
                role="button"
                tabIndex={0}
                aria-label="Core"
              >
                <path
                  d="M96,130 C108,130 132,130 144,130 C146,155 142,175 138,195 C128,198 112,198 102,195 C98,175 94,155 96,130 Z"
                  fill={getMuscleColor('Core')}
                  stroke={getMuscleStroke('Core')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Quads (Anterior Thighs) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Quads')}
                role="button"
                tabIndex={0}
                aria-label="Quads"
              >
                <path
                  d="M86,204 C94,202 114,204 116,218 C118,245 116,275 112,286 C105,290 94,290 90,282 C84,265 80,230 86,204 Z"
                  fill={getMuscleColor('Quads')}
                  stroke={getMuscleStroke('Quads')}
                  strokeWidth="1.5"
                />
                <path
                  d="M154,204 C146,202 126,204 124,218 C122,245 124,275 128,286 C135,290 146,290 150,282 C156,265 160,230 154,204 Z"
                  fill={getMuscleColor('Quads')}
                  stroke={getMuscleStroke('Quads')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Calves (Tibialis & Gastrocnemius front angle) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Calves')}
                role="button"
                tabIndex={0}
                aria-label="Calves"
              >
                <path
                  d="M90,296 C98,296 108,296 110,315 C110,335 106,355 102,364 C98,366 94,366 92,358 C88,340 86,315 90,296 Z"
                  fill={getMuscleColor('Calves')}
                  stroke={getMuscleStroke('Calves')}
                  strokeWidth="1.5"
                />
                <path
                  d="M150,296 C142,296 132,296 130,315 C130,335 134,355 138,364 C142,366 146,366 148,358 C152,340 154,315 150,296 Z"
                  fill={getMuscleColor('Calves')}
                  stroke={getMuscleStroke('Calves')}
                  strokeWidth="1.5"
                />
              </g>
            </g>
          ) : (
            /* BACK VIEW */
            <g id="back-anatomy">
              {/* Upper Back / Traps & Lats */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Back')}
                role="button"
                tabIndex={0}
                aria-label="Back"
              >
                <path
                  d="M84,80 C100,74 140,74 156,80 C162,105 152,145 138,155 C128,158 112,158 102,155 C88,145 78,105 84,80 Z"
                  fill={getMuscleColor('Back')}
                  stroke={getMuscleStroke('Back')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Rear Deltoids */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Shoulders')}
                role="button"
                tabIndex={0}
                aria-label="Rear Shoulders"
              >
                <path
                  d="M74,78 C66,85 60,98 64,110 C68,112 76,104 80,94 Z"
                  fill={getMuscleColor('Shoulders')}
                  stroke={getMuscleStroke('Shoulders')}
                  strokeWidth="1.5"
                />
                <path
                  d="M166,78 C174,85 180,98 176,110 C172,112 164,104 160,94 Z"
                  fill={getMuscleColor('Shoulders')}
                  stroke={getMuscleStroke('Shoulders')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Triceps (Posterior Upper Arm) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Triceps')}
                role="button"
                tabIndex={0}
                aria-label="Triceps"
              >
                <path
                  d="M58,114 C52,125 50,145 56,155 C60,158 66,152 68,140 C70,130 67,118 58,114 Z"
                  fill={getMuscleColor('Triceps')}
                  stroke={getMuscleStroke('Triceps')}
                  strokeWidth="1.5"
                />
                <path
                  d="M182,114 C188,125 190,145 184,155 C180,158 174,152 172,140 C170,130 173,118 182,114 Z"
                  fill={getMuscleColor('Triceps')}
                  stroke={getMuscleStroke('Triceps')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Glutes (Posterior Hips) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Glutes')}
                role="button"
                tabIndex={0}
                aria-label="Glutes"
              >
                <path
                  d="M86,172 C96,168 116,170 118,184 C119,198 116,212 108,218 C96,220 86,212 84,198 C82,185 84,176 86,172 Z"
                  fill={getMuscleColor('Glutes')}
                  stroke={getMuscleStroke('Glutes')}
                  strokeWidth="1.5"
                />
                <path
                  d="M154,172 C144,168 124,170 122,184 C121,198 124,212 132,218 C144,220 154,212 156,198 C158,185 156,176 154,172 Z"
                  fill={getMuscleColor('Glutes')}
                  stroke={getMuscleStroke('Glutes')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Hamstrings (Posterior Thighs) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Hamstrings')}
                role="button"
                tabIndex={0}
                aria-label="Hamstrings"
              >
                <path
                  d="M86,224 C94,222 114,224 116,238 C118,260 116,278 110,286 C104,288 94,288 90,280 C84,265 82,240 86,224 Z"
                  fill={getMuscleColor('Hamstrings')}
                  stroke={getMuscleStroke('Hamstrings')}
                  strokeWidth="1.5"
                />
                <path
                  d="M154,224 C146,222 126,224 124,238 C122,260 124,278 130,286 C136,288 146,288 150,280 C156,265 158,240 154,224 Z"
                  fill={getMuscleColor('Hamstrings')}
                  stroke={getMuscleStroke('Hamstrings')}
                  strokeWidth="1.5"
                />
              </g>

              {/* Calves (Gastrocnemius & Soleus) */}
              <g
                className="cursor-pointer"
                onClick={() => handleClick('Calves')}
                role="button"
                tabIndex={0}
                aria-label="Calves"
              >
                <path
                  d="M88,296 C98,294 112,298 112,316 C112,338 106,358 102,364 C96,366 92,364 90,355 C86,338 84,312 88,296 Z"
                  fill={getMuscleColor('Calves')}
                  stroke={getMuscleStroke('Calves')}
                  strokeWidth="1.5"
                />
                <path
                  d="M152,296 C142,294 128,298 128,316 C128,338 134,358 138,364 C144,366 148,364 150,355 C154,338 156,312 152,296 Z"
                  fill={getMuscleColor('Calves')}
                  stroke={getMuscleStroke('Calves')}
                  strokeWidth="1.5"
                />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Legend Footer */}
      <div className="w-full pt-3 mt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-lime-400" />
            Primary Target
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            Assister / Stabilizer
          </span>
          {selectedMuscle && (
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              Selected ({selectedMuscle})
            </span>
          )}
        </div>

        <span className="text-[11px] text-zinc-400 italic">
          Anatomical guide for movement execution
        </span>
      </div>
    </div>
  )
}
