import type { Metadata } from 'next'
import { Zap } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Meals' }

export default function MealsPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Meal Planning"
        description="Generate personalized fitness-friendly meal plans based on your nutritional goals and preferences. Coming in Phase 2."
        icon={<Zap size={28} />}
      />
    </AppShell>
  )
}

