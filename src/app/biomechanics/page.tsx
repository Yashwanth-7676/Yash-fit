import { Metadata } from 'next'
import { BiomechanicsContent } from './BiomechanicsContent'

export const metadata: Metadata = {
  title: 'Advanced Biomechanics Intelligence | YashFit',
  description:
    'Camera-assisted real-time biomechanics, skeletal landmark tracking, joint-angle estimation, and strict movement form analysis running locally on your device.',
}

export default function BiomechanicsPage() {
  return <BiomechanicsContent />
}

