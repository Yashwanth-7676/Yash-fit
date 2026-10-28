import type {
  WearableProviderId,
  WearableProviderInfo,
  WearableDailyMetric,
  WearableImportResult,
} from '../../types/wearables'

const STORAGE_KEYS = {
  CONNECTIONS: 'yashfit_wearable_connections',
  METRICS: 'yashfit_wearable_metrics',
}

const inMemoryStorage = new Map<string, string>()

function getStoredItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key)
  }
  return inMemoryStorage.get(key) ?? null
}

function setStoredItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  }
  inMemoryStorage.set(key, value)
}

function removeStoredItem(key: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
  inMemoryStorage.delete(key)
}

export const SUPPORTED_PROVIDERS: WearableProviderInfo[] = [
  {
    id: 'apple_health',
    name: 'Apple Health',
    category: 'mobile_os',
    icon: '🍎',
    description: 'Import workout minutes, step counts, resting HR, and sleep stages from iOS HealthKit.',
    supportedMetrics: ['steps', 'resting_hr', 'sleep', 'active_calories', 'workouts'],
    authType: 'file_export',
    status: 'disconnected',
    isConfiguredOnServer: true,
    connectionInstructions: [
      'Open the Health app on your iPhone.',
      'Tap your profile icon in the top right corner.',
      'Tap "Export All Health Data" and save the export file.',
      'Upload the exported JSON or XML below to import your real health telemetry into YashFit.',
    ],
  },
  {
    id: 'google_health_connect',
    name: 'Google Health Connect',
    category: 'mobile_os',
    icon: '🟢',
    description: 'Sync on-device health data across Android apps and Pixel Watch / Galaxy Watch.',
    supportedMetrics: ['steps', 'resting_hr', 'sleep', 'active_calories', 'workouts'],
    authType: 'file_export',
    status: 'disconnected',
    isConfiguredOnServer: true,
    connectionInstructions: [
      'Open Health Connect settings on your Android device.',
      'Export your activity and sleep history or connect a supported Health Connect sync bridge.',
      'Upload the exported metrics file directly into YashFit.',
    ],
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    category: 'smartwatch',
    icon: '⌚',
    description: 'Direct REST API sync for Fitbit Charge, Sense, and Versa devices.',
    supportedMetrics: ['steps', 'resting_hr', 'sleep', 'active_calories'],
    authType: 'oauth',
    status: 'disconnected',
    envRequired: ['FITBIT_CLIENT_ID', 'FITBIT_CLIENT_SECRET'],
    isConfiguredOnServer: false,
    connectionInstructions: [
      'Register an application in dev.fitbit.com to obtain OAuth Client ID and Secret.',
      'Add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to your environment variables.',
      'Authenticate with Fitbit to enable automatic daily background polling.',
    ],
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    category: 'smartwatch',
    icon: '🧭',
    description: 'Enterprise sync for Garmin Forerunner, Fenix, and Venu wearables.',
    supportedMetrics: ['steps', 'resting_hr', 'sleep', 'active_calories', 'workouts'],
    authType: 'oauth',
    status: 'disconnected',
    envRequired: ['GARMIN_CONSUMER_KEY', 'GARMIN_CONSUMER_SECRET'],
    isConfiguredOnServer: false,
    connectionInstructions: [
      'Garmin Health API requires a partner developer account.',
      'Add GARMIN_CONSUMER_KEY to your environment variables or export FIT/GPX activity files directly.',
    ],
  },
  {
    id: 'whoop',
    name: 'WHOOP 4.0',
    category: 'band',
    icon: '🖤',
    description: 'Physiological strain, recovery scores, HRV, and sleep performance tracking.',
    supportedMetrics: ['resting_hr', 'sleep', 'active_calories', 'workouts'],
    authType: 'oauth',
    status: 'disconnected',
    envRequired: ['WHOOP_CLIENT_ID', 'WHOOP_CLIENT_SECRET'],
    isConfiguredOnServer: false,
    connectionInstructions: [
      'Create a developer app at developer.whoop.com.',
      'Set WHOOP_CLIENT_ID in your configuration to pull strain and sleep data.',
    ],
  },
  {
    id: 'oura',
    name: 'Oura Ring Gen3',
    category: 'ring',
    icon: '💍',
    description: 'Overnight resting heart rate, sleep stages, temperature trends, and readiness.',
    supportedMetrics: ['resting_hr', 'sleep'],
    authType: 'oauth',
    status: 'disconnected',
    envRequired: ['OURA_PERSONAL_ACCESS_TOKEN'],
    isConfiguredOnServer: false,
    connectionInstructions: [
      'Generate a Personal Access Token from cloud.ouraring.com/personal-access-tokens.',
      'Enter your token in YashFit settings to sync overnight sleep records.',
    ],
  },
  {
    id: 'strava',
    name: 'Strava',
    category: 'gps',
    icon: '🏃',
    description: 'Outdoor cardio sessions, GPS distance, elevation gain, and active energy.',
    supportedMetrics: ['active_calories', 'workouts'],
    authType: 'oauth',
    status: 'disconnected',
    envRequired: ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET'],
    isConfiguredOnServer: false,
    connectionInstructions: [
      'Create an API Application at strava.com/settings/api.',
      'Connect your Strava account to automatically sync runs, cycling, and hikes.',
    ],
  },
]

