import type { Metadata } from 'next'
import { Suspense } from 'react'
import { VirtualGymContent } from './VirtualGymContent'

export const metadata: Metadata = {
  title: '3D Virtual Gym & Interactive Muscle Intelligence | YashFit',
  description:
    'Simulate human joint mechanics in 3D, inspect real muscle activation, and track weekly muscle-group training volume.',
}

export default function VirtualGymPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400">Loading 3D Virtual Gym...</p>
          </div>
        </div>
      }
    >
      <VirtualGymContent />
    </Suspense>
  )
}
