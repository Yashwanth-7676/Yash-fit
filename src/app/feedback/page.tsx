import type { Metadata } from 'next'
import { FeedbackContent } from './FeedbackContent'

export const metadata: Metadata = {
  title: 'Beta Feedback & Issue Tracker | YashFit',
  description:
    'Submit bug reports, feature requests, and rating telemetry directly to the YashFit engineering team. Track resolution and view release updates.',
}

export default function FeedbackPage() {
  return <FeedbackContent />
}

