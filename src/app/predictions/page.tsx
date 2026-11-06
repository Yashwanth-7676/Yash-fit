import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const PredictionsContent = dynamic(
  () => import('./PredictionsContent').then((mod) => mod.PredictionsContent),
  {
    loading: () => <PageLoadingFallback label="Synthesizing predictive fitness forecast..." />,
  }
)

export const metadata: Metadata = {
  title: 'Predictive Fitness Intelligence | YashFit',
  description:
    'Long-range physiological forecasting, compound strength 1RM progression trajectories, weight timeline estimates, and transparent mathematical explainability.',
}

export default function PredictionsPage() {
  return (
    <AppShell>
      <PredictionsContent />
    </AppShell>
  )
}
