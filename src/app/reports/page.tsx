import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const ReportsContent = dynamic(
  () => import('./ReportsContent').then((mod) => mod.ReportsContent),
  {
    loading: () => <PageLoadingFallback label="Loading fitness intelligence reports..." />,
  }
)

export const metadata: Metadata = {
  title: 'Fitness Intelligence Reports | YashFit',
  description:
    'Verifiable multi-period fitness intelligence audits, longitudinal strength progression, habit consistency analysis, and printable executive summaries.',
}

export default function ReportsPage() {
  return (
    <AppShell>
      <ReportsContent />
    </AppShell>
  )
}
