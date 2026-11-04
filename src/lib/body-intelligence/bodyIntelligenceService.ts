import type {
  BodyCompositionEstimate,
  BodyIntelligenceRecord,
  BodyIntelligenceGoal,
  MeasurementComparisonDelta,
  MonthlyCompositionSummary,
  CompositionFormula,
} from '@/types/bodyIntelligence'

const LOCAL_STORAGE_RECORDS_KEY = 'yashfit_body_intelligence_records'
const LOCAL_STORAGE_GOAL_KEY = 'yashfit_body_intelligence_goal'

export const DEFAULT_BODY_GOAL: BodyIntelligenceGoal = {
  currentWeightKg: 74.0,
  targetWeightKg: 70.0,
  targetBodyFatPercent: 14.0,
  targetWaistCm: 78,
  targetDate: '2026-12-31',
  weeklyRateGoalKg: -0.4,
}

export function calculateBodyComposition(params: {
  weightKg: number
  heightCm: number
  gender: 'male' | 'female' | 'other'
  age: number
  waistCm?: number
  neckCm?: number
  hipsCm?: number
}): BodyCompositionEstimate {
  const { weightKg, heightCm, gender, age, waistCm, neckCm, hipsCm } = params

  const heightM = Math.max(0.5, heightCm / 100)
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1))

  let bodyFatPercentage: number
  let formulaUsed: CompositionFormula = 'bmi_derived'
  let confidenceRating: 'high' | 'moderate' | 'approximate' = 'approximate'
  let explanation = ''

  // Attempt U.S. Navy Method
  if (gender === 'female' && waistCm && neckCm && hipsCm && waistCm + hipsCm - neckCm > 0) {
    const diff = waistCm + hipsCm - neckCm
    const logDiff = Math.log10(diff)
    const logHeight = Math.log10(heightCm)
    const bf = 495 / (1.29579 - 0.35004 * logDiff + 0.221 * logHeight) - 450
    bodyFatPercentage = Number(Math.max(10, Math.min(50, bf)).toFixed(1))
    formulaUsed = 'navy_method'
    confidenceRating = 'high'
    explanation = 'Calculated using the U.S. Navy Body Fat formula incorporating waist, hip, neck, and height circumference measurements.'
  } else if ((gender === 'male' || gender === 'other') && waistCm && neckCm && waistCm - neckCm > 0) {
    const diff = waistCm - neckCm
    const logDiff = Math.log10(diff)
    const logHeight = Math.log10(heightCm)
    const bf = 495 / (1.0324 - 0.19077 * logDiff + 0.15456 * logHeight) - 450
    bodyFatPercentage = Number(Math.max(4, Math.min(45, bf)).toFixed(1))
    formulaUsed = 'navy_method'
    confidenceRating = 'high'
    explanation = 'Calculated using the U.S. Navy Body Fat formula based on waist-to-neck circumference differential and height.'
  } else {
    // Adult BMI-derived formula (Deurenberg et al.)
    const genderFactor = gender === 'female' ? 0 : 1
    const bf = 1.2 * bmi + 0.23 * age - 10.8 * genderFactor - 5.4
    bodyFatPercentage = Number(Math.max(5, Math.min(50, bf)).toFixed(1))
    formulaUsed = 'bmi_derived'
    confidenceRating = 'approximate'
    explanation = 'Approximated via clinical Deurenberg BMI formula. Add waist & neck measurements for high-confidence U.S. Navy estimates.'
  }

  const leanMassKg = Number((weightKg * (1 - bodyFatPercentage / 100)).toFixed(1))
  const fatMassKg = Number((weightKg - leanMassKg).toFixed(1))

  return {
    bodyFatPercentage,
    leanMassKg,
    fatMassKg,
    bmi,
    formulaUsed,
    isEstimated: true,
    confidenceRating,
    explanation,
  }
}

