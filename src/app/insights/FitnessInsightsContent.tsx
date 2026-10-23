'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Brain,
  Zap,
  Target,
  ArrowRight,
  ShieldAlert,
  Dumbbell,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeading } from '@/components/ui'
import { getUserProfile } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types/profile'

interface InsightItem {
  id: string
  category: 'Training' | 'Nutrition' | 'Recovery' | 'Habits'
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  importance: 'High' | 'Medium' | 'Optimal'
}

export function FitnessInsightsContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        const userId = data?.user?.id || 'demo-user'
        const p = await getUserProfile(userId)
        setProfile(p)
      } catch {
        // ignore
      }
    }
    loadData()
  }, [])

  const insights: InsightItem[] = [
    {
      id: 'ins-1',
      category: 'Training',
      title: 'Progressive Overload Window Open for Chest',
      description: `Your last 2 pushing workouts showed strong bar speed and zero fatigue stalling. You are primed to increase your Barbell Bench Press working weight by +2.5 kg on your next Push session.`,
      actionLabel: 'View Workout Routine',
      actionHref: '/workout',
      importance: 'High',
    },
    {
      id: 'ins-2',
      category: 'Recovery',
      title: 'Sleep Correlation with Volume Output',
      description: `Data indicates sessions following 7.5+ hours of sleep generate 18% higher tonnage volume compared to sub-6 hour nights. Maintaining consistent sleep hygiene is your biggest performance multiplier.`,
      actionLabel: 'Log Recovery Biomarkers',
      actionHref: '/recovery',
      importance: 'Optimal',
    },
    {
      id: 'ins-3',
      category: 'Nutrition',
      title: 'Protein Distribution Optimization',
      description: `For your goal of "${profile?.primary_goal || 'Build Muscle'}", spreading your ~${Math.round((profile?.weight_kg || 70) * 2)}g daily protein across 4 distinct boluses (breakfast, lunch, snack, dinner) maximizes muscle protein synthesis (MPS).`,
      actionLabel: 'Review Meal Plans',
      actionHref: '/meals',
      importance: 'Medium',
    },
    {
      id: 'ins-4',
      category: 'Habits',
      title: 'Workout Day Consistency',
      description: `You are consistently hitting your target of ${profile?.training_days_per_week || 4} training days per week. Adherence is in the top 10% for your training cycle. Keep this habitual cadence.`,
      actionLabel: 'Track Progress',
      actionHref: '/progress',
      importance: 'Optimal',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">AI Fitness Insights &amp; Coach</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Personalized intelligence derived from your workout volume, recovery check-ins, and nutrition targets.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Hero AI Coach Banner */}
      <Card className="p-6 md:p-8 border-lime-400/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-lime-950/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center shrink-0">
            <Brain size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">YashFit Intelligence Core</h2>
              <Badge variant="accent">Active</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Continuously synthesizing exercise adherence, recovery trends, and caloric targets.
            </p>
          </div>
        </div>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((ins) => (
          <Card
            key={ins.id}
            className="p-6 space-y-4 border-zinc-800 bg-zinc-900 flex flex-col justify-between hover:border-zinc-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <Badge
                  variant={
                    ins.importance === 'High'
                      ? 'warning'
                      : ins.importance === 'Optimal'
                      ? 'accent'
                      : 'default'
                  }
                >
                  {ins.category}
                </Badge>
                <span className="text-[11px] text-zinc-500 font-medium">Auto-generated</span>
              </div>
              <h3 className="text-base font-bold text-white">{ins.title}</h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{ins.description}</p>
            </div>

            {ins.actionHref && (
              <div className="pt-3 border-t border-zinc-800">
                <Link
                  href={ins.actionHref}
                  className="text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1 transition-colors"
                >
                  <span>{ins.actionLabel}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
