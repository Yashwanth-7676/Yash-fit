import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WorkoutSessionTracker } from './WorkoutSessionTracker'

export const metadata: Metadata = {
  title: 'Active Workout Session',
  description: 'Track sets, weights, and reps with interactive workout rest timer.',
}

export default function WorkoutSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
          Loading workout session...
        </div>
      }
    >
      <WorkoutSessionTracker />
    </Suspense>
  )
}

