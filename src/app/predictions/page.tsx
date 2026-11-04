import React from 'react'
import type { Metadata } from 'next'
import { PredictionsContent } from './PredictionsContent'

export const metadata: Metadata = {
  title: 'Predictive Fitness Intelligence | YashFit',
  description:
    'Long-range physiological forecasting, compound strength 1RM progression trajectories, weight timeline estimates, and transparent mathematical explainability.',
}

export default function PredictionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PredictionsContent />
    </div>
  )
}

