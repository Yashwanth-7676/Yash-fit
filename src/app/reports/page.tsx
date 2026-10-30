import type { Metadata } from 'next'
import { ReportsContent } from './ReportsContent'

export const metadata: Metadata = {
  title: 'Fitness Intelligence Reports | YashFit',
  description:
    'Verifiable multi-period fitness intelligence audits, longitudinal strength progression, habit consistency analysis, and printable executive summaries.',
}

export default function ReportsPage() {
  return <ReportsContent />
}

