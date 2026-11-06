import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const FormAnalysisContent = dynamic(
  () => import('./FormAnalysisContent').then((mod) => mod.FormAnalysisContent),
  {
    loading: () => <PageLoadingFallback label="Loading AI form analysis engine..." />,
  }
)

export const metadata: Metadata = {
  title: 'AI Form Analysis & Pose Correction | YashFit',
  description:
    'Real-time camera-assisted exercise form analysis, joint angles tracking, depth validation, and strict repetition counting processed locally on your device.',
}

export default function FormAnalysisPage() {
  return (
    <AppShell>
      <FormAnalysisContent />
    </AppShell>
  )
}
