import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const NutritionPlannerContent = dynamic(
  () => import('./NutritionPlannerContent').then((mod) => mod.NutritionPlannerContent),
  {
    loading: () => <PageLoadingFallback label="Loading Indian nutrition planner..." />,
  }
)

export const metadata: Metadata = {
  title: 'Indian Nutrition Planner | YashFit',
  description: 'Evidence-based regional Indian meal intelligence, smart grocery optimizer, and protein macro architect.',
}

export default function NutritionPlannerPage() {
  return (
    <AppShell>
      <NutritionPlannerContent />
    </AppShell>
  )
}
