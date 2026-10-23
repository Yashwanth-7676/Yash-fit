import type { EnergyRating, SorenessLevel, StressLevel } from '@/types/recovery'

/**
 * Calculates a 0-100 Training Readiness Score based on user-reported biomarkers.
 * This is an athletic conditioning metric, NOT a medical diagnosis.
 */
export function calculateReadinessScore(params: {
  sleepHours: number
  sleepQuality: number // 1 to 5
  soreness: SorenessLevel
  energy: EnergyRating
  stress: StressLevel
}): number {
  const { sleepHours, sleepQuality, soreness, energy, stress } = params

  // 1. Sleep Component (Max 35 pts)
  // Optimal sleep is 7.5 to 9 hours
  let sleepDurationScore = (Math.min(sleepHours, 8.5) / 8.5) * 20
  if (sleepHours < 5) sleepDurationScore *= 0.6
  const sleepQualityScore = (sleepQuality / 5) * 15
  const sleepTotal = Math.min(35, sleepDurationScore + sleepQualityScore)

  // 2. Soreness Component (Max 25 pts)
  let sorenessScore = 25
  if (soreness === 'Mild') sorenessScore = 20
  else if (soreness === 'Moderate') sorenessScore = 13
  else if (soreness === 'Severe') sorenessScore = 5

  // 3. Energy Component (Max 25 pts)
  let energyScore = 18
  if (energy === 'Peak') energyScore = 25
  else if (energy === 'High') energyScore = 22
  else if (energy === 'Moderate') energyScore = 15
  else if (energy === 'Low') energyScore = 6

  // 4. Stress Component (Max 15 pts)
  let stressScore = 15
  if (stress === 'Moderate') stressScore = 10
  else if (stress === 'High') stressScore = 4

  const total = Math.round(sleepTotal + sorenessScore + energyScore + stressScore)
  return Math.max(10, Math.min(100, total))
}

export function getReadinessCategory(score: number): {
  label: string
  color: string
  recommendation: string
} {
  if (score >= 80) {
    return {
      label: 'Optimal Readiness',
      color: 'text-lime-400',
      recommendation: 'Your central nervous system and muscles are well-rested. Great day for heavy compound lifts, PR attempts, or peak volume.',
    }
  } else if (score >= 60) {
    return {
      label: 'Moderate Readiness',
      color: 'text-amber-400',
      recommendation: 'Sufficient recovery for standard training. Stick to prescribed sets and rep ranges; avoid pushing to extreme muscular failure.',
    }
  } else {
    return {
      label: 'Fatigue Alert / Deload',
      color: 'text-rose-400',
      recommendation: 'Elevated systemic fatigue detected. Prioritize active recovery, light mobility, dynamic stretching, or an extra rest day.',
    }
  }
}

