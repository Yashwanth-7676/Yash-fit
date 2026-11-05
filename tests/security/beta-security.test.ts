import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { isUserAdmin, registerTester } from '@/lib/beta/betaService'
import { submitFeedback } from '@/lib/feedback/feedbackService'
import { trackEvent } from '@/lib/analytics/betaAnalytics'

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

describe('Security: Beta & Feedback Access Boundaries', () => {
  beforeEach(() => {
    setupMockStorage()
  })

  it('restricts admin privileges from standard beta testers', async () => {
    // Register as standard beta tester
    await registerTester('standard-user', 'YASH-BETA-2026')
    const isAdmin = await isUserAdmin('standard-user')
    expect(isAdmin).toBe(false)
  })

  it('grants admin privileges only to users registered with admin invitation codes', async () => {
    await registerTester('staff-admin-user', 'ADMIN-MASTER-YASH')
    const isAdmin = await isUserAdmin('staff-admin-user')
    expect(isAdmin).toBe(true)
  })

  it('strictly scrubs PII and health biomarkers from product telemetry events', async () => {
    // Track an event with contaminated sensitive parameters
    await trackEvent('feature_accessed', 'feature_usage', {
      feature: 'food-scanner',
      password: 'superSecretPassword123!',
      userEmail: 'private@athlete.com',
      weight_kg: 74.5,
      bodyFatPercent: 14.2,
      healthBiomarker: 'glucose_normal',
      renderDurationMs: 14,
    })

    const raw = localStorage.getItem('yashfit_analytics_events')
    expect(raw).toBeDefined()
    const events = JSON.parse(raw || '[]')
    const recorded = events[0]

    // Safe operational parameters must be preserved
    expect(recorded.metadata.feature).toBe('food-scanner')
    expect(recorded.metadata.renderDurationMs).toBe(14)

    // Prohibited parameters must NOT exist in the serialized telemetry payload
    expect(recorded.metadata.password).toBeUndefined()
    expect(recorded.metadata.userEmail).toBeUndefined()
    expect(recorded.metadata.weight_kg).toBeUndefined()
    expect(recorded.metadata.bodyFatPercent).toBeUndefined()
    expect(recorded.metadata.healthBiomarker).toBeUndefined()
  })

  it('enforces rate limiting on rapid repeated feedback submissions', async () => {
    const userId = 'spammer-bot-01'

    // Submit 5 valid tickets
    for (let i = 1; i <= 5; i++) {
      await submitFeedback({
        userId,
        type: 'bug',
        title: `Rapid Bug Ticket #${i}`,
        description: `This is legitimate descriptive text for submission #${i}.`,
        category: 'workout_studio',
      })
    }

    // The 6th submission within 10 minutes must be rejected by rate limiter
    await expect(
      submitFeedback({
        userId,
        type: 'bug',
        title: 'Rapid Bug Ticket #6 (Should be blocked)',
        description: 'This is the 6th rapid submission that exceeds the rate limit threshold.',
        category: 'workout_studio',
      })
    ).rejects.toThrow(/Rate limit reached/i)
  })

  it('verifies RLS policies are enforced on all 5 Upgrade #39 database tables in schema.sql', () => {
    const schemaPath = path.resolve(process.cwd(), 'supabase/schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')

    const newTables = [
      'beta_invitations',
      'beta_testers',
      'user_feedback',
      'product_analytics_events',
      'release_notes',
    ]

    for (const table of newTables) {
      // Must have ENABLE ROW LEVEL SECURITY
      const rlsRegex = new RegExp(`ALTER TABLE (?:public\\.)?${table} ENABLE ROW LEVEL SECURITY`, 'i')
      expect(sql).toMatch(rlsRegex)

      // Must have CREATE POLICY
      const policyRegex = new RegExp(`CREATE POLICY [^;]+ ON (?:public\\.)?${table}`, 'i')
      expect(sql).toMatch(policyRegex)
    }
  })
})
