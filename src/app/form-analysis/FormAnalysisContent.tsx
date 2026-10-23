'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Video,
  Sparkles,
  Info,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeading } from '@/components/ui'
import { PoseCameraFeed } from '@/components/vision/PoseCameraFeed'
import { ExerciseVideoPlayer } from '@/components/video/ExerciseVideoPlayer'
import { EXERCISE_FORM_CONFIGS } from '@/lib/vision/exerciseRules'
import { EXERCISE_DATABASE } from '@/data/exercises'
import type { SupportedVisionExercise, FormAnalysisResult } from '@/types/pose'

const EXERCISE_OPTIONS: { id: SupportedVisionExercise; label: string; primaryMuscle: string; matchingId: string }[] = [
  { id: 'squat', label: 'Bodyweight / Goblet Squat', primaryMuscle: 'Quads', matchingId: 'ex-barbell-squat' },
  { id: 'push_up', label: 'Standard Push-Up', primaryMuscle: 'Chest', matchingId: 'ex-push-up' },
  { id: 'lunge', label: 'Stationary / Walking Lunge', primaryMuscle: 'Glutes', matchingId: 'ex-dumbbell-walking-lunge' },
  { id: 'plank', label: 'Forearm Plank Hold', primaryMuscle: 'Core', matchingId: 'ex-plank' },
  { id: 'bicep_curl', label: 'Dumbbell Bicep Curl', primaryMuscle: 'Biceps', matchingId: 'ex-dumbbell-bicep-curl' },
]

export function FormAnalysisContent() {
  const [selectedExercise, setSelectedExercise] = useState<SupportedVisionExercise>('squat')
  const [activeTab, setActiveTab] = useState<'camera' | 'demonstration'>('camera')
  const [sessionReps, setSessionReps] = useState<number>(0)
  const [partialReps, setPartialReps] = useState<number>(0)
  const [latestResult, setLatestResult] = useState<FormAnalysisResult | null>(null)

  const activeConfig = EXERCISE_FORM_CONFIGS[selectedExercise]
  const matchedExerciseData =
    EXERCISE_DATABASE.find((ex) => ex.id === EXERCISE_OPTIONS.find((o) => o.id === selectedExercise)?.matchingId) ||
    EXERCISE_DATABASE[0]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">AI Vision Biomechanics</Badge>
            <span className="text-xs text-zinc-500 font-mono">MediaPipe On-Device ML</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Real-Time Form Analysis</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Camera-assisted joint alignment, depth tracking, and strict repetition counting powered 100% locally on your device.
          </p>
        </div>

        {/* View Switcher: Camera vs Video Demo Alternative */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera size={14} />
            <span>Live Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demonstration')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'demonstration'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video size={14} />
            <span>Anime Demo Alternative</span>
          </button>
        </div>
      </div>

      {/* Exercise Selector Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {EXERCISE_OPTIONS.map((item) => {
          const isSelected = selectedExercise === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedExercise(item.id)
                setSessionReps(0)
                setPartialReps(0)
                setLatestResult(null)
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                isSelected
                  ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {item.primaryMuscle}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Analysis Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Feed / Anime Video (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'camera' ? (
            <PoseCameraFeed
              exercise={selectedExercise}
              onAnalysisUpdate={(res, r, pr) => {
                setLatestResult(res)
                setSessionReps(r)
                setPartialReps(pr)
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
                <span>Non-Camera Reference: 60 FPS Cel Animation</span>
                <span className="text-lime-400 font-semibold">{matchedExerciseData.name}</span>
              </div>
              <ExerciseVideoPlayer exercise={matchedExerciseData} autoPlay={true} />
            </div>
          )}

          {/* Setup Guidelines Card */}
          <Card className="p-4 sm:p-5 border-zinc-800 bg-zinc-900 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Info size={16} className="text-lime-400" />
              Optimal Camera Setup for {activeConfig.name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Distance</span>
                <span className="text-white font-medium">{activeConfig.recommendedDistance}</span>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Recommended Angle</span>
                <span className="text-white font-medium">{activeConfig.recommendedAngle}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Real-time Telemetry & Form Criteria (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Real-time Session KPI Card */}
          <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Live Session Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Confirmed Reps</span>
                <span className="text-3xl font-extrabold text-lime-400 font-mono">{sessionReps}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Partial Reps</span>
                <span className="text-3xl font-extrabold text-amber-400 font-mono">{partialReps}</span>
              </div>
            </div>

            {/* Current Joint Angles Gauge */}
            {latestResult?.angles && (
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
                <span className="text-zinc-400 font-semibold block">Live Joint Angles:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Knee Angle:</span>
                    <span className="text-white font-bold">{latestResult.angles.kneeAngle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Hip Hinge:</span>
                    <span className="text-white font-bold">{latestResult.angles.hipAngle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Torso Incline:</span>
                    <span className="text-white font-bold">{latestResult.angles.torsoAngle}°</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Technique Criteria & Form Cues Card */}
          <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Movement Criteria &amp; Rules
            </h3>
            <ul className="space-y-2 text-xs text-zinc-300">
              {activeConfig.cues.map((cue, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-lime-400 shrink-0 mt-0.5" />
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Privacy & Safety Disclaimer */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertTriangle size={13} />
              <span>Safety &amp; Biomechanics Disclaimer</span>
            </div>
            <p className="leading-relaxed text-zinc-500">
              YashFit AI Form Analysis uses browser-based computer vision for instructional guidance. It does not provide medical diagnoses or guarantee injury prevention. If you experience discomfort or joint pain, halt the movement immediately and consult a healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
