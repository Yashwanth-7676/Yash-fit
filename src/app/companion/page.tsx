import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const CompanionContent = dynamic(
  () => import('./CompanionContent').then((mod) => mod.CompanionContent),
  {
    loading: () => <PageLoadingFallback label="Initializing Astra AI Companion..." />,
  }
)

export const metadata: Metadata = {
  title: 'Personal AI Fitness Companion | YashFit',
  description:
    'Astra — Your context-aware AI fitness companion for daily check-ins, Indian nutrition recommendations, workout guidance, and recovery optimization.',
}

export default function CompanionPage() {
  return (
    <AppShell>
      <CompanionContent />
    </AppShell>
  )
}
