export interface DataCategoryAudit {
  key: string
  name: string
  recordsCount: number
  purpose: string
  retentionPeriod: string
  isSensitive: boolean
}

export interface ActiveSessionInfo {
  id: string
  device: string
  browser: string
  location: string
  lastActive: string
  isCurrent: boolean
}

export interface SecurityEvent {
  id: string
  timestamp: string
  eventType: 'login' | 'export' | 'permission_change' | 'password_update' | 'session_terminated'
  description: string
  severity: 'info' | 'warning' | 'security'
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends_only' | 'private'
  shareWorkoutActivity: boolean
  anonymousInLeaderboards: boolean
  trainerAccessAllowed: boolean
  encryptProgressPhotos: boolean
  aiDataProcessingAllowed: boolean
}

export interface SecurityOverview {
  securityScore: number // 0 to 100
  passwordAgeDays: number
  twoFactorEnabled: boolean
  activeSessions: ActiveSessionInfo[]
  recentSecurityEvents: SecurityEvent[]
  lastDataExportTimestamp?: string
}

