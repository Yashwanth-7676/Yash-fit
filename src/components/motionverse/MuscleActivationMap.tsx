'use client'

import React, { useState } from 'react'
import {
  ANATOMICAL_MUSCLES,
  getExerciseMuscleEngagement,
} from '@/lib/motionverse/muscleMapData'
import { MotionVerseExercise } from '@/types/motionverse'
import { Info, ShieldAlert, Sparkles, Activity } from 'lucide-react'

interface MuscleActivationMapProps {
  exercise: MotionVerseExercise
  cycleProgress?: number
  className?: string
}

export function MuscleActivationMap({
  exercise,
  cycleProgress = 0,
  className = '',
}: MuscleActivationMapProps) {
  const [selectedMuscleId, setSelectedMuscleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'anterior' | 'posterior'>('anterior')

  const engagement = getExerciseMuscleEngagement(
    exercise.targetMuscles.primary,
    exercise.targetMuscles.secondary,
    exercise.targetMuscles.stabilizers
  )

  const selectedMuscleInfo = engagement.find((m) => m.muscleId === selectedMuscleId)
  const selectedDefinition = selectedMuscleId ? ANATOMICAL_MUSCLES[selectedMuscleId] : null

  // Dynamic contraction intensity based on cycle progress
  const intensity = 0.6 + Math.sin(cycleProgress * Math.PI * 2) * 0.4

  const getMuscleColor = (muscleId: string) => {
    const item = engagement.find((m) => m.muscleId === muscleId)
    if (!item) return '#27272a' // zinc-800 inactive
    if (item.role === 'agonist') return '#a3e635' // lime-400 primary
    if (item.role === 'synergist') return '#38bdf8' // sky-400 secondary
    if (item.role === 'stabilizer') return '#f59e0b' // amber-500 stabilizer
    return '#3f3f46'
  }

  const getMuscleOpacity = (muscleId: string) => {
    const item = engagement.find((m) => m.muscleId === muscleId)
    if (!item) return 0.25
    if (item.role === 'agonist') return 0.75 + intensity * 0.25
    return 0.65
  }

  return (
    <div className={`p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-lime-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Anatomical Muscle Map</h3>
            <p className="text-[11px] text-zinc-400">Real-time biomechanical engagement</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('anterior')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'anterior'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posterior')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeTab === 'posterior'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Posterior (Back)
          </button>
        </div>
      </div>

      {/* Main Grid: SVG Map Left, Muscle Detail Cards Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left: Anatomical Mannequin SVG */}
        <div className="md:col-span-5 flex justify-center py-2 bg-zinc-950/60 rounded-xl border border-zinc-800/80 relative">
          <svg
            viewBox="0 0 200 400"
            className="w-44 h-80 select-none filter drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Base Mannequin Silhouette */}
            <g fill="#18181b" stroke="#27272a" strokeWidth="1.5">
              {/* Head */}
              <circle cx="100" cy="50" r="22" />
              {/* Neck */}
              <rect x="94" y="70" width="12" height="15" rx="2" />
              {/* Torso Outline */}
              <path d="M65,95 L135,95 L125,210 L75,210 Z" />
              {/* Arms */}
              <path d="M60,95 L40,180 L48,183 L66,105 Z" />
              <path d="M140,95 L160,180 L152,183 L134,105 Z" />
              {/* Forearms */}
              <path d="M40,180 L35,250 L43,252 L48,183 Z" />
              <path d="M160,180 L165,250 L157,252 L152,183 Z" />
              {/* Legs */}
              <path d="M75,210 L70,305 L88,305 L96,215 Z" />
              <path d="M125,210 L130,305 L112,305 L104,215 Z" />
              {/* Calves & Feet */}
              <path d="M70,305 L72,375 L86,375 L88,305 Z" />
              <path d="M130,305 L128,375 L114,375 L112,305 Z" />
            </g>

            {/* Muscle Overlays */}
            {Object.values(ANATOMICAL_MUSCLES).map((muscle) => {
              const path = activeTab === 'anterior' ? muscle.anteriorPath : muscle.posteriorPath
              if (!path) return null
              const isSelected = selectedMuscleId === muscle.id
              const color = getMuscleColor(muscle.id)
              const opacity = getMuscleOpacity(muscle.id)

              return (
                <path
                  key={muscle.id}
                  d={path}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#ffffff' : color}
                  strokeWidth={isSelected ? 2.5 : 1}
                  className="cursor-pointer transition-all duration-300 hover:brightness-125"
                  onClick={() => setSelectedMuscleId(muscle.id)}
                  aria-label={muscle.name}
                >
                  <title>{muscle.name}</title>
                </path>
              )
            })}
          </svg>

          {/* Legend Pill */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-3 text-[10px] bg-zinc-900/90 py-1 px-2 rounded-lg border border-zinc-800">
            <span className="flex items-center gap-1 text-lime-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-lime-400" /> Agonist
            </span>
            <span className="flex items-center gap-1 text-sky-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Synergist
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Stabilizer
            </span>
          </div>
        </div>

        {/* Right: Selected Muscle Explanation & Exercise Role List */}
        <div className="md:col-span-7 space-y-3">
          {selectedMuscleInfo ? (
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-lime-400" />
                  {selectedMuscleInfo.name}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    selectedMuscleInfo.role === 'agonist'
                      ? 'bg-lime-400/20 text-lime-400'
                      : selectedMuscleInfo.role === 'synergist'
                      ? 'bg-sky-400/20 text-sky-400'
                      : 'bg-amber-400/20 text-amber-400'
                  }`}
                >
                  {selectedMuscleInfo.role}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {selectedMuscleInfo.functionDescription}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-400 flex items-center gap-2">
              <Info size={16} className="text-zinc-500 shrink-0" />
              <span>Click any muscle on the anatomical figure to inspect its mechanical role during this lift.</span>
            </div>
          )}

          {/* Active Roles Summary for current exercise */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Muscles Recruited in {exercise.name}
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {engagement.map((item) => (
                <button
                  key={item.muscleId}
                  type="button"
                  onClick={() => setSelectedMuscleId(item.muscleId)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition ${
                    selectedMuscleId === item.muscleId
                      ? 'bg-zinc-800 border-zinc-700 text-white'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span className="font-medium truncate mr-2">{item.name}</span>
                  <span
                    className={`text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded ${
                      item.role === 'agonist'
                        ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                        : item.role === 'synergist'
                        ? 'bg-sky-400/10 text-sky-400 border border-sky-400/20'
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    }`}
                  >
                    {item.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Strict Biomechanical Integrity Notice */}
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-500 flex items-start gap-2">
            <ShieldAlert size={14} className="text-zinc-500 shrink-0 mt-0.5" />
            <span>
              Anatomical roles are classified according to clinical kinesiology (Prime Agonist, Synergist, Dynamic Stabilizer). YashFit strictly refrains from fabricating synthetic percentage figures.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
