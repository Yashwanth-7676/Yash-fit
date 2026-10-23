'use client'

import React from 'react'
import { ANIME_AVATARS } from '@/data/avatars'
import { RANKS_CONFIG } from '@/lib/rpg/rpgService'
import type { AnimeRank } from '@/types/rpg'

interface AvatarBadgeProps {
  avatarId: string
  rank?: AnimeRank
  level?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLevel?: boolean
  className?: string
}

export function AvatarBadge({
  avatarId,
  rank = 'Rookie',
  level,
  size = 'md',
  showLevel = true,
  className = '',
}: AvatarBadgeProps) {
  const avatar = ANIME_AVATARS.find((a) => a.id === avatarId) || ANIME_AVATARS[0]
  const rankDef = RANKS_CONFIG[rank]

  const sizeStyles = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-11 h-11 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-24 h-24 text-4xl',
  }[size]

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Outer Glow Ring matching Rank / Avatar theme */}
      <div
        className={`rounded-2xl flex items-center justify-center shadow-lg border transition-transform ${sizeStyles}`}
        style={{
          backgroundColor: '#18181b',
          borderColor: rankDef ? rankDef.color : avatar.themeColor,
          boxShadow: `0 0 16px ${avatar.themeColor}30`,
        }}
        title={`${avatar.name} — ${avatar.title}`}
      >
        <span>{avatar.badgeEmoji}</span>
      </div>

      {/* Level Tag Pill */}
      {showLevel && level !== undefined && (
        <span
          className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full font-extrabold text-[10px] leading-tight text-zinc-950 shadow-md border border-zinc-900"
          style={{ backgroundColor: avatar.themeColor }}
        >
          {level}
        </span>
      )}
    </div>
  )
}
