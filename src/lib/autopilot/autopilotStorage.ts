import type { AutopilotAdaptationRecord, TodayWorkoutRecommendation } from '@/types/autopilot'
import { activePlanKey, readArray } from '@/lib/digitalTwin'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/profileService'

export const autopilotHistoryKey = (userId: string) => `yashfit_autopilot_adaptations_${userId}`
export const autopilotUndoSnapshotKey = (userId: string) => `yashfit_autopilot_undo_${userId}`

/**
 * Reads adaptation history for a user (combining Supabase or localStorage fallback)
 */
export async function getAdaptationHistory(userId: string): Promise<AutopilotAdaptationRecord[]> {
  if (typeof window === 'undefined') return []

  // Check Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('autopilot_adaptations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          date: d.created_at,
          routineName: d.routine_name,
          previousPlanSummary: d.previous_plan_summary,
          proposedAdjustmentSummary: d.proposed_adjustment_summary,
          reason: d.reason,
          userDecision: d.user_decision,
          decisionTimestamp: d.created_at,
          outcomeSummary: d.outcome_summary,
          previousPlanSnapshot: d.metadata?.previousPlanSnapshot,
        }))
      }
    } catch (err) {
      console.warn('Could not read autopilot adaptations from Supabase:', err)
    }
  }

  // Fallback to localStorage
  const localList = readArray<AutopilotAdaptationRecord>(autopilotHistoryKey(userId))
  return localList
}

/**
 * Applies an accepted workout recommendation, stores an undo snapshot, and logs adaptation record.
 */
export async function applyAutopilotRecommendation(
  userId: string,
  recommendation: TodayWorkoutRecommendation,
  customOverrides?: Record<string, string>
): Promise<AutopilotAdaptationRecord> {
  if (typeof window === 'undefined') throw new Error('Cannot apply plan in SSR')

  // 1. Capture current plan as Undo snapshot
  const currentPlanRaw = localStorage.getItem(activePlanKey(userId))
  let currentPlanSnapshot: Record<string, unknown> | null = null
  if (currentPlanRaw) {
    try {
      currentPlanSnapshot = JSON.parse(currentPlanRaw)
    } catch {}
  }
  if (currentPlanSnapshot) {
    localStorage.setItem(autopilotUndoSnapshotKey(userId), JSON.stringify(currentPlanSnapshot))
  }

  // 2. Build new exercise overrides dictionary
  const newOverrides: Record<string, string> = {
    ...(currentPlanSnapshot?.exerciseOverrides as Record<string, string> || {}),
    ...(customOverrides || {}),
  }

  recommendation.exerciseAdaptations.forEach((adapt) => {
    if (adapt.actionType === 'substitute') {
      newOverrides[adapt.originalItem.exerciseId] = adapt.proposedItem.exerciseId
    }
  })

  // 3. Save new active plan into localStorage
  const updatedPlan = {
    routineId: recommendation.routineId,
    exerciseOverrides: newOverrides,
    appliedAt: new Date().toISOString(),
    appliedBy: 'training_autopilot',
  }
  localStorage.setItem(activePlanKey(userId), JSON.stringify(updatedPlan))

  // 4. Create Adaptation Record
  const adjustmentSummary = recommendation.exerciseAdaptations
    .map((a) => `${a.exerciseName}: ${a.actionType.replace('_', ' ')}`)
    .join('; ')

  const record: AutopilotAdaptationRecord = {
    id: `adapt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    date: new Date().toISOString(),
    routineName: recommendation.routineName,
    previousPlanSummary: currentPlanSnapshot ? `Custom plan (${currentPlanSnapshot.routineId})` : 'Standard default routine',
    proposedAdjustmentSummary: adjustmentSummary || 'Baseline plan maintained',
    reason: recommendation.overallRationale,
    userDecision: 'accepted',
    decisionTimestamp: new Date().toISOString(),
    outcomeSummary: 'Active in workout planner',
    previousPlanSnapshot: currentPlanSnapshot as AutopilotAdaptationRecord['previousPlanSnapshot'],
  }

  // 5. Persist record locally
  const currentHistory = readArray<AutopilotAdaptationRecord>(autopilotHistoryKey(userId))
  localStorage.setItem(
    autopilotHistoryKey(userId),
    JSON.stringify([record, ...currentHistory.slice(0, 19)])
  )

  // 6. Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      await supabase.from('autopilot_adaptations').insert({
        user_id: userId,
        routine_name: recommendation.routineName,
        previous_plan_summary: record.previousPlanSummary,
        proposed_adjustment_summary: record.proposedAdjustmentSummary,
        reason: record.reason,
        user_decision: 'accepted',
        outcome_summary: record.outcomeSummary,
        metadata: { previousPlanSnapshot: currentPlanSnapshot },
      })
    } catch (err) {
      console.warn('Failed to insert autopilot adaptation into Supabase:', err)
    }
  }

  return record
}

/**
 * Reverts the user's active plan to the prior undo snapshot.
 */
export async function undoAutopilotRecommendation(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const snapshotRaw = localStorage.getItem(autopilotUndoSnapshotKey(userId))
  if (!snapshotRaw) return false

  try {
    const snapshot = JSON.parse(snapshotRaw)
    localStorage.setItem(activePlanKey(userId), JSON.stringify(snapshot))
    localStorage.removeItem(autopilotUndoSnapshotKey(userId))

    // Update latest history record to 'undone'
    const history = readArray<AutopilotAdaptationRecord>(autopilotHistoryKey(userId))
    if (history.length > 0) {
      history[0].userDecision = 'undone'
      history[0].outcomeSummary = 'Reverted by user'
      localStorage.setItem(autopilotHistoryKey(userId), JSON.stringify(history))
    }
    return true
  } catch (err) {
    console.warn('Failed to restore undo snapshot:', err)
    return false
  }
}

