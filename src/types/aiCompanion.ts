export type CompanionPersonaStyle = 'encouraging' | 'disciplined' | 'scientific'

export interface CompanionMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  relatedTopic?: 'workout' | 'nutrition' | 'recovery' | 'goal' | 'general'
  groundedFacts?: string[]
}

export interface CompanionUserContext {
  currentWeightKg: number
  targetWeightKg: number
  recentWorkoutsCount: number
  lastWorkoutName?: string
  lastWorkoutDate?: string
  readinessScore?: number
  dietaryPreference: string
  targetCalories: number
  targetProtein: number
}

export interface DailyCheckInStatus {
  todayTrained: boolean
  nutritionLogged: boolean
  recoveryRecorded: boolean
  streakDays: number
}

export interface CompanionChatRequest {
  message: string
  persona: CompanionPersonaStyle
  context: CompanionUserContext
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
}

export interface CompanionChatResponse {
  reply: string
  personaUsed: CompanionPersonaStyle
  groundedFacts: string[]
  isAiGenerated: boolean
}

