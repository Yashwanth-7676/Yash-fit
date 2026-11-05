import type { Metadata } from 'next'
import { ChangelogContent } from './ChangelogContent'

export const metadata: Metadata = {
  title: 'Platform Changelog & Release Intelligence | YashFit',
  description:
    'Complete chronological release notes, architectural updates, biomechanics engine upgrades, and stability fixes for YashFit.',
}

export default function ChangelogPage() {
  return <ChangelogContent />
}

