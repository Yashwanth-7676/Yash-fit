/**
 * YashFit User Feedback & Issue Intelligence Service
 * Handles user bug submissions, feature proposals, rating telemetry,
 * admin review workflows, screenshot validation, and duplicate tracking.
 */

import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type {
  UserFeedbackItem,
  FeedbackInput,
  FeedbackStatus,
  FeedbackCategory,
  FeedbackMetrics,
  FeedbackFilters,
  FeedbackType,
} from '@/types/betaFeedback'

const STORAGE_FEEDBACK_KEY = 'yashfit_user_feedback'
const STORAGE_SUBMISSION_TIMESTAMPS_KEY = 'yashfit_feedback_ratelimit'

const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024 // 3 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export const DEFAULT_FEEDBACK_SEEDS: UserFeedbackItem[] = [
  {
    id: 'fb-seed-01',
    userId: 'demo-user',
    userName: 'Yash (Demo)',
    userEmail: 'yash@example.com',
    type: 'bug',
    title: 'Camera pose detection jitter in low lighting conditions',
    description:
      'When performing squats under warm or dim gym lighting, the MediaPipe knee joint angle estimate flickers between 85 and 95 degrees, intermittently failing to record completed reps.',
    category: 'workout_studio',
    severity: 'medium',
    rating: 4,
    status: 'in_progress',
    adminResponse:
      'Thank you for reporting! We are adding an adaptive confidence threshold filter for low-lux conditions in the v2.4.1 release.',
    adminNotes: 'Investigate temporal smoothing filter on joint angle landmark coordinates.',
    createdAt: '2026-10-28T14:30:00.000Z',
    updatedAt: '2026-10-29T09:15:00.000Z',
  },
  {
    id: 'fb-seed-02',
    userId: 'tester-alpha-2',
    userName: 'Priya M.',
    userEmail: 'priya@fitness.test',
    type: 'feature_request',
    title: 'Support barcode scanning for packaged Indian protein snacks',
    description:
      'Would love an integrated UPC/EAN barcode scanner alongside the computer vision camera for items like RiteBite Max Protein bars, Epigamia yogurt, and Nutrela boxes.',
    category: 'food_scanner',
    severity: 'low',
    rating: 5,
    status: 'under_review',
    adminResponse: 'Great suggestion Priya! We are mapping Indian FSSAI barcode registries to our offline nutritional dataset.',
    adminNotes: 'Prioritize for Q1 2027 roadmap under Smart Grocery expansion.',
    createdAt: '2026-11-01T11:00:00.000Z',
    updatedAt: '2026-11-02T16:20:00.000Z',
  },
  {
    id: 'fb-seed-03',
    userId: 'demo-user',
    userName: 'Yash (Demo)',
    userEmail: 'yash@example.com',
    type: 'improvement',
    title: 'Add audio cues before rest timer reaches zero',
    description:
      'In Workout Studio, three short beeps at 3s, 2s, 1s before rest interval concludes would help when resting with eyes closed or chalking hands.',
    category: 'workout_studio',
    severity: 'low',
    rating: 5,
    status: 'resolved',
    resolvedAt: '2026-11-04T18:00:00.000Z',
    adminResponse: 'Shipped in v2.4.0! Audio countdown chimes now sound at T-3 seconds before each set begins.',
    adminNotes: 'Implemented via Web Audio API synthesizeChime method.',
    createdAt: '2026-10-25T08:12:00.000Z',
    updatedAt: '2026-11-04T18:00:00.000Z',
  },
  {
    id: 'fb-seed-04',
    userId: 'tester-vip-09',
    userName: 'Arjun K.',
    userEmail: 'arjun.k@fitpro.io',
    type: 'bug',
    title: 'Protein calculation mismatch on mixed Gujarati thali scan',
    description:
      'Scanned a Gujarati thali with 2 phulkas, dal, and cabbage sabzi. The model classified the dal as high-protein chana dal when it was light Gujarati sweet dal.',
    category: 'food_scanner',
    severity: 'medium',
    rating: 3,
    status: 'submitted',
    createdAt: '2026-11-05T12:45:00.000Z',
    updatedAt: '2026-11-05T12:45:00.000Z',
  },
]

