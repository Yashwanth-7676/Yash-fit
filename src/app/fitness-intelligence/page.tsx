import { Metadata } from 'next'
import { FitnessIntelligenceContent } from './FitnessIntelligenceContent'

export const metadata: Metadata = {
  title: 'Personal Fitness Intelligence Graph | YashFit',
  description:
    'Multi-dimensional relationship network exploring empirical correlations, data attribution, and explainable causal distinctions across your fitness ecosystem.',
}

export default function FitnessIntelligencePage() {
  return <FitnessIntelligenceContent />
}

