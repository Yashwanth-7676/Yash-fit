import { Metadata } from 'next'
import { FitnessWorldContent } from './FitnessWorldContent'

export const metadata: Metadata = {
  title: 'Immersive Virtual Fitness World | YashFit',
  description:
    'Interactive 3D training space with customizable avatar, exercise station demonstrators, environment presets, and multiplayer workout rooms.',
}

export default function FitnessWorldPage() {
  return <FitnessWorldContent />
}

