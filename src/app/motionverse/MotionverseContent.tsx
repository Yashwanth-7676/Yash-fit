'use client'

import React, { useState } from 'react'
import {
  MOTIONVERSE_EXERCISES,
  getMotionVerseExercise,
} from '@/lib/motionverse/motionverseService'
import { MotionVersePlayer } from '@/components/motionverse/MotionVersePlayer'
import {
  Sparkles,
  Dumbbell,
  Play,
  Activity,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Badge, Card, Button } from '@/components/ui'

export function MotionverseContent() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('squat')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'All Exercises' },
    { id: 'compound', label: 'Compound Lifts' },
    { id: 'calisthenics', label: 'Calisthenics' },
    { id: 'isolation', label: 'Isolation' },
    { id: 'core', label: 'Core / Stability' },
  ]

  const filteredExercises =
    selectedCategory === 'all'
      ? MOTIONVERSE_EXERCISES
      : MOTIONVERSE_EXERCISES.filter((ex) => ex.category === selectedCategory)

  const activeExercise = getMotionVerseExercise(selectedExerciseId)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="accent">Upgrade #49</Badge>
            <span className="text-xs text-zinc-500 font-mono">MotionVerse AI Engine • 60 FPS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            MotionVerse AI Animation Engine
            <span className="text-xs px-2.5 py-1 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/30 font-bold uppercase tracking-wider hidden sm:inline-block">
              3D • Biomechanics • Anime
            </span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-3xl">
            Interactive biomechanical exercise visualization, multi-angle camera projections, anatomical muscle recruitment mapping, and stylized Anime Hero Mode.
          </p>
        </div>
      </div>

      {/* Main Interactive Player Section */}
      <MotionVersePlayer
        exerciseId={selectedExerciseId}
        onExerciseChange={setSelectedExerciseId}
      />

      {/* Exercise Library Directory */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell size={18} className="text-lime-400" />
              MotionVerse Movement Catalog
            </h2>
            <p className="text-xs text-zinc-400">
              Select an exercise to load animated kinematics, muscle maps, and AI form checks
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-lime-400 text-zinc-950 font-bold'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => {
            const isSelected = selectedExerciseId === ex.id
            return (
              <div
                key={ex.id}
                onClick={() => {
                  setSelectedExerciseId(ex.id)
                  window.scrollTo({ top: 120, behavior: 'smooth' })
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 border-lime-400 shadow-lg shadow-lime-400/10'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-lime-400 bg-lime-400/10 px-2 py-0.5 rounded">
                      {ex.category}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Tempo: {ex.defaultTempo}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-lime-400 transition">
                    {ex.name}
                  </h3>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {ex.targetMuscles.primary.map((m) => (
                      <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px] font-mono">
                    {ex.availableAngles.length} Views ({ex.availableAngles.join(', ')})
                  </span>
                  <span className="font-bold text-lime-400 flex items-center gap-1 text-[11px]">
                    <Play size={12} className="fill-lime-400" />
                    {isSelected ? 'Loaded in Player' : 'View Animation'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