// Initial demo seed records
const INITIAL_DEMO_RECORDS: BodyIntelligenceRecord[] = [
  {
    id: 'bi-seed-1',
    userId: 'demo-user',
    recordedDate: '2026-09-01',
    weightKg: 78.5,
    heightCm: 175,
    gender: 'male',
    age: 26,
    waistCm: 88,
    neckCm: 38,
    chestCm: 102,
    armCm: 34,
    thighCm: 58,
    composition: calculateBodyComposition({
      weightKg: 78.5,
      heightCm: 175,
      gender: 'male',
      age: 26,
      waistCm: 88,
      neckCm: 38,
    }),
    notes: 'Initial transformation baseline check-in.',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'bi-seed-2',
    userId: 'demo-user',
    recordedDate: '2026-10-01',
    weightKg: 76.2,
    heightCm: 175,
    gender: 'male',
    age: 26,
    waistCm: 85,
    neckCm: 37.5,
    chestCm: 101,
    armCm: 34.5,
    thighCm: 57,
    composition: calculateBodyComposition({
      weightKg: 76.2,
      heightCm: 175,
      gender: 'male',
      age: 26,
      waistCm: 85,
      neckCm: 37.5,
    }),
    notes: 'One month progress; waist down 3cm, strength maintained.',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'bi-seed-3',
    userId: 'demo-user',
    recordedDate: '2026-11-01',
    weightKg: 74.0,
    heightCm: 175,
    gender: 'male',
    age: 26,
    waistCm: 82,
    neckCm: 37,
    chestCm: 101,
    armCm: 35,
    thighCm: 56.5,
    composition: calculateBodyComposition({
      weightKg: 74.0,
      heightCm: 175,
      gender: 'male',
      age: 26,
      waistCm: 82,
      neckCm: 37,
    }),
    notes: 'Lean definition emerging, consistent high-protein diet.',
    createdAt: '2026-11-01T08:00:00.000Z',
  },
]

let inMemoryRecords: BodyIntelligenceRecord[] = [...INITIAL_DEMO_RECORDS]
let inMemoryGoal: BodyIntelligenceGoal = { ...DEFAULT_BODY_GOAL }

export function getBodyIntelligenceRecords(): BodyIntelligenceRecord[] {
  if (typeof window === 'undefined') return inMemoryRecords
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fallback
  }
  return inMemoryRecords
}

