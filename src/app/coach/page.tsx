import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const CoachContent = dynamic(
  () => import('./CoachContent').then((mod) => mod.CoachContent),
  {
    loading: () => <PageLoadingFallback label="Connecting to YashFit AI Coach..." />,
  }
)

export const metadata: Metadata = {
  title: 'Personal AI Fitness Coach 2.0 | YashFit',
  description: 'Evidence-based conversational fitness coach reasoning across workout telemetry, recovery check-ins, Indian nutrition, and transformation data.',
}

export default function CoachPage() {
  return (
    <AppShell>
      <CoachContent />
    </AppShell>
  )
}
