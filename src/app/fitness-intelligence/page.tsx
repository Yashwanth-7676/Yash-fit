import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const FitnessIntelligenceContent = dynamic(
  () => import('./FitnessIntelligenceContent').then((mod) => mod.FitnessIntelligenceContent),
  {
    loading: () => <PageLoadingFallback label="Loading fitness intelligence graph..." />,
  }
)

export const metadata: Metadata = {
  title: 'Personal Fitness Intelligence Graph | YashFit',
  description:
    'Multi-dimensional relationship network exploring empirical correlations, data attribution, and explainable causal distinctions across your fitness ecosystem.',
}

export default function FitnessIntelligencePage() {
  return (
    <AppShell>
      <FitnessIntelligenceContent />
    </AppShell>
  )
}
