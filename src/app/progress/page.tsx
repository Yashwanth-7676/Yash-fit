import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { ProgressAnalyticsContent } from './ProgressAnalyticsContent'

export const metadata: Metadata = {
  title: 'Progress & Strength Analytics',
  description: 'Track compound lift progression, weekly tonnage, and workout consistency over time.',
}

export default function ProgressPage() {
  return (
    <AppShell>
      <ProgressAnalyticsContent />
    </AppShell>
  )
}
