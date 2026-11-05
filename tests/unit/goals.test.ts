import { describe, it, expect } from 'vitest'
import {
  calculateBodyComposition,
  calculateComparisonDelta,
} from '@/lib/body-intelligence/bodyIntelligenceService'
import type { BodyIntelligenceRecord } from '@/types/bodyIntelligence'

describe('Unit: Fitness Goals & Body Composition Calculations', () => {
  it('calculates body fat % for males using U.S. Navy circumference method', () => {
    const result = calculateBodyComposition({
      weightKg: 78,
      heightCm: 178,
      gender: 'male',
      age: 26,
      waistCm: 82,
      neckCm: 38,
    })

    expect(result.formulaUsed).toBe('navy_method')
    expect(result.confidenceRating).toBe('high')
    expect(result.bodyFatPercentage).toBeGreaterThan(10)
    expect(result.bodyFatPercentage).toBeLessThan(25)
    expect(result.leanMassKg + result.fatMassKg).toBeCloseTo(78, 1)
  })

  it('calculates body fat % for females using U.S. Navy formula incorporating hips', () => {
    const result = calculateBodyComposition({
      weightKg: 62,
      heightCm: 165,
      gender: 'female',
      age: 27,
      waistCm: 70,
      neckCm: 32,
      hipsCm: 95,
    })

    expect(result.formulaUsed).toBe('navy_method')
    expect(result.confidenceRating).toBe('high')
    expect(result.bodyFatPercentage).toBeGreaterThan(15)
    expect(result.bodyFatPercentage).toBeLessThan(35)
    expect(result.leanMassKg + result.fatMassKg).toBeCloseTo(62, 1)
  })

  it('falls back to clinical Deurenberg BMI formula when circumference tape data is missing', () => {
    const result = calculateBodyComposition({
      weightKg: 75,
      heightCm: 175,
      gender: 'male',
      age: 25,
    })

    expect(result.formulaUsed).toBe('bmi_derived')
    expect(result.confidenceRating).toBe('approximate')
    expect(result.bodyFatPercentage).toBeGreaterThan(10)
  })

  it('calculates accurate comparison deltas between baseline and current check-in', () => {
    const baseline: BodyIntelligenceRecord = {
      id: 'rec-1',
      userId: 'test-user',
      recordedDate: '2026-10-01',
      weightKg: 80.0,
      heightCm: 175,
      age: 26,
      gender: 'male',
      waistCm: 86.0,
      createdAt: '2026-10-01T08:00:00Z',
      composition: {
        bodyFatPercentage: 18.0,
        leanMassKg: 65.6,
        fatMassKg: 14.4,
        bmi: 26.1,
        formulaUsed: 'navy_method',
        isEstimated: true,
        confidenceRating: 'high',
        explanation: 'Baseline test',
      },
    }

    const current: BodyIntelligenceRecord = {
      id: 'rec-2',
      userId: 'test-user',
      recordedDate: '2026-11-01',
      weightKg: 76.0,
      heightCm: 175,
      age: 26,
      gender: 'male',
      waistCm: 81.0,
      createdAt: '2026-11-01T08:00:00Z',
      composition: {
        bodyFatPercentage: 15.0,
        leanMassKg: 64.6,
        fatMassKg: 11.4,
        bmi: 24.8,
        formulaUsed: 'navy_method',
        isEstimated: true,
        confidenceRating: 'high',
        explanation: 'Current test',
      },
    }

    const delta = calculateComparisonDelta(baseline, current)
    expect(delta.weightDeltaKg).toBe(-4.0)
    expect(delta.bodyFatDeltaPercent).toBe(-3.0)
    expect(delta.waistDeltaCm).toBe(-5.0)
    expect(delta.daysElapsed).toBe(31)
  })
})