export function getWearableProviders(): WearableProviderInfo[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.CONNECTIONS)
    if (raw) {
      const saved = JSON.parse(raw) as Record<string, Partial<WearableProviderInfo>>
      return SUPPORTED_PROVIDERS.map((p) => ({
        ...p,
        status: saved[p.id]?.status ?? p.status,
        lastSyncAt: saved[p.id]?.lastSyncAt ?? p.lastSyncAt,
      }))
    }
  } catch {
    // fallback
  }
  return SUPPORTED_PROVIDERS
}

export function saveWearableStatus(providerId: WearableProviderId, status: WearableProviderInfo['status']): void {
  try {
    const current = getWearableProviders()
    const map: Record<string, Partial<WearableProviderInfo>> = {}
    current.forEach((p) => {
      map[p.id] = {
        status: p.id === providerId ? status : p.status,
        lastSyncAt: p.id === providerId && status === 'connected' ? new Date().toISOString() : p.lastSyncAt,
      }
    })
    setStoredItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function disconnectWearable(providerId: WearableProviderId): void {
  saveWearableStatus(providerId, 'disconnected')
}

export function getWearableMetrics(): WearableDailyMetric[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.METRICS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return []
}

export function saveWearableMetrics(metrics: WearableDailyMetric[]): void {
  setStoredItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics))
}

export function clearWearableMetrics(): void {
  removeStoredItem(STORAGE_KEYS.METRICS)
}

/**
 * Deterministic parser for imported health export data (JSON or CSV).
 * Extracts real recorded steps, resting HR, and sleep without fabricating fake points.
 */
