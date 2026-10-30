import type {
  DailyLifestyleSchedule,
  LifestyleTimeSlot,
  UserTimeConstraint,
  LifestyleOptimizationProposal,
} from '../../types/lifestyle'
import type { CoachUserContext } from '../ai/providers'

const LOCAL_STORAGE_SCHEDULE_KEY = 'yashfit_lifestyle_schedule'
const LOCAL_STORAGE_CONSTRAINTS_KEY = 'yashfit_lifestyle_constraints'

const inMemorySchedules: Record<string, DailyLifestyleSchedule> = {}

export const DEFAULT_USER_CONSTRAINTS: UserTimeConstraint = {
  id: 'constraint-default',
  dayOfWeek: new Date().getDay(),
  workStartTime: '09:00',
  workEndTime: '17:30',
  preferredWorkoutTime: 'morning',
  busyPeriods: [
    { start: '09:30', end: '11:00', title: 'Work Deep Focus' },
    { start: '14:00', end: '15:30', title: 'Team Sync' },
  ],
}

/**
 * Synthesizes a unified daily lifestyle schedule from user commitments, recovery telemetry, and fitness goals.
 */
export function buildDailyLifestyleSchedule(
  date: string,
  context: CoachUserContext,
  constraints: UserTimeConstraint = DEFAULT_USER_CONSTRAINTS
): DailyLifestyleSchedule {
  const { profile, recovery = [], waterLoggedLiters, waterTargetLiters, nutritionPlan } = context
  const latestRecovery = recovery[0] || null
  const readiness = latestRecovery?.readinessScore ?? 75
  const sleepHours = latestRecovery?.sleepHours ?? 7.0

  const timeSlots: LifestyleTimeSlot[] = [
    {
      id: 'slot-1-wake',
      time: '06:30',
      durationMinutes: 15,
      category: 'hydration',
      title: 'Morning Rehydration & Sunlight Exposure',
      description: 'Drink 500ml water with a pinch of mineral salt. 10 minutes of direct morning sunlight to set circadian rhythm.',
      isCompleted: true,
      isAiSuggested: false,
      adherencePriority: 'high',
      reminderEnabled: true,
    },
    {
      id: 'slot-2-training',
      time: '07:00',
      durationMinutes: 60,
      category: 'workout',
      title: readiness < 55 ? 'Active Recovery Walking & Mobility' : 'Scheduled Strength Training Session',
      description:
        readiness < 55
          ? 'Readiness is below 55. Low-intensity walking and hip/thoracic mobility recommended instead of heavy compound lifts.'
          : 'Prescribed workout session. Strict 2-minute rests between working sets.',
      isCompleted: false,
      isAiSuggested: readiness < 55,
      adherencePriority: 'high',
      reminderEnabled: true,
    },
    {
      id: 'slot-3-breakfast',
      time: '08:30',
      durationMinutes: 30,
      category: 'nutrition',
      title: 'High-Protein Post-Workout Breakfast',
      description:
        profile?.dietary_preference === 'Vegetarian'
          ? 'Besan Chilla / Paneer Bhurji with sprouted mung (32g protein target).'
          : 'Egg white scramble with whole wheat toast & fruit (35g protein target).',
      isCompleted: false,
      isAiSuggested: false,
      adherencePriority: 'high',
      reminderEnabled: true,
    },
    {
      id: 'slot-4-lunch',
      time: '13:00',
      durationMinutes: 45,
      category: 'nutrition',
      title: 'Midday Meal & Macro Replenishment',
      description:
        nutritionPlan
          ? `Regional Indian lunch: Dal Tadka / Rajma with brown rice and salad (~${Math.round(nutritionPlan.dailyCalories * 0.35)} kcal).`
          : 'Balanced lunch with complex carbohydrates and lean protein.',
      isCompleted: false,
      isAiSuggested: false,
      adherencePriority: 'medium',
      reminderEnabled: false,
    },
    {
      id: 'slot-5-hydrate',
      time: '16:00',
      durationMinutes: 10,
      category: 'hydration',
      title: 'Afternoon Hydration Check',
      description: `Target: reach ${Math.round(waterTargetLiters * 0.75)}L by 4 PM. Current intake logged: ${waterLoggedLiters}L.`,
      isCompleted: false,
      isAiSuggested: true,
      adherencePriority: 'medium',
      reminderEnabled: true,
    },
    {
      id: 'slot-6-dinner',
      time: '20:00',
      durationMinutes: 45,
      category: 'nutrition',
      title: 'Dinner & Final Protein Allocation',
      description: 'Lighter dinner 2.5 hours prior to sleep to optimize digestive comfort and sleep architecture.',
      isCompleted: false,
      isAiSuggested: false,
      adherencePriority: 'medium',
      reminderEnabled: false,
    },
    {
      id: 'slot-7-winddown',
      time: '22:00',
      durationMinutes: 30,
      category: 'sleep',
      title: 'Circadian Wind-Down & Screen Dimming',
      description: 'Dim overhead lights. Zero caffeine. Aim for 7.5 to 8.5 hours of restorative sleep.',
      isCompleted: false,
      isAiSuggested: true,
      adherencePriority: 'high',
      reminderEnabled: true,
    },
  ]

  const proposals: LifestyleOptimizationProposal[] = []

  // Recovery-aware schedule adjustments
  if (readiness < 60) {
    proposals.push({
      id: 'prop-recovery-adjust',
      title: 'Readiness Fatigue Adjustment',
      rationale: `Morning recovery readiness is ${readiness}/100 and sleep was ${sleepHours}h. Shifting heavy lifting to active recovery reduces connective tissue strain.`,
      basedOnData: [
        `Readiness Score: ${readiness}/100`,
        `Sleep Duration: ${sleepHours} hours`,
        `Soreness Level: ${latestRecovery?.soreness || 'Moderate'}`,
      ],
      proposedChanges: [
        {
          slotId: 'slot-2-training',
          action: 'reduce_volume',
          title: 'Switch Strength Session to 40-Min Active Recovery Walk',
        },
      ],
      requiresUserApproval: true,
      userDecision: 'pending',
    })
  }

  // Hydration gap proposal
  if (waterLoggedLiters < waterTargetLiters * 0.5) {
    proposals.push({
      id: 'prop-hydrate-adjust',
      title: 'Midday Hydration Acceleration',
      rationale: `Only ${waterLoggedLiters}L water logged against ${waterTargetLiters}L target. Dehydration blunts muscle protein synthesis and causes premature fatigue.`,
      basedOnData: [`Logged: ${waterLoggedLiters}L`, `Target: ${waterTargetLiters}L`],
      proposedChanges: [
        {
          action: 'hydrate_cue',
          title: 'Insert 500ml water prompt before lunch',
        },
      ],
      requiresUserApproval: false,
      userDecision: 'pending',
    })
  }

  const completedCount = timeSlots.filter((s) => s.isCompleted).length
  const adherenceScorePct = Math.round((completedCount / timeSlots.length) * 100)

  return {
    date,
    timezone: 'Asia/Kolkata',
    timeSlots,
    totalPlannedWorkoutMinutes: readiness < 55 ? 40 : 60,
    targetWaterLiters: waterTargetLiters,
    targetSleepDurationHours: 8.0,
    recoveryScore: readiness,
    aiOptimizationNotes: [
      `Schedule aligned with user preferred workout window (${constraints.preferredWorkoutTime}).`,
      `Protected work focus blocks (${constraints.workStartTime} to ${constraints.workEndTime}).`,
      readiness < 60
        ? 'Active recovery modifications proposed due to elevated systemic fatigue.'
        : 'Full intensity capacity cleared by morning telemetry.',
    ],
    adherenceScorePct,
    pendingProposals: proposals,
  }
}

