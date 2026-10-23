import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { RecoveryTrackerContent } from './RecoveryTrackerContent'

export const metadata: Metadata = {
  title: 'Recovery Intelligence',
  description: 'Track sleep, soreness, and physical biomarkers to compute training readiness.',
}

export default function RecoveryPage() {
  return (
    <AppShell>
      <RecoveryTrackerContent />
    </AppShell>
  )
}
