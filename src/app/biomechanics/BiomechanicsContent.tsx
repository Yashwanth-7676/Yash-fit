'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import { PoseCameraFeed } from '@/components/vision/PoseCameraFeed'
import {
  BIOMECHANICS_GUIDANCE_CATALOG,
  getSavedBiomechanicsSessions,
  saveBiomechanicsSession,
  deleteBiomechanicsSession,
  exportBiomechanicsToCsv,
  exportBiomechanicsToJson,
} from '@/lib/biomechanics/biomechanicsService'
import type { SupportedVisionExercise, FormAnalysisResult } from '@/types/pose'
import type { BiomechanicsSessionRecord } from '@/types/biomechanics'

const EXERCISE_OPTIONS: { id: SupportedVisionExercise; label: string; primaryMuscle: string }[] = [
  { id: 'squat', label: 'Bodyweight / Goblet Squat', primaryMuscle: 'Quadriceps & Glutes' },
  { id: 'push_up', label: 'Standard Push-Up', primaryMuscle: 'Chest & Triceps' },
  { id: 'lunge', label: 'Stationary / Walking Lunge', primaryMuscle: 'Glutes & Quads' },
  { id: 'bicep_curl', label: 'Dumbbell Bicep Curl', primaryMuscle: 'Biceps Brachii' },
  { id: 'shoulder_press', label: 'Overhead Shoulder Press', primaryMuscle: 'Anterior & Lateral Deltoids' },
]

