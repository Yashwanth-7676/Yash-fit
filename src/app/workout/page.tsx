import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { WorkoutPlannerContent } from './WorkoutPlannerContent'

export const metadata: Metadata = {
  title: 'Workout Planner',
  description: 'Personalized adaptive workout programming tailored to your routine and available gear.',
}

export default function WorkoutPage() {
  return (
    <AppShell>
      <WorkoutPlannerContent />
    </AppShell>
  )
}
