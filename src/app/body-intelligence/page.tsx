import React from 'react'
import type { Metadata } from 'next'
import { BodyIntelligenceContent } from './BodyIntelligenceContent'

export const metadata: Metadata = {
  title: 'AI Body Composition Intelligence | YashFit',
  description:
    'Scientific body composition analysis, anthropometric U.S. Navy calculations, private progress photo timeline, and delta matrix.',
}

export default function BodyIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BodyIntelligenceContent />
    </div>
  )
}

