import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { GroceryPlannerContent } from './GroceryPlannerContent'

export const metadata: Metadata = {
  title: 'Smart Grocery Planner',
  description: 'Budget-optimized Indian fitness grocery shopping checklist calibrated from meal plans.',
}

export default function GroceryPage() {
  return (
    <AppShell>
      <GroceryPlannerContent />
    </AppShell>
  )
}