function getLocalFeedback(): UserFeedbackItem[] {
  if (typeof window === 'undefined') return DEFAULT_FEEDBACK_SEEDS
  try {
    const raw = localStorage.getItem(STORAGE_FEEDBACK_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(DEFAULT_FEEDBACK_SEEDS))
      return DEFAULT_FEEDBACK_SEEDS
    }
    return JSON.parse(raw) as UserFeedbackItem[]
  } catch {
    return DEFAULT_FEEDBACK_SEEDS
  }
}

function saveLocalFeedback(items: UserFeedbackItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_FEEDBACK_KEY, JSON.stringify(items))
  } catch {
    // Ignore storage quota
  }
}

/**
 * Validates screenshot file size and MIME type.
 */
export function validateScreenshot(file: File | string): { valid: boolean; error?: string } {
  if (typeof file === 'string') {
    // If base64 string
    if (!file.startsWith('data:image/')) {
      return { valid: false, error: 'Screenshot must be a valid image data URI.' }
    }
    // Estimate byte length from base64
    const stringLength = file.length - 'data:image/png;base64,'.length
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383687
    if (sizeInBytes > MAX_SCREENSHOT_BYTES) {
      return { valid: false, error: 'Screenshot exceeds maximum allowed size of 3 MB.' }
    }
    return { valid: true }
  }

  // If File object
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPEG, and WebP images are supported.' }
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { valid: false, error: 'Screenshot file size exceeds 3 MB limit.' }
  }
  return { valid: true }
}

/**
 * Checks client-side rate limit (max 5 submissions per 10 minutes).
 */
export function checkSubmissionRateLimit(): { allowed: boolean; waitSeconds?: number } {
  if (typeof window === 'undefined') return { allowed: true }
  try {
    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000
    const raw = localStorage.getItem(STORAGE_SUBMISSION_TIMESTAMPS_KEY)
    const timestamps: number[] = raw ? JSON.parse(raw) : []

    const validTimestamps = timestamps.filter((t) => now - t < tenMinutes)
    if (validTimestamps.length >= 5) {
      const oldest = Math.min(...validTimestamps)
      const remainingMs = tenMinutes - (now - oldest)
      return { allowed: false, waitSeconds: Math.ceil(remainingMs / 1000) }
    }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

function recordSubmissionTimestamp(): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_SUBMISSION_TIMESTAMPS_KEY)
    const timestamps: number[] = raw ? JSON.parse(raw) : []
    timestamps.push(Date.now())
    localStorage.setItem(STORAGE_SUBMISSION_TIMESTAMPS_KEY, JSON.stringify(timestamps))
  } catch {
    // Ignore
  }
}

/**
 * Submits user feedback (bug, feature request, rating, or improvement).
 */
