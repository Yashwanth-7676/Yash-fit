import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const AITrainerContent = dynamic(
  () => import('./AITrainerContent').then((mod) => mod.AITrainerContent),
  {
    loading: () => <PageLoadingFallback label="Loading AI Vision Personal Trainer..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Vision Personal Trainer & Form Coach | YashFit',
  description:
    'Real-time computer vision personal trainer powered by MediaPipe. Automatic repetition counting, biomechanical form analysis, live voice coaching, and bilateral symmetry tracking.',
}

export default function AITrainerPage() {
  return (
    <AppShell>
      <AITrainerContent />
    </AppShell>
  )
}
