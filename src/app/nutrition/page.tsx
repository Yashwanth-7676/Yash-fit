import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { NutritionDashboardContent } from './NutritionDashboardContent'

export const metadata: Metadata = {
  title: 'Smart Nutrition',
  description: 'Personalized caloric and macro distribution with Indian food options and budget-friendly diet tracking.',
}

export default function NutritionPage() {
  return (
    <AppShell>
      <NutritionDashboardContent />
    </AppShell>
  )
}
