import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const MotionverseContent = dynamic(
  () => import('./MotionverseContent').then((mod) => mod.MotionverseContent),
  {
    loading: () => <PageLoadingFallback label="Loading MotionVerse AI Animation Engine..." />,
  }
)

export const metadata: Metadata = {
  title: 'MotionVerse AI Workout Animation Engine | YashFit',
  description:
    'Interactive 3D and anatomical exercise visualizations, multi-angle camera views, real-time muscle activation maps, and Anime Hero Mode.',
}

export default function MotionversePage() {
  return (
    <AppShell>
      <MotionverseContent />
    </AppShell>
  )
}
