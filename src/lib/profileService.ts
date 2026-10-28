import { createClient } from './supabase/client'
import type { UserProfile } from '../types/profile'

const PROFILE_STORAGE_KEY = 'yashfit_demo_profile'

/**
 * Checks if Supabase client is configured with real URL and key
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(
    url &&
    key &&
    url !== 'your_supabase_project_url' &&
    !url.includes('your-project') &&
    !url.includes('placeholder') &&
    key !== 'your_supabase_anon_key' &&
    !key.includes('your-anon-key') &&
    !key.includes('placeholder')
  )
}

/**
 * Fetch the authenticated user's profile from Supabase,
 * with graceful fallback to browser session storage if Supabase credentials are not yet configured.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Error fetching profile from Supabase:', error.message)
        // Check if there is a local cached profile
        return getLocalProfile(userId)
      }

      if (data) {
        return data as UserProfile
      }
    } catch (err) {
      console.warn('Supabase profile query failed:', err)
      return getLocalProfile(userId)
    }
  }

  return getLocalProfile(userId)
}

/**
 * Save or update the user profile in Supabase,
 * with fallback to browser storage for demo/development if Supabase is unconfigured.
 */
export async function saveUserProfile(
  profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: UserProfile | null; error: string | null }> {
  // Always update local cache so UI is immediately responsive
  saveLocalProfile(profile)

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            ...profile,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (error) {
        return { data: null, error: error.message }
      }

      return { data: data as UserProfile, error: null }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database operation failed'
      return { data: null, error: message }
    }
  }

  // Fallback mode: simulate successful save
  const demoProfile: UserProfile = {
    ...profile,
    id: 'demo-profile-' + profile.user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  return { data: demoProfile, error: null }
}

function getLocalProfile(userId: string): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY}_${userId}`) ||
      (userId === 'demo-user' ? localStorage.getItem(PROFILE_STORAGE_KEY) : null)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch (error) {
    console.warn('Unable to read the locally cached user profile:', error)
    return null
  }
}

function saveLocalProfile(profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${PROFILE_STORAGE_KEY}_${profile.user_id}`,
      JSON.stringify(profile)
    )
    if (profile.user_id === 'demo-user') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    }
  } catch {
    // ignore local storage errors
  }
}
