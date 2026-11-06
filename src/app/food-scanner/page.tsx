import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const FoodScannerContent = dynamic(
  () => import('./FoodScannerContent').then((mod) => mod.FoodScannerContent),
  {
    loading: () => <PageLoadingFallback label="Loading AI food vision scanner..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Food Vision & Meal Scanner | YashFit',
  description:
    'Visual recognition and nutrient density estimation for Indian meals, mixed thalis, dosas, and daily macro tracking with portion calibration.',
}

export default function FoodScannerPage() {
  return (
    <AppShell>
      <FoodScannerContent />
    </AppShell>
  )
}
