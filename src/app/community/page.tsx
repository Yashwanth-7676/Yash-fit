import type { Metadata } from 'next'
import { CommunityContent } from './CommunityContent'

export const metadata: Metadata = {
  title: 'Social Fitness Community & Challenges | YashFit',
  description: 'Connect with companion lifters, participate in fitness challenges, compete on privacy-conscious leaderboards, and share workout milestones.',
}

export default function CommunityPage() {
  return <CommunityContent />
}
