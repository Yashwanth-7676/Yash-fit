import type { Metadata } from 'next'
import { QuestsContent } from './QuestsContent'

export const metadata: Metadata = {
  title: 'Daily & Weekly Quests | YashFit RPG',
  description: 'Complete daily workouts, hydration goals, and recovery habits to level up your anime fitness avatar.',
}

export default function QuestsPage() {
  return <QuestsContent />
}
