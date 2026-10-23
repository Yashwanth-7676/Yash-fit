import type { Metadata } from 'next'
import { AvatarStudioContent } from './AvatarStudioContent'

export const metadata: Metadata = {
  title: 'Anime Avatar Studio | YashFit RPG',
  description: 'Customize and equip anime fitness avatars, unlock legendary character titles, and boost passive workout specializations.',
}

export default function AvatarPage() {
  return <AvatarStudioContent />
}
