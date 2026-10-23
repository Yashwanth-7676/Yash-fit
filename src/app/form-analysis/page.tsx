import type { Metadata } from 'next'
import { FormAnalysisContent } from './FormAnalysisContent'

export const metadata: Metadata = {
  title: 'AI Form Analysis & Pose Correction | YashFit',
  description:
    'Real-time camera-assisted exercise form analysis, joint angles tracking, depth validation, and strict repetition counting processed locally on your device.',
}

export default function FormAnalysisPage() {
  return <FormAnalysisContent />
}

