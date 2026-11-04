import type { Metadata } from 'next'
import { PrivacyCenterContent } from './PrivacyCenterContent'

export const metadata: Metadata = {
  title: 'Privacy & Security Command Center | YashFit',
  description:
    'Comprehensive personal data audit, GDPR Article 20 data portability export, active session management, granular privacy controls, and account deletion.',
}

export default function PrivacyCenterPage() {
  return <PrivacyCenterContent />
}

