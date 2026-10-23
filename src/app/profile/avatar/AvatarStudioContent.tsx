'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Shield,
  Zap,
  Check,
  Lock,
  Crown,
  Flame,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import { ANIME_AVATARS } from '@/data/avatars'
import {
  getUserRpgProgress,
  saveUserRpgProgress,
  RANKS_CONFIG,
} from '@/lib/rpg/rpgService'
import { AvatarBadge } from '@/components/rpg/AvatarBadge'
import type { UserRpgProgress, AnimeAvatar } from '@/types/rpg'

export function AvatarStudioContent() {
  const toast = useToast()
  const [rpg, setRpg] = useState<UserRpgProgress | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('avatar-kenji')

  useEffect(() => {
    const prog = getUserRpgProgress()
    setRpg(prog)
    setSelectedAvatarId(prog.avatarId)
  }, [])

  if (!rpg) return null

  const selectedAvatar =
    ANIME_AVATARS.find((a) => a.id === selectedAvatarId) || ANIME_AVATARS[0]
  const isSelectedEquipped = rpg.avatarId === selectedAvatar.id
  const isSelectedUnlocked =
    rpg.unlockedAvatars.includes(selectedAvatar.id) ||
    rpg.currentLevel >= selectedAvatar.requiredLevel

  const handleEquip = (avatar: AnimeAvatar) => {
    if (!isSelectedUnlocked) {
      toast.warning(
        'Avatar Locked',
        `Reach Level ${avatar.requiredLevel} to unlock ${avatar.name}.`
      )
      return
    }

    const updated: UserRpgProgress = {
      ...rpg,
      avatarId: avatar.id,
      equippedTitle: avatar.title,
    }
    saveUserRpgProgress(updated)
    setRpg(updated)
    toast.success('Avatar Equipped! 🥋', `You are now representing as ${avatar.name}.`)
  }

  const rankDef = RANKS_CONFIG[rpg.rank]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Command Center
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Avatar Studio</Badge>
            <span className="text-xs text-zinc-500 font-medium">Cosmetic Customization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Anime Avatar Studio</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Choose your fitness anime identity. Unlock legendary avatars as your training consistency levels up.
          </p>
        </div>

        {/* Current Hero Status Banner */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <AvatarBadge avatarId={rpg.avatarId} rank={rpg.rank} level={rpg.currentLevel} size="md" />
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Current Hero</span>
            <span className="text-sm font-bold text-white">
              Level {rpg.currentLevel} · {rpg.rank}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Avatar Showcase Hero Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800 text-center relative overflow-hidden shadow-2xl">
            {/* Background Halo */}
            <div
              className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: selectedAvatar.themeColor }}
            />

            <div className="relative z-10 space-y-4">
              {/* Massive Badge Display */}
              <div className="mx-auto w-32 h-32 rounded-3xl bg-zinc-950 border-2 border-zinc-800 flex items-center justify-center text-6xl shadow-2xl relative">
                <span>{selectedAvatar.badgeEmoji}</span>
                {isSelectedEquipped && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-lime-400 text-zinc-950 text-[10px] font-extrabold uppercase shadow-md">
                    Equipped
                  </span>
                )}
              </div>

              <div>
                <span
                  className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-950 inline-block mb-1 shadow-sm"
                  style={{ backgroundColor: selectedAvatar.themeColor }}
                >
                  {selectedAvatar.rarity}
                </span>
                <h2 className="text-2xl font-extrabold text-white">{selectedAvatar.name}</h2>
                <p className="text-xs text-lime-400 font-semibold">{selectedAvatar.title}</p>
              </div>

              {/* Quote */}
              <blockquote className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs text-zinc-300 italic leading-relaxed">
                &ldquo;{selectedAvatar.quote}&rdquo;
              </blockquote>

              {/* Stat Boost / Passive Ability */}
              <div className="p-3 rounded-xl bg-lime-400/5 border border-lime-400/20 text-xs flex items-center justify-center gap-2 text-lime-400 font-semibold">
                <Sparkles size={14} />
                <span>Specialization: {selectedAvatar.statBoost}</span>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isSelectedEquipped ? (
                  <Button variant="outline" fullWidth disabled icon={<Check size={16} />}>
                    Currently Equipped
                  </Button>
                ) : isSelectedUnlocked ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleEquip(selectedAvatar)}
                    icon={<Sparkles size={16} />}
                  >
                    Equip {selectedAvatar.name}
                  </Button>
                ) : (
                  <Button variant="outline" fullWidth disabled icon={<Lock size={16} />}>
                    Unlocks at Level {selectedAvatar.requiredLevel}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Avatar Grid Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Available Avatars ({ANIME_AVATARS.length})
            </h3>
            <span className="text-xs text-zinc-400">
              {rpg.unlockedAvatars.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ANIME_AVATARS.map((avatar) => {
              const isUnlocked =
                rpg.unlockedAvatars.includes(avatar.id) || rpg.currentLevel >= avatar.requiredLevel
              const isEquipped = rpg.avatarId === avatar.id
              const isSelected = selectedAvatarId === avatar.id

              return (
                <div
                  key={avatar.id}
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-lime-400 bg-zinc-900 shadow-md ring-1 ring-lime-400'
                      : isUnlocked
                      ? 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
                      : 'border-zinc-850 bg-zinc-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl shrink-0"
                      style={{ borderColor: isUnlocked ? avatar.themeColor : '#27272a' }}
                    >
                      {avatar.badgeEmoji}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white">{avatar.name}</h4>
                        {isEquipped && (
                          <span className="w-2 h-2 rounded-full bg-lime-400" title="Equipped" />
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 block">{avatar.title}</span>
                      <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                        {isUnlocked ? avatar.statBoost : `Requires Level ${avatar.requiredLevel}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="text-xs font-semibold text-lime-400 flex items-center gap-1">
                        <Check size={14} />
                      </span>
                    ) : !isUnlocked ? (
                      <Lock size={14} className="text-zinc-600" />
                    ) : (
                      <ChevronRight size={14} className="text-zinc-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

