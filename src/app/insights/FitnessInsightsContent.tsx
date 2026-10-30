'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { getUserProfile } from '@/lib/profileService'
import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import {
  getFitnessUserId,
  getTrainingAdvice,
  parseExerciseLogs,
  readArray,
  recoveryHistoryKey,
  workoutHistoryKey,
  type RecoveryEntry,
  type TwinWorkout,
} from '@/lib/digitalTwin'
import type { UserProfile } from '@/types/profile'

interface InsightItem {
  id: string
  category: 'Training' | 'Nutrition' | 'Recovery' | 'Habits'
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  importance: 'High' | 'Medium' | 'Optimal'
  evidence: string
  reason: string
  limitation: string
}

export function FitnessInsightsContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const userId = await getFitnessUserId()
        const p = await getUserProfile(userId)
        setProfile(p)
        const history = readArray<TwinWorkout>(workoutHistoryKey(userId))
        setWorkouts(userId === 'demo-user' && history.length === 0
          ? readArray<TwinWorkout>('yashfit_completed_workouts')
          : history)
        const checkIns = readArray<RecoveryEntry>(recoveryHistoryKey(userId))
        if (userId === 'demo-user' && checkIns.length === 0) {
          const latest = localStorage.getItem('yashfit_latest_recovery')
          setRecovery(latest ? [JSON.parse(latest) as RecoveryEntry] : [])
        } else {
          setRecovery(checkIns)
        }
        if (userId !== 'demo-user' && isSupabaseConfigured()) {
          const supabase = createClient()
          const [workoutResult, recoveryResult] = await Promise.all([
            supabase.from('workout_logs')
              .select('routine_name, duration_seconds, total_volume_kg, total_sets_completed, exercise_logs, completed_at')
              .eq('user_id', userId)
              .order('completed_at', { ascending: false }),
            supabase.from('recovery_logs')
              .select('date, sleep_hours, readiness_score, soreness')
              .eq('user_id', userId)
              .order('date', { ascending: false }),
          ])
          if (workoutResult.error) {
            console.warn('Unable to load account workouts for insights:', workoutResult.error.message)
          } else {
            const localDates = new Set(history.map((workout) => Date.parse(workout.date)).filter(Number.isFinite))
            const cloud = (workoutResult.data ?? [])
              .filter((workout) => !localDates.has(Date.parse(workout.completed_at)))
              .map((workout) => ({
                routineName: workout.routine_name,
                durationSeconds: workout.duration_seconds,
                totalVolume: Number(workout.total_volume_kg),
                totalCompletedSets: workout.total_sets_completed,
                date: workout.completed_at,
                exercises: parseExerciseLogs(workout.exercise_logs),
              }))
            setWorkouts([...(userId === 'demo-user' ? [] : history), ...cloud])
          }
          if (recoveryResult.error) {
            console.warn('Unable to load account recovery for insights:', recoveryResult.error.message)
          } else {
            const latestFirst = (recoveryResult.data ?? []).map((entry) => ({
              date: entry.date,
              sleepHours: Number(entry.sleep_hours),
              readinessScore: entry.readiness_score,
              soreness: entry.soreness,
            }))
            const byDate = new Map<string, RecoveryEntry>(latestFirst.map((entry) => [entry.date.slice(0, 10), entry]))
            checkIns.forEach((entry) => byDate.set(entry.date.slice(0, 10), entry))
            setRecovery([...byDate.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)))
          }
        }
      } catch (error) {
        console.error('Unable to load recorded data for fitness insights:', error)
      }
    }
    loadData()
  }, [])

  const trainingAdvice = getTrainingAdvice(profile, workouts, recovery)
  const insights: InsightItem[] = [
    {
      id: 'training',
      category: 'Training',
      title: trainingAdvice.observation,
      description: trainingAdvice.action,
      evidence: trainingAdvice.evidence,
      reason: trainingAdvice.reason,
      limitation: trainingAdvice.limitation,
      actionLabel: 'Review Digital Twin',
      actionHref: '/digital-twin',
      importance: trainingAdvice.caution ? 'High' : 'Medium',
    },
    {
      id: 'recovery',
      category: 'Recovery',
      title: recovery.length
        ? 'Recovery check-ins are available'
        : 'Recovery trend is not available yet',
      description: recovery.length
        ? `Your latest recorded check-in includes ${recovery[0].sleepHours} hours of sleep${recovery[0].readinessScore === undefined ? '' : ` and a calculated readiness score of ${recovery[0].readinessScore}/100`}.`
        : 'There are no recovery check-ins in this account history to compare against training.',
      evidence: recovery.length ? `${recovery.length} check-in${recovery.length === 1 ? '' : 's'} recorded.` : 'No recovery entries found.',
      reason: 'Self-reported recovery gives context for training choices but does not predict performance.',
      limitation: 'Check-ins are subjective and not clinical measurements.',
      actionLabel: 'Log Recovery',
      actionHref: '/recovery',
      importance: 'Medium',
    },
    {
      id: 'nutrition',
      category: 'Nutrition',
      title: 'Nutrition adherence data is missing',
      description: `Your profile goal is ${profile?.primary_goal || 'not recorded'}, but meal intake is not stored as a dated history in the current app.`,
      evidence: 'Nutrition targets exist; actual meal adherence records are unavailable.',
      reason: 'A target alone cannot establish whether daily intake matched that target.',
      limitation: 'No calorie or protein adherence claim is made.',
      actionLabel: 'Review Nutrition',
      actionHref: '/nutrition',
      importance: 'Medium',
    },
    {
      id: 'habits',
      category: 'Habits',
      title: workouts.length >= 3 ? 'Workout history is building' : 'Log more workouts to assess consistency',
      description: `${workouts.length} completed workout${workouts.length === 1 ? '' : 's'} are currently available to this account.`,
      evidence: workouts.length ? `Most recent logged session: ${new Date(workouts[0].date).toLocaleDateString()}.` : 'No completed workout records found.',
      reason: 'Consistency estimates need dated workout records across multiple weeks.',
      limitation: 'No adherence percentile or prediction is computed.',
      actionLabel: 'Open Workout Planner',
      actionHref: '/workout',
      importance: 'Medium',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">AI Fitness Insights &amp; Coach</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Rules-based guidance from the recorded profile, completed sessions, and recovery check-ins available to this account.
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
              Deterministic calculations only. No external model is sent personal or health-related data.
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
              <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3 text-xs leading-relaxed">
                <p><span className="font-semibold text-zinc-500">Supporting data: </span><span className="text-zinc-300">{ins.evidence}</span></p>
                <p><span className="font-semibold text-zinc-500">Reason: </span><span className="text-zinc-300">{ins.reason}</span></p>
                <p><span className="font-semibold text-zinc-500">Limitation: </span><span className="text-zinc-500">{ins.limitation}</span></p>
              </div>
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
