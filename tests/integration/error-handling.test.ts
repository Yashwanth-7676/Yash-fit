import { describe, it, expect } from 'vitest'
import { parseTargetRepBounds } from '@/lib/autopilot/autopilotEngine'
import { calculateReadinessScore } from '@/lib/recoveryCalculator'
import { calculateMacroTargets } from '@/lib/nutritionCalculator'
import type { SorenessLevel, EnergyRating, StressLevel } from '@/types/recovery'

describe('Integration: Error Handling & Boundary Defense', () => {
  it('safely parses malformed rep strings without unhandled exceptions', () => {
    // Malformed strings that could cause NaN or regex crashes
    const weirdInputs = [
      '',
      '   ',
      'abc',
      '--12',
      '12-8', // inverted range
      '10-20-30',
      'null',
      'undefined',
      'NaN',
    ]

    weirdInputs.forEach((input) => {
      expect(() => {
        const bounds = parseTargetRepBounds(input)
        expect(Number.isFinite(bounds.minReps)).toBe(true)
        expect(Number.isFinite(bounds.maxReps)).toBe(true)
      }).not.toThrow()
    })
  })

  it('safely handles extreme negative, zero, and out-of-bound numerical inputs in recovery calculator', () => {
    expect(() => {
      const score = calculateReadinessScore({
        sleepHours: -5,
        sleepQuality: 0,
        soreness: 'Severe' as SorenessLevel,
        energy: 'Low' as EnergyRating,
        stress: 'High' as StressLevel,
      })
      expect(Number.isFinite(score)).toBe(true)
      expect(score).toBeGreaterThanOrEqual(10)
    }).not.toThrow()
  })

  it('handles negative or zero weights in nutrition calculations without generating NaN or infinite calories', () => {
    // @ts-expect-error Testing negative biometric values
    const result = calculateMacroTargets({ weight_kg: -70, height_cm: 0, age: -25 })
    expect(Number.isFinite(result.calories)).toBe(true)
    expect(Number.isFinite(result.protein)).toBe(true)
    expect(Number.isFinite(result.waterLiters)).toBe(true)
  })
})

