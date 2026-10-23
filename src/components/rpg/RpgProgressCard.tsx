'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Zap,
  Flame,
  Award,
  ChevronRight,
  Sparkles,
  Target,
  Crown,
  Shield,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { AvatarBadge } from './AvatarBadge'
import {
  getUserRpgProgress,
  getActiveQuests,
  RANKS_CONFIG,
} from '@/lib/rpg/rpgService'
import { ANIME_AVATARS } from '@/data/avatars'
import type { UserRpgProgress, Quest } from '@/types/rpg'

export function RpgProgressCard() {
  const [rpg, setRpg] = useState<UserRpgProgress | null>(null)
  const [activeQuests, setActiveQuests] = useState<Quest[]>([])

  useEffect(() => {
    setRpg(getUserRpgProgress())
    setActiveQuests(getActiveQuests())
  }, [])

  if (!rpg) return null

  const rankDef = RANKS_CONFIG[rpg.rank]
  const avatar = ANIME_AVATARS.find((a) => a.id === rpg.avatarId) || ANIME_AVATARS[0]
  const progressPct = Math.min(
    100,
    Math.round((rpg.xpInCurrentLevel / rpg.xpRequiredForNextLevel) * 100)
  )

  const completedQuests = activeQuests.filter((q) => q.completed).length

  return (
    <Card className="p-5 sm:p-6 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border-zinc-800 relative overflow-hidden shadow-xl">
      {/* Background Decorative Ki Glow */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: rankDef.color }}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left: Avatar, Title, Level, Rank */}
        <div className="flex items-center gap-4">
          <Link href="/profile/avatar" className="group block">
            <AvatarBadge
              avatarId={rpg.avatarId}
              rank={rpg.rank}
              level={rpg.currentLevel}
              size="lg"
              className="group-hover:scale-105 transition-transform"
            />
          </Link>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-zinc-950 shadow-sm"
                style={{ backgroundColor: rankDef.color }}
              >
                {rankDef.badgeIcon} {rpg.rank}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Level {rpg.currentLevel}</span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {rpg.totalXp.toLocaleString()} Total XP
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>{avatar.name}</span>
              <span className="text-xs text-zinc-400 font-normal">· {rpg.equippedTitle}</span>
            </h2>

            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 italic">
              &ldquo;{avatar.quote}&rdquo;
            </p>
          </div>
        </div>

        {/* Middle: Level Progression Bar */}
        <div className="flex-1 max-w-md space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400 font-medium flex items-center gap-1.5">
              <Zap size={13} className="text-lime-400" />
              <span>Level {rpg.currentLevel} &rarr; Level {rpg.currentLevel + 1}</span>
            </span>
            <span className="text-zinc-300 font-mono font-semibold">
              {rpg.xpInCurrentLevel} / {rpg.xpRequiredForNextLevel} XP ({progressPct}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-zinc-800/90 overflow-hidden p-0.5 border border-zinc-700/50">
            <div
              className="h-full rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${progressPct}%`,
                backgroundColor: '#a3e635',
                boxShadow: '0 0 10px rgba(163, 230, 53, 0.5)',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{rpg.xpRequiredForNextLevel - rpg.xpInCurrentLevel} XP until next level</span>
            <span className="text-lime-400/80 font-medium">{avatar.statBoost}</span>
          </div>
        </div>

        {/* Right: Streak & Quests Quick Stats */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-3 lg:pt-0 lg:pl-5">
          {/* Streak */}
          <div className="text-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 min-w-[70px]">
            <div className="flex items-center justify-center gap-1 text-amber-400 mb-0.5">
              <Flame size={15} className="fill-amber-400 animate-pulse" />
              <span className="text-base font-extrabold font-mono">{rpg.currentStreak}</span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Day Streak</span>
          </div>

          {/* Quests Summary */}
          <Link
            href="/quests"
            className="text-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 min-w-[80px] hover:border-lime-400/40 transition-colors group"
          >
            <div className="flex items-center justify-center gap-1 text-lime-400 mb-0.5">
              <Target size={15} />
              <span className="text-base font-extrabold font-mono">
                {completedQuests}/{activeQuests.length}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 group-hover:text-lime-400 uppercase font-semibold block transition-colors">
              Quests Done
            </span>
          </Link>

          {/* Quick Hub Links */}
          <div className="flex flex-col gap-1.5">
            <Link
              href="/quests"
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Quests</span>
              <ChevronRight size={13} />
            </Link>
            <Link
              href="/achievements"
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1 font-semibold"
            >
              <span>Badges</span>
              <Award size={13} />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

