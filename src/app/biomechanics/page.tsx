import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const BiomechanicsContent = dynamic(
  () => import('./BiomechanicsContent').then((mod) => mod.BiomechanicsContent),
  {
    loading: () => <PageLoadingFallback label="Loading Biomechanics Vision Engine..." />,
  }
)

export const metadata: Metadata = {
  title: 'Advanced Biomechanics Intelligence | YashFit',
  description:
    'Camera-assisted real-time biomechanics, skeletal landmark tracking, joint-angle estimation, and strict movement form analysis running locally on your device.',
}

export default function BiomechanicsPage() {
  return (
    <AppShell>
      <BiomechanicsContent />
    </AppShell>
  )
}
