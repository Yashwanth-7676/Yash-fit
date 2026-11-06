import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const AvatarStudioContent = dynamic(
  () => import('./AvatarStudioContent').then((mod) => mod.AvatarStudioContent),
  {
    loading: () => <PageLoadingFallback label="Loading RPG anime avatar studio..." />,
  }
)

export const metadata: Metadata = {
  title: 'Anime Avatar Studio | YashFit RPG',
  description: 'Customize and equip anime fitness avatars, unlock legendary character titles, and boost passive workout specializations.',
}

export default function AvatarPage() {
  return (
    <AppShell>
      <AvatarStudioContent />
    </AppShell>
  )
}
