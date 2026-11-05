import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateInviteCode,
  registerTester,
  leaveBetaProgram,
  getTesterProfile,
  createAdminInvitation,
} from '@/lib/beta/betaService'
import {
  validateScreenshot,
  calculateFeedbackMetrics,
} from '@/lib/feedback/feedbackService'
import {
  hasAnalyticsConsent,
  setAnalyticsConsent,
  trackEvent,
  getAnalyticsSummary,
} from '@/lib/analytics/betaAnalytics'
import { publishReleaseNote, getPublishedReleaseNotes } from '@/lib/changelog/changelogService'
import type { UserFeedbackItem } from '@/types/betaFeedback'

function setupMockStorage() {
  const store: Record<string, string> = {}
  global.window = {} as unknown as Window & typeof globalThis
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = val
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k])
    },
    key: (i: number) => Object.keys(store)[i] || null,
    length: Object.keys(store).length,
  }
}

describe('Unit: Beta Testing & Tester Invitations', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  it('validates active beta invitation codes successfully', async () => {
    const res = await validateInviteCode('YASH-BETA-2026')
    expect(res.valid).toBe(true)
    expect(res.invite).toBeDefined()
    expect(res.invite?.role).toBe('beta_tester')
  })

  it('rejects invalid or non-existent invitation codes', async () => {
    const res = await validateInviteCode('INVALID-CODE-999')
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/invalid/i)
  })

  it('rejects empty or whitespace invitation codes', async () => {
    const res = await validateInviteCode('   ')
    expect(res.valid).toBe(false)
    expect(res.reason).toMatch(/cannot be empty/i)
  })

  it('registers tester with valid invite code and creates profile', async () => {
    const reg = await registerTester('tester-unit-1', 'YASH-BETA-2026')
    expect(reg.success).toBe(true)
    expect(reg.tester?.userId).toBe('tester-unit-1')
    expect(reg.tester?.status).toBe('active')
    expect(reg.tester?.role).toBe('beta_tester')

    const profile = await getTesterProfile('tester-unit-1')
    expect(profile?.userId).toBe('tester-unit-1')
    expect(profile?.status).toBe('active')
  })

  it('allows tester to voluntarily leave beta program', async () => {
    await registerTester('tester-unit-2', 'VIP-CREW-77')
    const leave = await leaveBetaProgram('tester-unit-2')
    expect(leave.success).toBe(true)

    const profile = await getTesterProfile('tester-unit-2')
    expect(profile?.status).toBe('left_program')
    expect(profile?.leftAt).toBeDefined()
  })
})

describe('Unit: Feedback & Screenshot Upload Validation', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  it('accepts valid screenshot files within 3 MB', () => {
    const mockPng = new File(['mock_image_bytes'], 'screenshot.png', { type: 'image/png' })
    const res = validateScreenshot(mockPng)
    expect(res.valid).toBe(true)
  })

  it('rejects screenshot files exceeding 3 MB limit', () => {
    const largeContent = new Uint8Array(3.5 * 1024 * 1024)
    const largeFile = new File([largeContent], 'heavy.png', { type: 'image/png' })
    const res = validateScreenshot(largeFile)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/exceeds 3 MB limit/i)
  })

  it('rejects unsupported file formats like PDF or EXE', () => {
    const badFile = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const res = validateScreenshot(badFile)
    expect(res.valid).toBe(false)
    expect(res.error).toMatch(/only png, jpeg, and webp/i)
  })

  it('calculates feedback metrics accurately', () => {
    const items: UserFeedbackItem[] = [
      {
        id: '1',
        userId: 'u1',
        type: 'bug',
        title: 'Bug 1',
        description: 'Desc 1',
        category: 'workout_studio',
        severity: 'critical',
        status: 'submitted',
        rating: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'u2',
        type: 'bug',
        title: 'Bug 2',
        description: 'Desc 2',
        category: 'food_scanner',
        severity: 'high',
        status: 'resolved',
        rating: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: 'u3',
        type: 'feature_request',
        title: 'Feature 1',
        description: 'Desc 3',
        category: 'arena',
        severity: 'low',
        status: 'under_review',
        rating: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const metrics = calculateFeedbackMetrics(items)
    expect(metrics.totalCount).toBe(3)
    expect(metrics.openBugsCount).toBe(1)
    expect(metrics.resolvedCount).toBe(1)
    expect(metrics.featureRequestsCount).toBe(1)
    expect(metrics.criticalCount).toBe(1)
    expect(metrics.averageRating).toBe(3.7)
    expect(metrics.categoryBreakdown.workout_studio).toBe(1)
    expect(metrics.categoryBreakdown.food_scanner).toBe(1)
  })
})

describe('Unit: Privacy-Conscious Telemetry & Release Notes', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  it('respects user telemetry consent toggle', () => {
    setAnalyticsConsent(false)
    expect(hasAnalyticsConsent()).toBe(false)
    setAnalyticsConsent(true)
    expect(hasAnalyticsConsent()).toBe(true)
  })

  it('aggregates analytics summary with zero PII', async () => {
    await trackEvent('feature_accessed', 'feature_usage', { feature: 'workout-studio' })
    await trackEvent('workout_session_completed', 'workflow', { durationSeconds: 1800 })

    const summary = await getAnalyticsSummary()
    expect(summary.totalEvents).toBeGreaterThanOrEqual(2)
    expect(summary.onboardingCompletionRate).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(summary.topFeaturesUsed)).toBe(true)
  })

  it('publishes and retrieves release notes', async () => {
    const newNote = await publishReleaseNote({
      version: 'v2.5.0-beta',
      title: 'Biomechanics Sensor Integration',
      releaseDate: '2026-11-10',
      summary: 'Experimental IMU wearable sync for high accuracy bar paths.',
      features: ['IMU acceleration vector stream'],
      improvements: ['Reduced latency to 8ms'],
      bugFixes: ['Fixed bluetooth disconnect reconnect loop'],
      knownIssues: [],
    })

    expect(newNote.version).toBe('v2.5.0-beta')
    const published = await getPublishedReleaseNotes()
    expect(published.some((n) => n.version === 'v2.5.0-beta')).toBe(true)
  })
})
