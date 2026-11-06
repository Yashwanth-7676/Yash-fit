import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const PerformanceLabContent = dynamic(
  () => import('./PerformanceLabContent').then((mod) => mod.PerformanceLabContent),
  {
    loading: () => <PageLoadingFallback label="Loading fitness performance lab..." />,
  }
)

export const metadata: Metadata = {
  title: 'Fitness Performance Lab | YashFit',
  description:
    'Standardized fitness testing, submaximal 1RM calculations, muscular endurance benchmarks, and longitudinal progress tracking against your personal baseline.',
}

export default function PerformanceLabPage() {
  return (
    <AppShell>
      <PerformanceLabContent />
    </AppShell>
  )
}