export function parseHealthExportData(
  rawText: string,
  provider: WearableProviderId
): WearableImportResult {
  const errors: string[] = []
  const newMetrics: WearableDailyMetric[] = []
  const now = new Date().toISOString()

  try {
    // Attempt JSON parse first
    if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
      const parsed = JSON.parse(rawText)
      const list = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [parsed]

      list.forEach((entryRecord: unknown, index: number) => {
        const entry = (entryRecord && typeof entryRecord === 'object' ? entryRecord : {}) as Record<string, unknown>
        const dateRaw = entry.date || entry.day || entry.recordedAt || entry.timestamp
        const dateStr = typeof dateRaw === 'string' ? dateRaw : ''
        if (!dateStr || !Number.isFinite(Date.parse(dateStr))) {
          errors.push(`Record #${index + 1} skipped: missing or invalid date.`)
          return
        }

        const date = new Date(dateStr).toISOString().slice(0, 10)
        const steps = Number(entry.steps || entry.step_count || entry.stepCount)
        const restingHeartRate = Number(entry.restingHeartRate || entry.resting_hr || entry.heart_rate)
        const sleepHours = Number(entry.sleepHours || entry.sleep_hours || (typeof entry.sleepMinutes === 'number' ? entry.sleepMinutes / 60 : undefined))
        const activeCalories = Number(entry.activeCalories || entry.calories)

        newMetrics.push({
          date,
          provider,
          steps: Number.isFinite(steps) && steps > 0 ? Math.round(steps) : undefined,
          restingHeartRate: Number.isFinite(restingHeartRate) && restingHeartRate > 30 && restingHeartRate < 220 ? Math.round(restingHeartRate) : undefined,
          sleepHours: Number.isFinite(sleepHours) && sleepHours > 0 && sleepHours <= 24 ? Math.round(sleepHours * 10) / 10 : undefined,
          activeCalories: Number.isFinite(activeCalories) && activeCalories > 0 ? Math.round(activeCalories) : undefined,
          sourceLabel: `${provider.replace('_', ' ').toUpperCase()} Import`,
          importedAt: now,
        })
      })
    } else {
      // Attempt CSV parse
      const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) {
        return {
          success: false,
          provider,
          recordsCount: 0,
          importedDays: 0,
          message: 'The file contains insufficient rows. Expected CSV header and data rows.',
          errors: ['Empty or single-row file.'],
        }
      }

      const headers = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))
      const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time') || h.includes('day'))
      const stepsIdx = headers.findIndex((h) => h.includes('step'))
      const hrIdx = headers.findIndex((h) => h.includes('heart') || h.includes('pulse') || h.includes('hr'))
      const sleepIdx = headers.findIndex((h) => h.includes('sleep'))
      const calIdx = headers.findIndex((h) => h.includes('cal'))

      if (dateIdx === -1) {
        return {
          success: false,
          provider,
          recordsCount: 0,
          importedDays: 0,
          message: 'CSV header missing "date" column.',
          errors: ['No date column found.'],
        }
      }

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''))
        const dateStr = parts[dateIdx]
        if (!dateStr || !Number.isFinite(Date.parse(dateStr))) continue

        const date = new Date(dateStr).toISOString().slice(0, 10)
        const steps = stepsIdx >= 0 ? Number(parts[stepsIdx]) : undefined
        const hr = hrIdx >= 0 ? Number(parts[hrIdx]) : undefined
        const sleep = sleepIdx >= 0 ? Number(parts[sleepIdx]) : undefined
        const cal = calIdx >= 0 ? Number(parts[calIdx]) : undefined

        newMetrics.push({
          date,
          provider,
          steps: steps && Number.isFinite(steps) && steps > 0 ? Math.round(steps) : undefined,
          restingHeartRate: hr && Number.isFinite(hr) && hr > 30 && hr < 220 ? Math.round(hr) : undefined,
          sleepHours: sleep && Number.isFinite(sleep) && sleep > 0 && sleep <= 24 ? Math.round(sleep * 10) / 10 : undefined,
          activeCalories: cal && Number.isFinite(cal) && cal > 0 ? Math.round(cal) : undefined,
          sourceLabel: `${provider.replace('_', ' ').toUpperCase()} CSV`,
          importedAt: now,
        })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      provider,
      recordsCount: 0,
      importedDays: 0,
      message: `Failed to parse file: ${message}`,
      errors: [message],
    }
  }

  if (newMetrics.length === 0) {
    return {
      success: false,
      provider,
      recordsCount: 0,
      importedDays: 0,
      message: 'No valid metric entries could be extracted from the file.',
      errors: errors.length ? errors : ['No parsable date-metric rows found.'],
    }
  }

  // Merge into existing metrics by date
  const current = getWearableMetrics()
  const byDate = new Map<string, WearableDailyMetric>()
  current.forEach((m) => byDate.set(`${m.date}_${m.provider}`, m))
  newMetrics.forEach((m) => byDate.set(`${m.date}_${m.provider}`, m))
  const merged = Array.from(byDate.values()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))

  saveWearableMetrics(merged)
  saveWearableStatus(provider, 'connected')

  return {
    success: true,
    provider,
    recordsCount: newMetrics.length,
    importedDays: new Set(newMetrics.map((m) => m.date)).size,
    message: `Successfully imported ${newMetrics.length} health telemetry records across ${new Set(newMetrics.map((m) => m.date)).size} days!`,
  }
}
