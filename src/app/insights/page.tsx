import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { FitnessInsightsContent } from './FitnessInsightsContent'

export const metadata: Metadata = {
  title: 'AI Fitness Insights',
  description: 'Intelligent fitness coaching and pattern recognition across your workouts, nutrition, and recovery.',
}

export default function InsightsPage() {
  return (
    <AppShell>
      <FitnessInsightsContent />
    </AppShell>
  )
}
