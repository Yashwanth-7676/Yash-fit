'use client'

import React from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { Trophy, Award, Flame, Dumbbell, ArrowRight } from 'lucide-react'
import type { PersonalRecordItem } from '@/types/commandCenter'

interface PersonalRecordsListProps {
  records: PersonalRecordItem[]
}

export function PersonalRecordsList({ records }: PersonalRecordsListProps) {
  if (records.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
          <Trophy size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Personal Records &amp; Milestones</h3>
          <Badge variant="default">Verified Loads</Badge>
        </div>

        <div className="p-6 text-center space-y-2">
          <Dumbbell size={24} className="mx-auto text-zinc-500" />
          <h4 className="text-sm font-semibold text-zinc-300">No verified personal records logged yet</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Log working weights and completed repetitions in your workout sessions to establish verified PRs and Brzycki 1RM estimates.
          </p>
          <div className="pt-2">
            <Link
              href="/workout"
              className="text-xs text-lime-400 hover:text-lime-300 font-semibold inline-flex items-center gap-1"
            >
              Start Workout Now <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Personal Records &amp; Milestones</h3>
          <Badge variant="accent">{records.length} Verified PRs</Badge>
        </div>
        <Link
          href="/progress"
          className="text-xs text-lime-400 hover:text-lime-300 font-medium inline-flex items-center gap-1"
        >
          Detailed Analytics <ArrowRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {records.slice(0, 6).map((rec) => (
          <div
            key={rec.exerciseName}
            className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 space-y-2 relative overflow-hidden"
          >
            {rec.isRecent && (
              <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center gap-0.5">
                <Flame size={9} /> RECENT PR
              </span>
            )}

            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                {rec.primaryMuscle}
              </span>
              <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                {rec.exerciseName}
              </h4>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-white">
                {rec.bestWeightKg}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                kg × {rec.repsAtBestWeight} reps
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-[10px] text-zinc-500">
              <span>Est. 1RM: <strong className="text-zinc-300">{rec.estimated1RmKg} kg</strong></span>
              <span>{new Date(rec.achievedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
