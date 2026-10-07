import type { Metadata } from 'next'
import { Heart } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Recovery' }

export default function RecoveryPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Recovery Tracking"
        description="Log your recovery metrics, understand your readiness, and optimize your training schedule. Coming in Phase 2."
        icon={<Heart size={28} />}
      />
    </AppShell>
  )
}

