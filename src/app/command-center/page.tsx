import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { CommandCenterContent } from './CommandCenterContent'

export const metadata: Metadata = {
  title: 'AI Command Center | YashFit',
  description:
    'Comprehensive AI Fitness Command Center synthesizing verified workout volume, recovery check-ins, hydration, nutrition adherence, and adaptive training calibrations.',
}

export default function CommandCenterPage() {
  return (
    <AppShell>
      <CommandCenterContent />
    </AppShell>
  )
}

