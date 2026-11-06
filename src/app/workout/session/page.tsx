import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { PageLoadingFallback } from '@/components/ui'

const WorkoutSessionTracker = dynamic(
  () => import('./WorkoutSessionTracker').then((mod) => mod.WorkoutSessionTracker),
  {
    loading: () => <PageLoadingFallback label="Loading active workout session..." />,
  }
)

export const metadata: Metadata = {
  title: 'Active Workout Session | YashFit',
  description: 'Track sets, weights, and reps with interactive workout rest timer.',
}

export default function WorkoutSessionPage() {
  return <WorkoutSessionTracker />
}
