export type TimeSlotCategory =
  | 'workout'
  | 'nutrition'
  | 'hydration'
  | 'sleep'
  | 'recovery'
  | 'work_commitment'
  | 'mindfulness'

export interface LifestyleTimeSlot {
  id: string
  time: string // e.g. "06:30"
  durationMinutes: number
  category: TimeSlotCategory
  title: string
  description: string
  isCompleted: boolean
  isAiSuggested: boolean
  adherencePriority: 'high' | 'medium' | 'low'
  reminderEnabled: boolean
}

export interface UserTimeConstraint {
  id: string
  dayOfWeek: number // 0 (Sun) to 6 (Sat)
  workStartTime: string // e.g. "09:00"
  workEndTime: string // e.g. "17:30"
  preferredWorkoutTime: 'morning' | 'afternoon' | 'evening'
  busyPeriods: { start: string; end: string; title: string }[]
}

export interface LifestyleOptimizationProposal {
  id: string
  title: string
  rationale: string
  basedOnData: string[]
  proposedChanges: {
    slotId?: string
    action: 'reschedule' | 'reduce_volume' | 'insert_rest' | 'hydrate_cue'
    originalTime?: string
    newTime?: string
    title: string
  }[]
  requiresUserApproval: boolean
  userDecision: 'pending' | 'accepted' | 'dismissed'
}

export interface DailyLifestyleSchedule {
  date: string // YYYY-MM-DD
  timezone: string
  timeSlots: LifestyleTimeSlot[]
  totalPlannedWorkoutMinutes: number
  targetWaterLiters: number
  targetSleepDurationHours: number
  recoveryScore?: number
  aiOptimizationNotes: string[]
  adherenceScorePct: number
  pendingProposals: LifestyleOptimizationProposal[]
}

