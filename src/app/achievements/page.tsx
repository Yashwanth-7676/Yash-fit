import type { Metadata } from 'next'
import { AchievementsContent } from './AchievementsContent'

export const metadata: Metadata = {
  title: 'Achievements & Badges | YashFit RPG',
  description: 'Track and unlock anime fitness achievement badges for training consistency, volume, recovery, and form.',
}

export default function AchievementsPage() {
  return <AchievementsContent />
}
