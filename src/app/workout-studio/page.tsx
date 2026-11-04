import React from 'react'
import type { Metadata } from 'next'
import { WorkoutStudioContent } from './WorkoutStudioContent'

export const metadata: Metadata = {
  title: 'Interactive Smart Workout Studio | YashFit',
  description:
    'Guided workout interface with biomechanical kinematics solver, interactive set logging, audio rest timer, and voice coach.',
}

export default function WorkoutStudioPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <WorkoutStudioContent />
    </div>
  )
}

