import type { Metadata } from 'next'
import { Dumbbell } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Workout' }

export default function WorkoutPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Workout Planner"
        description="Adaptive workout plans personalized to your goals, recovery, and equipment. Coming in Phase 2."
        icon={<Dumbbell size={28} />}
      />
    </AppShell>
  )
}

