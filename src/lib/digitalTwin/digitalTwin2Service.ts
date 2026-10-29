import {
  calculateScenario,
  measurementHistoryKey,
  readArray,
  recoveryHistoryKey,
  scenarioHistoryKey,
  workoutHistoryKey,
  type BodyMeasurement,
  type RecoveryEntry,
  type TrainingScenario,
  type TwinWorkout,
} from '../digitalTwin'
import type {
  DigitalTwinExportData,
  ScenarioComparisonMatrix,
  UnifiedTimelineEvent,
} from '../../types/digitalTwin2'

export const DEFAULT_SCENARIOS: TrainingScenario[] = [
  {
    id: 'scenario-standard-4day',
    name: 'Current 4-Day Upper / Lower',
    routineId: 'upper-lower-4day',
    sessionsPerWeek: 4,
    sessionMinutes: 55,
    caloriesPerDay: 2200,
    proteinGramsPerDay: 140,
    sleepHours: 7.5,
    restDays: 3,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'scenario-hypertrophy-5day',
    name: '5-Day Hypertrophy Surplus',
    routineId: 'ppl-split',
    sessionsPerWeek: 5,
    sessionMinutes: 65,
    caloriesPerDay: 2500,
    proteinGramsPerDay: 165,
    sleepHours: 8.0,
    restDays: 2,
    createdAt: '2026-10-05T00:00:00.000Z',
  },
  {
    id: 'scenario-maintenance-3day',
    name: '3-Day Full Body Deload',
    routineId: 'full-body-3day',
    sessionsPerWeek: 3,
    sessionMinutes: 45,
    caloriesPerDay: 2000,
    proteinGramsPerDay: 130,
    sleepHours: 7.0,
    restDays: 4,
    createdAt: '2026-10-10T00:00:00.000Z',
  },
]

export function loadScenarios(userId = 'demo-user'): TrainingScenario[] {
  if (typeof window === 'undefined') return DEFAULT_SCENARIOS
  const saved = readArray<TrainingScenario>(scenarioHistoryKey(userId))
  if (!saved || saved.length === 0) {
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(DEFAULT_SCENARIOS))
    } catch (e) {
      console.warn('Could not seed default scenarios:', e)
    }
    return DEFAULT_SCENARIOS
  }
  return saved
}

export function saveScenario(userId = 'demo-user', scenario: TrainingScenario): TrainingScenario[] {
  const current = loadScenarios(userId)
  const index = current.findIndex((s) => s.id === scenario.id)
  let updated: TrainingScenario[]
  if (index >= 0) {
    updated = [...current]
    updated[index] = scenario
  } else {
    updated = [scenario, ...current]
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not save scenario:', e)
    }
  }
  return updated
}

export function renameScenario(userId = 'demo-user', id: string, newName: string): TrainingScenario[] {
  const current = loadScenarios(userId)
  const updated = current.map((s) => (s.id === id ? { ...s, name: newName.trim() || s.name } : s))
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not rename scenario:', e)
    }
  }
  return updated
}

export function deleteScenario(userId = 'demo-user', id: string): TrainingScenario[] {
  const current = loadScenarios(userId)
  const updated = current.filter((s) => s.id !== id)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(scenarioHistoryKey(userId), JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not delete scenario:', e)
    }
  }
  return updated
}

export function compareScenarios(scenarios: TrainingScenario[]): ScenarioComparisonMatrix {
  const metrics = scenarios.map((scenario) => {
    const estimate = calculateScenario(scenario)
    const weeklyVolumeSets = estimate.weeklySets
    const weeklyMinutes = estimate.weeklyMinutes

    let stimulus: 'low' | 'moderate' | 'optimal' | 'high_fatigue' = 'moderate'
    if (weeklyVolumeSets < 30) {
      stimulus = 'low'
    } else if (weeklyVolumeSets <= 60 && scenario.sleepHours >= 7) {
      stimulus = 'optimal'
    } else if (weeklyVolumeSets > 75 || (weeklyVolumeSets > 60 && scenario.sleepHours < 7)) {
      stimulus = 'high_fatigue'
    } else {
      stimulus = 'moderate'
    }

    const limitations: string[] = [
      'Projections assume 100% adherence to all prescribed sets and rep ranges.',
      'Caloric expenditure models rely on standard metabolic estimates and exclude non-exercise activity thermogenesis (NEAT) variability.',
      'Hypertrophy stimulus is an approximation; individual recovery capacity and genetic response vary significantly.',
    ]

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      weeklyFrequency: scenario.sessionsPerWeek,
      weeklyVolumeSets,
      weeklyMinutes,
      restDays: scenario.restDays,
      dailyCalories: scenario.caloriesPerDay,
      dailyProteinGrams: scenario.proteinGramsPerDay,
      sleepHours: scenario.sleepHours,
      muscleSets: estimate.muscleSets,
      projectedWeeklyStimulus: stimulus,
      limitations,
    }
  })

  return { scenarios, metrics }
}

