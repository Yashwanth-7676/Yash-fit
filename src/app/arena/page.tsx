import { Metadata } from 'next'
import { ArenaContent } from './ArenaContent'

export const metadata: Metadata = {
  title: 'Global Fitness Arena | YashFit',
  description:
    'Verified public and private competitions, weekly tournaments, team leaderboards, anti-exploit volume scoring, and fair-play fitness leagues.',
}

export default function ArenaPage() {
  return <ArenaContent />
}

