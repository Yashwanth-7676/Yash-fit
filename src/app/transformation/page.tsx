import { Metadata } from 'next'
import { TransformationContent } from './TransformationContent'

export const metadata: Metadata = {
  title: 'Body Transformation Intelligence | YashFit',
  description: 'Track longitudinal body measurements, visual before-and-after photo comparisons, and regression trend rates with uncertainty bounds.',
}

export default function TransformationPage() {
  return <TransformationContent />
}

