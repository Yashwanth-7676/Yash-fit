import type { Metadata } from 'next'
import { Activity } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Exercises' }

export default function ExercisesPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Exercise Library"
        description="A complete library of exercises with instructions, muscle groups, and equipment alternatives. Coming in Phase 2."
        icon={<Activity size={28} />}
      />
    </AppShell>
  )
}

