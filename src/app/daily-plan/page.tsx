import type { Metadata } from 'next'
import { DailyPlanContent } from './DailyPlanContent'

export const metadata: Metadata = {
  title: 'Fitness Life Autopilot & Daily Agenda | YashFit',
  description: 'Synthesize workouts, Indian nutrition, hydration milestones, recovery requirements, and daily quests into an actionable daily fitness agenda.',
}

export default function DailyPlanPage() {
  return <DailyPlanContent />
}

