'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target,
  Dumbbell,
  Droplet,
  Moon,
  Salad,
  Award,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Flame,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import {
  getActiveQuests,
  claimQuestReward,
  getUserRpgProgress,
} from '@/lib/rpg/rpgService'
import type { Quest, QuestFrequency } from '@/types/rpg'

const ICON_MAP: Record<string, React.ReactNode> = {
  Dumbbell: <Dumbbell size={20} className="text-lime-400" />,
  Droplet: <Droplet size={20} className="text-sky-400" />,
  Moon: <Moon size={20} className="text-indigo-400" />,
  Salad: <Salad size={20} className="text-emerald-400" />,
  Award: <Award size={20} className="text-amber-400" />,
  Eye: <Eye size={20} className="text-cyan-400" />,
}

export function QuestsContent() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<QuestFrequency>('daily')
  const [quests, setQuests] = useState<Quest[]>([])
  const [totalClaimedToday, setTotalClaimedToday] = useState(0)

  useEffect(() => {
    setQuests(getActiveQuests())
  }, [])

  const filteredQuests = quests.filter((q) => q.frequency === activeTab)

  const handleClaim = (questId: string, title: string) => {
    const res = claimQuestReward(questId)
    if (res.success) {
      toast.success('Quest Completed! 🎉', `Awarded +${res.xpAwarded} XP for "${title}".`)
      setQuests(getActiveQuests())
      setTotalClaimedToday((prev) => prev + res.xpAwarded)
    } else {
      toast.error('Unable to Claim', 'This quest is either not completed or already claimed.')
    }
  }

  const completedCount = filteredQuests.filter((q) => q.completed).length
  const claimedCount = filteredQuests.filter((q) => q.claimed).length

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Anime Fitness RPG</Badge>
            <span className="text-xs text-zinc-500 font-medium">Daily &amp; Weekly Directives</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Quests &amp; Directives</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Complete daily and weekly directives aligned with your training schedule to earn XP, level up your avatar, and ascend ranks.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Daily Quests ({quests.filter((q) => q.frequency === 'daily').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'weekly'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Weekly Directives ({quests.filter((q) => q.frequency === 'weekly').length})
          </button>
        </div>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <Target size={20} />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Quests Completed</span>
            <span className="text-xl font-bold text-white font-mono">
              {completedCount} / {filteredQuests.length}
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Zap size={20} />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Total Rewards Available</span>
            <span className="text-xl font-bold text-amber-400 font-mono">
              {filteredQuests.reduce((sum, q) => sum + (q.claimed ? 0 : q.rewardXp), 0)} XP
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Reset Schedule</span>
            <span className="text-xs font-semibold text-zinc-200">
              {activeTab === 'daily' ? 'Resets at 00:00 Local' : 'Resets Sunday Midnight'}
            </span>
          </div>
        </Card>
      </div>

      {/* Quests List */}
      <div className="space-y-3.5">
        {filteredQuests.map((quest) => {
          const pct = Math.min(100, Math.round((quest.currentValue / quest.targetValue) * 100))
          return (
            <Card
              key={quest.id}
              className={`p-5 border transition-all ${
                quest.claimed
                  ? 'bg-zinc-950/60 border-zinc-800/60 opacity-70'
                  : quest.completed
                  ? 'bg-lime-400/5 border-lime-400/30'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    {ICON_MAP[quest.iconName] || <Sparkles size={20} className="text-lime-400" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{quest.title}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                        +{quest.rewardXp} XP
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{quest.description}</p>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div className="flex items-center gap-4 sm:min-w-[240px] justify-between sm:justify-end">
                  <div className="w-32 space-y-1 text-right">
                    <span className="text-[11px] font-mono font-semibold text-zinc-300">
                      {quest.currentValue} / {quest.targetValue}
                    </span>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-lime-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {quest.claimed ? (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 size={13} />
                      Claimed
                    </span>
                  ) : quest.completed ? (
                    <Button
                      size="sm"
                      onClick={() => handleClaim(quest.id, quest.title)}
                      className="shadow-md shadow-lime-400/20 shrink-0"
                    >
                      Claim XP
                    </Button>
                  ) : (
                    <span className="text-xs text-zinc-500 font-semibold px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 shrink-0">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Rest Day Consideration Notice */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-indigo-400 shrink-0" />
          <span>
            <strong className="text-white">Rest Day Rule:</strong> Appropriate rest days never penalize streaks or deduct XP. Recovery check-ins fulfill your daily cadence on scheduled rest days.
          </span>
        </div>
        <Link href="/recovery" className="text-lime-400 font-semibold hover:underline flex items-center gap-1">
          Check Recovery <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  )
}

