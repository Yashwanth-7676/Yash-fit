import type { Metadata } from 'next'
import { AdminFeedbackContent } from './AdminFeedbackContent'

export const metadata: Metadata = {
  title: 'Admin Feedback & Operations HQ | YashFit',
  description:
    'Administrator operations portal for beta tester invitation provisioning, issue triage, user feedback resolution, and telemetry analytics.',
}

export default function AdminFeedbackPage() {
  return <AdminFeedbackContent />
}

