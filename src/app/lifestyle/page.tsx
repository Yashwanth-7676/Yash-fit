import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const LifestyleContent = dynamic(
  () => import('./LifestyleContent').then((mod) => mod.LifestyleContent),
  {
    loading: () => <PageLoadingFallback label="Loading AI lifestyle optimizer..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Lifestyle Optimization | YashFit',
  description:
    'Timezone-aware 24-hour lifestyle schedule aligning workouts, nutrition timing, hydration checkpoints, and circadian recovery with autonomous AI adaptations.',
}

export default function LifestylePage() {
  return (
    <AppShell>
      <LifestyleContent />
    </AppShell>
  )
}
