import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const TrainingAutopilotContent = dynamic(
  () => import('./TrainingAutopilotContent').then((mod) => mod.TrainingAutopilotContent),
  {
    loading: () => <PageLoadingFallback label="Initializing smart training autopilot..." />,
  }
)

export const metadata: Metadata = {
  title: 'Smart Training Autopilot | YashFit',
  description:
    'Intelligent, explainable workout adaptations, conservative progressive overload, and recovery-aware weekly training schedules.',
}

export default function TrainingAutopilotPage() {
  return (
    <AppShell>
      <TrainingAutopilotContent />
    </AppShell>
  )
}
