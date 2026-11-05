'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button } from '@/components/ui'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log client-side error to console or error tracking service
    console.error('YashFit Client Route Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <YashFitLogo />
      </div>

      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle size={28} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Session Interrupted
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            An unexpected error occurred in this module. Your logged fitness data is safe.
          </p>
        </div>

        {error.digest && (
          <div className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-800/80">
            <p className="text-xs font-mono text-zinc-500 break-all">
              Error Digest: {error.digest}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            icon={<RefreshCw size={16} />}
            className="w-full sm:w-auto"
          >
            Try Again
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="outline"
              icon={<Home size={16} />}
              className="w-full"
            >
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-2 border-t border-zinc-800/60">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-lime-400 transition-colors"
          >
            <HelpCircle size={14} />
            <span>Need assistance? Contact YashFit Support</span>
          </Link>
        </div>
      </div>

      <p className="mt-12 text-xs text-zinc-600">
        YashFit OS · Resilient Fitness Intelligence
      </p>
    </div>
  )
}

