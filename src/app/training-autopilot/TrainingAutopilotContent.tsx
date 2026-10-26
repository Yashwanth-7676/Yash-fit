'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import type { UserProfile } from '@/types/profile'
import type { TwinWorkout, RecoveryEntry } from '@/lib/digitalTwin'
import type {
  TodayWorkoutRecommendation,
  WeeklyAutopilotSchedule,
  AutopilotAdaptationRecord,
  ExerciseAdaptation,
} from '@/types/autopilot'
import type { WorkoutRoutine } from '@/types/workout'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'
import {
  getFitnessUserId,
  workoutHistoryKey,
  recoveryHistoryKey,
  activePlanKey,
  readArray,
} from '@/lib/digitalTwin'
import { getUserProfile } from '@/lib/profileService'
import { generateAutopilotRecommendation } from '@/lib/autopilot/autopilotEngine'
import { generateWeeklyAutopilotSchedule } from '@/lib/autopilot/weeklyScheduler'
import {
  getAdaptationHistory,
  applyAutopilotRecommendation,
  undoAutopilotRecommendation,
  autopilotUndoSnapshotKey,
} from '@/lib/autopilot/autopilotStorage'
import { TodayRecommendationCard } from '@/components/autopilot/TodayRecommendationCard'
import { WeeklyScheduleCard } from '@/components/autopilot/WeeklyScheduleCard'
import { AdaptationHistoryTimeline } from '@/components/autopilot/AdaptationHistoryTimeline'
import { ExerciseCustomizerModal } from '@/components/autopilot/ExerciseCustomizerModal'
import { useToast } from '@/components/ui'
import { Compass, Bot, Sparkles, Activity, ShieldAlert, Cpu, Box, Play } from 'lucide-react'

