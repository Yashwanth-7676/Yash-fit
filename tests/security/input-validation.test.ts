import { describe, it, expect } from 'vitest'
import { validateProfileData } from '@/lib/validation/profileValidation'
import { exportMeasurementsToCsv } from '@/lib/transformation/transformationService'
import type { BodyMeasurementEntry } from '@/types/transformation'

describe('Security: Input Validation, XSS Neutralization & Injection Defense', () => {
  it('sanitizes and safely handles script tags and HTML injection in measurement notes', () => {
    const maliciousEntry: BodyMeasurementEntry = {
      id: 'sec-1',
      userId: 'test-sec-user',
      recordedDate: '2026-11-05',
      weightKg: 75.0,
      notes: '<script>alert("XSS")</script><img src=x onerror=alert(1)>',
    }

    const csv = exportMeasurementsToCsv([maliciousEntry])
    // Ensure properly escaped in quotes, does not break CSV delimiters
    expect(csv).toContain('"<script>alert(""XSS"")</script><img src=x onerror=alert(1)>"')
  })

  it('rejects SQL injection payloads submitted in profile text fields', () => {
    const sqlInjectionAttempts = [
      "'; DROP TABLE profiles; --",
      "' OR '1'='1",
      "admin'--",
      "1; SELECT * FROM users;",
    ]

    sqlInjectionAttempts.forEach((attempt) => {
      // Validate that attempting SQL injection in primary_goal or experience_level fails domain validation
      const result = validateProfileData({
        first_name: attempt,
        age: 25,
        height_cm: 180,
        weight_kg: 80,
        // @ts-expect-error Testing injection
        primary_goal: attempt,
      })
      expect(result.isValid).toBe(false)
      expect(result.errors.primary_goal).toBeDefined()
    })
  })

  it('rejects extreme overflow and underflow numbers in numerical fields', () => {
    const overflowAttempts = [
      { age: Number.MAX_SAFE_INTEGER },
      { height_cm: 1e10 },
      { weight_kg: -999999 },
      { training_days_per_week: 100 },
    ]

    overflowAttempts.forEach((attempt) => {
      const result = validateProfileData({
        first_name: 'SafeUser',
        ...attempt,
      })
      expect(result.isValid).toBe(false)
    })
  })
})
