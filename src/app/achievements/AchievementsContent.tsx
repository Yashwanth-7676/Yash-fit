'use client'

import React, { useState, useEffect } from 'react'
import {
  Award,
  Flame,
  Zap,
  Dumbbell,
  Shield,
  Droplet,
  Salad,
  Moon,
  Sparkles,
  Eye,
  Users,
  Crown,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import { getAchievements, unlockAchievement } from '@/lib/rpg/rpgService'
import type { Achievement, AchievementCategory } from '@/types/rpg'

const CATEGORIES: { id: AchievementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Badges' },
  { id: 'workout', label: 'Workouts' },
  { id: 'streak', label: 'Streaks' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'form', label: 'Form Analysis' },
]

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-900/20', text: 'text-amber-500', border: 'border-amber-700/40' },
  silver: { bg: 'bg-zinc-400/10', text: 'text-zinc-300', border: 'border-zinc-500/40' },
  gold: { bg: 'bg-amber-400/20', text: 'text-amber-400', border: 'border-amber-400/40' },
  platinum: { bg: 'bg-cyan-400/20', text: 'text-cyan-400', border: 'border-cyan-400/40' },
  mythic: { bg: 'bg-lime-400/20', text: 'text-lime-400', border: 'border-lime-400/50' },
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Flame: <Flame size={20} />,
  Zap: <Zap size={20} />,
  Award: <Award size={20} />,
  Dumbbell: <Dumbbell size={20} />,
  Shield: <Shield size={20} />,
  Droplet: <Droplet size={20} />,
  Salad: <Salad size={20} />,
  Moon: <Moon size={20} />,
  Sparkles: <Sparkles size={20} />,
  Eye: <Eye size={20} />,
  Users: <Users size={20} />,
  Crown: <Crown size={20} />,
}

export function AchievementsContent() {
  const toast = useToast()
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all')
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    setAchievements(getAchievements())
  }, [])

  const filtered = achievements.filter(
    (a) => selectedCategory === 'all' || a.category === selectedCategory
  )

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length
  const pct = Math.round((unlockedCount / totalCount) * 100)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Hall of Glory</Badge>
            <span className="text-xs text-zinc-500 font-medium">Achievement Showcase</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Achievements &amp; Badges</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Unlock achievements across verified workouts, consecutive day streaks, nutrition discipline, and AI form mastery.
          </p>
        </div>

        {/* Progress KPI Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-4 min-w-[200px] shrink-0">
          <div className="w-12 h-12 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center font-extrabold text-lg">
            {pct}%
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Total Unlocked</span>
            <span className="text-sm font-bold text-white font-mono">
              {unlockedCount} of {totalCount} Badges
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ach) => {
          const tierStyle = TIER_COLORS[ach.tier] || TIER_COLORS.bronze
          return (
            <Card
              key={ach.id}
              className={`p-5 border flex flex-col justify-between transition-all ${
                ach.unlocked
                  ? 'bg-zinc-900 border-zinc-700 shadow-lg'
                  : 'bg-zinc-950/70 border-zinc-850 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shadow-md ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                  >
                    {ach.unlocked ? (
                      ICON_MAP[ach.iconName] || <Award size={20} />
                    ) : (
                      <Lock size={18} className="text-zinc-600" />
                    )}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}
                    >
                      {ach.tier}
                    </span>
                    <span className="block text-[11px] font-mono text-zinc-500 mt-1">
                      +{ach.rewardXp} XP
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{ach.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{ach.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-medium">
                  {ach.unlocked ? (
                    <span className="text-lime-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Unlocked
                    </span>
                  ) : (
                    <span>Criteria: {ach.criteriaText}</span>
                  )}
                </span>
                {!ach.unlocked && (
                  <span className="text-[11px] font-mono text-zinc-600">{ach.progress}%</span>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