export function TrainingAutopilotContent() {
  const toast = useToast()

  // State
  const [userId, setUserId] = useState<string>('demo-user')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [workouts, setWorkouts] = useState<TwinWorkout[]>([])
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([])
  const [activePlan, setActivePlan] = useState<Record<string, unknown> | null>(null)
  const [history, setHistory] = useState<AutopilotAdaptationRecord[]>([])
  const [canUndo, setCanUndo] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isApplying, setIsApplying] = useState<boolean>(false)

  // AI explanation state
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState<string | null>(null)

  // Edit modal state
  const [editingAdaptation, setEditingAdaptation] = useState<ExerciseAdaptation | null>(null)
  const [customAdaptations, setCustomAdaptations] = useState<Record<string, ExerciseAdaptation>>({})

  // 1. Load Data
  const loadAutopilotData = useCallback(async () => {
    try {
      const id = await getFitnessUserId()
      setUserId(id)

      const p = await getUserProfile(id)
      setProfile(p)

      // Load workouts
      let wList = readArray<TwinWorkout>(workoutHistoryKey(id))
      if (id === 'demo-user' && wList.length === 0) {
        wList = readArray<TwinWorkout>('yashfit_completed_workouts')
      }
      setWorkouts(wList)

      // Load recovery
      const rList = readArray<RecoveryEntry>(recoveryHistoryKey(id))
      setRecovery(rList)

      // Load active plan
      if (typeof window !== 'undefined') {
        const planRaw = localStorage.getItem(activePlanKey(id))
        if (planRaw) {
          try {
            setActivePlan(JSON.parse(planRaw))
          } catch {}
        }
        const hasSnapshot = Boolean(localStorage.getItem(autopilotUndoSnapshotKey(id)))
        setCanUndo(hasSnapshot)
      }

      // Load history
      const hist = await getAdaptationHistory(id)
      setHistory(hist)
    } catch (err) {
      console.warn('Error loading autopilot telemetry:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAutopilotData()
  }, [loadAutopilotData])

  // Resolve active routine
  const currentRoutine: WorkoutRoutine = useMemo(() => {
    const routineId = (activePlan?.routineId as string) || PRESET_WORKOUT_ROUTINES[0].id
    return PRESET_WORKOUT_ROUTINES.find((r) => r.id === routineId) || PRESET_WORKOUT_ROUTINES[0]
  }, [activePlan])

  // 2. Generate Autopilot Today Recommendation
  const recommendation: TodayWorkoutRecommendation = useMemo(() => {
    const activeOverrides = (activePlan?.exerciseOverrides as Record<string, string>) || {}
    const baseRec = generateAutopilotRecommendation({
      profile,
      workouts,
      recovery,
      currentRoutine,
      activeOverrides,
    })

    // Apply any active in-memory user customizations
    const mergedAdaptations = baseRec.exerciseAdaptations.map((a) => {
      if (customAdaptations[a.exerciseId]) {
        return customAdaptations[a.exerciseId]
      }
      return a
    })

    return {
      ...baseRec,
      exerciseAdaptations: mergedAdaptations,
    }
  }, [profile, workouts, recovery, currentRoutine, activePlan, customAdaptations])

  // 3. Fetch optional AI explanation
  useEffect(() => {
    let isCancelled = false
    async function fetchAiExplanation() {
      if (!recommendation) return
      try {
        const res = await fetch('/api/ai/autopilot-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendation }),
        })
        if (res.ok && !isCancelled) {
          const json = await res.json()
          if (json.explanation) {
            setAiExplanation(json.explanation)
            setAiProvider(json.providerUsed)
          }
        }
      } catch {
        // Fallback to deterministic
      }
    }
    fetchAiExplanation()
    return () => {
      isCancelled = true
    }
  }, [recommendation])

  // 4. Generate Weekly Autopilot Schedule
  const weeklySchedule: WeeklyAutopilotSchedule = useMemo(() => {
    return generateWeeklyAutopilotSchedule(profile, workouts, currentRoutine)
  }, [profile, workouts, currentRoutine])

  // 5. Actions: Accept Proposal
  const handleAccept = async () => {
    setIsApplying(true)
    try {
      const customOverrides: Record<string, string> = {}
      recommendation.exerciseAdaptations.forEach((a) => {
        if (a.actionType === 'substitute') {
          customOverrides[a.originalItem.exerciseId] = a.proposedItem.exerciseId
        }
      })

      const record = await applyAutopilotRecommendation(userId, recommendation, customOverrides)
      setHistory((prev) => [record, ...prev.slice(0, 19)])
      setCanUndo(true)

      // Reload active plan
      if (typeof window !== 'undefined') {
        const updated = localStorage.getItem(activePlanKey(userId))
        if (updated) setActivePlan(JSON.parse(updated))
      }

      toast.success(
        'Calibration Applied to Planner! 🚀',
        `Autopilot updated '${recommendation.routineName}' with verified progressive overload adjustments.`
      )
    } catch (err) {
      toast.error('Failed to Apply Plan', 'Could not save the adaptation.')
    } finally {
      setIsApplying(false)
    }
  }

  // 6. Actions: Undo
  const handleUndo = async () => {
    const success = await undoAutopilotRecommendation(userId)
    if (success) {
      setCanUndo(false)
      if (typeof window !== 'undefined') {
        const updated = localStorage.getItem(activePlanKey(userId))
        setActivePlan(updated ? JSON.parse(updated) : null)
      }
      const hist = await getAdaptationHistory(userId)
      setHistory(hist)
      setCustomAdaptations({})
      toast.info('Plan Reverted ↩️', 'Restored your prior workout plan.')
    } else {
      toast.error('Undo Failed', 'No prior snapshot available to restore.')
    }
  }

  // 7. Actions: Dismiss
  const handleDismiss = () => {
    toast.info('Proposal Dismissed', 'Your existing workout plan remains unchanged.')
  }

  // 8. Actions: Regenerate
  const handleRegenerate = () => {
    setCustomAdaptations({})
    toast.info('Regenerating Engine 🔄', 'Recalculating progressive overload against latest logs.')
  }

  // 9. Save customized adaptation from modal
  const handleSaveCustomAdaptation = (customized: ExerciseAdaptation) => {
    setCustomAdaptations((prev) => ({
      ...prev,
      [customized.exerciseId]: customized,
    }))
    toast.success('Movement Customized! ✏️', `Updated prescription for ${customized.exerciseName}.`)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <p className="text-sm text-zinc-400">Loading Training Autopilot telemetry...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Compass size={13} />
              Upgrade #12
            </span>
            <span className="text-xs text-zinc-400">Adaptive Programming Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Smart Training Autopilot
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Conservative progressive overload, recovery-aware volume adjustments, and intelligent exercise substitutions driven by real performance logs.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link
            href="/workout"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <span>Workout Planner</span>
          </Link>
          <Link
            href="/virtual-gym"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Box size={13} className="text-lime-400" />
            <span>3D Gym</span>
          </Link>
          <Link
            href="/command-center"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Cpu size={13} className="text-lime-400" />
            <span className="hidden sm:inline">AI HQ</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Today's Recommendation Hero Card */}
      <TodayRecommendationCard
        recommendation={recommendation}
        aiExplanation={aiExplanation}
        aiProvider={aiProvider}
        canUndo={canUndo}
        onAccept={handleAccept}
        onDismiss={handleDismiss}
        onRegenerate={handleRegenerate}
        onUndo={handleUndo}
        onOpenEditModal={(adaptation) => setEditingAdaptation(adaptation)}
        isApplying={isApplying}
      />

      {/* Weekly Autopilot Schedule */}
      <WeeklyScheduleCard schedule={weeklySchedule} />

      {/* Adaptation History Timeline */}
      <AdaptationHistoryTimeline history={history} />

      {/* Customizer Modal */}
      <ExerciseCustomizerModal
        adaptation={editingAdaptation}
        availableEquipment={profile?.available_equipment}
        onClose={() => setEditingAdaptation(null)}
        onSave={handleSaveCustomAdaptation}
      />
    </div>
  )
}
