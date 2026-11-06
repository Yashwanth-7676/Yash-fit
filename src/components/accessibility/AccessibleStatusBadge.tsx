'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, HelpCircle } from 'lucide-react'

export type AccessibleStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface AccessibleStatusBadgeProps {
  status: AccessibleStatus
  label: string
  detail?: string
  className?: string
  size?: 'sm' | 'md'
}

export function AccessibleStatusBadge({
  status,
  label,
  detail,
  className = '',
  size = 'md',
}: AccessibleStatusBadgeProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
      iconColor: 'text-emerald-400',
      ariaText: 'Status: Optimal',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
      iconColor: 'text-amber-400',
      ariaText: 'Status: Attention needed',
    },
    error: {
      icon: XCircle,
      bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
      iconColor: 'text-rose-400',
      ariaText: 'Status: Critical alert',
    },
    info: {
      icon: Info,
      bg: 'bg-sky-500/15 border-sky-500/40 text-sky-300',
      iconColor: 'text-sky-400',
      ariaText: 'Status: Informational notice',
    },
    neutral: {
      icon: HelpCircle,
      bg: 'bg-zinc-800/80 border-zinc-700 text-zinc-300',
      iconColor: 'text-zinc-400',
      ariaText: 'Status: Neutral',
    },
  }[status]

  const Icon = config.icon

  return (
    <span
      role="status"
      aria-label={`${config.ariaText} - ${label}${detail ? ` (${detail})` : ''}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium transition-colors ${
        size === 'sm' ? 'text-[11px] py-0.5 px-2' : 'text-xs py-1 px-2.5'
      } ${config.bg} ${className}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} className={`shrink-0 ${config.iconColor}`} aria-hidden="true" />
      <span className="font-semibold">{label}</span>
      {detail && <span className="opacity-75 text-[10px] hidden sm:inline">({detail})</span>}
    </span>
  )
}
