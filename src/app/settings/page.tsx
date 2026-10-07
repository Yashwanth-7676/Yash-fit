import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { SettingsContent } from './SettingsContent'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your YashFit fitness goals, measurements, and training preferences.',
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  )
}
