import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const IntegrationsContent = dynamic(
  () => import('./IntegrationsContent').then((mod) => mod.IntegrationsContent),
  {
    loading: () => <PageLoadingFallback label="Loading wearable integrations hub..." />,
  }
)

export const metadata: Metadata = {
  title: 'Wearable Intelligence Hub & Health Bridges | YashFit',
  description: 'Connect Apple Health, Google Health Connect, Garmin, Whoop, and Oura with real telemetry verification and honest disconnected states.',
}

export default function IntegrationsPage() {
  return (
    <AppShell>
      <IntegrationsContent />
    </AppShell>
  )
}
