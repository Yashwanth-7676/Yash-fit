import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const CommunityContent = dynamic(
  () => import('./CommunityContent').then((mod) => mod.CommunityContent),
  {
    loading: () => <PageLoadingFallback label="Loading YashFit Community Feed..." />,
  }
)

export const metadata: Metadata = {
  title: 'Social Fitness Community & Challenges | YashFit',
  description: 'Connect with companion lifters, participate in fitness challenges, compete on privacy-conscious leaderboards, and share workout milestones.',
}

export default function CommunityPage() {
  return (
    <AppShell>
      <CommunityContent />
    </AppShell>
  )
}
