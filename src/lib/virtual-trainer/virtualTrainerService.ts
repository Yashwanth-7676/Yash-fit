import type {
  VirtualCoachMessage,
  VirtualCoachDailyGuidance,
  VoiceInstructionConfig,
} from '../../types/virtualTrainer'
import type { CoachUserContext } from '../ai/providers'

const LOCAL_STORAGE_HISTORY_KEY = 'yashfit_virtual_coach_messages'
const LOCAL_STORAGE_VOICE_CONFIG_KEY = 'yashfit_virtual_coach_voice_config'

export const DEFAULT_VOICE_CONFIG: VoiceInstructionConfig = {
  speechRate: 1.0,
  pitch: 1.0,
  autoSpeak: false,
  isMuted: false,
  recognitionLanguage: 'en-US',
}

let inMemoryVoiceConfig: VoiceInstructionConfig = { ...DEFAULT_VOICE_CONFIG }

/**
 * Builds personalized daily training guidance synthesized from user's active records.
 */
export function buildDailyTrainingGuidance(context: CoachUserContext): VirtualCoachDailyGuidance {
  const { profile, recovery } = context
  const latestRecovery = recovery[0] || null
  const readiness = latestRecovery?.readinessScore ?? null
  const sleepHours = latestRecovery?.sleepHours ?? 7.0
  const soreness = (latestRecovery?.soreness || 'Low').toLowerCase()
  const freq = profile?.training_days_per_week || 4

  let recommendedWorkoutName = 'Full Body Hypertrophy'
  let recommendedSplit = '3-Day Full Body'
  if (freq >= 5) {
    recommendedSplit = 'Push / Pull / Legs (PPL)'
    recommendedWorkoutName = 'Push Focus (Chest, Shoulders & Triceps)'
  } else if (freq === 4) {
    recommendedSplit = 'Upper / Lower Split'
    recommendedWorkoutName = 'Upper Body Power & Hypertrophy'
  }

  const alerts: string[] = []
  if (readiness !== null && readiness < 55) {
    alerts.push(`Low readiness detected (${readiness}/100). Consider reducing volume by 1 set per exercise.`)
  }
  if (sleepHours < 6.0) {
    alerts.push(`Sleep deficit: ${sleepHours} hours recorded last night. Hydrate heavily and avoid 1RM attempts.`)
  }
  if (soreness === 'high' || soreness === 'severe') {
    alerts.push(`Significant soreness reported ("${soreness}"). Focus on active warmup and dynamic mobility.`)
  }

  const focusCues = [
    'Strict 2-second eccentric lowering on all working sets',
    'Full lockout and pause at peak contraction without momentum',
    'Track all working loads accurately for Autopilot progressive overload',
  ]

  const nutritionAdvice =
    profile?.dietary_preference === 'Vegetarian'
      ? 'Ensure 35g protein target at post-workout meal via Paneer, Soya Chunks, or high-protein Dal.'
      : 'Target 30-40g lean protein post-session with complex carbs to replenish muscle glycogen.'

  let readinessSummary = 'Recovery is unrecorded today. Proceed with standard baseline intensity.'
  if (readiness !== null) {
    if (readiness >= 80) readinessSummary = `Optimal Readiness (${readiness}/100). Central nervous system is primed for progressive overload.`
    else if (readiness >= 60) readinessSummary = `Moderate Readiness (${readiness}/100). Standard training capacity with normal rest periods.`
    else readinessSummary = `Fatigue Alert (${readiness}/100). Autopilot recommends reduced load or active recovery.`
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    readinessSummary,
    readinessScore: readiness,
    recommendedWorkoutName,
    recommendedSplit,
    suggestedFocusCues: focusCues,
    nutritionAdvice,
    recoveryAlerts: alerts,
    suggestedQuickActions: [
      { label: 'Start Workout', href: '/workout' },
      { label: 'Check Biomechanics', href: '/biomechanics' },
      { label: 'Review Autopilot', href: '/training-autopilot' },
      { label: 'Performance Lab', href: '/performance-lab' },
    ],
  }
}

/**
 * Builds a weekly or monthly fitness progress review from verified records.
 */
export function buildPeriodicReview(
  period: 'week' | 'month',
  context: CoachUserContext
): {
  periodLabel: string
  totalWorkouts: number
  totalVolumeKg: number
  averageReadiness: number | null
  activeStreak: number
  keyAccomplishments: string[]
  recommendedAdjustments: string[]
  dataCompletenessText: string
} {
  const { workouts, recovery, activeStreak, rpgRank, rpgLevel } = context
  const days = period === 'week' ? 7 : 30
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

  const periodWorkouts = workouts.filter((w) => {
    const t = new Date(w.date).getTime()
    return !isNaN(t) && t >= cutoff
  })

  const totalVolume = periodWorkouts.reduce((acc, w) => acc + (Number(w.totalVolume) || 0), 0)

  const periodRecovery = recovery.filter((r) => {
    const t = new Date(r.date).getTime()
    return !isNaN(t) && t >= cutoff
  })

  const avgReadiness =
    periodRecovery.length > 0
      ? Math.round(
          periodRecovery.reduce((acc, r) => acc + (r.readinessScore || 0), 0) / periodRecovery.length
        )
      : null

  const accomplishments: string[] = []
  if (periodWorkouts.length > 0) {
    accomplishments.push(`Completed ${periodWorkouts.length} verified workout sessions.`)
    accomplishments.push(`Total lifted volume across the period: ${totalVolume.toLocaleString()} kg.`)
  }
  if (activeStreak >= 3) {
    accomplishments.push(`Active habit streak maintained at ${activeStreak} consecutive days.`)
  }
  accomplishments.push(`Rank progression: ${rpgRank} (Level ${rpgLevel}).`)

  const adjustments: string[] = []
  if (periodWorkouts.length < (period === 'week' ? 3 : 10)) {
    adjustments.push('Workout frequency was below the recommended target. Aim for at least 3 sessions per week.')
  }
  if (avgReadiness !== null && avgReadiness < 60) {
    adjustments.push('Average recovery score is below 60%. Prioritize 7.5+ hours of sleep and adequate hydration.')
  } else {
    adjustments.push('Recovery capacity is stable. Continue progressive overload on compound lifts.')
  }

  const dataCompletenessText = `Based on ${periodWorkouts.length} workouts and ${periodRecovery.length} recovery logs recorded in the past ${days} days.`

  return {
    periodLabel: period === 'week' ? 'Past 7 Days' : 'Past 30 Days',
    totalWorkouts: periodWorkouts.length,
    totalVolumeKg: totalVolume,
    averageReadiness: avgReadiness,
    activeStreak,
    keyAccomplishments: accomplishments,
    recommendedAdjustments: adjustments,
    dataCompletenessText,
  }
}

/**
 * Storage helpers for Virtual Coach conversation history in browser environments.
 */
export function getSavedCoachMessages(): VirtualCoachMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)
    if (data) return JSON.parse(data)
  } catch {
    // fallback
  }
  return []
}

export function saveCoachMessages(messages: VirtualCoachMessage[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(messages.slice(-50)))
  } catch {
    // ignore
  }
}

export function clearCoachMessages(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY)
  } catch {
    // ignore
  }
}

export function getVoiceConfig(): VoiceInstructionConfig {
  if (typeof window === 'undefined') return inMemoryVoiceConfig
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_VOICE_CONFIG_KEY)
    if (data) return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(data) }
  } catch {
    // fallback
  }
  return inMemoryVoiceConfig
}

export function saveVoiceConfig(config: VoiceInstructionConfig): void {
  inMemoryVoiceConfig = config
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_VOICE_CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}
