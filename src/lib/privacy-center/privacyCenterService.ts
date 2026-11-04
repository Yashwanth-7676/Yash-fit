import type {
  DataCategoryAudit,
  ActiveSessionInfo,
  SecurityEvent,
  PrivacyPreferences,
  SecurityOverview,
} from '../../types/privacyCenter'

export const LOCAL_STORAGE_PRIVACY_PREFS_KEY = 'yashfit_privacy_preferences'
export const LOCAL_STORAGE_SECURITY_EVENTS_KEY = 'yashfit_security_events'
export const LOCAL_STORAGE_SESSIONS_KEY = 'yashfit_active_sessions'

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  profileVisibility: 'public',
  shareWorkoutActivity: true,
  anonymousInLeaderboards: false,
  trainerAccessAllowed: true,
  encryptProgressPhotos: true,
  aiDataProcessingAllowed: true,
}

export const SEED_SESSIONS: ActiveSessionInfo[] = [
  {
    id: 'sess-current',
    device: 'Desktop Workstation (Windows 11)',
    browser: 'Chrome 131.0',
    location: 'Bengaluru, India',
    lastActive: 'Active Now',
    isCurrent: true,
  },
  {
    id: 'sess-mobile',
    device: 'iPhone 15 Pro (iOS 18)',
    browser: 'Mobile Safari',
    location: 'Bengaluru, India',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
]

export const SEED_SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: 'sec-01',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventType: 'login',
    description: 'Successful authenticated login via email credentials.',
    severity: 'info',
  },
  {
    id: 'sec-02',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    eventType: 'permission_change',
    description: 'Updated trainer data-sharing consent scopes.',
    severity: 'info',
  },
]

let inMemoryPrefs = { ...DEFAULT_PRIVACY_PREFERENCES }
let inMemorySessions = [...SEED_SESSIONS]
let inMemoryEvents = [...SEED_SECURITY_EVENTS]

export function getPrivacyPreferences(): PrivacyPreferences {
  if (typeof window === 'undefined') return inMemoryPrefs
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PRIVACY_PREFS_KEY)
    if (raw) return { ...DEFAULT_PRIVACY_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    // fallback
  }
  return inMemoryPrefs
}

export function savePrivacyPreferences(prefs: PrivacyPreferences): void {
  inMemoryPrefs = prefs
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_PRIVACY_PREFS_KEY, JSON.stringify(prefs))
    } catch {
      // ignore
    }
  }
}

export function getDataCategoriesAudit(): DataCategoryAudit[] {
  let workoutsCount = 14
  let recoveryCount = 8
  let scannedMealsCount = 4

  if (typeof window !== 'undefined') {
    try {
      const rawW = localStorage.getItem('yashfit_completed_workouts')
      if (rawW) workoutsCount = JSON.parse(rawW).length
      const rawR = localStorage.getItem('yashfit_recovery_entries')
      if (rawR) recoveryCount = JSON.parse(rawR).length
      const rawM = localStorage.getItem('yashfit_scanned_meals_history')
      if (rawM) scannedMealsCount = JSON.parse(rawM).length
    } catch {
      // fallback
    }
  }

  return [
    {
      key: 'auth_identity',
      name: 'Authentication & Account Identity',
      recordsCount: 1,
      purpose: 'Account authorization, login verification and profile security.',
      retentionPeriod: 'Until account deletion request.',
      isSensitive: true,
    },
    {
      key: 'physical_profile',
      name: 'Biometrics & Body Composition',
      recordsCount: 6,
      purpose: 'Calculate basal metabolic rate, macro targets, and 1RM strength ratios.',
      retentionPeriod: 'Retained for longitudinal transformation trends.',
      isSensitive: true,
    },
    {
      key: 'workout_telemetry',
      name: 'Workout Logs & Strength Tonnage',
      recordsCount: workoutsCount,
      purpose: 'Track progressive overload, calculate Arena scores, and Autopilot deload triggers.',
      retentionPeriod: 'Persistent audit trail.',
      isSensitive: false,
    },
    {
      key: 'recovery_sleep',
      name: 'Recovery & Neuromuscular Readiness',
      recordsCount: recoveryCount,
      purpose: 'Assess central nervous system fatigue to modify daily training volume.',
      retentionPeriod: '365 days rolling history.',
      isSensitive: false,
    },
    {
      key: 'nutrition_meals',
      name: 'Meal Photos & Food Vision Scans',
      recordsCount: scannedMealsCount,
      purpose: 'Calculate caloric intake, macro density, and regional grocery checklists.',
      retentionPeriod: 'Retained until deleted by user.',
      isSensitive: false,
    },
    {
      key: 'trainer_collaboration',
      name: 'Coaching Consents & Private Notes',
      recordsCount: 2,
      purpose: 'Governs role-based access for trainer program prescription.',
      retentionPeriod: 'Instantly purged upon revoking coach authorization.',
      isSensitive: true,
    },
  ]
}

