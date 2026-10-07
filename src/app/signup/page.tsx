'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

function validateForm(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.name.trim()) {
    errors.name = 'Full name is required.'
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const score = [hasLength, hasUpper, hasNumber].filter(Boolean).length

  const levels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-lime-500' },
  ]
  const level = levels[score - 1] || levels[0]

  return (
    <div className="mt-1.5">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? level.color : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500 mt-1">
        Strength: <span className="font-medium">{level.label}</span>
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [values, setValues] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setSuccessMessage('')

    const validationErrors = validateForm(values)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    startTransition(async () => {
      try {
        const { isSupabaseConfigured } = await import('@/lib/profileService')
        
        // If Supabase is not configured yet, run in seamless Local Demo Mode
        if (!isSupabaseConfigured()) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('yashfit_demo_user', JSON.stringify({
              name: values.name.trim(),
              email: values.email.trim(),
            }))
          }
          setSuccessMessage('Account created (Demo Mode)! Taking you to onboarding...')
          setTimeout(() => router.push('/onboarding'), 1000)
          return
        }

        const supabase = createClient()
        const { data: authData, error } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: {
            data: {
              full_name: values.name.trim(),
            },
          },
        })

        if (error) {
          if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
            setErrors({ email: 'An account with this email already exists. Try logging in.' })
          } else if (error.message.toLowerCase().includes('failed to fetch')) {
            // Supabase project URL is unreachable - switch to Demo Mode
            if (typeof window !== 'undefined') {
              localStorage.setItem('yashfit_demo_user', JSON.stringify({
                name: values.name.trim(),
                email: values.email.trim(),
              }))
            }
            setSuccessMessage('Entering Demo Mode! Taking you to onboarding...')
            setTimeout(() => router.push('/onboarding'), 1000)
          } else {
            setErrors({ general: error.message })
          }
          return
        }

        if (authData?.session) {
          setSuccessMessage('Account created! Taking you to onboarding...')
          setTimeout(() => router.push('/onboarding'), 1500)
        } else {
          setSuccessMessage(
            'Account created! Check your email to confirm your address, then sign in.'
          )
          setTimeout(() => router.push('/login'), 3000)
        }
      } catch (err: unknown) {
        // Fallback for network fetch issues
        if (typeof window !== 'undefined') {
          localStorage.setItem('yashfit_demo_user', JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
          }))
        }
        setSuccessMessage('Entering Demo Mode! Taking you to onboarding...')
        setTimeout(() => router.push('/onboarding'), 1000)
      }
    })
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5">
        <YashFitNavLogo />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Start your smarter fitness journey with YashFit
              </p>
            </div>

            {/* General error */}
            {errors.general && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-lg bg-red-950 border border-red-900 text-sm text-red-400"
              >
                {errors.general}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div
                role="status"
                className="mb-5 p-3 rounded-lg bg-emerald-950 border border-emerald-900 text-sm text-emerald-400"
              >
                {successMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={values.name}
                onChange={handleChange('name')}
                error={errors.name}
                leftIcon={<User size={16} />}
                disabled={isPending}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={values.email}
                onChange={handleChange('email')}
                error={errors.email}
                leftIcon={<Mail size={16} />}
                disabled={isPending}
                required
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={handleChange('password')}
                  error={errors.password}
                  leftIcon={<Lock size={16} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  disabled={isPending}
                  required
                />
                <PasswordStrength password={values.password} />
              </div>

              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={errors.confirmPassword}
                leftIcon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                disabled={isPending}
                required
              />

              <Button
                type="submit"
                fullWidth
                loading={isPending}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                className="mt-6"
              >
                {isPending ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-900 px-3 text-xs text-zinc-600">Already have an account?</span>
              </div>
            </div>

            <Link href="/login">
              <Button variant="outline" fullWidth>
                Sign in
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            By creating an account, you agree to YashFit&apos;s{' '}
            <a href="#" className="text-zinc-500 hover:text-white transition-colors underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="text-zinc-500 hover:text-white transition-colors underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}

