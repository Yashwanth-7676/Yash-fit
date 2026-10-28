'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FitnessStatusHeader,
} from '@/components/command-center/FitnessStatusHeader'
import {
  AttentionAreasBanner,
} from '@/components/command-center/AttentionAreasBanner'
import {
  AdaptiveRecommendationCard,
} from '@/components/command-center/AdaptiveRecommendationCard'
import {
  PersonalActionPlanCard,
} from '@/components/command-center/PersonalActionPlanCard'
import {
  ExplainableAiCoachPanel,
} from '@/components/command-center/ExplainableAiCoachPanel'
import {
  TrendsAndForecastsCard,
} from '@/components/command-center/TrendsAndForecastsCard'
import {
  PersonalRecordsList,
} from '@/components/command-center/PersonalRecordsList'
import { Modal, Button } from '@/components/ui'
import {
  calculateTodayFitnessStatus,
  computePersonalRecords,
  computeStrengthProgression,
  detectAttentionAreas,
  generateAdaptiveWorkoutRecommendation,
  generateDailyActionPlan,
} from '@/lib/command-center/commandCenterService'
import { getUserProfile, isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import {
  getFitnessUserId,
  readArray,
  workoutHistoryKey,
  recoveryHistoryKey,
  dailyWaterKey,
  waterTargetKey,
  activePlanKey,
  type TwinWorkout,
  type RecoveryEntry,
} from '@/lib/digitalTwin'
import { getUserRpgProgress } from '@/lib/rpg/rpgService'
import type { UserProfile } from '@/types/profile'
import type {
  AdaptiveWorkoutRecommendation,
} from '@/types/commandCenter'
import type { CoachUserContext } from '@/lib/ai/providers'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'

export function CommandCenterContent() {
  const [userId, setUserId] = useState('demo-user')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([])
  const [waterLogged, setWaterLogged] = useState(0)
  const [waterTarget, setWaterTarget] = useState(2.5)
  const [rpgData, setRpgData] = useState({ level: 1, rank: 'Rookie', totalXp: 0, streak: 0 })
  const [isLoading, setIsLoading] = useState(true)

  // Recommendation state
  const [recommendation, setRecommendation] = useState<AdaptiveWorkoutRecommendation | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editedVolumePercent, setEditedVolumePercent] = useState<number>(-20)
  const [editedRoutineId, setEditedRoutineId] = useState('routine-full-body')

  // Load telemetry
  useEffect(() => {
    async function loadCommandCenterData() {
      try {
        const id = await getFitnessUserId()
        setUserId(id)

        const [p, rpg] = await Promise.all([
          getUserProfile(id),
          Promise.resolve(getUserRpgProgress()),
        ])
        setProfile(p)
        setRpgData({
          level: rpg.currentLevel,
          rank: rpg.rank,
          totalXp: rpg.totalXp,
          streak: rpg.currentStreak,
        })

        // Workouts
        let localWorkouts = readArray<TwinWorkout>(workoutHistoryKey(id))
        if (id === 'demo-user' && localWorkouts.length === 0) {
          localWorkouts = readArray<TwinWorkout>('yashfit_completed_workouts')
        }
        setWorkouts(localWorkouts)

        // Recovery
        let localRecovery = readArray<RecoveryEntry>(recoveryHistoryKey(id))
        if (id === 'demo-user' && localRecovery.length === 0) {
          const latest = localStorage.getItem('yashfit_latest_recovery')
          if (latest) {
            localRecovery = [JSON.parse(latest) as RecoveryEntry]
          }
        }
        setRecovery(localRecovery)

        // Hydration
        const waterStr = localStorage.getItem(dailyWaterKey(id)) || (id === 'demo-user' ? localStorage.getItem('yashfit_daily_water') : null)
        if (waterStr) {
          const val = parseFloat(waterStr)
          if (!isNaN(val)) setWaterLogged(val)
        }

        const wtStr = localStorage.getItem(waterTargetKey(id)) || (id === 'demo-user' ? localStorage.getItem('yashfit_water_target') : null)
        if (wtStr) {
          const val = parseFloat(wtStr)
          if (!isNaN(val)) setWaterTarget(val)
        }

        // Supabase sync if configured
        if (id !== 'demo-user' && isSupabaseConfigured()) {
          const supabase = createClient()
          const [wRes, rRes] = await Promise.all([
            supabase
              .from('workout_logs')
              .select('routine_name, duration_seconds, total_volume_kg, total_sets_completed, completed_at')
              .eq('user_id', id)
              .order('completed_at', { ascending: false }),
            supabase
              .from('recovery_logs')
              .select('date, sleep_hours, readiness_score, soreness')
              .eq('user_id', id)
              .order('date', { ascending: false }),
          ])

          if (!wRes.error && wRes.data) {
            const localDates = new Set(localWorkouts.map((w) => Date.parse(w.date)).filter(Number.isFinite))
            const cloudWorkouts: TwinWorkout[] = wRes.data
              .filter((item) => !localDates.has(Date.parse(item.completed_at)))
              .map((item) => ({
                routineName: item.routine_name,
                durationSeconds: item.duration_seconds,
                totalVolume: Number(item.total_volume_kg),
                totalCompletedSets: item.total_sets_completed,
                date: item.completed_at,
              }))
            setWorkouts([...localWorkouts, ...cloudWorkouts].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)))
          }

          if (!rRes.error && rRes.data) {
            const cloudRecovery: RecoveryEntry[] = rRes.data.map((item) => ({
              date: item.date,
              sleepHours: Number(item.sleep_hours),
              readinessScore: item.readiness_score,
              soreness: item.soreness,
            }))
            const map = new Map<string, RecoveryEntry>()
            ;[...cloudRecovery, ...localRecovery].forEach((entry) => map.set(entry.date.slice(0, 10), entry))
            setRecovery([...map.values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)))
          }
        }
      } catch (err) {
        console.warn('Unable to load full Command Center telemetry:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCommandCenterData()
  }, [])

  // Derived Calculations
  const fitnessStatus = useMemo(() => {
    return calculateTodayFitnessStatus(profile, workouts, recovery, waterLogged, waterTarget, rpgData)
  }, [profile, workouts, recovery, waterLogged, waterTarget, rpgData])

  const attentionAreas = useMemo(() => {
    return detectAttentionAreas(fitnessStatus, workouts, recovery)
  }, [fitnessStatus, workouts, recovery])

  const dailyActions = useMemo(() => {
    return generateDailyActionPlan(userId, fitnessStatus, workouts, recovery)
  }, [userId, fitnessStatus, workouts, recovery])

  const personalRecords = useMemo(() => {
    return computePersonalRecords(workouts)
  }, [workouts])

  const strengthProgression = useMemo(() => {
    return computeStrengthProgression(workouts)
  }, [workouts])

  // Generate initial adaptive recommendation
  useEffect(() => {
    if (!recommendation && profile !== undefined) {
      const rec = generateAdaptiveWorkoutRecommendation(
        profile,
        workouts,
        recovery,
        fitnessStatus.scheduledWorkout.id
      )
      setRecommendation(rec)
      setEditedVolumePercent(rec.volumeAdjustmentPercent || 0)
      setEditedRoutineId(rec.targetRoutineId)
    }
  }, [profile, workouts, recovery, fitnessStatus, recommendation])

  // Context for AI Coach
  const coachContext: CoachUserContext = useMemo(() => {
    return {
      profile,
      workouts,
      recovery,
      waterLoggedLiters: waterLogged,
      waterTargetLiters: waterTarget,
      activeStreak: rpgData.streak,
      rpgLevel: rpgData.level,
      rpgRank: rpgData.rank,
    }
  }, [profile, workouts, recovery, waterLogged, waterTarget, rpgData])

  // Handlers for Recommendation
  const handleAcceptRecommendation = (rec: AdaptiveWorkoutRecommendation) => {
    try {
      localStorage.setItem(
        activePlanKey(userId),
        JSON.stringify({
          routineId: rec.targetRoutineId,
          exerciseOverrides: rec.substitutions || {},
          appliedAt: new Date().toISOString(),
          calibrationType: rec.recommendationType,
        })
      )
      setRecommendation((prev) => (prev ? { ...prev, status: 'accepted' } : null))
    } catch (err) {
      console.warn('Failed to persist calibrated plan:', err)
    }
  }

  const handleDismissRecommendation = (_rec: AdaptiveWorkoutRecommendation) => {
    setRecommendation((prev) => (prev ? { ...prev, status: 'dismissed' } : null))
  }

  const handleSaveEditedRecommendation = () => {
    if (!recommendation) return
    const updated: AdaptiveWorkoutRecommendation = {
      ...recommendation,
      targetRoutineId: editedRoutineId,
      volumeAdjustmentPercent: editedVolumePercent,
      title: `Custom Calibration: ${PRESET_WORKOUT_ROUTINES.find((r) => r.id === editedRoutineId)?.name}`,
      status: 'accepted',
    }
    setRecommendation(updated)
    handleAcceptRecommendation(updated)
    setEditModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-zinc-400 font-medium">
          Initializing AI Fitness Command Center…
        </p>
      </div>
    )
  }

  const displayName = profile?.first_name || 'Fitness Champion'

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Fitness Status Header */}
      <FitnessStatusHeader status={fitnessStatus} userName={displayName} />

      {/* 2. Areas Requiring Attention Banner */}
      <AttentionAreasBanner areas={attentionAreas} />

      {/* 3. Adaptive Workout Recommendation Card */}
      {recommendation && (
        <AdaptiveRecommendationCard
          recommendation={recommendation}
          onAccept={handleAcceptRecommendation}
          onDismiss={handleDismissRecommendation}
          onEdit={() => setEditModalOpen(true)}
        />
      )}

      {/* 4. Action Plan & AI Coach Side-by-Side Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PersonalActionPlanCard userId={userId} actions={dailyActions} />
        <ExplainableAiCoachPanel context={coachContext} />
      </div>

      {/* 5. Trends, Projections & Strength Progression */}
      <TrendsAndForecastsCard workouts={workouts} strengthItems={strengthProgression} />

      {/* 6. Personal Records & Milestones */}
      <PersonalRecordsList records={personalRecords} />

      {/* Edit Calibration Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Adjust Workout Calibration"
        description="Customize the target routine split or volume reduction."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Select Workout Split
            </label>
            <select
              value={editedRoutineId}
              onChange={(e) => setEditedRoutineId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-lime-400"
            >
              {PRESET_WORKOUT_ROUTINES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.exercises.length} Exercises ({r.targetSplit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Volume Adjustment (% Working Sets)
            </label>
            <div className="flex items-center gap-2">
              {[-30, -20, -10, 0, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setEditedVolumePercent(pct)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    editedVolumePercent === pct
                      ? 'bg-lime-400 text-zinc-950 border-lime-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Negative values reduce working sets to manage recovery debt.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedRecommendation}>
              Apply Custom Calibration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
