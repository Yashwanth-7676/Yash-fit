'use client'

import React from 'react'
import type { AutopilotAdaptationRecord } from '@/types/autopilot'
import { History, CheckCircle2, RotateCcw, XCircle, Sliders, Calendar } from 'lucide-react'

interface AdaptationHistoryTimelineProps {
  history: AutopilotAdaptationRecord[]
}

export function AdaptationHistoryTimeline({ history }: AdaptationHistoryTimelineProps) {
  const getDecisionBadge = (decision: AutopilotAdaptationRecord['userDecision']) => {
    switch (decision) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30">
            <CheckCircle2 size={11} />
            Accepted
          </span>
        )
      case 'undone':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
            <RotateCcw size={11} />
            Reverted
          </span>
        )
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-400 border border-sky-400/30">
            <Sliders size={11} />
            Customized
          </span>
        )
      case 'dismissed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            <XCircle size={11} />
            Dismissed
          </span>
        )
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-md space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400">
            <History size={18} />
          </span>
          <h3 className="text-base font-bold text-white tracking-wide">
            Autopilot Adaptation Audit Log
          </h3>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{history.length} records</span>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
          <p className="font-semibold text-zinc-300">No adaptation records logged yet.</p>
          <p className="text-zinc-500 max-w-md mx-auto">
            When you accept, customize, or dismiss an Autopilot calibration proposal, an immutable adaptation audit record is captured here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {history.map((record) => (
            <div
              key={record.id}
              className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{record.routineName}</span>
                  {getDecisionBadge(record.userDecision)}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {new Date(record.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="text-zinc-400 block text-[11px]">Proposed Calibration:</span>
                {record.proposedAdjustmentSummary}
              </div>

              <div className="text-[11px] text-zinc-500 flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                <span className="truncate">Reason: {record.reason}</span>
                {record.outcomeSummary && (
                  <span className="shrink-0 text-lime-400/90 font-medium">
                    Status: {record.outcomeSummary}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

