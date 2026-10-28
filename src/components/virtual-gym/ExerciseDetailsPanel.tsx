'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Exercise3DConfig } from '@/types/virtualGym'
import {
  Dumbbell,
  AlertTriangle,
  ShieldCheck,
  Copy,
  Check,
  Play,
  Camera,
  ExternalLink,
} from 'lucide-react'
import { useToast } from '@/components/ui'

interface ExerciseDetailsPanelProps {
  config: Exercise3DConfig
}

export function ExerciseDetailsPanel({ config }: ExerciseDetailsPanelProps) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyFormCue = () => {
    const text = `${config.name} — Biomechanical Form Cue:\nTempo: ${config.tempo}\nSetup: ${config.startingPosition}\nExecution: ${config.instructions.join(' ')}\nAvoid: ${config.commonMistakes.join(', ')}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Form Cues Copied! 📋', 'Copied execution instructions to clipboard.')
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case 'Beginner':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/80'
      case 'Intermediate':
        return 'text-amber-400 bg-amber-950/50 border-amber-800/80'
      case 'Advanced':
        return 'text-rose-400 bg-rose-950/50 border-rose-800/80'
      default:
        return 'text-zinc-300 bg-zinc-800 border-zinc-700'
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 backdrop-blur-sm space-y-6">
      {/* Exercise Title & Tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getDifficultyBadgeColor(config.difficulty)}`}>
              {config.difficulty}
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
              <Dumbbell size={11} className="text-lime-400" />
              {config.equipment}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700">
              Tempo: {config.tempo}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
            {config.name}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyFormCue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            {copied ? <Check size={13} className="text-lime-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Cues'}</span>
          </button>

          <Link
            href={`/workout/session?exerciseId=${config.id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-lime-400/20"
          >
            <Play size={13} className="fill-zinc-950" />
            <span>Train Now</span>
          </Link>
        </div>
      </div>

      {/* Target Muscles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
          <span className="text-xs font-semibold text-lime-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            Primary Target Muscles
          </span>
          <div className="flex flex-wrap gap-1.5">
            {config.primaryMuscles.map((muscle) => (
              <span
                key={muscle}
                className="text-xs px-2.5 py-1 rounded-lg bg-lime-950/70 border border-lime-800/80 text-lime-300 font-medium"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
          <span className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            Secondary Assister Muscles
          </span>
          <div className="flex flex-wrap gap-1.5">
            {config.secondaryMuscles.map((muscle) => (
              <span
                key={muscle}
                className="text-xs px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-800/80 text-sky-300 font-medium"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Starting & Ending Positions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1">
          <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
            Starting Kinematic Setup
          </h4>
          <p className="text-zinc-400 leading-relaxed">{config.startingPosition}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1">
          <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
            Peak Contraction & Lockout
          </h4>
          <p className="text-zinc-400 leading-relaxed">{config.endingPosition}</p>
        </div>
      </div>

      {/* Movement Phases */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Biomechanical Movement Phases
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {config.phases.map((phase, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between gap-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{phase.name}</span>
                <span className="font-mono text-lime-400/90 text-[10px]">
                  {Math.round(phase.startProgress * 100)}%-{Math.round(phase.endProgress * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">{phase.cue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          Step-by-Step Instructions
        </h4>
        <ol className="space-y-2 text-xs text-zinc-300">
          {config.instructions.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-lime-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Common Mistakes & Safety Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mistakes */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={15} />
            <span>Common Form Faults to Avoid</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {config.commonMistakes.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Safety Tips */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={15} />
            <span>Joint Safety & Injury Prevention</span>
          </div>
          <ul className="space-y-1.5 text-xs text-zinc-300">
            {config.safetyTips.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick Link to AI Pose Check */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
            <Camera size={18} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Want real-time camera form analysis?</h5>
            <p className="text-[11px] text-zinc-400">
              Run YashFit AI Pose Check to track joint angles and rep consistency via webcam.
            </p>
          </div>
        </div>

        <Link
          href={`/form-analysis?exercise=${config.id}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors shrink-0"
        >
          <span>Launch AI Form Check</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}

