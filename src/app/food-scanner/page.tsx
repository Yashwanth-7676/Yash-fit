import type { Metadata } from 'next'
import { FoodScannerContent } from './FoodScannerContent'

export const metadata: Metadata = {
  title: 'AI Food Vision & Meal Scanner | YashFit',
  description:
    'Visual recognition and nutrient density estimation for Indian meals, mixed thalis, dosas, and daily macro tracking with portion calibration.',
}

export default function FoodScannerPage() {
  return <FoodScannerContent />
}

