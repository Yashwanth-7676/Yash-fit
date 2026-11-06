import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const WorkoutStudioContent = dynamic(
  () => import('./WorkoutStudioContent').then((mod) => mod.WorkoutStudioContent),
  {
    loading: () => <PageLoadingFallback label="Loading interactive smart workout studio..." />,
  }
)

export const metadata: Metadata = {
  title: 'Interactive Smart Workout Studio | YashFit',
  description:
    'Guided workout interface with biomechanical kinematics solver, interactive set logging, audio rest timer, and voice coach.',
}

export default function WorkoutStudioPage() {
  return (
    <AppShell>
      <WorkoutStudioContent />
    </AppShell>
  )
}
