import type { Metadata } from 'next'
import { Lightbulb } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Insights' }

export default function InsightsPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Fitness Insights"
        description="AI-powered analysis of your fitness data to surface patterns, trends, and personalized recommendations. Coming in Phase 2."
        icon={<Lightbulb size={28} />}
      />
    </AppShell>
  )
}

