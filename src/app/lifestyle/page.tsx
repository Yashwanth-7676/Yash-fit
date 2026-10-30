import type { Metadata } from 'next'
import { LifestyleContent } from './LifestyleContent'

export const metadata: Metadata = {
  title: 'AI Lifestyle Optimization | YashFit',
  description:
    'Timezone-aware 24-hour lifestyle schedule aligning workouts, nutrition timing, hydration checkpoints, and circadian recovery with autonomous AI adaptations.',
}

export default function LifestylePage() {
  return <LifestyleContent />
}

