import type { StructuredCoachResponse } from './commandCenter'

export interface VirtualCoachMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  metadata?: Partial<StructuredCoachResponse> & {
    provider?: 'gemini' | 'openai' | 'rule_based'
    quickActions?: { label: string; href: string }[]
    audioSpoken?: boolean
    topicCategory?: 'workout' | 'nutrition' | 'recovery' | 'biomechanics' | 'performance' | 'general'
  }
}

export interface VirtualCoachDailyGuidance {
  date: string
  readinessSummary: string
  readinessScore: number | null
  recommendedWorkoutName: string
  recommendedSplit: string
  suggestedFocusCues: string[]
  nutritionAdvice: string
  recoveryAlerts: string[]
  suggestedQuickActions: { label: string; href: string }[]
}

export interface VoiceInstructionConfig {
  speechRate: number // 0.75 to 1.5, default 1.0
  pitch: number // 0.8 to 1.2, default 1.0
  autoSpeak: boolean
  isMuted: boolean
  recognitionLanguage: string // 'en-US' or 'en-IN'
}

export interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  recognitionSupported: boolean
  synthesisSupported: boolean
  permissionState: 'granted' | 'denied' | 'prompt' | 'unsupported'
  errorMessage?: string | null
}

