'use client'

import React from 'react'
import Link from 'next/link'
import {
  Camera,
  ShieldCheck,
  Zap,
  Activity,
  PlaySquare,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react'
import { AITrainerDashboard } from '@/components/vision/AITrainerDashboard'

export function AITrainerContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-semibold mb-2">
            <ShieldCheck size={14} />
            <span>100% On-Device Local AI • Zero Cloud Video Streaming</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Vision & Real-Time Personal Trainer
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Automatic repetition counter, skeletal tracking, bilateral symmetry evaluation, and real-time voice coaching cues directly through your device camera.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/motionverse"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <PlaySquare size={15} className="text-lime-400" />
            <span>MotionVerse 3D</span>
          </Link>

          <Link
            href="/workout-studio"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Activity size={15} className="text-lime-400" />
            <span>Workout Studio</span>
          </Link>
        </div>
      </div>

      {/* Main AI Trainer Studio Dashboard */}
      <AITrainerDashboard />

      {/* Feature Capabilities Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-zinc-850">
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <Zap size={16} />
          </div>
          <h4 className="text-sm font-bold text-white">Hysteresis Rep Counter</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Multi-phase finite state machines (Setup → Eccentric → Inflection → Concentric → Lockout) eliminate false counts and detect partial reps with calibrated angular hysteresis.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <Activity size={16} />
          </div>
          <h4 className="text-sm font-bold text-white">Bilateral Symmetry & Valgus Check</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Continuous left/right joint angle comparison alerts you to weight shifts, knee caving (valgus collapse), excessive lumbar arching, and flared elbows.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <h4 className="text-sm font-bold text-white">Privacy by Mathematical Design</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All pose landmark calculations occur in your browser via WebAssembly. YashFit never stores, records, or transmits your video feed to any cloud server.
          </p>
        </div>
      </div>
    </div>
  )
}
