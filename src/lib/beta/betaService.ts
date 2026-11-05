/**
 * YashFit Beta Tester & Invitation Management Service
 * Provides invitation code validation, tester registration, role verification,
 * admin invite provisioning, and offline/demo fallback.
 */

import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type {
  BetaInvitation,
  BetaTesterProfile,
  BetaRole,
} from '@/types/betaFeedback'

const STORAGE_INVITATIONS_KEY = 'yashfit_beta_invitations'
const STORAGE_TESTERS_KEY = 'yashfit_beta_testers'
const STORAGE_ADMIN_OVERRIDE_KEY = 'yashfit_admin_override'

const DEFAULT_INVITATIONS: BetaInvitation[] = [
  {
    id: 'inv-seed-01',
    code: 'YASH-BETA-2026',
    role: 'beta_tester',
    maxUses: 100,
    usedCount: 18,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'inv-seed-02',
    code: 'VIP-CREW-77',
    role: 'vip_tester',
    maxUses: 25,
    usedCount: 7,
    isActive: true,
    createdAt: '2026-10-15T00:00:00.000Z',
  },
  {
    id: 'inv-seed-03',
    code: 'ADMIN-MASTER-YASH',
    role: 'admin',
    maxUses: 5,
    usedCount: 1,
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
]

function getLocalInvitations(): BetaInvitation[] {
  if (typeof window === 'undefined') return DEFAULT_INVITATIONS
  try {
    const raw = localStorage.getItem(STORAGE_INVITATIONS_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_INVITATIONS_KEY, JSON.stringify(DEFAULT_INVITATIONS))
      return DEFAULT_INVITATIONS
    }
    return JSON.parse(raw) as BetaInvitation[]
  } catch {
    return DEFAULT_INVITATIONS
  }
}

function saveLocalInvitations(invites: BetaInvitation[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_INVITATIONS_KEY, JSON.stringify(invites))
  } catch {
    // Ignore storage quota
  }
}

function getLocalTesters(): Record<string, BetaTesterProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_TESTERS_KEY)
    if (!raw) {
      const initial: Record<string, BetaTesterProfile> = {
        'demo-user': {
          id: 'tester-demo-01',
          userId: 'demo-user',
          inviteCode: 'YASH-BETA-2026',
          role: 'beta_tester',
          status: 'active',
          feedbackCount: 3,
          onboardingCompleted: true,
          joinedAt: '2026-10-20T10:00:00.000Z',
        },
      }
      localStorage.setItem(STORAGE_TESTERS_KEY, JSON.stringify(initial))
      return initial
    }
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveLocalTesters(testers: Record<string, BetaTesterProfile>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_TESTERS_KEY, JSON.stringify(testers))
  } catch {
    // Ignore storage quota
  }
}

/**
 * Validates whether an invite code exists, is active, has remaining uses, and is unexpired.
 */
export async function validateInviteCode(
  code: string
): Promise<{ valid: boolean; invite?: BetaInvitation; reason?: string }> {
  const normalized = (code || '').trim().toUpperCase()
  if (!normalized) {
    return { valid: false, reason: 'Invitation code cannot be empty.' }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .eq('code', normalized)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        console.warn('Supabase invite validation failed, checking fallback:', error.message)
      } else if (data) {
        const invite: BetaInvitation = {
          id: data.id,
          code: data.code,
          email: data.email,
          role: data.role as BetaRole,
          maxUses: data.max_uses,
          usedCount: data.used_count,
          expiresAt: data.expires_at,
          isActive: data.is_active,
          createdAt: data.created_at,
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          return { valid: false, reason: 'This invitation code has expired.' }
        }
        if (invite.usedCount >= invite.maxUses) {
          return { valid: false, reason: 'This invitation code has reached maximum usage limit.' }
        }
        return { valid: true, invite }
      }
    } catch (err) {
      console.warn('Supabase check errored, falling back:', err)
    }
  }

  // Local / Offline fallback
  const localInvites = getLocalInvitations()
  const found = localInvites.find((i) => i.code === normalized)

  if (!found) {
    return { valid: false, reason: 'Invalid beta invitation code.' }
  }
  if (!found.isActive) {
    return { valid: false, reason: 'This invitation code is no longer active.' }
  }
  if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
    return { valid: false, reason: 'This invitation code has expired.' }
  }
  if (found.usedCount >= found.maxUses) {
    return { valid: false, reason: 'This invitation code has reached maximum usage limit.' }
  }

  return { valid: true, invite: found }
}

/**
 * Registers an authenticated user or demo user as an active beta tester.
 */
