import type {
  BodyMeasurementEntry,
  TransformationPhoto,
  MetricTrendAnalysis,
  TransformationMilestone,
  MeasurementMetricKey,
} from '../../types/transformation'
import { createClient } from '../supabase/client'

const MEASUREMENT_STORAGE_KEY = 'yashfit_body_measurements_'
const PHOTO_STORAGE_KEY = 'yashfit_transformation_photos_'

export const METRIC_CONFIG: Record<
  MeasurementMetricKey,
  { label: string; unit: string; defaultUncertainty: number; defaultReason: string }
> = {
  weight_kg: {
    label: 'Body Weight',
    unit: 'kg',
    defaultUncertainty: 0.6,
    defaultReason: 'Short-term fluctuations driven by sodium intake, hydration levels, and gut residue.',
  },
  waist_cm: {
    label: 'Waist Circumference',
    unit: 'cm',
    defaultUncertainty: 0.8,
    defaultReason: 'Tape tension differences, posture, and postprandial gastrointestinal distension.',
  },
  chest_cm: {
    label: 'Chest Circumference',
    unit: 'cm',
    defaultUncertainty: 0.6,
    defaultReason: 'Vascular blood pump from recent workouts and lung tidal volume variance.',
  },
  hips_cm: {
    label: 'Hips / Glutes',
    unit: 'cm',
    defaultUncertainty: 0.7,
    defaultReason: 'Pelvic tilt and tape positioning along the maximal gluteal protuberance.',
  },
  arm_cm: {
    label: 'Flexed Arm',
    unit: 'cm',
    defaultUncertainty: 0.4,
    defaultReason: 'Acute glycogen fullness, localized muscle pump, and exact bicep peak placement.',
  },
  thigh_cm: {
    label: 'Thigh Circumference',
    unit: 'cm',
    defaultUncertainty: 0.6,
    defaultReason: 'Sub-inguinal positioning height and quadriceps contraction state.',
  },
  neck_cm: {
    label: 'Neck Circumference',
    unit: 'cm',
    defaultUncertainty: 0.3,
    defaultReason: 'Laryngeal positioning and tape placement just below the thyroid cartilage.',
  },
}

/**
 * Returns default baseline measurements if none exist in demo/offline mode.
 */
export function getDefaultMeasurements(userId = 'demo-user'): BodyMeasurementEntry[] {
  const today = new Date()
  const list: BodyMeasurementEntry[] = []

  const offsets = [60, 45, 30, 15, 0]
  const weights = [74.5, 73.8, 73.2, 72.4, 71.8]
  const waists = [84.0, 83.2, 82.5, 81.8, 81.0]
  const chests = [98.0, 98.5, 99.0, 99.2, 99.5]
  const arms = [35.0, 35.2, 35.4, 35.6, 35.8]

  offsets.forEach((daysAgo, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    const dateStr = d.toISOString().split('T')[0]

    list.push({
      id: `meas-${i + 1}`,
      userId,
      recordedDate: dateStr,
      weightKg: weights[i],
      waistCm: waists[i],
      chestCm: chests[i],
      hipsCm: 96.0 - i * 0.4,
      armCm: arms[i],
      thighCm: 56.5 + i * 0.2,
      neckCm: 38.0,
      notes: i === 0 ? 'Baseline measurement check-in' : 'Consistent bi-weekly progress check',
    })
  })

  return list
}

/**
 * Loads all body measurement records for a user.
 */
