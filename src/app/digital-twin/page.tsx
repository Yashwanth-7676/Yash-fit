import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { DigitalTwinContent } from './DigitalTwinContent'

export const metadata: Metadata = {
  title: 'Fitness Digital Twin',
  description: 'Review recorded fitness data, adaptive training advice, and transparent training scenarios.',
}

export default function DigitalTwinPage() {
  return (
    <AppShell>
      <DigitalTwinContent />
    </AppShell>
  )
}
