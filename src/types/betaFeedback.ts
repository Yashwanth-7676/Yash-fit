/**
 * YashFit Beta Testing, User Feedback, and Release Intelligence Types
 * Mega Upgrade #39
 */

export type BetaRole = 'beta_tester' | 'vip_tester' | 'admin'

export type BetaTesterStatus = 'active' | 'inactive' | 'left_program' | 'revoked'

export interface BetaInvitation {
  id: string
  code: string
  email?: string | null
  createdBy?: string | null
  role: BetaRole
  maxUses: number
  usedCount: number
  expiresAt?: string | null
  isActive: boolean
  createdAt: string
}

export interface BetaTesterProfile {
  id: string
  userId: string
  inviteCode?: string | null
  role: BetaRole
  status: BetaTesterStatus
  feedbackCount: number
  onboardingCompleted: boolean
  joinedAt: string
  leftAt?: string | null
}

export type FeedbackType = 'bug' | 'feature_request' | 'improvement' | 'rating' | 'general'

export type FeedbackCategory =
  | 'workout_studio'
  | 'nutrition'
  | 'recovery'
  | 'ai_coach'
  | 'food_scanner'
  | 'body_intelligence'
  | 'arena'
  | 'virtual_gym'
  | 'analytics'
  | 'ui_ux'
  | 'performance'
  | 'other'

export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical'

export type FeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'declined'
  | 'duplicate'

export interface UserFeedbackItem {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  type: FeedbackType
  title: string
  description: string
  category: FeedbackCategory
  severity: FeedbackSeverity
  rating?: number | null
  screenshotUrl?: string | null
  status: FeedbackStatus
  adminResponse?: string | null
  adminNotes?: string | null
  isDuplicateOf?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackInput {
  userId: string
  userName?: string
  userEmail?: string
  type: FeedbackType
  title: string
  description: string
  category: FeedbackCategory
  severity?: FeedbackSeverity
  rating?: number | null
  screenshotUrl?: string | null
}

export interface FeedbackMetrics {
  totalCount: number
  openBugsCount: number
  resolvedCount: number
  featureRequestsCount: number
  criticalCount: number
  averageRating: number
  categoryBreakdown: Record<FeedbackCategory, number>
  statusBreakdown: Record<FeedbackStatus, number>
}

export interface FeedbackFilters {
  status?: FeedbackStatus | 'all'
  type?: FeedbackType | 'all'
  category?: FeedbackCategory | 'all'
  severity?: FeedbackSeverity | 'all'
  searchQuery?: string
}

export type AnalyticsCategory =
  | 'onboarding'
  | 'feature_usage'
  | 'workflow'
  | 'error'
  | 'performance'

export type AnalyticsEventName =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'feature_accessed'
  | 'workout_session_started'
  | 'workout_session_completed'
  | 'meal_logged'
  | 'recovery_logged'
  | 'food_scanned'
  | 'feedback_submitted'
  | 'error_boundary_triggered'
  | 'api_fallback_used'
  | 'performance_slow_render'

export interface AnalyticsEvent {
  id: string
  userId?: string | null
  eventName: AnalyticsEventName
  category: AnalyticsCategory
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AnalyticsSummary {
  totalEvents: number
  onboardingCompletionRate: number
  topFeaturesUsed: Array<{ feature: string; count: number }>
  completedWorkflowsCount: number
  errorIncidentsCount: number
  avgClientRenderTimeMs: number
}

export interface ReleaseNoteItem {
  id: string
  version: string
  title: string
  releaseDate: string
  summary: string
  features: string[]
  improvements: string[]
  bugFixes: string[]
  knownIssues: string[]
  isPublished: boolean
  createdBy?: string | null
  createdAt: string
}

export interface ReleaseNoteInput {
  version: string
  title: string
  releaseDate: string
  summary: string
  features: string[]
  improvements: string[]
  bugFixes: string[]
  knownIssues: string[]
  isPublished?: boolean
}
