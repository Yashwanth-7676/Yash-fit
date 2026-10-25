'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight, CalendarDays, Target } from 'lucide-react'
import { Card } from '@/components/ui'
import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import { recoveryHistoryKey, workoutHistoryKey, readArray, type RecoveryEntry, type TwinWorkout } from '@/lib/digitalTwin'
import type { UserProfile } from '@/types/profile'

export function DigitalTwinSummaryCard({
  profile,
  userId,
}: {
  profile: UserProfile | null
  userId: string
}) {
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [recovery, setRecovery] = useState<RecoveryEntry | null>(null)

  useEffect(() => {
    async function loadSummary() {
      let history = readArray<TwinWorkout>(workoutHistoryKey(userId))
      if (userId === 'demo-user' && history.length === 0) {
        history = readArray<TwinWorkout>('yashfit_completed_workouts')
      }
      setWorkouts(history)
      const recoveryHistory = readArray<RecoveryEntry>(recoveryHistoryKey(userId))
      if (recoveryHistory[0]) setRecovery(recoveryHistory[0])
      else if (userId === 'demo-user') {
        try {
          const latest = localStorage.getItem('yashfit_latest_recovery')
          setRecovery(latest ? JSON.parse(latest) as RecoveryEntry : null)
        } catch (error) {
          console.warn('Unable to read recovery summary for the digital twin card:', error)
        }
      }
      if (userId === 'demo-user' || !isSupabaseConfigured()) return
      try {
        const supabase = createClient()
        const [workoutResult, recoveryResult] = await Promise.all([
          supabase.from('workout_logs')
            .select('routine_name, duration_seconds, total_volume_kg, total_sets_completed, completed_at')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false }),
          supabase.from('recovery_logs')
            .select('date, sleep_hours, readiness_score, soreness')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(1),
        ])
        if (workoutResult.error) {
          console.warn('Unable to load Digital Twin workout summary:', workoutResult.error.message)
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
            }))
          setWorkouts([...history, ...cloud])
        }
        if (recoveryResult.error) {
          console.warn('Unable to load Digital Twin recovery summary:', recoveryResult.error.message)
        } else if (recoveryResult.data?.[0]) {
          const entry = recoveryResult.data[0]
          setRecovery({
            date: entry.date,
            sleepHours: Number(entry.sleep_hours),
            readinessScore: entry.readiness_score,
            soreness: entry.soreness,
          })
        }
      } catch (error) {
        console.warn('Unable to reach account history for the Digital Twin summary:', error)
      }
    }
    loadSummary()
  }, [userId])

  const now = Date.now()
  const weekSessions = workouts.filter((workout) => {
    const date = Date.parse(workout.date)
    return Number.isFinite(date) && date >= now - 7 * 86400000
  }).length
  const nextMilestone = (Math.floor(workouts.length / 10) + 1) * 10
  const caution = (recovery?.readinessScore !== undefined && recovery.readinessScore < 50) ||
    (recovery?.sleepHours !== undefined && recovery.sleepHours < 6) ||
    recovery?.soreness?.toLowerCase() === 'severe'

  return (
    <Card className="border-lime-400/20 bg-gradient-to-br from-zinc-900 to-lime-950/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lime-400"><Activity size={17} /><span className="text-xs font-semibold uppercase tracking-wider">Digital Twin</span></div>
          <h2 className="mt-2 text-lg font-bold text-white">{profile?.primary_goal ?? 'Goal not recorded'}</h2>
          <p className="mt-1 text-sm text-zinc-400">
            {weekSessions} session{weekSessions === 1 ? '' : 's'} logged in the last 7 days
            {profile?.training_days_per_week ? ` · target ${profile.training_days_per_week}/week` : ''}
          </p>
        </div>
        <Link href="/digital-twin" className="inline-flex items-center gap-1 text-sm font-medium text-lime-400 hover:text-lime-300">
          Full overview <ArrowRight size={15} />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-800 pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-xs text-zinc-300"><CalendarDays size={15} className="text-zinc-500" />{workouts.length} total recorded workout{workouts.length === 1 ? '' : 's'}</div>
        <div className="flex items-center gap-2 text-xs text-zinc-300"><Target size={15} className="text-zinc-500" />Next milestone: {nextMilestone} workouts</div>
        <p className={caution ? 'text-xs text-amber-300' : 'text-xs text-zinc-400'}>
          {caution ? 'Suggested action: consider recovery before adding load.' : 'Suggested action: keep logging sets and check-ins for tailored guidance.'}
        </p>
      </div>
    </Card>
  )
}
