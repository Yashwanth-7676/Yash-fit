'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Trophy,
  Activity,
  Flame,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  Sliders,
  Share2,
  Save,
  Info,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { PoseCameraFeed } from '@/components/vision/PoseCameraFeed'
import { EXERCISE_FORM_CONFIGS } from '@/lib/vision/exerciseRules'
import { voiceCoach } from '@/lib/vision/voiceCoachService'
import type { SupportedVisionExercise, FormAnalysisResult } from '@/types/pose'
import type { RepPerformanceRecord, TrainerSessionSummary } from '@/types/aiTrainer'

const EXERCISE_LIST: { id: SupportedVisionExercise; label: string; defaultTarget: number }[] = [
  { id: 'squat', label: 'Squat', defaultTarget: 10 },
  { id: 'push_up', label: 'Push-Up', defaultTarget: 12 },
  { id: 'lunge', label: 'Lunge', defaultTarget: 10 },
  { id: 'bicep_curl', label: 'Bicep Curl', defaultTarget: 12 },
  { id: 'shoulder_press', label: 'Shoulder Press', defaultTarget: 10 },
  { id: 'deadlift', label: 'Romanian Deadlift', defaultTarget: 8 },
  { id: 'jumping_jack', label: 'Jumping Jacks', defaultTarget: 25 },
  { id: 'plank', label: 'Forearm Plank', defaultTarget: 30 },
]

