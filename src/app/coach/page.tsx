import { Metadata } from 'next'
import { CoachContent } from './CoachContent'

export const metadata: Metadata = {
  title: 'Personal AI Fitness Coach 2.0 | YashFit',
  description: 'Evidence-based conversational fitness coach reasoning across workout telemetry, recovery check-ins, Indian nutrition, and transformation data.',
}

export default function CoachPage() {
  return <CoachContent />
}
