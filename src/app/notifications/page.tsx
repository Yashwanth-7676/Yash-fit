import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const NotificationsContent = dynamic(
  () => import('./NotificationsContent').then((mod) => mod.NotificationsContent),
  {
    loading: () => <PageLoadingFallback label="Loading Smart Notification Center..." />,
  }
)

export const metadata: Metadata = {
  title: 'Smart Notification Center | YashFit',
  description:
    'Manage your workouts, hydration checkpoints, recovery reminders, and circadian quiet hours.',
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <NotificationsContent />
    </AppShell>
  )
}