export async function submitFeedback(input: FeedbackInput): Promise<UserFeedbackItem> {
  // 1. Validation
  const title = (input.title || '').trim()
  const description = (input.description || '').trim()

  if (title.length < 3 || title.length > 120) {
    throw new Error('Title must be between 3 and 120 characters.')
  }
  if (description.length < 10 || description.length > 3000) {
    throw new Error('Description must be between 10 and 3,000 characters.')
  }

  // 2. Screenshot validation
  if (input.screenshotUrl) {
    const check = validateScreenshot(input.screenshotUrl)
    if (!check.valid) {
      throw new Error(check.error)
    }
  }

  // 3. Rate limiting check
  const rateLimit = checkSubmissionRateLimit()
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit reached. Please wait ${rateLimit.waitSeconds}s before submitting another ticket.`)
  }

  const nowIso = new Date().toISOString()
  const newItem: UserFeedbackItem = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: input.userId,
    userName: input.userName || 'YashFit Athlete',
    userEmail: input.userEmail,
    type: input.type,
    title,
    description,
    category: input.category,
    severity: input.severity || 'medium',
    rating: input.rating || null,
    screenshotUrl: input.screenshotUrl || null,
    status: 'submitted',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  // 4. Supabase integration if available
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: input.userId,
          type: input.type,
          title,
          description,
          category: input.category,
          severity: newItem.severity,
          rating: newItem.rating,
          screenshot_url: newItem.screenshotUrl,
          status: 'submitted',
        })
        .select()
        .single()

      if (!error && data) {
        recordSubmissionTimestamp()
        return {
          id: data.id,
          userId: data.user_id,
          userName: input.userName,
          userEmail: input.userEmail,
          type: data.type as FeedbackType,
          title: data.title,
          description: data.description,
          category: data.category as FeedbackCategory,
          severity: data.severity,
          rating: data.rating,
          screenshotUrl: data.screenshot_url,
          status: data.status as FeedbackStatus,
          adminResponse: data.admin_response,
          adminNotes: data.admin_notes,
          isDuplicateOf: data.is_duplicate_of,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      }
    } catch (err) {
      console.warn('Supabase feedback insert fallback to local:', err)
    }
  }

  // 5. Local storage fallback
  const all = getLocalFeedback()
  all.unshift(newItem)
  saveLocalFeedback(all)
  recordSubmissionTimestamp()
  return newItem
}

/**
 * Retrieves feedback tickets submitted by a specific user.
 */
export async function getUserFeedbackList(userId: string): Promise<UserFeedbackItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          type: d.type as FeedbackType,
          title: d.title,
          description: d.description,
          category: d.category as FeedbackCategory,
          severity: d.severity,
          rating: d.rating,
          screenshotUrl: d.screenshot_url,
          status: d.status as FeedbackStatus,
          adminResponse: d.admin_response,
          adminNotes: d.admin_notes,
          isDuplicateOf: d.is_duplicate_of,
          resolvedAt: d.resolved_at,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }))
      }
    } catch {
      // Fall through
    }
  }

  const all = getLocalFeedback()
  return all.filter((item) => item.userId === userId || userId === 'demo-user')
}

/**
 * Computes administrative metrics from a feedback list.
 */
export function calculateFeedbackMetrics(items: UserFeedbackItem[]): FeedbackMetrics {
  const totalCount = items.length
  let openBugsCount = 0
  let resolvedCount = 0
  let featureRequestsCount = 0
  let criticalCount = 0
  let ratingSum = 0
  let ratingCount = 0

  const categoryBreakdown: Record<FeedbackCategory, number> = {
    workout_studio: 0,
    nutrition: 0,
    recovery: 0,
    ai_coach: 0,
    food_scanner: 0,
    body_intelligence: 0,
    arena: 0,
    virtual_gym: 0,
    analytics: 0,
    ui_ux: 0,
    performance: 0,
    other: 0,
  }

  const statusBreakdown: Record<FeedbackStatus, number> = {
    submitted: 0,
    under_review: 0,
    in_progress: 0,
    resolved: 0,
    declined: 0,
    duplicate: 0,
  }

  for (const item of items) {
    if (item.type === 'bug' && item.status !== 'resolved' && item.status !== 'declined') {
      openBugsCount += 1
    }
    if (item.status === 'resolved') {
      resolvedCount += 1
    }
    if (item.type === 'feature_request') {
      featureRequestsCount += 1
    }
    if (item.severity === 'critical') {
      criticalCount += 1
    }
    if (item.rating) {
      ratingSum += item.rating
      ratingCount += 1
    }
    if (categoryBreakdown[item.category] !== undefined) {
      categoryBreakdown[item.category] += 1
    }
    if (statusBreakdown[item.status] !== undefined) {
      statusBreakdown[item.status] += 1
    }
  }

  return {
    totalCount,
    openBugsCount,
    resolvedCount,
    featureRequestsCount,
    criticalCount,
    averageRating: ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(1)) : 5.0,
    categoryBreakdown,
    statusBreakdown,
  }
}

/**
 * Admin: Retrieves all feedback tickets with filtering and telemetry summaries.
 */
export async function getAllFeedbackForAdmin(
  filters?: FeedbackFilters
): Promise<{ items: UserFeedbackItem[]; metrics: FeedbackMetrics }> {
  let allItems: UserFeedbackItem[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        allItems = data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          type: d.type as FeedbackType,
          title: d.title,
          description: d.description,
          category: d.category as FeedbackCategory,
          severity: d.severity,
          rating: d.rating,
          screenshotUrl: d.screenshot_url,
          status: d.status as FeedbackStatus,
          adminResponse: d.admin_response,
          adminNotes: d.admin_notes,
          isDuplicateOf: d.is_duplicate_of,
          resolvedAt: d.resolved_at,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }))
      }
    } catch {
      // Fall through
    }
  }

  if (allItems.length === 0) {
    allItems = getLocalFeedback()
  }

  const metrics = calculateFeedbackMetrics(allItems)

  // Apply filters
  let filtered = [...allItems]
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((i) => i.status === filters.status)
  }
  if (filters?.type && filters.type !== 'all') {
    filtered = filtered.filter((i) => i.type === filters.type)
  }
  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter((i) => i.category === filters.category)
  }
  if (filters?.severity && filters.severity !== 'all') {
    filtered = filtered.filter((i) => i.severity === filters.severity)
  }
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim()
    filtered = filtered.filter(
      (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    )
  }

  return { items: filtered, metrics }
}

/**
 * Admin: Updates feedback status, responds to user, or records private internal team notes.
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNotes?: string,
  adminResponse?: string
): Promise<UserFeedbackItem> {
  const nowIso = new Date().toISOString()
  const resolvedAt = status === 'resolved' ? nowIso : null

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const updatePayload: Record<string, unknown> = {
        status,
        updated_at: nowIso,
      }
      if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes
      if (adminResponse !== undefined) updatePayload.admin_response = adminResponse
      if (resolvedAt) updatePayload.resolved_at = resolvedAt

      const { data, error } = await supabase
        .from('user_feedback')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          type: data.type as FeedbackType,
          title: data.title,
          description: data.description,
          category: data.category as FeedbackCategory,
          severity: data.severity,
          rating: data.rating,
          screenshotUrl: data.screenshot_url,
          status: data.status as FeedbackStatus,
          adminResponse: data.admin_response,
          adminNotes: data.admin_notes,
          isDuplicateOf: data.is_duplicate_of,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
      }
    } catch {
      // Fall through
    }
  }

  const all = getLocalFeedback()
  const idx = all.findIndex((i) => i.id === id)
  if (idx === -1) {
    throw new Error('Feedback item not found.')
  }

  all[idx].status = status
  all[idx].updatedAt = nowIso
  if (adminNotes !== undefined) all[idx].adminNotes = adminNotes
  if (adminResponse !== undefined) all[idx].adminResponse = adminResponse
  if (resolvedAt) all[idx].resolvedAt = resolvedAt

  saveLocalFeedback(all)
  return all[idx]
}

/**
 * Admin: Marks a feedback submission as a duplicate of an earlier issue ticket.
 */
export async function markAsDuplicate(id: string, duplicateOfId: string): Promise<UserFeedbackItem> {
  if (id === duplicateOfId) {
    throw new Error('An issue ticket cannot be a duplicate of itself.')
  }

  return updateFeedbackStatus(
    id,
    'duplicate',
    `Marked as duplicate of ticket ${duplicateOfId}.`,
    `This issue has been consolidated into ticket #${duplicateOfId.slice(-6)}. We are tracking progress there.`
  )
}

