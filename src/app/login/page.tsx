'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'
import { Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FormState {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

function validateForm(values: FormState): FormErrors {
  const errors: FormErrors = {}
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  }
  return errors
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [values, setValues] = useState<FormState>({ email: '', password: '' })
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

        if (!isSupabaseConfigured()) {
          setSuccessMessage('Logged in (Demo Mode)! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 1000)
          return
        }

        const supabase = createClient()
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        })

        if (error) {
          if (error.message.toLowerCase().includes('invalid') || error.message.toLowerCase().includes('credentials')) {
            setErrors({ general: 'Incorrect email or password. Please try again.' })
          } else if (error.message.toLowerCase().includes('failed to fetch')) {
            setSuccessMessage('Entering Demo Mode! Redirecting to Dashboard...')
            setTimeout(() => router.push('/dashboard'), 1000)
          } else {
            setErrors({ general: error.message })
          }
          return
        }

        setSuccessMessage('Signed in successfully! Redirecting...')

        // Check if user has completed onboarding in database
        try {
          if (signInData?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('user_id', signInData.user.id)
              .maybeSingle()

            if (profile && profile.onboarding_completed) {
              router.push('/dashboard')
            } else {
              router.push('/onboarding')
            }
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
        router.refresh()
      } catch {
        setSuccessMessage('Entering Demo Mode! Redirecting...')
        setTimeout(() => router.push('/dashboard'), 1000)
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
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-sm text-zinc-500 mt-1">Sign in to your YashFit account</p>
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

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                autoComplete="current-password"
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

              <Button
                type="submit"
                fullWidth
                loading={isPending}
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                className="mt-6"
              >
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-zinc-900 px-3 text-xs text-zinc-600">New to YashFit?</span>
              </div>
            </div>

            <Link href="/signup">
              <Button variant="outline" fullWidth>
                Create an account
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-600">
            By signing in, you agree to YashFit&apos;s{' '}
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

