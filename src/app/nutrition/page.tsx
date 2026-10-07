import type { Metadata } from 'next'
import { Salad } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Nutrition' }

export default function NutritionPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Smart Nutrition"
        description="Personalized nutrition planning with Indian food support and budget-friendly meal options. Coming in Phase 2."
        icon={<Salad size={28} />}
      />
    </AppShell>
  )
}

