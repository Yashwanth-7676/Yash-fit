import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const FitnessWorldContent = dynamic(
  () => import('./FitnessWorldContent').then((mod) => mod.FitnessWorldContent),
  {
    loading: () => <PageLoadingFallback label="Loading 3D virtual fitness world..." />,
  }
)

export const metadata: Metadata = {
  title: 'Immersive Virtual Fitness World | YashFit',
  description:
    'Interactive 3D training space with customizable avatar, exercise station demonstrators, environment presets, and multiplayer workout rooms.',
}

export default function FitnessWorldPage() {
  return (
    <AppShell>
      <FitnessWorldContent />
    </AppShell>
  )
}
