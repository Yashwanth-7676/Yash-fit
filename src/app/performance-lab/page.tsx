import { Metadata } from 'next'
import { PerformanceLabContent } from './PerformanceLabContent'

export const metadata: Metadata = {
  title: 'Fitness Performance Lab | YashFit',
  description:
    'Standardized fitness testing, submaximal 1RM calculations, muscular endurance benchmarks, and longitudinal progress tracking against your personal baseline.',
}

export default function PerformanceLabPage() {
  return <PerformanceLabContent />
}

