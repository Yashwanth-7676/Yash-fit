import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const PrivacyCenterContent = dynamic(
  () => import('./PrivacyCenterContent').then((mod) => mod.PrivacyCenterContent),
  {
    loading: () => <PageLoadingFallback label="Loading privacy & security command center..." />,
  }
)

export const metadata: Metadata = {
  title: 'Privacy & Security Command Center | YashFit',
  description:
    'Comprehensive personal data audit, GDPR Article 20 data portability export, active session management, granular privacy controls, and account deletion.',
}

export default function PrivacyCenterPage() {
  return (
    <AppShell>
      <PrivacyCenterContent />
    </AppShell>
  )
}
