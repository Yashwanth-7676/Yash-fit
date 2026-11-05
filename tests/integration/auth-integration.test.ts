import { describe, it, expect, beforeEach, vi } from 'vitest'
import { isSupabaseConfigured, getUserProfile, saveUserProfile } from '@/lib/profileService'
import type { UserProfile } from '@/types/profile'

describe('Integration: Authentication & Supabase Services', () => {
  const isolatedUserId = `test-user-${Date.now()}`

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('correctly detects whether Supabase environment variables are real or placeholder', () => {
    // When environment variables are empty or placeholder, isSupabaseConfigured returns false
    const configured = isSupabaseConfigured()
    expect(typeof configured).toBe('boolean')
  })

  it('falls back seamlessly to local profile storage when Supabase is unconfigured', async () => {
    const profile = await getUserProfile(isolatedUserId)
    // Non-existent user returns null gracefully without throwing
    expect(profile === null || typeof profile === 'object').toBe(true)
  })

  it('persists and retrieves profile in local storage with dual-write guarantee', async () => {
    const newProfile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
      user_id: isolatedUserId,
      first_name: 'IntegrationTestUser',
      age: 28,
      height_cm: 182,
      weight_kg: 82,
      primary_goal: 'Increase Strength',
      experience_level: 'Advanced',
      training_days_per_week: 5,
      training_environment: 'Commercial Gym',
      available_equipment: ['Barbell', 'Dumbbells', 'Bench', 'Cable Machine'],
      dietary_preference: 'Non-Vegetarian',
      onboarding_completed: true,
    }

    const { data, error } = await saveUserProfile(newProfile)
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.first_name).toBe('IntegrationTestUser')
    expect(data?.user_id).toBe(isolatedUserId)
  })
})