export function getSecurityOverview(): SecurityOverview {
  let sessions = inMemorySessions
  let events = inMemoryEvents

  if (typeof window !== 'undefined') {
    try {
      const rawS = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY)
      if (rawS) sessions = JSON.parse(rawS)
      const rawE = localStorage.getItem(LOCAL_STORAGE_SECURITY_EVENTS_KEY)
      if (rawE) events = JSON.parse(rawE)
    } catch {
      // fallback
    }
  }

  return {
    securityScore: 92,
    passwordAgeDays: 24,
    twoFactorEnabled: false,
    activeSessions: sessions,
    recentSecurityEvents: events,
    lastDataExportTimestamp: undefined,
  }
}

export function terminateActiveSession(sessionId: string): ActiveSessionInfo[] {
  const sessions = inMemorySessions.filter((s) => s.id !== sessionId)
  inMemorySessions = sessions

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions))
    } catch {
      // ignore
    }
  }

  recordSecurityEvent('session_terminated', `Terminated active session: ${sessionId}`, 'warning')
  return sessions
}

export function recordSecurityEvent(
  eventType: SecurityEvent['eventType'],
  description: string,
  severity: SecurityEvent['severity'] = 'info'
): void {
  const newEvent: SecurityEvent = {
    id: `sec-${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventType,
    description,
    severity,
  }

  inMemoryEvents = [newEvent, ...inMemoryEvents]

  if (typeof window !== 'undefined') {
    try {
      const current = getSecurityOverview().recentSecurityEvents
      localStorage.setItem(
        LOCAL_STORAGE_SECURITY_EVENTS_KEY,
        JSON.stringify([newEvent, ...current])
      )
    } catch {
      // ignore
    }
  }
}

export function buildFullDataExport(): Record<string, unknown> {
  const exportPayload: Record<string, unknown> = {
    exportMetadata: {
      platform: 'YashFit Personal Fitness Operating System',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      gdprCompliance: 'Article 20 Data Portability Certified',
    },
    privacyPreferences: getPrivacyPreferences(),
    dataCategoriesAudit: getDataCategoriesAudit(),
  }

  if (typeof window !== 'undefined') {
    const keys = [
      'yashfit_completed_workouts',
      'yashfit_recovery_entries',
      'yashfit_scanned_meals_history',
      'yashfit_smart_grocery_plan',
      'yashfit_trainer_clients',
      'yashfit_lifestyle_schedule',
    ]

    keys.forEach((k) => {
      try {
        const val = localStorage.getItem(k)
        if (val) exportPayload[k] = JSON.parse(val)
      } catch {
        // ignore
      }
    })
  }

  recordSecurityEvent('export', 'Exported comprehensive personal fitness telemetry archive in JSON format.', 'info')
  return exportPayload
}

export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  if (typeof window === 'undefined') return
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function executeAccountPurge(): void {
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('yashfit_')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  }
}

