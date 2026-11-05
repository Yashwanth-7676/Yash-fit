/**
 * YashFit Changelog & Release Notes Service
 * Provides public release note feeds, version milestones, known issues,
 * and administrator publishing workflows.
 */

import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type { ReleaseNoteItem, ReleaseNoteInput } from '@/types/betaFeedback'

const STORAGE_CHANGELOG_KEY = 'yashfit_release_notes'

export const DEFAULT_RELEASE_NOTES: ReleaseNoteItem[] = [
  {
    id: 'rel-240',
    version: 'v2.4.0',
    title: 'Beta Testing, User Feedback & Production Hardening',
    releaseDate: '2026-11-05',
    summary:
      'Introduces community beta tester invite management, in-app feedback reporting with screenshot attachments, admin issue resolution triage, privacy-conscious telemetry, and production deployment hardening.',
    features: [
      'Invite-only Beta Tester management with tier verification (Beta Tester, VIP, Admin).',
      'In-app Feedback Center (/feedback) with bug reporting, feature proposals, and rating telemetry.',
      'Administrator Feedback Dashboard (/admin/feedback) with ticket resolution, duplicate linking, and direct user responses.',
      'Privacy-conscious, zero-PII telemetry engine with consent opt-out controls.',
      'Public Release Notes portal (/changelog) with version milestone history.',
    ],
    improvements: [
      'Configured HTTP Security Headers (HSTS, CSP, X-Frame-Options DENY, nosniff, strict Permissions-Policy).',
      'Added custom dark-first route error boundary (error.tsx) and global root fallback (global-error.tsx).',
      'Integrated structured server logger with automated JWT and API key scrubbing.',
    ],
    bugFixes: [
      'Resolved MediaPipe pose jitter under low-light gym illumination.',
      'Fixed mobile sidebar layout collision in responsive tablet viewports.',
      'Corrected body fat delta percentage display formatting in transformation analytics.',
    ],
    knownIssues: [
      'Safari iOS low power mode may reduce 3D mannequin rendering to 30 FPS.',
      'Offline meal scans use regional heuristics until cloud network reconnects.',
    ],
    isPublished: true,
    createdAt: '2026-11-05T00:00:00.000Z',
  },
  {
    id: 'rel-230',
    version: 'v2.3.0',
    title: 'AI Body Composition, Workout Studio & Astra Companion',
    releaseDate: '2026-11-04',
    summary:
      'Major intelligence expansion featuring interactive smart workout guidance, predictive 1RM forecasts, computer vision body metrics, and multi-persona conversational companion.',
    features: [
      'Interactive Smart Workout Studio with audio cues, exercise substitutions, and interval timers.',
      'U.S. Navy circumference and clinical body composition transformation comparisons.',
      'Predictive Fitness Engine estimating target weight arrival dates and strength milestones.',
      'Astra AI Personal Companion supporting Disciplined, Scientific, and Encouraging personas.',
    ],
    improvements: [
      'Optimized Indian nutritional lookup with regional breakfast and dinner presets.',
      'Enhanced rest-day streak shield protection in RPG gamification.',
    ],
    bugFixes: [
      'Fixed audio chime overlap on rapid set completions.',
      'Corrected macro rounding on multi-dish Indian food photo scans.',
    ],
    knownIssues: [],
    isPublished: true,
    createdAt: '2026-11-04T00:00:00.000Z',
  },
  {
    id: 'rel-220',
    version: 'v2.2.0',
    title: 'AI Food Vision & Privacy Command Center',
    releaseDate: '2026-10-28',
    summary:
      'Introduces camera meal photo recognition for authentic Indian dishes, automated grocery budgeting, trainer client oversight, and GDPR Article 20 data portability.',
    features: [
      'AI Food Vision scanning Dosa, Idli, Dal, Roti, Paneer, and Mixed Thalis.',
      'Smart Grocery with affordable Indian ingredient substitutions.',
      'Professional Trainer Workspace with private client notes.',
      'Privacy & Security Command Center with instant JSON export and account deletion.',
    ],
    improvements: [
      'Added dark-first high-contrast accessibility tags across all form controls.',
    ],
    bugFixes: [
      'Fixed protein total mismatch when scanning customized multi-dish plates.',
    ],
    knownIssues: [],
    isPublished: true,
    createdAt: '2026-10-28T00:00:00.000Z',
  },
  {
    id: 'rel-200',
    version: 'v2.0.0',
    title: 'Global Fitness Arena & 3D Kinematics',
    releaseDate: '2026-10-20',
    summary:
      'Launched 3D virtual gym anatomy, real-time MediaPipe form analysis, 24-hour lifestyle schedule optimization, and global competitive arena.',
    features: [
      'Global Fitness Arena with solo and team community tournaments.',
      '3D procedural kinematic biomechanical mannequin.',
      '24-Hour AI Lifestyle scheduler optimizing circadian recovery.',
    ],
    improvements: [
      'Upgraded to Next.js 16.4 App Router and React 19 concurrent features.',
    ],
    bugFixes: [
      'Resolved WebGL context loss when switching browser tabs during 3D exercises.',
    ],
    knownIssues: [],
    isPublished: true,
    createdAt: '2026-10-20T00:00:00.000Z',
  },
]

