import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const QuestsContent = dynamic(
  () => import('./QuestsContent').then((mod) => mod.QuestsContent),
  {
    loading: () => <PageLoadingFallback label="Loading daily quests & milestones..." />,
  }
)

export const metadata: Metadata = {
  title: 'Daily & Weekly Quests | YashFit RPG',
  description: 'Complete daily workouts, hydration goals, and recovery habits to level up your anime fitness avatar.',
}

export default function QuestsPage() {
  return (
    <AppShell>
      <QuestsContent />
    </AppShell>
  )
}
