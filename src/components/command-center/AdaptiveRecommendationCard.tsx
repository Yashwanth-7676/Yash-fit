'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Modal } from '@/components/ui'
import {
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  SlidersHorizontal,
  Info,
  Dumbbell,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import type { AdaptiveWorkoutRecommendation } from '@/types/commandCenter'
import { getRoutine } from '@/lib/digitalTwin'

interface AdaptiveRecommendationCardProps {
  recommendation: AdaptiveWorkoutRecommendation
  onAccept: (rec: AdaptiveWorkoutRecommendation) => void
  onDismiss: (rec: AdaptiveWorkoutRecommendation) => void
  onEdit: (rec: AdaptiveWorkoutRecommendation) => void
}

export function AdaptiveRecommendationCard({
  recommendation,
  onAccept,
  onDismiss,
  onEdit,
}: AdaptiveRecommendationCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [decisionState, setDecisionState] = useState<'pending' | 'accepted' | 'dismissed'>('pending')

  const isRecoveryDay = recommendation.recommendationType === 'recovery_day'
  const isReducedVolume = recommendation.recommendationType === 'reduce_intensity'
  const isSubstitution = recommendation.recommendationType === 'substitute_exercise'

  const borderGlow = isRecoveryDay
    ? 'border-amber-400/30 bg-gradient-to-br from-zinc-900 via-amber-950/10 to-zinc-900'
    : isReducedVolume
    ? 'border-emerald-400/30 bg-gradient-to-br from-zinc-900 via-emerald-950/10 to-zinc-900'
    : 'border-lime-400/30 bg-gradient-to-br from-zinc-900 via-lime-950/10 to-zinc-900'

  const badgeVariant = isRecoveryDay ? 'default' : isReducedVolume ? 'default' : 'accent'

  const handleConfirmAccept = () => {
    setDecisionState('accepted')
    setShowConfirmModal(false)
    onAccept(recommendation)
  }

  const handleDismiss = () => {
    setDecisionState('dismissed')
    onDismiss(recommendation)
  }

  return (
    <>
      <Card className={`${borderGlow} p-6 relative overflow-hidden space-y-5`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                {isRecoveryDay ? (
                  <ShieldAlert size={14} className="text-amber-400" />
                ) : (
                  <Sparkles size={14} className="text-lime-400" />
                )}
                Adaptive Workout Calibration
              </span>
              <Badge variant={badgeVariant}>
                {recommendation.recommendationType.replace('_', ' ').toUpperCase()}
              </Badge>
              {decisionState === 'accepted' && (
                <span className="text-xs text-lime-400 font-semibold flex items-center gap-1">
                  <Check size={12} /> Plan Calibrated
                </span>
              )}
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {recommendation.title}
            </h3>
            <p className="text-sm text-zinc-300 font-medium">
              {recommendation.summary}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {decisionState === 'pending' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<SlidersHorizontal size={13} />}
                  onClick={() => onEdit(recommendation)}
                >
                  Edit / Adjust
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<X size={13} />}
                  onClick={handleDismiss}
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  icon={<Check size={13} />}
                  onClick={() => setShowConfirmModal(true)}
                >
                  Accept Calibration
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={<RotateCcw size={13} />}
                onClick={() => setDecisionState('pending')}
              >
                Reset Decision
              </Button>
            )}
          </div>
        </div>

        {/* 5-Pillar Explainable Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* 1. Real Supporting Data */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Dumbbell size={12} className="text-lime-400" /> Supporting Logged Data
            </span>
            <p className="text-zinc-200 leading-relaxed font-mono text-[11px]">
              {recommendation.supportingData}
            </p>
          </div>

          {/* 2. Physiological Explanation */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-lime-400" /> Scientific Reasoning
            </span>
            <p className="text-zinc-300 leading-relaxed">
              {recommendation.explanation}
            </p>
          </div>

          {/* 3. Actionable Next Step */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowRight size={12} className="text-lime-400" /> Immediate Next Action
            </span>
            <div className="flex items-center justify-between gap-2">
              <p className="text-lime-300 font-medium">
                {recommendation.actionText}
              </p>
              <Link
                href={recommendation.actionHref}
                className="text-xs text-lime-400 hover:text-lime-300 font-semibold underline shrink-0"
              >
                Go to Session
              </Link>
            </div>
          </div>

          {/* 4. Safety & Limitations */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-400" /> Safety &amp; Limitations
            </span>
            <p className="text-zinc-400 leading-relaxed">
              {recommendation.safetyDisclaimer}
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
          <Info size={12} className="shrink-0 text-zinc-400" />
          <span>
            {recommendation.limitations} Consult a licensed sports medicine physician if you experience sharp or persistent discomfort.
          </span>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Adaptive Plan Calibration"
        description="Verify how this recommendation modifies your active workout session."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Adjustment Type:</span>
              <span className="text-white font-semibold capitalize">
                {recommendation.recommendationType.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Target Routine:</span>
              <span className="text-lime-400 font-semibold">
                {getRoutine(recommendation.targetRoutineId).name}
              </span>
            </div>
            {recommendation.volumeAdjustmentPercent && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Volume Calibration:</span>
                <span className="text-amber-300 font-semibold">
                  {recommendation.volumeAdjustmentPercent}% volume reduction
                </span>
              </div>
            )}
            {recommendation.substitutions && Object.keys(recommendation.substitutions).length > 0 && (
              <div className="border-t border-zinc-800 pt-2 space-y-1">
                <span className="text-zinc-400 block font-medium">Exercise Substitutions:</span>
                <span className="text-zinc-300 font-mono text-[11px] block">
                  {Object.keys(recommendation.substitutions).length} exercises swapped for equipment fit.
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Accepting updates your session tracker parameters for today. Your default weekly split remains unchanged in your profile settings.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button icon={<Check size={14} />} onClick={handleConfirmAccept}>
              Confirm &amp; Apply Calibration
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

