'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import {
  CheckSquare,
  Square,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  Droplet,
  Utensils,
  Target,
  Scale,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import type { DailyActionItem } from '@/types/commandCenter'
import { toggleDailyAction } from '@/lib/command-center/commandCenterService'

interface PersonalActionPlanCardProps {
  userId: string
  actions: DailyActionItem[]
  onActionToggle?: (actionId: string, completed: boolean) => void
}

export function PersonalActionPlanCard({
  userId,
  actions: initialActions,
  onActionToggle,
}: PersonalActionPlanCardProps) {
  const [items, setItems] = useState<DailyActionItem[]>(initialActions)

  const handleToggle = (id: string, current: boolean) => {
    const nextState = !current
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: nextState } : item))
    )
    toggleDailyAction(userId, id, nextState)
    if (onActionToggle) {
      onActionToggle(id, nextState)
    }
  }

  const completedCount = items.filter((i) => i.completed).length
  const progressPct = Math.round((completedCount / (items.length || 1)) * 100)

  const getCategoryIcon = (category: DailyActionItem['category']) => {
    switch (category) {
      case 'workout':
        return <Dumbbell size={15} className="text-lime-400" />
      case 'recovery':
        return <HeartPulse size={15} className="text-rose-400" />
      case 'hydration':
        return <Droplet size={15} className="text-cyan-400" />
      case 'nutrition':
        return <Utensils size={15} className="text-amber-400" />
      case 'quest':
        return <Target size={15} className="text-purple-400" />
      case 'measurement':
        return <Scale size={15} className="text-blue-400" />
    }
  }

  return (
    <Card className="p-5 border-zinc-800 bg-zinc-900/60 space-y-4">
      {/* Header with progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Personal Action Plan</h3>
            <Badge variant="accent">
              {completedCount}/{items.length} Done
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synchronized with your actual logging state across YashFit modules
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
            <span>Daily Progress</span>
            <span className="text-lime-400 font-semibold">{progressPct}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-lime-400 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-2.5">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3 flex items-start justify-between gap-3 transition-all ${
                item.completed
                  ? 'border-zinc-800/60 bg-zinc-950/40 opacity-75'
                  : item.isKeyGoal
                  ? 'border-lime-500/30 bg-lime-950/10'
                  : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, item.completed)}
                  className="mt-0.5 text-zinc-400 hover:text-lime-400 transition-colors shrink-0 focus-visible:outline-none"
                  aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {item.completed ? (
                    <CheckCircle2 size={18} className="text-lime-400 fill-lime-400/20" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold tracking-tight ${
                        item.completed ? 'line-through text-zinc-500' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.isKeyGoal && !item.completed && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-lime-400/10 text-lime-400 border border-lime-400/30">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Direct Screen Link */}
              <Link
                href={item.actionHref}
                className="shrink-0 text-xs text-lime-400 hover:text-lime-300 font-semibold flex items-center gap-1 self-center pl-2 transition-colors"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

