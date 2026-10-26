'use client'

import React from 'react'
import type { WeeklyAutopilotSchedule } from '@/types/autopilot'
import { Calendar, Clock, Activity, Dumbbell, Coffee, Sparkles, Info } from 'lucide-react'

interface WeeklyScheduleCardProps {
  schedule: WeeklyAutopilotSchedule
  onSelectDay?: (dayIndex: number) => void
}

export function WeeklyScheduleCard({ schedule }: WeeklyScheduleCardProps) {
  const { trainingDaysPerWeek, totalWeeklyMinutes, totalWeeklySets, days, tradeoffsAndTradeNotes, muscleDistribution } = schedule

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400">
              <Calendar size={18} />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Weekly Training Autopilot Schedule
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Intelligently distributed across 7 days to balance volume and prevent muscular overtraining.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs bg-zinc-950/70 border border-zinc-800 rounded-xl px-3 py-2 shrink-0">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Frequency</span>
            <strong className="text-lime-400 font-mono text-sm">{trainingDaysPerWeek}d / week</strong>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Total Vol</span>
            <strong className="text-white font-mono text-sm">{totalWeeklySets} sets</strong>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Duration</span>
            <strong className="text-white font-mono text-sm">~{totalWeeklyMinutes}m</strong>
          </div>
        </div>
      </div>

      {/* 7-Day Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {days.map((day) => {
          const isRest = day.isRestDay
          return (
            <div
              key={day.dayOfWeek}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                isRest
                  ? 'bg-zinc-950/40 border-zinc-800/60'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-lime-400/50 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white">{day.dayOfWeek.slice(0, 3)}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{day.dateString.slice(5)}</span>
                </div>

                {isRest ? (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 py-2">
                    <Coffee size={14} className="text-zinc-600" />
                    <span>Rest &amp; Recover</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-lime-400 line-clamp-1">
                      {day.routineName}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock size={11} className="text-zinc-500" />
                      <span>{day.plannedMinutes} mins</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Focus Muscles */}
              <div>
                {day.focusMuscles.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-800/60">
                    {day.focusMuscles.slice(0, 2).map((m) => (
                      <span
                        key={m}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300"
                      >
                        {m}
                      </span>
                    ))}
                    {day.focusMuscles.length > 2 && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        +{day.focusMuscles.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-zinc-600 pt-1 border-t border-zinc-800/40 italic">
                    Tissue repair
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trade-offs & Scientific Insights */}
      {tradeoffsAndTradeNotes.length > 0 && (
        <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
            <Info size={13} className="text-lime-400" />
            <span>Weekly Programming Trade-Offs &amp; Notes</span>
          </div>
          <ul className="space-y-1 text-zinc-400 text-[11px]">
            {tradeoffsAndTradeNotes.map((note, idx) => (
              <li key={idx}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Muscle Distribution Mini Bar Overview */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/60">
        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Weekly Muscle Volume Allocation (Sets)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(muscleDistribution)
            .filter(([_, sets]) => sets > 0)
            .map(([muscle, sets]) => (
              <div
                key={muscle}
                className="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs"
              >
                <span className="text-zinc-400">{muscle}</span>
                <span className="font-bold text-lime-400 font-mono">{sets} sets</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

