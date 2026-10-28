export type WearableProviderId =
  | 'apple_health'
  | 'google_health_connect'
  | 'fitbit'
  | 'garmin'
  | 'whoop'
  | 'oura'
  | 'strava'

export type WearableConnectionStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'pending_auth'

export type WearableCategory = 'mobile_os' | 'smartwatch' | 'band' | 'ring' | 'gps'

export interface WearableProviderInfo {
  id: WearableProviderId
  name: string
  category: WearableCategory
  icon: string
  description: string
  supportedMetrics: ('steps' | 'resting_hr' | 'sleep' | 'active_calories' | 'workouts')[]
  authType: 'oauth' | 'file_export' | 'mobile_sdk'
  status: WearableConnectionStatus
  connectionInstructions: string[]
  envRequired?: string[]
  isConfiguredOnServer: boolean
  lastSyncAt?: string
  rateLimitStatus?: {
    callsRemaining: number
    resetTime: string
  }
}

export interface WearableDailyMetric {
  date: string
  provider: WearableProviderId
  steps?: number
  restingHeartRate?: number
  sleepHours?: number
  activeCalories?: number
  sourceLabel: string
  importedAt: string
}

export interface WearableImportResult {
  success: boolean
  provider: WearableProviderId
  recordsCount: number
  importedDays: number
  message: string
  errors?: string[]
}
