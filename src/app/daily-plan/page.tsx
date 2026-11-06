import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const DailyPlanContent = dynamic(
  () => import('./DailyPlanContent').then((mod) => mod.DailyPlanContent),
  {
    loading: () => <PageLoadingFallback label="Synthesizing daily fitness agenda..." />,
  }
)

export const metadata: Metadata = {
  title: 'Fitness Life Autopilot & Daily Agenda | YashFit',
  description: 'Synthesize workouts, Indian nutrition, hydration milestones, recovery requirements, and daily quests into an actionable daily fitness agenda.',
}

export default function DailyPlanPage() {
  return (
    <AppShell>
      <DailyPlanContent />
    </AppShell>
  )
}
