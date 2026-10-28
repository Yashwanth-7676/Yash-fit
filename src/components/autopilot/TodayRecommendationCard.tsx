'use client'

import React from 'react'
import Link from 'next/link'
import type { TodayWorkoutRecommendation, ExerciseAdaptation } from '@/types/autopilot'
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  RotateCcw,
  Check,
  Dumbbell,
  Clock,
  Shuffle,
  AlertTriangle,
  Play,
} from 'lucide-react'

interface TodayRecommendationCardProps {
  recommendation: TodayWorkoutRecommendation
  aiExplanation?: string | null
  aiProvider?: string | null
  canUndo: boolean
  onAccept: () => void
  onDismiss: () => void
  onRegenerate: () => void
  onUndo: () => void
  onOpenEditModal: (adaptation: ExerciseAdaptation) => void
  isApplying: boolean
}

export function TodayRecommendationCard({
  recommendation,
  aiExplanation,
  aiProvider,
  canUndo,
  onAccept,
  onDismiss,
  onRegenerate,
  onUndo,
  onOpenEditModal,
  isApplying,
}: TodayRecommendationCardProps) {
  const {
    routineName,
    targetSplit,
    estimatedDurationMinutes,
    readinessScore,
    readinessCategory,
    isRecoveryConstrained: _isRecoveryConstrained,
    overallRationale,
    dataSufficiency,
    confidenceScore,
    exerciseAdaptations,
    safetyWarnings,
    status,
  } = recommendation

  const getActionBadge = (action: ExerciseAdaptation['actionType']) => {
    switch (action) {
      case 'increase_weight':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-400 text-zinc-950 shadow-sm shadow-lime-400/20">
            <TrendingUp size={12} />
            +2.5 kg Progressive Overload
          </span>
        )
      case 'increase_reps':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lime-400 text-zinc-950 shadow-sm shadow-lime-400/20">
            <TrendingUp size={12} />
            +1 Rep Progression
          </span>
        )
      case 'decrease_load':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-800">
            <AlertTriangle size={12} />
            Fatigue Deload (-10%)
          </span>
        )
      case 'substitute':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-950/70 text-sky-300 border border-sky-800">
            <Shuffle size={12} />
            Equipment Alternative
          </span>
        )
      case 'maintain':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
            Maintain Baseline
          </span>
        )
    }
  }

  const getReadinessColor = (category: string) => {
    if (category.includes('Optimal')) return 'text-lime-400 bg-lime-950/60 border-lime-800'
    if (category.includes('Moderate')) return 'text-amber-400 bg-amber-950/60 border-amber-800'
    if (category.includes('Fatigue')) return 'text-rose-400 bg-rose-950/60 border-rose-800'
    return 'text-zinc-400 bg-zinc-900 border-zinc-800'
  }

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md space-y-6 shadow-xl">
      {/* Top Header: Routine Name & Readiness Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
              Today&apos;s Autopilot Calibration
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              {targetSplit}
            </span>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getReadinessColor(readinessCategory)}`}>
              {readinessScore !== null ? `Readiness: ${readinessScore}/100 • ${readinessCategory}` : 'Readiness: Unrecorded'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {routineName}
          </h2>
          <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-lime-400" />
              ~{estimatedDurationMinutes} mins
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Dumbbell size={13} className="text-lime-400" />
              {exerciseAdaptations.length} movements
            </span>
          </div>
        </div>

        {/* Confidence & Sufficiency Meter */}
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3 flex items-center gap-3 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
              Data Sufficiency
            </span>
            <span className="text-xs font-bold capitalize text-zinc-200">
              {dataSufficiency}
            </span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
              Confidence
            </span>
            <span className="text-base font-extrabold text-lime-400 font-mono">
              {confidenceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Rationale & AI Coaching Note */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles size={14} className="text-lime-400" />
            Biomechanical Rationale
          </span>
          <span className="text-[11px] text-zinc-500">
            Engine: {aiProvider && aiProvider !== 'rule_based' ? `${aiProvider} AI enriched` : 'Deterministic biomechanics'}
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {aiExplanation || overallRationale}
        </p>
      </div>

      {/* Exercise Adaptations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Calibrated Movements ({exerciseAdaptations.length})
          </h3>
          <span className="text-xs text-zinc-500">Click &ldquo;Customize&rdquo; to modify loads or reps</span>
        </div>

        <div className="space-y-2.5">
          {exerciseAdaptations.map((adaptation) => (
            <div
              key={adaptation.exerciseId}
              className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {adaptation.actionType === 'substitute' ? adaptation.proposedItem.exerciseName : adaptation.exerciseName}
                  </span>
                  {getActionBadge(adaptation.actionType)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span>
                    Prescribed: <strong className="text-white">{adaptation.proposedItem.targetSets} sets × {adaptation.proposedItem.targetReps} reps</strong>
                  </span>
                  <span>•</span>
                  <span>Target: <strong className="text-lime-400/90">{adaptation.proposedItem.primaryMuscle}</strong></span>
                  <span>•</span>
                  <span>Equipment: {adaptation.proposedItem.equipment}</span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed pt-0.5">
                  💡 {adaptation.reason}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span><strong>Evidence:</strong> {adaptation.supportingData}</span>
                </div>
              </div>

              {/* Action buttons on movement item */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenEditModal(adaptation)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <Sliders size={13} className="text-lime-400" />
                  <span>Customize</span>
                </button>

                <Link
                  href={`/virtual-gym?exercise=${adaptation.proposedItem.exerciseId}&muscle=${adaptation.proposedItem.primaryMuscle}`}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium border border-zinc-800 transition-colors"
                  title="View 3D biomechanics"
                >
                  3D View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Warnings Banner */}
      {safetyWarnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200/90 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldAlert size={14} />
            <span>Safety &amp; Biomechanical Guardrails</span>
          </div>
          <ul className="space-y-0.5 text-zinc-400 text-[11px]">
            {safetyWarnings.map((w, idx) => (
              <li key={idx}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Controls Bar */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 flex-wrap">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} className="text-amber-400" />
              <span>Undo Last Change</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRegenerate}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
          >
            Regenerate Calibration
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>

        {/* Primary Accept & Train */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={isApplying || status === 'accepted'}
            onClick={onAccept}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
              status === 'accepted'
                ? 'bg-zinc-800 text-lime-400 border border-lime-400/30'
                : 'bg-lime-400 hover:bg-lime-300 text-zinc-950 shadow-lime-400/20 active:scale-95'
            }`}
          >
            {status === 'accepted' ? (
              <>
                <Check size={14} className="text-lime-400" />
                <span>Proposal Applied</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                <span>{isApplying ? 'Applying Plan...' : 'Accept & Apply Proposal'}</span>
              </>
            )}
          </button>

          <Link
            href={`/workout/session?routineId=${recommendation.routineId}`}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <Play size={13} className="text-lime-400 fill-lime-400" />
            <span>Start Session</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

