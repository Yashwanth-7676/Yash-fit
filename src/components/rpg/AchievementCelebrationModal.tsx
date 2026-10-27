'use client'

import React from 'react'
import { Sparkles, Trophy, Award, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Achievement } from '@/types/rpg'

interface Props {
  isOpen: boolean
  achievement: Achievement | null
  levelUp?: { newLevel: number; newRank?: string } | null
  onClose: () => void
}

export function AchievementCelebrationModal({
  isOpen,
  achievement,
  levelUp,
  onClose,
}: Props) {
  if (!isOpen || (!achievement && !levelUp)) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 border border-lime-400/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-lime-400/20 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 border border-zinc-800 transition"
          aria-label="Close celebration"
        >
          <X size={18} />
        </button>

        {/* Icon & Badge */}
        <div className="relative mx-auto mb-5 w-24 h-24 rounded-3xl bg-lime-400/10 border-2 border-lime-400/60 flex items-center justify-center shadow-lg shadow-lime-400/30 animate-bounce">
          {levelUp ? (
            <Trophy size={48} className="text-lime-400" />
          ) : (
            <Award size={48} className="text-lime-400" />
          )}
          <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-lime-400 text-black">
            <Sparkles size={16} />
          </span>
        </div>

        {/* Headline */}
        <span className="inline-block text-xs font-black uppercase tracking-widest text-lime-400 mb-2 px-3 py-1 bg-lime-400/10 rounded-full border border-lime-400/30">
          {levelUp ? 'Level Up Unlocked!' : 'Achievement Unlocked!'}
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          {levelUp ? `Level ${levelUp.newLevel} Achieved` : achievement?.title}
        </h2>

        {levelUp?.newRank && (
          <p className="text-sm font-semibold text-lime-400 mb-2">
            Ascended to Rank: {levelUp.newRank}
          </p>
        )}

        <p className="text-sm text-zinc-300 leading-relaxed mb-6 max-w-xs mx-auto">
          {levelUp
            ? 'Your dedicated training consistency has unlocked superior athletic capability and new avatar titles.'
            : achievement?.description}
        </p>

        {/* XP Bonus pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm mb-6">
          <Zap size={16} className="text-lime-400" />
          <span>Reward:</span>
          <span className="text-lime-400 font-bold">
            +{levelUp ? 250 : achievement?.rewardXp || 100} XP
          </span>
        </div>

        <div>
          <Button
            variant="primary"
            className="w-full py-3 text-base font-bold bg-lime-400 hover:bg-lime-500 text-black"
            onClick={onClose}
          >
            Claim &amp; Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