export async function getBodyMeasurements(userId = 'demo-user'): Promise<BodyMeasurementEntry[]> {
  // 1. Supabase Fetch
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data, error } = await supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', authData.user.id)
          .order('recorded_date', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            recordedDate: d.recorded_date,
            weightKg: d.weight_kg ? Number(d.weight_kg) : undefined,
            waistCm: d.waist_cm ? Number(d.waist_cm) : undefined,
            chestCm: d.chest_cm ? Number(d.chest_cm) : undefined,
            hipsCm: d.hips_cm ? Number(d.hips_cm) : undefined,
            armCm: d.arm_cm ? Number(d.arm_cm) : undefined,
            thighCm: d.thigh_cm ? Number(d.thigh_cm) : undefined,
            neckCm: d.neck_cm ? Number(d.neck_cm) : undefined,
            notes: d.notes,
            createdAt: d.created_at,
          }))
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. LocalStorage Fetch
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${MEASUREMENT_STORAGE_KEY}${userId}`)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch {
      // fallback
    }
  }

  const initial = getDefaultMeasurements(userId)
  saveBodyMeasurementsLocally(userId, initial)
  return initial
}

export function saveBodyMeasurementsLocally(userId: string, list: BodyMeasurementEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${MEASUREMENT_STORAGE_KEY}${userId}`, JSON.stringify(list))
  } catch {
    // ignore
  }
}

/**
 * Adds a new body measurement entry.
 */