export function AITrainerDashboard() {
  const [selectedExercise, setSelectedExercise] = useState<SupportedVisionExercise>('squat')
  const [targetReps, setTargetReps] = useState<number>(10)
  const [currentReps, setCurrentReps] = useState<number>(0)
  const [partialReps, setPartialReps] = useState<number>(0)
  const [activeScore, setActiveScore] = useState<number>(95)
  const [bilateralSymmetry, setBilateralSymmetry] = useState<number>(96)
  const [latestAnalysis, setLatestAnalysis] = useState<FormAnalysisResult | null>(null)
  const [repRecords, setRepRecords] = useState<RepPerformanceRecord[]>([])
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [sessionSummary, setSessionSummary] = useState<TrainerSessionSummary | null>(null)
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false)
  const [personalBest, setPersonalBest] = useState<number>(0)
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const repStartTimeRef = useRef<number>(Date.now())

  // Load personal best from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPR = localStorage.getItem(`yashfit_pr_${selectedExercise}`)
        setPersonalBest(storedPR ? parseInt(storedPR, 10) : 0)
      } catch {
        // Storage unavailable
      }
    }
  }, [selectedExercise])

  // Workout duration timer
  useEffect(() => {
    if (isSessionActive) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isSessionActive])

  // Update target reps when switching exercises
  const handleSelectExercise = (exId: SupportedVisionExercise) => {
    setSelectedExercise(exId)
    const match = EXERCISE_LIST.find((e) => e.id === exId)
    if (match) {
      setTargetReps(match.defaultTarget)
    }
    handleResetSet()
  }

  // Handle frame update from vision camera
  const handleAnalysisUpdate = (result: FormAnalysisResult, reps: number, partials: number) => {
    setLatestAnalysis(result)
    setCurrentReps(reps)
    setPartialReps(partials)
    setActiveScore(result.formScore)
    if (result.bilateralSymmetryScore !== undefined) {
      setBilateralSymmetry(result.bilateralSymmetryScore)
    }

    if (!isSessionActive && (reps > 0 || partials > 0)) {
      setIsSessionActive(true)
    }
  }

  // Handle completed rep event
  const handleRepCompleted = (repCount: number, score: number) => {
    const now = Date.now()
    const duration = Math.max(1, Math.round((now - repStartTimeRef.current) / 1000))
    repStartTimeRef.current = now

    const newRecord: RepPerformanceRecord = {
      repNumber: repCount,
      qualityScore: score,
      durationSeconds: duration,
      peakDepthAngle: latestAnalysis?.angles.kneeAngle ?? latestAnalysis?.angles.elbowAngle ?? 90,
      wasFullRep: true,
      bilateralSymmetry: bilateralSymmetry,
      detectedFaults: latestAnalysis?.primaryFault ? [latestAnalysis.primaryFault] : [],
      completedAt: now,
    }

    setRepRecords((prev) => [...prev, newRecord])

    // Target reached celebration
    if (repCount >= targetReps) {
      voiceCoach.speak(`Target goal of ${targetReps} reps achieved! Finish strong or wrap up set.`, {
        priority: 'high',
      })
    }
  }

  // Reset current set
  const handleResetSet = () => {
    setCurrentReps(0)
    setPartialReps(0)
    setRepRecords([])
    setElapsedSeconds(0)
    setIsSessionActive(false)
    setSessionSummary(null)
    setShowSummaryModal(false)
    setSavedSuccess(false)
    repStartTimeRef.current = Date.now()
  }

  // Finish Set and Calculate Summary
  const handleFinishSet = () => {
    setIsSessionActive(false)

    const total = currentReps + partialReps
    const avgScore =
      repRecords.length > 0
        ? Math.round(repRecords.reduce((acc, r) => acc + r.qualityScore, 0) / repRecords.length)
        : activeScore

    const avgSym =
      repRecords.length > 0
        ? Math.round(repRecords.reduce((acc, r) => acc + r.bilateralSymmetry, 0) / repRecords.length)
        : bilateralSymmetry

    // Check PR
    const isNewPR = currentReps > personalBest && currentReps > 0
    if (isNewPR && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`yashfit_pr_${selectedExercise}`, currentReps.toString())
        setPersonalBest(currentReps)
      } catch {
        // Storage unavailable
      }
    }

    // Estimate calories burned (MET approx)
    const calories = Math.max(2, Math.round((elapsedSeconds / 60) * 7.5))

    // Fault tally
    const faultCounts: Record<string, number> = {}
    repRecords.forEach((r) => {
      r.detectedFaults.forEach((f) => {
        faultCounts[f] = (faultCounts[f] || 0) + 1
      })
    })
    const topFaults = Object.entries(faultCounts).map(([fault, count]) => ({ fault, count }))

    const summary: TrainerSessionSummary = {
      id: `train_${Date.now()}`,
      exercise: selectedExercise,
      startTime: Date.now() - elapsedSeconds * 1000,
      endTime: Date.now(),
      durationSeconds: elapsedSeconds,
      totalReps: total,
      validReps: currentReps,
      partialReps: partialReps,
      averageScore: avgScore,
      averageSymmetry: avgSym,
      estimatedCalories: calories,
      repRecords: repRecords,
      topFaults: topFaults,
      personalRecordBeaten: isNewPR,
      previousRecord: personalBest,
      feedbackSummary:
        avgScore >= 85
          ? 'Exceptional form and tempo! Movement angles aligned with optimal biomechanical standards.'
          : 'Good effort. Keep an eye on maintaining parallel depth and symmetrical joint extension.',
      verifiedByAiVision: true,
    }

    setSessionSummary(summary)
    setShowSummaryModal(true)

    // Voice announcement
    voiceCoach.speak(
      `Set complete! ${currentReps} confirmed repetitions with ${avgScore} percent average form score.${
        isNewPR ? ' New personal record!' : ''
      }`,
      { priority: 'high', force: true }
    )
  }

  // Save session record to local workout history
  const handleSaveSession = () => {
    if (!sessionSummary || typeof window !== 'undefined') {
      try {
        const historyKey = 'yashfit_ai_trainer_history'
        const existing = JSON.parse(localStorage.getItem(historyKey) || '[]')
        existing.unshift(sessionSummary)
        localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 50)))
        setSavedSuccess(true)
      } catch {
        // Storage unavailable
      }
    }
  }

  const currentConfig = EXERCISE_FORM_CONFIGS[selectedExercise]
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`
  }

  return (
    <div className="space-y-6">
      {/* Exercise Selection Carousel / Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {EXERCISE_LIST.map((ex) => {
          const isSelected = selectedExercise === ex.id
          return (
            <button
              key={ex.id}
              onClick={() => handleSelectExercise(ex.id)}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-lg shadow-lime-400/20 font-bold'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {ex.label}
            </button>
          )
        })}
      </div>

      {/* Main Grid: Camera Viewport on Left, Telemetry & Form Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Camera & Vision Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
                <span className="font-bold text-white uppercase tracking-wider">
                  {currentConfig.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Target:</span>
                <select
                  value={targetReps}
                  onChange={(e) => setTargetReps(parseInt(e.target.value, 10))}
                  className="bg-zinc-950 border border-zinc-800 text-white rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-lime-400"
                >
                  <option value={5}>5 reps</option>
                  <option value={8}>8 reps</option>
                  <option value={10}>10 reps</option>
                  <option value={12}>12 reps</option>
                  <option value={15}>15 reps</option>
                  <option value={20}>20 reps</option>
                  <option value={25}>25 reps</option>
                  <option value={30}>30 reps / sec</option>
                  <option value={60}>60 reps / sec</option>
                </select>
              </div>
            </div>

            {/* Vision Camera Component */}
            <PoseCameraFeed
              exercise={selectedExercise}
              targetReps={targetReps}
              onAnalysisUpdate={handleAnalysisUpdate}
              onRepCompleted={handleRepCompleted}
            />

            {/* Movement Guidance Tips */}
            <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-850">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-1.5">
                <Info size={14} className="text-lime-400" />
                <span>Optimal Biomechanics Cues:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-zinc-400">
                {currentConfig.cues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-lime-400 font-bold shrink-0">•</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry, Score Gauges, and Rep Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Rep Counter Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Reps Confirmed</span>
                <Trophy size={14} className="text-lime-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-lime-400 font-mono">
                  {currentReps}
                </span>
                <span className="text-xs text-zinc-500 font-mono">/{targetReps}</span>
              </div>
              {personalBest > 0 && (
                <p className="text-[10px] text-zinc-400 mt-1">
                  Personal Record: <span className="text-white font-semibold">{personalBest}</span>
                </p>
              )}
            </div>

            {/* Elapsed Time Card */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                <span>Set Duration</span>
                <Clock size={14} className="text-lime-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {formatTime(elapsedSeconds)}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Est. Burn: ~{Math.max(1, Math.round((elapsedSeconds / 60) * 7.5))} kcal
              </p>
            </div>
          </div>

          {/* Form Quality & Symmetry Scores */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Activity size={14} className="text-lime-400" />
                Live Form Quality
              </span>
              <span
                className={`font-mono font-bold ${
                  activeScore >= 80 ? 'text-lime-400' : 'text-amber-400'
                }`}
              >
                {activeScore}%
              </span>
            </div>

            {/* Form Score Progress Bar */}
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  activeScore >= 80 ? 'bg-lime-400' : 'bg-amber-400'
                }`}
                style={{ width: `${activeScore}%` }}
              />
            </div>

            {/* Bilateral Symmetry Gauge */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Bilateral Left/Right Symmetry</span>
              <span className="font-mono text-zinc-200 font-semibold">{bilateralSymmetry}%</span>
            </div>
          </div>

          {/* Rep-by-Rep Performance History */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Layers size={14} className="text-lime-400" />
                Rep-by-Rep Analytics
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {repRecords.length} logged
              </span>
            </div>

            {repRecords.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs rounded-xl bg-zinc-950/40 border border-zinc-850">
                Begin your set to view rep-by-rep depth and tempo telemetry.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {repRecords.map((rep) => (
                  <div
                    key={rep.repNumber}
                    className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-zinc-800 text-lime-400 flex items-center justify-center font-mono font-bold text-[10px]">
                        {rep.repNumber}
                      </span>
                      <span className="text-zinc-200 font-medium">
                        Rep {rep.repNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-zinc-400">{rep.durationSeconds}s</span>
                      <span
                        className={`font-semibold ${
                          rep.qualityScore >= 80 ? 'text-lime-400' : 'text-amber-400'
                        }`}
                      >
                        {rep.qualityScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* End Set / Action Bar */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleResetSet}
              icon={<RotateCcw size={16} />}
              className="flex-1"
            >
              Reset Set
            </Button>

            <Button
              size="lg"
              onClick={handleFinishSet}
              disabled={currentReps === 0 && partialReps === 0}
              icon={<CheckCircle2 size={16} />}
              className="flex-1"
            >
              Finish & Review
            </Button>
          </div>
        </div>
      </div>

      {/* Session Summary Modal */}
      {showSummaryModal && sessionSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] text-lime-400 font-mono uppercase tracking-wider font-bold">
                  Verified AI Session
                </span>
                <h3 className="text-xl font-extrabold text-white">Workout Set Summary</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSummaryModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* PR Banner if beaten */}
            {sessionSummary.personalRecordBeaten && (
              <div className="p-3 rounded-2xl bg-lime-400/10 border border-lime-400/40 text-xs text-lime-400 flex items-center gap-2.5">
                <Trophy size={18} className="shrink-0 animate-bounce" />
                <div>
                  <span className="font-bold">NEW PERSONAL RECORD!</span>
                  <p className="text-[11px] text-lime-300/80">
                    You beat your previous best of {sessionSummary.previousRecord} reps.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Confirmed Reps</span>
                <span className="text-2xl font-extrabold text-lime-400 font-mono">
                  {sessionSummary.validReps}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Avg Form Score</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {sessionSummary.averageScore}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Symmetry</span>
                <span className="text-2xl font-extrabold text-white font-mono">
                  {sessionSummary.averageSymmetry}%
                </span>
              </div>
            </div>

            {/* Qualitative Feedback */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-lime-400">
                <Sparkles size={14} />
                <span>AI Biomechanical Assessment</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                {sessionSummary.feedbackSummary}
              </p>
            </div>

            {/* Save Status & Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setShowSummaryModal(false)
                  handleResetSet()
                }}
                className="flex-1"
              >
                Start New Set
              </Button>

              <Button
                size="md"
                onClick={handleSaveSession}
                disabled={savedSuccess}
                icon={savedSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                className="flex-1"
              >
                {savedSuccess ? 'Saved to Logs!' : 'Save Set'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
