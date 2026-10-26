import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TrainingAutopilotContent } from './TrainingAutopilotContent'

export const metadata: Metadata = {
  title: 'Smart Training Autopilot | YashFit',
  description:
    'Intelligent, explainable workout adaptations, conservative progressive overload, and recovery-aware weekly training schedules.',
}

export default function TrainingAutopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[500px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <p className="text-sm text-zinc-400">Initializing Smart Training Autopilot...</p>
          </div>
        </div>
      }
    >
      <TrainingAutopilotContent />
    </Suspense>
  )
}
