import { Metadata } from 'next'
import { VirtualCoachContent } from './VirtualCoachContent'

export const metadata: Metadata = {
  title: 'AI Virtual Personal Trainer | YashFit',
  description:
    'Interactive AI personal fitness trainer reasoning across your verified workouts, Indian nutrition, recovery readiness, performance tests, and voice-guided workout instructions.',
}

export default function VirtualCoachPage() {
  return <VirtualCoachContent />
}

