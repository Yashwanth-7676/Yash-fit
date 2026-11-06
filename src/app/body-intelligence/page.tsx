import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const BodyIntelligenceContent = dynamic(
  () => import('./BodyIntelligenceContent').then((mod) => mod.BodyIntelligenceContent),
  {
    loading: () => <PageLoadingFallback label="Loading Body Composition Intelligence..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Body Composition Intelligence | YashFit',
  description:
    'Scientific body composition analysis, anthropometric U.S. Navy calculations, private progress photo timeline, and delta matrix.',
}

export default function BodyIntelligencePage() {
  return (
    <AppShell>
      <BodyIntelligenceContent />
    </AppShell>
  )
}
