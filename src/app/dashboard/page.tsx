import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { DashboardContent } from './DashboardContent'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  )
}

