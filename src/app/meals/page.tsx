import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { MealsPlannerContent } from './MealsPlannerContent'

export const metadata: Metadata = {
  title: 'Indian Meals & Recipes',
  description: 'Curated high-protein Indian meal plans, budget swaps, and kitchen cooking cues.',
}

export default function MealsPage() {
  return (
    <AppShell>
      <MealsPlannerContent />
    </AppShell>
  )
}