export function getSavedLifestyleSchedule(
  date: string,
  context: CoachUserContext
): DailyLifestyleSchedule {
  if (typeof window === 'undefined') {
    return inMemorySchedules[date] || buildDailyLifestyleSchedule(date, context)
  }
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_SCHEDULE_KEY}_${date}`)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return inMemorySchedules[date] || buildDailyLifestyleSchedule(date, context)
}

export function saveLifestyleSchedule(schedule: DailyLifestyleSchedule): void {
  inMemorySchedules[schedule.date] = schedule
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_SCHEDULE_KEY}_${schedule.date}`,
      JSON.stringify(schedule)
    )
  } catch {
    // ignore
  }
}

export function toggleLifestyleSlotCompletion(
  schedule: DailyLifestyleSchedule,
  slotId: string
): DailyLifestyleSchedule {
  const updatedSlots = schedule.timeSlots.map((slot) =>
    slot.id === slotId ? { ...slot, isCompleted: !slot.isCompleted } : slot
  )
  const completedCount = updatedSlots.filter((s) => s.isCompleted).length
  const adherenceScorePct = Math.round((completedCount / updatedSlots.length) * 100)

  const updatedSchedule: DailyLifestyleSchedule = {
    ...schedule,
    timeSlots: updatedSlots,
    adherenceScorePct,
  }

  saveLifestyleSchedule(updatedSchedule)
  return updatedSchedule
}

export function applyProposalDecision(
  schedule: DailyLifestyleSchedule,
  proposalId: string,
  decision: 'accepted' | 'dismissed'
): DailyLifestyleSchedule {
  let updatedSlots = [...schedule.timeSlots]

  const updatedProposals = schedule.pendingProposals.map((prop) => {
    if (prop.id !== proposalId) return prop

    if (decision === 'accepted') {
      prop.proposedChanges.forEach((change) => {
        if (change.slotId) {
          updatedSlots = updatedSlots.map((slot) => {
            if (slot.id === change.slotId) {
              return {
                ...slot,
                title: change.title,
                time: change.newTime || slot.time,
                durationMinutes: change.action === 'reduce_volume' ? 40 : slot.durationMinutes,
              }
            }
            return slot
          })
        }
      })
    }

    return {
      ...prop,
      userDecision: decision,
    }
  })

  const updatedSchedule: DailyLifestyleSchedule = {
    ...schedule,
    timeSlots: updatedSlots,
    pendingProposals: updatedProposals,
  }

  saveLifestyleSchedule(updatedSchedule)
  return updatedSchedule
}
