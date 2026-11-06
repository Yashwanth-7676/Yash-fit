import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const VirtualGymContent = dynamic(
  () => import('./VirtualGymContent').then((mod) => mod.VirtualGymContent),
  {
    loading: () => <PageLoadingFallback label="Loading 3D virtual gym & muscle biomechanics..." />,
  }
)

export const metadata: Metadata = {
  title: '3D Virtual Gym & Interactive Muscle Intelligence | YashFit',
  description:
    'Simulate human joint mechanics in 3D, inspect real muscle activation, and track weekly muscle-group training volume.',
}

export default function VirtualGymPage() {
  return (
    <AppShell>
      <VirtualGymContent />
    </AppShell>
  )
}
