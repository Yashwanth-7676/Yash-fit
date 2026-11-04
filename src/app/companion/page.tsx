import React from 'react'
import type { Metadata } from 'next'
import { CompanionContent } from './CompanionContent'

export const metadata: Metadata = {
  title: 'Personal AI Fitness Companion | YashFit',
  description:
    'Astra — Your context-aware AI fitness companion for daily check-ins, Indian nutrition recommendations, workout guidance, and recovery optimization.',
}

export default function CompanionPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <CompanionContent />
    </div>
  )
}

