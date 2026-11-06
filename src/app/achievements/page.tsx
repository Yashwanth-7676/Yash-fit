import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const AchievementsContent = dynamic(
  () => import('./AchievementsContent').then((mod) => mod.AchievementsContent),
  {
    loading: () => <PageLoadingFallback label="Loading achievements & RPG badges..." />,
  }
)

export const metadata: Metadata = {
  title: 'Achievements & Badges | YashFit RPG',
  description: 'Track and unlock anime fitness achievement badges for training consistency, volume, recovery, and form.',
}

export default function AchievementsPage() {
  return (
    <AppShell>
      <AchievementsContent />
    </AppShell>
  )
}
