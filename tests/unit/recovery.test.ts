import { describe, it, expect } from 'vitest'
import {
  calculateReadinessScore,
  getReadinessCategory,
} from '@/lib/recoveryCalculator'

describe('Unit: Recovery & Readiness Calculations', () => {
  it('calculates optimal readiness score (>=80) with full sleep and low fatigue', () => {
    const score = calculateReadinessScore({
      sleepHours: 8.5,
      sleepQuality: 5,
      soreness: 'None',
      energy: 'Peak',
      stress: 'Low',
    })
    // 35 (sleep) + 25 (soreness) + 25 (energy) + 15 (stress) = 100
    expect(score).toBe(100)
    const category = getReadinessCategory(score)
    expect(category.label).toBe('Optimal Readiness')
    expect(category.color).toBe('text-lime-400')
  })

  it('penalizes sleep duration heavily when sleep is less than 5 hours', () => {
    const scoreShortSleep = calculateReadinessScore({
      sleepHours: 4.0,
      sleepQuality: 3,
      soreness: 'Mild',
      energy: 'Moderate',
      stress: 'Moderate',
    })
    const scoreNormalSleep = calculateReadinessScore({
      sleepHours: 7.5,
      sleepQuality: 3,
      soreness: 'Mild',
      energy: 'Moderate',
      stress: 'Moderate',
    })

    expect(scoreShortSleep).toBeLessThan(scoreNormalSleep)
    expect(scoreShortSleep).toBeLessThan(65)
  })

  it('triggers Deload / Fatigue Alert (<60) when systemic soreness and stress are elevated', () => {
    const score = calculateReadinessScore({
      sleepHours: 5.5,
      sleepQuality: 2,
      soreness: 'Severe', // 5 pts
      energy: 'Low', // 6 pts
      stress: 'High', // 4 pts
    })

    expect(score).toBeLessThan(60)
    const category = getReadinessCategory(score)
    expect(category.label).toBe('Fatigue Alert / Deload')
    expect(category.color).toBe('text-rose-400')
  })

  it('clamps scores strictly within the athletic boundary [10, 100]', () => {
    const minimumScore = calculateReadinessScore({
      sleepHours: 1,
      sleepQuality: 1,
      soreness: 'Severe',
      energy: 'Low',
      stress: 'High',
    })
    expect(minimumScore).toBeGreaterThanOrEqual(10)
    expect(minimumScore).toBeLessThanOrEqual(100)

    const maximumScore = calculateReadinessScore({
      sleepHours: 12,
      sleepQuality: 5,
      soreness: 'None',
      energy: 'Peak',
      stress: 'Low',
    })
    expect(maximumScore).toBe(100)
  })
})

