import { Metadata } from 'next'
import { NutritionPlannerContent } from './NutritionPlannerContent'

export const metadata: Metadata = {
  title: 'Indian Nutrition Planner | YashFit',
  description: 'Evidence-based regional Indian meal intelligence, smart grocery optimizer, and protein macro architect.',
}

export default function NutritionPlannerPage() {
  return <NutritionPlannerContent />
}
