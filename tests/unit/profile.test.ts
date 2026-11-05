import { describe, it, expect } from 'vitest'
import {
  validateProfileData,
  VALID_PRIMARY_GOALS,
  VALID_EXPERIENCE_LEVELS,
  VALID_ENVIRONMENTS,
  VALID_DIET_PREFERENCES,
} from '@/lib/validation/profileValidation'
import type { ProfileFormData } from '@/types/profile'

describe('Unit: Profile Validation & Domain Constraints', () => {
  const validForm: ProfileFormData = {
    first_name: 'Yash',
    age: 26,
    height_cm: 178,
    weight_kg: 74,
    primary_goal: 'Build Muscle',
    experience_level: 'Intermediate',
    training_days_per_week: 4,
    training_environment: 'Commercial Gym',
    available_equipment: ['Barbell', 'Dumbbells', 'Bench'],
    dietary_preference: 'Vegetarian',
  }

  it('validates a correct profile form payload with 0 errors', () => {
    const result = validateProfileData(validForm)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('rejects empty or whitespace-only first names', () => {
    const resultEmpty = validateProfileData({ ...validForm, first_name: '' })
    expect(resultEmpty.isValid).toBe(false)
    expect(resultEmpty.errors.first_name).toBeDefined()

    const resultWhitespace = validateProfileData({ ...validForm, first_name: '   ' })
    expect(resultWhitespace.isValid).toBe(false)
    expect(resultWhitespace.errors.first_name).toBeDefined()
  })

  it('enforces age constraints between 14 and 100 years', () => {
    expect(validateProfileData({ ...validForm, age: 13 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, age: 101 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, age: 14 }).isValid).toBe(true)
    expect(validateProfileData({ ...validForm, age: 100 }).isValid).toBe(true)
    expect(validateProfileData({ ...validForm, age: 'twenty' }).isValid).toBe(false)
  })

  it('enforces height constraints between 100cm and 240cm', () => {
    expect(validateProfileData({ ...validForm, height_cm: 99 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, height_cm: 241 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, height_cm: 175 }).isValid).toBe(true)
  })

  it('enforces weight constraints between 30kg and 250kg', () => {
    expect(validateProfileData({ ...validForm, weight_kg: 29 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, weight_kg: 251 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, weight_kg: 74.5 }).isValid).toBe(true)
  })

  it('enforces training frequency between 1 and 7 days per week', () => {
    expect(validateProfileData({ ...validForm, training_days_per_week: 0 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, training_days_per_week: 8 }).isValid).toBe(false)
    expect(validateProfileData({ ...validForm, training_days_per_week: 5 }).isValid).toBe(true)
  })

  it('validates primary goal against allowed enumerated values', () => {
    VALID_PRIMARY_GOALS.forEach((goal) => {
      expect(validateProfileData({ ...validForm, primary_goal: goal }).isValid).toBe(true)
    })
    // @ts-expect-error Testing invalid runtime enum
    expect(validateProfileData({ ...validForm, primary_goal: 'Win Marathon' }).isValid).toBe(false)
  })

  it('validates experience level against allowed enumerated values', () => {
    VALID_EXPERIENCE_LEVELS.forEach((level) => {
      expect(validateProfileData({ ...validForm, experience_level: level }).isValid).toBe(true)
    })
    // @ts-expect-error Testing invalid runtime enum
    expect(validateProfileData({ ...validForm, experience_level: 'Master' }).isValid).toBe(false)
  })

  it('validates training environment and dietary preferences', () => {
    VALID_ENVIRONMENTS.forEach((env) => {
      expect(validateProfileData({ ...validForm, training_environment: env }).isValid).toBe(true)
    })
    VALID_DIET_PREFERENCES.forEach((diet) => {
      expect(validateProfileData({ ...validForm, dietary_preference: diet }).isValid).toBe(true)
    })
  })
})