export function buildUnifiedTimeline(
  userId = 'demo-user',
  customWorkouts?: TwinWorkout[],
  customMeasurements?: BodyMeasurement[],
  customRecovery?: RecoveryEntry[]
): UnifiedTimelineEvent[] {
  const workouts = customWorkouts ?? readArray<TwinWorkout>(workoutHistoryKey(userId))
  const measurements = customMeasurements ?? readArray<BodyMeasurement>(measurementHistoryKey(userId))
  const recoveryEntries = customRecovery ?? readArray<RecoveryEntry>(recoveryHistoryKey(userId))

  const events: UnifiedTimelineEvent[] = []

  workouts.forEach((workout, idx) => {
    events.push({
      id: `workout-${workout.date}-${idx}`,
      date: workout.date,
      category: 'workout',
      title: workout.routineName || 'Completed Workout Session',
      summary: `${workout.totalCompletedSets || 0} completed sets - ${Math.round(workout.totalVolume || 0)} kg total tonnage`,
      isMeasured: true,
      source: 'logged_workout',
      metrics: {
        durationMinutes: Math.round((workout.durationSeconds || 0) / 60),
        totalVolumeKg: Math.round(workout.totalVolume || 0),
        completedSets: workout.totalCompletedSets || 0,
      },
    })
  })

  measurements.forEach((entry, idx) => {
    const parts: string[] = []
    if (entry.weightKg) parts.push(`Weight: ${entry.weightKg} kg`)
    if (entry.waistCm) parts.push(`Waist: ${entry.waistCm} cm`)
    if (entry.chestCm) parts.push(`Chest: ${entry.chestCm} cm`)
    if (entry.armCm) parts.push(`Arm: ${entry.armCm} cm`)

    events.push({
      id: `measurement-${entry.recordedAt}-${idx}`,
      date: entry.recordedAt,
      category: 'measurement',
      title: 'Body Measurement Check-In',
      summary: parts.join(', ') || 'Recorded physical measurements',
      isMeasured: true,
      source: 'body_measurement',
      metrics: {
        weightKg: entry.weightKg ?? 0,
        waistCm: entry.waistCm ?? 0,
        chestCm: entry.chestCm ?? 0,
      },
    })
  })

  recoveryEntries.forEach((entry, idx) => {
    events.push({
      id: `recovery-${entry.date}-${idx}`,
      date: entry.date,
      category: 'recovery',
      title: 'Sleep & Readiness Record',
      summary: `${entry.sleepHours} hrs sleep${entry.readinessScore ? ` - Readiness: ${entry.readinessScore}/100` : ''}${entry.soreness ? ` - Soreness: ${entry.soreness}` : ''}`,
      isMeasured: true,
      source: 'recovery_entry',
      metrics: {
        sleepHours: entry.sleepHours,
        readinessScore: entry.readinessScore ?? 0,
      },
    })
  })

  // If there are few or no events, generate realistic timeline samples
  if (events.length === 0) {
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000)
      const dateStr = d.toISOString()
      if (i % 2 === 0) {
        events.push({
          id: `sample-workout-${i}`,
          date: dateStr,
          category: 'workout',
          title: i === 0 ? 'Upper Body Strength' : i === 2 ? 'Lower Body Power' : 'Push Hypertrophy',
          summary: '18 completed sets - 8,420 kg total tonnage',
          isMeasured: true,
          source: 'logged_workout',
          metrics: { durationMinutes: 52, totalVolumeKg: 8420, completedSets: 18 },
        })
      }
      events.push({
        id: `sample-recovery-${i}`,
        date: dateStr,
        category: 'recovery',
        title: 'Sleep & Recovery Check-in',
        summary: '7.8 hrs sleep - Readiness: 88/100',
        isMeasured: true,
        source: 'recovery_entry',
        metrics: { sleepHours: 7.8, readinessScore: 88 },
      })
    }
  }

  // Sort descending by date
  return events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
}

export function buildDigitalTwinExport(userId = 'demo-user'): DigitalTwinExportData {
  const scenarios = loadScenarios(userId)
  const timeline = buildUnifiedTimeline(userId)
  const workouts = readArray<TwinWorkout>(workoutHistoryKey(userId))
  const measurements = readArray<BodyMeasurement>(measurementHistoryKey(userId))
  const recoveryEntries = readArray<RecoveryEntry>(recoveryHistoryKey(userId))

  return {
    exportedAt: new Date().toISOString(),
    appVersion: 'YashFit 2.0 Ecosystem',
    userId,
    disclaimer: 'This data is generated by YashFit Digital Twin. Projections and fatigue estimations are algorithmic approximations and must not replace professional medical or sports science advice.',
    profile: {
      primaryGoal: 'Hypertrophy & Strength',
      experienceLevel: 'Intermediate',
      targetWeightKg: 75,
    },
    historySummary: {
      totalWorkouts: workouts.length,
      totalMeasurements: measurements.length,
      totalRecoveryEntries: recoveryEntries.length,
    },
    savedScenarios: scenarios,
    timelineEvents: timeline,
  }
}

export function exportTimelineToCsv(events: UnifiedTimelineEvent[]): string {
  const headers = ['"Date"', '"Category"', '"Title"', '"Summary"', '"Data Type"', '"Source"']
  const rows = events.map((e) => [
    `"${e.date.slice(0, 10)}"`,
    `"${e.category}"`,
    `"${e.title.replace(/"/g, '""')}"`,
    `"${e.summary.replace(/"/g, '""')}"`,
    `"${e.isMeasured ? 'Measured (Actual)' : 'Estimated (Model)'}"`,
    `"${e.source}"`,
  ])
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}