export async function registerTester(
  userId: string,
  inviteCode: string
): Promise<{ success: boolean; tester?: BetaTesterProfile; error?: string }> {
  const validation = await validateInviteCode(inviteCode)
  if (!validation.valid || !validation.invite) {
    return { success: false, error: validation.reason || 'Invalid code' }
  }

  const role = validation.invite.role

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('beta_testers')
        .upsert({
          user_id: userId,
          invite_code: validation.invite.code,
          role,
          status: 'active',
          onboarding_completed: true,
          joined_at: new Date().toISOString(),
          left_at: null,
        })
        .select()
        .single()

      if (!error && data) {
        // Increment usage count on invitation
        await supabase
          .from('beta_invitations')
          .update({ used_count: validation.invite.usedCount + 1 })
          .eq('code', validation.invite.code)

        const testerProfile: BetaTesterProfile = {
          id: data.id,
          userId: data.user_id,
          inviteCode: data.invite_code,
          role: data.role as BetaRole,
          status: 'active',
          feedbackCount: data.feedback_count || 0,
          onboardingCompleted: true,
          joinedAt: data.joined_at,
        }
        return { success: true, tester: testerProfile }
      }
    } catch (err) {
      console.warn('Supabase tester registration fallback to local:', err)
    }
  }

  // Local storage registration
  const testers = getLocalTesters()
  const newProfile: BetaTesterProfile = {
    id: `tester-${Date.now()}`,
    userId,
    inviteCode: validation.invite.code,
    role,
    status: 'active',
    feedbackCount: testers[userId]?.feedbackCount || 0,
    onboardingCompleted: true,
    joinedAt: new Date().toISOString(),
    leftAt: null,
  }
  testers[userId] = newProfile
  saveLocalTesters(testers)

  // Increment usage count locally
  const invites = getLocalInvitations()
  const idx = invites.findIndex((i) => i.code === validation.invite!.code)
  if (idx !== -1) {
    invites[idx].usedCount += 1
    saveLocalInvitations(invites)
  }

  return { success: true, tester: newProfile }
}

/**
 * Retrieves the beta tester profile for a given user.
 */
export async function getTesterProfile(userId: string): Promise<BetaTesterProfile | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('beta_testers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          inviteCode: data.invite_code,
          role: data.role as BetaRole,
          status: data.status,
          feedbackCount: data.feedback_count || 0,
          onboardingCompleted: data.onboarding_completed,
          joinedAt: data.joined_at,
          leftAt: data.left_at,
        }
      }
    } catch {
      // Fall through to local
    }
  }

  const testers = getLocalTesters()
  return testers[userId] || null
}

/**
 * Allows a tester to voluntarily opt-out / leave the beta program.
 */
export async function leaveBetaProgram(userId: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      await supabase
        .from('beta_testers')
        .update({
          status: 'left_program',
          left_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } catch {
      // Fall through
    }
  }

  const testers = getLocalTesters()
  if (testers[userId]) {
    testers[userId].status = 'left_program'
    testers[userId].leftAt = new Date().toISOString()
    saveLocalTesters(testers)
  }

  return { success: true }
}

/**
 * Checks whether the current user holds administrator privileges.
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const override = localStorage.getItem(STORAGE_ADMIN_OVERRIDE_KEY)
    if (override === 'true') return true
  }

  const profile = await getTesterProfile(userId)
  return profile?.role === 'admin' && profile?.status === 'active'
}

/**
 * Toggles demo admin override for testing and UI evaluation.
 */
export function setDemoAdminMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_ADMIN_OVERRIDE_KEY, enabled ? 'true' : 'false')
}

export function isDemoAdminModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_ADMIN_OVERRIDE_KEY) === 'true'
}

/**
 * Retrieves all invitations for the admin panel.
 */
export async function getAdminInvitations(): Promise<BetaInvitation[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data.map((d) => ({
          id: d.id,
          code: d.code,
          email: d.email,
          createdBy: d.created_by,
          role: d.role as BetaRole,
          maxUses: d.max_uses,
          usedCount: d.used_count,
          expiresAt: d.expires_at,
          isActive: d.is_active,
          createdAt: d.created_at,
        }))
      }
    } catch {
      // Fall through
    }
  }

  return getLocalInvitations()
}

/**
 * Admin: Creates a new invitation code.
 */
export async function createAdminInvitation(
  input: {
    code?: string
    role?: BetaRole
    maxUses?: number
    email?: string | null
    expiresAt?: string | null
  }
): Promise<BetaInvitation> {
  const generatedCode = input.code?.trim().toUpperCase() || `YASH-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
  const newInvite: BetaInvitation = {
    id: `inv-${Date.now()}`,
    code: generatedCode,
    role: input.role || 'beta_tester',
    maxUses: input.maxUses || 10,
    usedCount: 0,
    email: input.email || null,
    expiresAt: input.expiresAt || null,
    isActive: true,
    createdAt: new Date().toISOString(),
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('beta_invitations')
        .insert({
          code: newInvite.code,
          role: newInvite.role,
          max_uses: newInvite.maxUses,
          email: newInvite.email,
          expires_at: newInvite.expiresAt,
          is_active: true,
        })
        .select()
        .single()

      if (!error && data) {
        return {
          id: data.id,
          code: data.code,
          role: data.role as BetaRole,
          maxUses: data.max_uses,
          usedCount: data.used_count,
          email: data.email,
          expiresAt: data.expires_at,
          isActive: data.is_active,
          createdAt: data.created_at,
        }
      }
    } catch {
      // Fall through
    }
  }

  const invites = getLocalInvitations()
  invites.unshift(newInvite)
  saveLocalInvitations(invites)
  return newInvite
}

/**
 * Admin: Revokes an active invitation code.
 */
export async function revokeAdminInvitation(inviteId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      await supabase
        .from('beta_invitations')
        .update({ is_active: false })
        .eq('id', inviteId)
    } catch {
      // Fall through
    }
  }

  const invites = getLocalInvitations()
  const idx = invites.findIndex((i) => i.id === inviteId)
  if (idx !== -1) {
    invites[idx].isActive = false
    saveLocalInvitations(invites)
    return true
  }
  return false
}

