'use client'

import React from 'react'
import type { WeeklyMuscleOverview, MuscleTrainingMetric } from '@/types/virtualGym'
import type { MuscleGroup } from '@/types/workout'
import {
  Activity,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react'

interface MuscleIntelligenceCardProps {
  overview: WeeklyMuscleOverview
  selectedMuscle?: MuscleGroup | null
  onSelectMuscle: (muscle: MuscleGroup | null) => void
  onQuickExerciseSelect?: (exerciseName: string) => void
}

export function MuscleIntelligenceCard({
  overview,
  selectedMuscle,
  onSelectMuscle,
  onQuickExerciseSelect,
}: MuscleIntelligenceCardProps) {
  const { totalLoggedSets, muscleMetrics, balancedSuggestions, disclaimer } = overview

  const getStatusColor = (status: MuscleTrainingMetric['status']) => {
    switch (status) {
      case 'optimal':
        return 'text-lime-400 bg-lime-950/60 border-lime-800/80'
      case 'moderate':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/80'
      case 'undertrained':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80'
      case 'untrained':
        return 'text-zinc-400 bg-zinc-900 border-zinc-800'
    }
  }

  const getProgressBarColor = (status: MuscleTrainingMetric['status']) => {
    switch (status) {
      case 'optimal':
        return 'bg-lime-400'
      case 'moderate':
        return 'bg-sky-400'
      case 'undertrained':
        return 'bg-amber-400'
      case 'untrained':
        return 'bg-zinc-700'
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Weekly Muscle Intelligence
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                {totalLoggedSets} sets (7d)
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Evidence-based weekly volume distribution from completed workout logs.
            </p>
          </div>
        </div>

        {selectedMuscle && (
          <button
            type="button"
            onClick={() => onSelectMuscle(null)}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 self-start sm:self-auto"
          >
            Clear {selectedMuscle} filter
          </button>
        )}
      </div>

      {/* Grid of Muscle Volumes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {(Object.keys(muscleMetrics) as MuscleGroup[]).map((muscle) => {
          const metric = muscleMetrics[muscle]
          const isSelected = selectedMuscle === muscle
          const pct = Math.min(100, Math.round((metric.loggedSetsLast7Days / 12) * 100))

          return (
            <button
              key={muscle}
              type="button"
              onClick={() => onSelectMuscle(isSelected ? null : muscle)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 scale-[1.02]'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400 font-bold' : 'text-zinc-200'}`}>
                  {muscle}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${getStatusColor(metric.status)}`}>
                  {metric.loggedSetsLast7Days}s
                </span>
              </div>

              {/* Progress Bar (Benchmark: 10-12 sets) */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                    metric.status
                  )}`}
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5">
                <span>{metric.frequencyDays}d active</span>
                <span className="capitalize">{metric.status}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Balanced Workout Suggestions & Rebalancing alerts */}
      {balancedSuggestions.length > 0 && (
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-lime-400" />
            <h4 className="text-sm font-semibold text-white">Suggested Structural Adjustments</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {balancedSuggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 flex flex-col justify-between gap-2"
              >
                <div>
                  <h5 className="text-xs font-bold text-lime-400 mb-1">{sug.title}</h5>
                  <p className="text-xs text-zinc-300 leading-relaxed">{sug.reason}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {sug.suggestedExercises.map((exName, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onQuickExerciseSelect && onQuickExerciseSelect(exName)}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-lime-400 hover:text-zinc-950 text-zinc-300 border border-zinc-700 transition-colors"
                    >
                      <span>{exName}</span>
                      <ArrowRight size={10} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scientific Transparency Disclaimer */}
      <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-400 leading-relaxed border-t border-zinc-800/60">
        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-zinc-400" />
        <span>{disclaimer}</span>
      </div>
    </div>
  )
}

