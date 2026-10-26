'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight } from 'lucide-react'
import type { AttentionArea } from '@/types/commandCenter'

interface AttentionAreasBannerProps {
  areas: AttentionArea[]
}

export function AttentionAreasBanner({ areas }: AttentionAreasBannerProps) {
  if (areas.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-emerald-300">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">
            All fitness systems optimal — recovery is balanced, hydration is on track, and training frequency is consistent.
          </span>
        </div>
        <span className="text-[11px] text-emerald-400/80 uppercase font-semibold tracking-wider">
          Readiness Verified
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle size={13} className="text-amber-400" />
          Areas Requiring Attention ({areas.length})
        </span>
        <span className="text-[11px] text-zinc-500">Based on recent logs</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {areas.map((area) => {
          const isHigh = area.severity === 'high'
          const isMed = area.severity === 'medium'

          const borderStyle = isHigh
            ? 'border-rose-900/50 bg-rose-950/20 text-rose-200'
            : isMed
            ? 'border-amber-900/50 bg-amber-950/20 text-amber-200'
            : 'border-zinc-800 bg-zinc-900/60 text-zinc-300'

          const badgeBg = isHigh
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            : isMed
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-zinc-800 text-zinc-400 border-zinc-700'

          const IconComponent = isHigh ? AlertTriangle : isMed ? AlertCircle : Info

          return (
            <div
              key={area.id}
              className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-all ${borderStyle}`}
            >
              <div className="flex items-start gap-3">
                <IconComponent
                  size={16}
                  className={`shrink-0 mt-0.5 ${
                    isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-blue-400'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {area.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${badgeBg}`}>
                      {area.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              </div>

              <Link
                href={area.actionHref}
                className="shrink-0 text-xs font-semibold text-lime-400 hover:text-lime-300 transition-colors flex items-center gap-1 self-center pl-2"
              >
                <span>{area.actionLabel}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
