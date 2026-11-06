import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const VirtualCoachContent = dynamic(
  () => import('./VirtualCoachContent').then((mod) => mod.VirtualCoachContent),
  {
    loading: () => <PageLoadingFallback label="Loading AI virtual personal trainer..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Virtual Personal Trainer | YashFit',
  description:
    'Interactive AI personal fitness trainer reasoning across your verified workouts, Indian nutrition, recovery readiness, performance tests, and voice-guided workout instructions.',
}

export default function VirtualCoachPage() {
  return (
    <AppShell>
      <VirtualCoachContent />
    </AppShell>
  )
}
