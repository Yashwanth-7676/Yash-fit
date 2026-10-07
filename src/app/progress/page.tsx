import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Progress' }

export default function ProgressPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Progress Tracking"
        description="Track your strength gains, body composition trends, and workout consistency over time. Coming in Phase 2."
        icon={<TrendingUp size={28} />}
      />
    </AppShell>
  )
}

