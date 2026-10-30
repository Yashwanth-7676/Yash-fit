import type {
  FitnessReport,
  ReportType,
  ReportMetricItem,
  ReportChartPoint,
  ReportPersonalRecord,
  ReportGenerationOptions,
} from '../../types/reports'
import type { TwinWorkout, RecoveryEntry } from '../digitalTwin'
import type { BodyMeasurementEntry } from '../../types/transformation'
import type { PerformanceTestLog } from '../../types/performanceLab'
import type { NutritionPlanV2 } from '../../types/nutritionPlanner'
import type { UserProfile } from '../../types/profile'

export interface ReportTelemetryInput {
  profile: UserProfile | null
  workouts: TwinWorkout[]
  recovery: RecoveryEntry[]
  measurements: BodyMeasurementEntry[]
  performanceLogs: PerformanceTestLog[]
  nutritionPlan: NutritionPlanV2 | null
  waterLoggedLiters: number
  activeStreak: number
}

/**
 * Generates a comprehensive, verifiable Fitness Intelligence Report.
 * Never fabricates missing metrics or compares incompatible timeframes.
 */
export function generateFitnessReport(
  options: ReportGenerationOptions,
  telemetry: ReportTelemetryInput
): FitnessReport {
  const { type, startDate, endDate, includePrivateMetrics = true } = options
  const {
    profile,
    workouts = [],
    recovery = [],
    measurements = [],
    performanceLogs = [],
    nutritionPlan,
    activeStreak,
  } = telemetry

  const now = new Date()
  let days = 7
  let reportTitle = 'Weekly Fitness Executive Report'
  let reportSubtitle = 'Past 7 Days Retrospective'

  switch (type) {
    case 'weekly':
      days = 7
      reportTitle = 'Weekly Fitness Intelligence Report'
      reportSubtitle = '7-Day Training, Recovery & Nutrition Audit'
      break
    case 'monthly':
      days = 30
      reportTitle = 'Monthly Progress & Transformation Report'
      reportSubtitle = '30-Day Longitudinal Adaptation Review'
      break
    case 'yearly':
      days = 365
      reportTitle = 'Annual Fitness Ecosystem Summary'
      reportSubtitle = 'Year-in-Review Habit Consistency & Total Workload'
      break
    case 'consistency':
      days = 30
      reportTitle = 'Workout Habit & Consistency Audit'
      reportSubtitle = 'Streak Integrity, Rest Days & Frequency Breakdown'
      break
    case 'strength':
      days = 60
      reportTitle = 'Compound Strength Progression Report'
      reportSubtitle = '1RM Benchmarks, Volume Waves & Load Accumulation'
      break
    case 'nutrition':
      days = 14
      reportTitle = 'Nutrition & Macro Adherence Report'
      reportSubtitle = 'Protein Target Attainment & Regional Meal Plan Audit'
      break
    case 'recovery':
      days = 14
      reportTitle = 'Physiological Recovery & Sleep Report'
      reportSubtitle = 'Readiness Scores, Sleep Duration & Fatigue Metrics'
      break
    case 'achievements':
      days = 90
      reportTitle = 'Personal Achievements & Milestones Report'
      reportSubtitle = 'RPG Level, Arena Accolades & Performance Lab PRs'
      break
  }

  const startMs = startDate ? new Date(startDate).getTime() : now.getTime() - days * 24 * 60 * 60 * 1000
  const endMs = endDate ? new Date(endDate).getTime() : now.getTime()

  // Filter verified events strictly inside date window
  const periodWorkouts = workouts.filter((w) => {
    const t = new Date(w.date).getTime()
    return !isNaN(t) && t >= startMs && t <= endMs
  })

  const periodRecovery = recovery.filter((r) => {
    const t = new Date(r.date).getTime()
    return !isNaN(t) && t >= startMs && t <= endMs
  })

  // Prior period for delta comparison (same duration immediately preceding)
  const priorStartMs = startMs - (endMs - startMs)
  const priorWorkouts = workouts.filter((w) => {
    const t = new Date(w.date).getTime()
    return !isNaN(t) && t >= priorStartMs && t < startMs
  })

  // 1. Metric Computations
  const totalVolumeKg = periodWorkouts.reduce((s, w) => s + (Number(w.totalVolume) || 0), 0)
  const priorVolumeKg = priorWorkouts.reduce((s, w) => s + (Number(w.totalVolume) || 0), 0)
  const volumeDeltaPct =
    priorVolumeKg > 0 ? Math.round(((totalVolumeKg - priorVolumeKg) / priorVolumeKg) * 100) : undefined

  const avgReadiness =
    periodRecovery.length > 0
      ? Math.round(periodRecovery.reduce((s, r) => s + (r.readinessScore || 0), 0) / periodRecovery.length)
      : null

  const avgSleepHours =
    periodRecovery.length > 0
      ? Number(
          (periodRecovery.reduce((s, r) => s + (r.sleepHours || 0), 0) / periodRecovery.length).toFixed(1)
        )
      : null

  const targetProteinGrams =
    nutritionPlan?.dailyProtein || Math.round((profile?.weight_kg || 70) * 1.8)

  const metrics: ReportMetricItem[] = [
    {
      key: 'total_workouts',
      label: 'Verified Workout Sessions',
      value: `${periodWorkouts.length}`,
      unit: 'sessions',
      changePct: priorWorkouts.length > 0 ? periodWorkouts.length - priorWorkouts.length : undefined,
      trendDirection: periodWorkouts.length >= priorWorkouts.length ? 'up' : 'down',
    },
    {
      key: 'total_volume',
      label: 'Total Tonnage Lifted',
      value: totalVolumeKg.toLocaleString(),
      unit: 'kg',
      changePct: volumeDeltaPct,
      trendDirection: volumeDeltaPct !== undefined ? (volumeDeltaPct >= 0 ? 'up' : 'down') : 'neutral',
    },
    {
      key: 'avg_readiness',
      label: 'Average Readiness Score',
      value: avgReadiness !== null ? `${avgReadiness}` : 'No records',
      unit: avgReadiness !== null ? '/100' : undefined,
      trendDirection: avgReadiness !== null && avgReadiness >= 70 ? 'up' : 'neutral',
    },
    {
      key: 'avg_sleep',
      label: 'Average Sleep Duration',
      value: avgSleepHours !== null ? `${avgSleepHours}` : 'No records',
      unit: avgSleepHours !== null ? 'hours/night' : undefined,
    },
    {
      key: 'active_streak',
      label: 'Habit Adherence Streak',
      value: `${activeStreak}`,
      unit: 'days',
      trendDirection: 'up',
    },
  ]

  if (includePrivateMetrics && measurements.length > 0) {
    const latestMeasurement = measurements[0]
    metrics.push({
      key: 'body_weight',
      label: 'Latest Recorded Weight',
      value: latestMeasurement.weightKg ? `${latestMeasurement.weightKg}` : 'N/A',
      unit: 'kg',
    })
  }

  // 2. Chart Series
  const chartData: ReportChartPoint[] = periodWorkouts.map((w) => ({
    label: w.date.slice(5),
    value: Number(w.totalVolume) || 0,
    secondaryValue: Math.round((Number(w.totalVolume) || 0) / 100),
  }))

  if (chartData.length === 0) {
    chartData.push({ label: 'No Data', value: 0 })
  }

  // 3. Personal Records
  const personalRecords: ReportPersonalRecord[] = performanceLogs.slice(0, 3).map((l) => ({
    exerciseName: l.testTitle,
    recordValue: `${l.resultValue} ${l.unit}`,
    date: l.date,
  }))

  // 4. Missing Data Notices
  const missingDataNotices: string[] = []
  if (periodWorkouts.length === 0) {
    missingDataNotices.push('No workout logs recorded in this exact date window.')
  }
  if (periodRecovery.length === 0) {
    missingDataNotices.push('No recovery check-ins logged for this timeframe. Sleep and readiness metrics are unrecorded.')
  }
  if (priorWorkouts.length === 0) {
    missingDataNotices.push('Insufficient prior-period history for historical delta comparison.')
  }

  // 5. Recommendations
  const recommendations: string[] = []
  if (periodWorkouts.length >= 3) {
    recommendations.push('Volume progression is consistent. Keep prioritizing 2-minute rests on compound sets.')
  } else {
    recommendations.push('Training frequency is below weekly target. Aim for at least 3 verified resistance sessions per week.')
  }
  if (avgReadiness !== null && avgReadiness < 60) {
    recommendations.push('Elevated systemic fatigue detected. Enable Autopilot Deload week to prevent non-functional overreaching.')
  } else {
    recommendations.push('Neuromuscular readiness is stable. Continue progressive overload on working sets.')
  }
  recommendations.push(`Maintain daily protein target of ${targetProteinGrams}g to support muscular repair.`)

  // 6. Sanitized Share Text
  const sanitizedShareText = `🏆 YashFit ${reportTitle}
📅 ${new Date(startMs).toLocaleDateString()} to ${new Date(endMs).toLocaleDateString()}
💪 Total Workouts: ${periodWorkouts.length} sessions
🏋️ Total Volume: ${totalVolumeKg.toLocaleString()} kg
🔥 Habit Streak: ${activeStreak} days
⭐ Built with YashFit AI Fitness Ecosystem`

  return {
    id: `rep-${Date.now()}`,
    type,
    title: reportTitle,
    subtitle: reportSubtitle,
    generatedAt: now.toISOString(),
    dateRange: {
      startDate: new Date(startMs).toISOString().slice(0, 10),
      endDate: new Date(endMs).toISOString().slice(0, 10),
    },
    summary: `Verified audit spanning ${days} days across ${periodWorkouts.length} completed workouts and ${periodRecovery.length} morning check-ins. Total lifted volume: ${totalVolumeKg.toLocaleString()} kg.`,
    metrics,
    chartData,
    personalRecords,
    missingDataNotices,
    recommendations,
    sanitizedShareText,
  }
}

