import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const TransformationContent = dynamic(
  () => import('./TransformationContent').then((mod) => mod.TransformationContent),
  {
    loading: () => <PageLoadingFallback label="Loading transformation intelligence..." />,
  }
)

export const metadata: Metadata = {
  title: 'Body Transformation Intelligence | YashFit',
  description: 'Track longitudinal body measurements, visual before-and-after photo comparisons, and regression trend rates with uncertainty bounds.',
}

export default function TransformationPage() {
  return (
    <AppShell>
      <TransformationContent />
    </AppShell>
  )
}