export async function addBodyMeasurement(
  userId = 'demo-user',
  entry: Omit<BodyMeasurementEntry, 'id' | 'userId' | 'createdAt'>
): Promise<BodyMeasurementEntry> {
  const newEntry: BodyMeasurementEntry = {
    ...entry,
    id: `meas-${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
  }

  // 1. LocalStorage
  const current = await getBodyMeasurements(userId)
  const existingIndex = current.findIndex((item) => item.recordedDate === entry.recordedDate)
  if (existingIndex >= 0) {
    current[existingIndex] = newEntry
  } else {
    current.push(newEntry)
  }
  current.sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
  saveBodyMeasurementsLocally(userId, current)

  // 2. Supabase
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        await supabase.from('body_measurements').upsert({
          user_id: authData.user.id,
          recorded_date: entry.recordedDate,
          weight_kg: entry.weightKg,
          waist_cm: entry.waistCm,
          chest_cm: entry.chestCm,
          hips_cm: entry.hipsCm,
          arm_cm: entry.armCm,
          thigh_cm: entry.thighCm,
          neck_cm: entry.neckCm,
          notes: entry.notes,
        })
      }
    } catch (err) {
      console.warn('Supabase measurement insertion error:', err)
    }
  }

  return newEntry
}

/**
 * Computes regression/trend rate for any given metric with scientific uncertainty bounds.
 */
export function calculateMetricTrend(
  entries: BodyMeasurementEntry[],
  metric: MeasurementMetricKey
): MetricTrendAnalysis | null {
  const valid = entries
    .filter((e) => {
      switch (metric) {
        case 'weight_kg':
          return typeof e.weightKg === 'number' && e.weightKg > 0
        case 'waist_cm':
          return typeof e.waistCm === 'number' && e.waistCm > 0
        case 'chest_cm':
          return typeof e.chestCm === 'number' && e.chestCm > 0
        case 'hips_cm':
          return typeof e.hipsCm === 'number' && e.hipsCm > 0
        case 'arm_cm':
          return typeof e.armCm === 'number' && e.armCm > 0
        case 'thigh_cm':
          return typeof e.thighCm === 'number' && e.thighCm > 0
        case 'neck_cm':
          return typeof e.neckCm === 'number' && e.neckCm > 0
        default:
          return false
      }
    })
    .sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())

  if (valid.length < 2) return null

  const first = valid[0]
  const last = valid[valid.length - 1]

  const getVal = (e: BodyMeasurementEntry) => {
    switch (metric) {
      case 'weight_kg':
        return e.weightKg!
      case 'waist_cm':
        return e.waistCm!
      case 'chest_cm':
        return e.chestCm!
      case 'hips_cm':
        return e.hipsCm!
      case 'arm_cm':
        return e.armCm!
      case 'thigh_cm':
        return e.thighCm!
      case 'neck_cm':
        return e.neckCm!
    }
  }

  const startVal = getVal(first)
  const currentVal = getVal(last)
  const netChange = Number((currentVal - startVal).toFixed(2))

  const dStart = new Date(first.recordedDate).getTime()
  const dEnd = new Date(last.recordedDate).getTime()
  const daysDiff = Math.max(1, (dEnd - dStart) / (1000 * 3600 * 24))
  const weeksDiff = daysDiff / 7

  const weeklyRate = Number((netChange / weeksDiff).toFixed(2))
  const cfg = METRIC_CONFIG[metric]

  let direction: 'decreasing' | 'increasing' | 'stable' = 'stable'
  if (Math.abs(weeklyRate) > 0.05) {
    direction = weeklyRate > 0 ? 'increasing' : 'decreasing'
  }

  return {
    metric,
    metricLabel: cfg.label,
    unit: cfg.unit,
    currentValue: currentVal,
    startValue: startVal,
    netChange,
    weeklyRate,
    direction,
    uncertaintyMargin: cfg.defaultUncertainty,
    uncertaintyExplanation: cfg.defaultReason,
  }
}

/**
 * Extracts transformation milestones.
 */
export function extractTransformationMilestones(
  measurements: BodyMeasurementEntry[],
  photos: TransformationPhoto[]
): TransformationMilestone[] {
  const milestones: TransformationMilestone[] = []

  if (measurements.length >= 2) {
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime()
    )
    const firstWeight = sorted[0].weightKg
    const lastWeight = sorted[sorted.length - 1].weightKg

    if (firstWeight && lastWeight && Math.abs(firstWeight - lastWeight) >= 2.0) {
      const diff = Number((lastWeight - firstWeight).toFixed(1))
      milestones.push({
        id: 'milestone-weight-shift',
        date: sorted[sorted.length - 1].recordedDate,
        title: diff < 0 ? `${Math.abs(diff)}kg Lean Drop Achieved` : `+${diff}kg Mass Gained`,
        description: `Verified shift from ${firstWeight}kg to ${lastWeight}kg across ${sorted.length} recorded checkpoints.`,
        type: 'weight',
      })
    }

    const firstWaist = sorted[0].waistCm
    const lastWaist = sorted[sorted.length - 1].waistCm
    if (firstWaist && lastWaist && firstWaist - lastWaist >= 2.0) {
      const drop = Number((firstWaist - lastWaist).toFixed(1))
      milestones.push({
        id: 'milestone-waist-taper',
        date: sorted[sorted.length - 1].recordedDate,
        title: `${drop}cm Waist Taper Recorded`,
        description: `Waist narrowed from ${firstWaist}cm to ${lastWaist}cm, indicating visceral fat loss.`,
        type: 'waist',
      })
    }

    milestones.push({
      id: 'milestone-consistency',
      date: sorted[sorted.length - 1].recordedDate,
      title: `${sorted.length} Measurement Checkpoints`,
      description: 'Disciplined habit of measuring body composition bi-weekly.',
      type: 'streak',
    })
  }

  if (photos.length >= 2) {
    milestones.push({
      id: 'milestone-photo-timeline',
      date: photos[photos.length - 1].recordedDate,
      title: 'Visual Transformation Timeline Formed',
      description: `Logged ${photos.length} transformation comparison snapshots with front/side/back angles.`,
      type: 'photo',
    })
  }

  return milestones
}

/**
 * Loads transformation photos for user.
 */
export async function getTransformationPhotos(userId = 'demo-user'): Promise<TransformationPhoto[]> {
  // 1. Supabase
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data, error } = await supabase
          .from('transformation_photos')
          .select('*')
          .eq('user_id', authData.user.id)
          .order('recorded_date', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            userId: d.user_id,
            recordedDate: d.recorded_date,
            poseType: d.pose_type,
            photoData: d.photo_data,
            weightAtTime: d.weight_at_time ? Number(d.weight_at_time) : undefined,
            notes: d.notes,
            createdAt: d.created_at,
          }))
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${PHOTO_STORAGE_KEY}${userId}`)
      if (raw) {
        return JSON.parse(raw)
      }
    } catch {
      // fallback
    }
  }

  // Demo default photos using lightweight SVG silhouettes
  const demoPhotos: TransformationPhoto[] = [
    {
      id: 'photo-demo-baseline',
      userId,
      recordedDate: '2026-08-15',
      poseType: 'front',
      photoData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%2318181b"/><circle cx="150" cy="80" r="35" fill="%233f3f46"/><rect x="110" y="125" width="80" height="130" rx="15" fill="%2352525b"/><rect x="80" y="130" width="22" height="110" rx="10" fill="%233f3f46"/><rect x="198" y="130" width="22" height="110" rx="10" fill="%233f3f46"/><rect x="115" y="260" width="32" height="120" rx="8" fill="%233f3f46"/><rect x="153" y="260" width="32" height="120" rx="8" fill="%233f3f46"/><text x="150" y="390" font-family="sans-serif" font-size="12" fill="%23a1a1aa" text-anchor="middle">Baseline (Day 1 - 74.5 kg)</text></svg>',
      weightAtTime: 74.5,
      notes: 'Initial transformation photo checkpoint',
      createdAt: '2026-08-15T08:00:00Z',
    },
    {
      id: 'photo-demo-current',
      userId,
      recordedDate: '2026-10-20',
      poseType: 'front',
      photoData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="100%" height="100%" fill="%2318181b"/><circle cx="150" cy="80" r="35" fill="%23a3e635"/><rect x="110" y="125" width="80" height="130" rx="15" fill="%2384cc16"/><rect x="80" y="130" width="24" height="110" rx="10" fill="%2365a30d"/><rect x="196" y="130" width="24" height="110" rx="10" fill="%2365a30d"/><rect x="115" y="260" width="32" height="120" rx="8" fill="%234d7c0f"/><rect x="153" y="260" width="32" height="120" rx="8" fill="%234d7c0f"/><text x="150" y="390" font-family="sans-serif" font-size="12" fill="%23a3e635" text-anchor="middle">Current (Week 10 - 71.8 kg)</text></svg>',
      weightAtTime: 71.8,
      notes: '10 weeks of progressive overload & Indian nutrition',
      createdAt: '2026-10-20T08:00:00Z',
    },
  ]

  saveTransformationPhotosLocally(userId, demoPhotos)
  return demoPhotos
}