function getLocalReleaseNotes(): ReleaseNoteItem[] {
  if (typeof window === 'undefined') return DEFAULT_RELEASE_NOTES
  try {
    const raw = localStorage.getItem(STORAGE_CHANGELOG_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_CHANGELOG_KEY, JSON.stringify(DEFAULT_RELEASE_NOTES))
      return DEFAULT_RELEASE_NOTES
    }
    return JSON.parse(raw) as ReleaseNoteItem[]
  } catch {
    return DEFAULT_RELEASE_NOTES
  }
}

function saveLocalReleaseNotes(notes: ReleaseNoteItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_CHANGELOG_KEY, JSON.stringify(notes))
  } catch {
    // Ignore storage quota
  }
}

/**
 * Retrieves all published release notes for public viewing.
 */
export async function getPublishedReleaseNotes(): Promise<ReleaseNoteItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('release_notes')
        .select('*')
        .eq('is_published', true)
        .order('release_date', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          version: d.version,
          title: d.title,
          releaseDate: d.release_date,
          summary: d.summary,
          features: d.features || [],
          improvements: d.improvements || [],
          bugFixes: d.bug_fixes || [],
          knownIssues: d.known_issues || [],
          isPublished: d.is_published,
          createdBy: d.created_by,
          createdAt: d.created_at,
        }))
      }
    } catch {
      // Fall through
    }
  }

  const all = getLocalReleaseNotes()
  return all.filter((n) => n.isPublished)
}

/**
 * Admin: Retrieves all release notes including draft/unpublished notes.
 */
export async function getAllReleaseNotesForAdmin(): Promise<ReleaseNoteItem[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('release_notes')
        .select('*')
        .order('release_date', { ascending: false })

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          version: d.version,
          title: d.title,
          releaseDate: d.release_date,
          summary: d.summary,
          features: d.features || [],
          improvements: d.improvements || [],
          bugFixes: d.bug_fixes || [],
          knownIssues: d.known_issues || [],
          isPublished: d.is_published,
          createdBy: d.created_by,
          createdAt: d.created_at,
        }))
      }
    } catch {
      // Fall through
    }
  }

  return getLocalReleaseNotes()
}

/**
 * Admin: Publishes a new release note update.
 */
export async function publishReleaseNote(input: ReleaseNoteInput): Promise<ReleaseNoteItem> {
  const version = (input.version || '').trim()
  const title = (input.title || '').trim()
  const summary = (input.summary || '').trim()

  if (!version.startsWith('v')) {
    throw new Error('Version must begin with "v" (e.g. v2.4.1).')
  }
  if (!title || !summary) {
    throw new Error('Title and summary are required.')
  }

  const nowIso = new Date().toISOString()
  const newItem: ReleaseNoteItem = {
    id: `rel-${Date.now()}`,
    version,
    title,
    releaseDate: input.releaseDate || nowIso.split('T')[0],
    summary,
    features: input.features || [],
    improvements: input.improvements || [],
    bugFixes: input.bugFixes || [],
    knownIssues: input.knownIssues || [],
    isPublished: input.isPublished !== undefined ? input.isPublished : true,
    createdAt: nowIso,
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('release_notes')
        .insert({
          version: newItem.version,
          title: newItem.title,
          release_date: newItem.releaseDate,
          summary: newItem.summary,
          features: newItem.features,
          improvements: newItem.improvements,
          bug_fixes: newItem.bugFixes,
          known_issues: newItem.knownIssues,
          is_published: newItem.isPublished,
        })
        .select()
        .single()

      if (!error && data) {
        return {
          id: data.id,
          version: data.version,
          title: data.title,
          releaseDate: data.release_date,
          summary: data.summary,
          features: data.features || [],
          improvements: data.improvements || [],
          bugFixes: data.bug_fixes || [],
          knownIssues: data.known_issues || [],
          isPublished: data.is_published,
          createdAt: data.created_at,
        }
      }
    } catch {
      // Fall through
    }
  }

  const all = getLocalReleaseNotes()
  all.unshift(newItem)
  saveLocalReleaseNotes(all)
  return newItem
}

