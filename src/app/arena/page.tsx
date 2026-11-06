import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const ArenaContent = dynamic(
  () => import('./ArenaContent').then((mod) => mod.ArenaContent),
  {
    loading: () => <PageLoadingFallback label="Loading Global Fitness Arena..." />,
  }
)

export const metadata: Metadata = {
  title: 'Global Fitness Arena | YashFit',
  description:
    'Verified public and private competitions, weekly tournaments, team leaderboards, anti-exploit volume scoring, and fair-play fitness leagues.',
}

export default function ArenaPage() {
  return (
    <AppShell>
      <ArenaContent />
    </AppShell>
  )
}
