import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const TrainerContent = dynamic(
  () => import('./TrainerContent').then((mod) => mod.TrainerContent),
  {
    loading: () => <PageLoadingFallback label="Loading professional trainer workspace..." />,
  }
)

export const metadata: Metadata = {
  title: 'Professional Trainer Workspace | YashFit',
  description:
    'Dedicated coaching workspace with client rosters, workout & nutrition prescription, private trainer notes, consent scopes, and client check-in reviews.',
}

export default function TrainerPage() {
  return (
    <AppShell>
      <TrainerContent />
    </AppShell>
  )
}
