'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('YashFit Critical Global Error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-white antialiased flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-xl">
            !
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              Critical Runtime Error
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Application encountered a critical error
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              The root layout was unable to initialize. Reloading the application usually resolves this state.
            </p>
          </div>

          {error.digest && (
            <div className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-800">
              <p className="text-xs font-mono text-zinc-500 break-all">
                Reference: {error.digest}
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-lime-400 text-zinc-950 font-semibold text-sm hover:bg-lime-300 transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/'
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Reload App
            </button>
          </div>
        </div>

        <p className="mt-12 text-xs text-zinc-600">
          YashFit OS · Fault Recovery System
        </p>
      </body>
    </html>
  )
}

