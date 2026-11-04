import type { Metadata } from 'next'
import { TrainerContent } from './TrainerContent'

export const metadata: Metadata = {
  title: 'Professional Trainer Workspace | YashFit',
  description:
    'Dedicated coaching workspace with client rosters, workout & nutrition prescription, private trainer notes, consent scopes, and client check-in reviews.',
}

export default function TrainerPage() {
  return <TrainerContent />
}