export function saveBodyIntelligenceRecord(
  record: Omit<BodyIntelligenceRecord, 'id' | 'createdAt' | 'composition'>
): BodyIntelligenceRecord[] {
  const composition = calculateBodyComposition({
    weightKg: record.weightKg,
    heightCm: record.heightCm,
    gender: record.gender,
    age: record.age,
    waistCm: record.waistCm,
    neckCm: record.neckCm,
    hipsCm: record.hipsCm,
  })

  const newRecord: BodyIntelligenceRecord = {
    ...record,
    id: `bi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    composition,
    createdAt: new Date().toISOString(),
  }

  const existing = getBodyIntelligenceRecords()
  // Replace if same date exists, else append & sort descending by date
  const filtered = existing.filter((r) => r.recordedDate !== record.recordedDate)
  const updated = [...filtered, newRecord].sort(
    (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
  )

  inMemoryRecords = updated
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  return updated
}

export function deleteBodyIntelligenceRecord(id: string): BodyIntelligenceRecord[] {
  const existing = getBodyIntelligenceRecords()
  const updated = existing.filter((r) => r.id !== id)
  inMemoryRecords = updated
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }
  return updated
}

export function getBodyIntelligenceGoal(): BodyIntelligenceGoal {
  if (typeof window === 'undefined') return inMemoryGoal
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_GOAL_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return inMemoryGoal
}

export function saveBodyIntelligenceGoal(goal: BodyIntelligenceGoal): void {
  inMemoryGoal = goal
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_GOAL_KEY, JSON.stringify(goal))
    } catch {
      // ignore
    }
  }
}

export function calculateComparisonDelta(
  baseline: BodyIntelligenceRecord,
  current: BodyIntelligenceRecord
): MeasurementComparisonDelta {
  const dBaseline = new Date(baseline.recordedDate).getTime()
  const dCurrent = new Date(current.recordedDate).getTime()
  const daysElapsed = Math.max(1, Math.round(Math.abs(dCurrent - dBaseline) / (1000 * 60 * 60 * 24)))

  return {
    baselineDate: baseline.recordedDate,
    currentDate: current.recordedDate,
    daysElapsed,
    weightDeltaKg: Number((current.weightKg - baseline.weightKg).toFixed(1)),
    waistDeltaCm:
      current.waistCm && baseline.waistCm
        ? Number((current.waistCm - baseline.waistCm).toFixed(1))
        : undefined,
    neckDeltaCm:
      current.neckCm && baseline.neckCm
        ? Number((current.neckCm - baseline.neckCm).toFixed(1))
        : undefined,
    chestDeltaCm:
      current.chestCm && baseline.chestCm
        ? Number((current.chestCm - baseline.chestCm).toFixed(1))
        : undefined,
    hipsDeltaCm:
      current.hipsCm && baseline.hipsCm
        ? Number((current.hipsCm - baseline.hipsCm).toFixed(1))
        : undefined,
    armDeltaCm:
      current.armCm && baseline.armCm
        ? Number((current.armCm - baseline.armCm).toFixed(1))
        : undefined,
    thighDeltaCm:
      current.thighCm && baseline.thighCm
        ? Number((current.thighCm - baseline.thighCm).toFixed(1))
        : undefined,
    bodyFatDeltaPercent: Number(
      (current.composition.bodyFatPercentage - baseline.composition.bodyFatPercentage).toFixed(1)
    ),
    leanMassDeltaKg: Number(
      (current.composition.leanMassKg - baseline.composition.leanMassKg).toFixed(1)
    ),
    fatMassDeltaKg: Number(
      (current.composition.fatMassKg - baseline.composition.fatMassKg).toFixed(1)
    ),
  }
}

export function generateMonthlySummaries(
  records: BodyIntelligenceRecord[]
): MonthlyCompositionSummary[] {
  if (records.length === 0) return []

  // Group by YYYY-MM
  const groups = new Map<string, BodyIntelligenceRecord[]>()
  for (const r of records) {
    const key = r.recordedDate.slice(0, 7)
    const list = groups.get(key) || []
    list.push(r)
    groups.set(key, list)
  }

  const summaries: MonthlyCompositionSummary[] = []
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  for (const [key, group] of groups.entries()) {
    // Sort chronological
    group.sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
    const first = group[0]
    const last = group[group.length - 1]
    const [year, month] = key.split('-')
    const monthLabel = `${monthNames[parseInt(month, 10) - 1]} ${year}`

    const netWeight = Number((last.weightKg - first.weightKg).toFixed(1))
    const bfDiff = Number(
      (last.composition.bodyFatPercentage - first.composition.bodyFatPercentage).toFixed(1)
    )

    let photoCount = 0
    for (const r of group) {
      if (r.photos?.frontUrl) photoCount++
      if (r.photos?.sideUrl) photoCount++
      if (r.photos?.backUrl) photoCount++
    }

    let milestone = 'Consistent measurement adherence logged.'
    if (netWeight < -1.5) {
      milestone = `Substantial fat cut progress: ${Math.abs(netWeight)} kg reduction.`
    } else if (netWeight > 1.0) {
      milestone = `Lean mass building phase: +${netWeight} kg gained.`
    } else if (first.waistCm && last.waistCm && last.waistCm < first.waistCm) {
      milestone = `Waist trimmer by ${first.waistCm - last.waistCm} cm while maintaining body weight.`
    }

    summaries.push({
      monthKey: key,
      monthLabel,
      startWeightKg: first.weightKg,
      endWeightKg: last.weightKg,
      netWeightChangeKg: netWeight,
      bodyFatChangePercent: bfDiff,
      photosLoggedCount: photoCount,
      measurementsLoggedCount: group.length,
      keyMilestone: milestone,
    })
  }

  return summaries.sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