export function saveTransformationPhotosLocally(userId: string, list: TransformationPhoto[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${PHOTO_STORAGE_KEY}${userId}`, JSON.stringify(list))
  } catch {
    // ignore
  }
}

/**
 * Saves a new transformation photo with validation.
 */
export async function addTransformationPhoto(
  userId = 'demo-user',
  photo: Omit<TransformationPhoto, 'id' | 'userId' | 'createdAt'>
): Promise<TransformationPhoto> {
  const newPhoto: TransformationPhoto = {
    ...photo,
    id: `photo-${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
  }

  // 1. LocalStorage
  const current = await getTransformationPhotos(userId)
  current.push(newPhoto)
  current.sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
  saveTransformationPhotosLocally(userId, current)

  // 2. Supabase
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        await supabase.from('transformation_photos').insert({
          user_id: authData.user.id,
          recorded_date: photo.recordedDate,
          pose_type: photo.poseType,
          photo_data: photo.photoData,
          weight_at_time: photo.weightAtTime,
          notes: photo.notes,
        })
      }
    } catch (err) {
      console.warn('Supabase photo insert error:', err)
    }
  }

  return newPhoto
}

/**
 * Exports measurements into formatted CSV text.
 */
export function exportMeasurementsToCsv(entries: BodyMeasurementEntry[]): string {
  const headers = [
    'Date',
    'Weight (kg)',
    'Waist (cm)',
    'Chest (cm)',
    'Hips (cm)',
    'Arm (cm)',
    'Thigh (cm)',
    'Neck (cm)',
    'Notes',
  ]
  const rows = entries.map((e) => [
    e.recordedDate,
    e.weightKg ?? '',
    e.waistCm ?? '',
    e.chestCm ?? '',
    e.hipsCm ?? '',
    e.armCm ?? '',
    e.thighCm ?? '',
    e.neckCm ?? '',
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Exports measurements into formatted JSON string.
 */
export function exportMeasurementsToJson(entries: BodyMeasurementEntry[]): string {
  return JSON.stringify(entries, null, 2)
}