export function BiomechanicsContent() {
  const toast = useToast()

  const [selectedExercise, setSelectedExercise] = useState<SupportedVisionExercise>('squat')
  const [activeTab, setActiveTab] = useState<'camera' | 'guidance' | 'history'>('camera')
  const [sessionReps, setSessionReps] = useState<number>(0)
  const [partialReps, setPartialReps] = useState<number>(0)
  const [latestResult, setLatestResult] = useState<FormAnalysisResult | null>(null)
  const [sessionDuration, setSessionDuration] = useState<number>(0)
  const [savedSessions, setSavedSessions] = useState<BiomechanicsSessionRecord[]>([])
  const [sessionScores, setSessionScores] = useState<number[]>([])

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved sessions from storage
  useEffect(() => {
    setSavedSessions(getSavedBiomechanicsSessions())
  }, [])

  // Timer for session duration when active
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSessionDuration((prev) => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Active guidance config
  const guidance = BIOMECHANICS_GUIDANCE_CATALOG[selectedExercise]

  // Track analysis updates from camera
  const handleAnalysisUpdate = (
    result: FormAnalysisResult,
    reps: number,
    partials: number
  ) => {
    setLatestResult(result)
    setSessionReps(reps)
    setPartialReps(partials)
    if (result.formScore) {
      setSessionScores((prev) => [...prev.slice(-30), result.formScore])
    }
  }

  // Calculate average form score
  const averageFormScore = useMemo(() => {
    if (sessionScores.length === 0) return 90
    return Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
  }, [sessionScores])

  // Save current session
  const handleSaveSession = () => {
    if (sessionReps === 0 && partialReps === 0) {
      toast.info('No Reps Logged', 'Complete at least 1 repetition before saving the biomechanics session.')
      return
    }

    const newRecord: BiomechanicsSessionRecord = {
      id: `bio-${Date.now()}`,
      userId: 'demo-user',
      date: new Date().toISOString().slice(0, 10),
      exercise: selectedExercise,
      exerciseName: guidance.name,
      totalReps: sessionReps + partialReps,
      cleanReps: sessionReps,
      partialReps: partialReps,
      averageFormScore: averageFormScore,
      durationSeconds: sessionDuration,
      maxKneeAngle: latestResult?.angles?.kneeAngle,
      minKneeAngle: latestResult?.angles?.kneeAngle,
      maxElbowAngle: latestResult?.angles?.elbowAngle,
      minElbowAngle: latestResult?.angles?.elbowAngle,
      maxTorsoLean: latestResult?.angles?.torsoAngle,
      primaryFeedback: latestResult?.feedback?.map((f) => f.message) || ['Form verified.'],
    }

    saveBiomechanicsSession(newRecord)
    const updated = getSavedBiomechanicsSessions()
    setSavedSessions(updated)
    toast.success('Session Saved! ⭐', `Logged ${sessionReps} reps for ${guidance.name}.`)
  }

  const handleDeleteSession = (id: string) => {
    deleteBiomechanicsSession(id)
    setSavedSessions(getSavedBiomechanicsSessions())
    toast.info('Record Deleted', 'Biomechanics session removed from log.')
  }

  const handleExportCsv = () => {
    if (savedSessions.length === 0) {
      toast.info('No Records', 'No biomechanics sessions to export.')
      return
    }
    const csv = exportBiomechanicsToCsv(savedSessions)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-biomechanics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export Successful', 'Downloaded biomechanics history as CSV.')
  }

  const handleExportJson = () => {
    if (savedSessions.length === 0) {
      toast.info('No Records', 'No biomechanics sessions to export.')
      return
    }
    const json = exportBiomechanicsToJson(savedSessions)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-biomechanics-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Export Successful', 'Downloaded biomechanics history as JSON.')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Computer Vision Biomechanics</Badge>
            <span className="text-xs text-zinc-400 font-mono">100% On-Device Neural Model</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Advanced Biomechanics Intelligence
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Real-time joint-angle tracking, phase inflection monitoring, and movement consistency analysis running securely inside your browser.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'camera'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guidance')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'guidance'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Form Guide
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            History ({savedSessions.length})
          </button>
        </div>
      </div>

      {/* Exercise Selector Strip */}
      <div className="p-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
        {EXERCISE_OPTIONS.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => {
              setSelectedExercise(ex.id)
              setSessionReps(0)
              setPartialReps(0)
              setSessionScores([])
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedExercise === ex.id
                ? 'bg-lime-400 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <span>{ex.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                selectedExercise === ex.id
                  ? 'bg-zinc-900/20 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {ex.primaryMuscle}
            </span>
          </button>
        ))}
      </div>

      {/* Main Viewport Container */}
      {activeTab === 'camera' && (
        <div className="space-y-6">
          {/* Real-time Pose Camera Feed */}
          <PoseCameraFeed
            exercise={selectedExercise}
            onAnalysisUpdate={handleAnalysisUpdate}
          />

          {/* Real-time Telemetry & Session Management Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5 border-zinc-800 bg-zinc-900/80 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Confirmed Clean Reps</span>
              <span className="text-2xl font-extrabold text-lime-400 font-mono">{sessionReps}</span>
            </Card>

            <Card className="p-3.5 border-zinc-800 bg-zinc-900/80 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Partial Reps</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">{partialReps}</span>
            </Card>

            <Card className="p-3.5 border-zinc-800 bg-zinc-900/80 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Session Form Score</span>
              <span className="text-2xl font-extrabold text-white font-mono">{averageFormScore}%</span>
            </Card>

            <div className="flex flex-col justify-center gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveSession}
                icon={<CheckCircle2 size={16} />}
                fullWidth
              >
                Save to History
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Guide Tab (when camera is off or user wants reference) */}
      {activeTab === 'guidance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Criteria & Joint Angles */}
          <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{guidance.name}</h3>
                <span className="text-xs text-lime-400 font-medium">{guidance.primaryMuscle}</span>
              </div>
              <Badge variant="accent">{guidance.planeOfMotion} Plane</Badge>
            </div>

            {/* Target Joints */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300 block">Biomechanical Joints:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {guidance.targetJoints.map((joint, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300"
                  >
                    {joint}
                  </span>
                ))}
              </div>
            </div>

            {/* Ideal Form Criteria */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-300 block">Strict Movement Criteria:</span>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {guidance.idealFormCriteria.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-lime-400 shrink-0 mt-0.5" />
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Camera Setup Recommendations */}
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-1.5">
              <span className="font-semibold text-lime-400 block">Camera Placement Guide:</span>
              <p className="text-zinc-400 leading-relaxed">
                Position device <span className="text-white font-medium">{guidance.cameraSetup.recommendedDistance}</span> away at <span className="text-white font-medium">{guidance.cameraSetup.optimalHeight}</span> with <span className="text-white font-medium">{guidance.cameraSetup.recommendedAngle}</span>.
              </p>
            </div>
          </Card>

          {/* Right Column: Common Faults & Corrective Cues */}
          <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Common Deviations & Corrective Cues
            </h3>

            <div className="space-y-3">
              {guidance.commonFaults.map((fault, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">{fault.fault}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        fault.severity === 'high'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {fault.severity} priority
                    </span>
                  </div>
                  <p className="text-zinc-400 italic">
                    <span className="text-lime-400 not-italic font-semibold">Cue: </span>
                    &ldquo;{fault.cue}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-normal">
              <span className="font-semibold text-zinc-300">Technical Note: </span>
              {guidance.approximateNote}
            </div>
          </Card>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white">Saved Biomechanics Sessions</h3>
              <p className="text-xs text-zinc-400">Review your past movement quality logs and angle stats.</p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={savedSessions.length === 0}
                icon={<Download size={14} />}
              >
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJson}
                disabled={savedSessions.length === 0}
                icon={<Download size={14} />}
              >
                JSON
              </Button>
            </div>
          </div>

          {savedSessions.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 space-y-2">
              <Activity size={28} className="mx-auto text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-400">No biomechanics sessions saved yet.</p>
              <p className="text-xs text-zinc-500">Run a live camera session above and click &quot;Save to History&quot;.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800 overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead>
                  <tr className="text-[10px] text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Exercise</th>
                    <th className="py-2.5 px-3">Clean Reps</th>
                    <th className="py-2.5 px-3">Partials</th>
                    <th className="py-2.5 px-3">Form Score</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {savedSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-3 text-zinc-400">{session.date}</td>
                      <td className="py-3 px-3 font-sans font-bold text-white">{session.exerciseName}</td>
                      <td className="py-3 px-3 text-lime-400 font-bold">{session.cleanReps}</td>
                      <td className="py-3 px-3 text-amber-400">{session.partialReps}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          session.averageFormScore >= 80 ? 'bg-lime-400/20 text-lime-400' : 'bg-amber-400/20 text-amber-400'
                        }`}>
                          {session.averageFormScore}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400">{session.durationSeconds}s</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-red-400 transition-colors"
                          title="Delete session"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* On-Device Privacy & Medical Disclaimer */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2 text-lime-400 font-bold text-xs">
          <ShieldCheck size={16} />
          <span>100% On-Device Privacy & Approximate Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          Webcam frames are analyzed strictly in WebAssembly memory on your device using MediaPipe Pose Landmarker. Camera footage is never recorded or transmitted to any server. Automated form feedback is approximate based on 2D optical landmarks and should not be used as clinical diagnostic criteria for orthopedic or medical treatment.
        </p>
      </div>
    </div>
  )
}
