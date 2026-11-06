import React from 'react'
import { LoadingSpinner } from '@/components/ui'

interface PageLoadingFallbackProps {
  label?: string
}

export function PageLoadingFallback({ label = 'Loading fitness intelligence...' }: PageLoadingFallbackProps) {
  return (
    <div className="w-full min-h-[460px] flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lime-400 shadow-lg">
        <LoadingSpinner size="md" label={label} />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white tracking-tight">{label}</p>
        <p className="text-xs text-zinc-500 font-medium">YashFit High-Performance Engine</p>
      </div>
    </div>
  )
}
