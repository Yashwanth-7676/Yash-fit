import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { ExercisesContent } from './ExercisesContent'

export const metadata: Metadata = {
  title: 'Exercises Library',
  description: 'Explore the complete YashFit exercise database with execution instructions and cues.',
}

export default function ExercisesPage() {
  return (
    <AppShell>
      <ExercisesContent />
    </AppShell>
  )
}
