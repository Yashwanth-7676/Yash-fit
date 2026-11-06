'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  Trophy,
  Dumbbell,
  Clock,
  Flame,
  Shuffle,
  ChevronRight,
  Check,
  Info,
} from 'lucide-react'
import { Card, Badge, Button, Modal, useToast } from '@/components/ui'
import { useAccessibility } from '@/lib/accessibility/accessibilityContext'
import { useOfflineSync } from '@/lib/offline/offlineContext'
import { BiomechanicalAnimator } from '@/components/workout-studio/BiomechanicalAnimator'
import {
  DEFAULT_STUDIO_ROUTINES,
  speakStudioCue,
  playStudioChime,
  completeStudioSession,
} from '@/lib/workout-studio/workoutStudioService'
import type {
  StudioWorkoutState,
  StudioExerciseDetail,
  StudioExerciseSubstitution,
  WorkoutStudioSummary,
} from '@/types/workoutStudio'

export function WorkoutStudioContent() {
  const toast = useToast()
  const { preferences } = useAccessibility()
  const { enqueue } = useOfflineSync()

  // Routine selection & state
  const [workoutState, setWorkoutState] = useState<StudioWorkoutState | null>(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [summaryData, setSummaryData] = useState<WorkoutStudioSummary | null>(null)

  // Substitution modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false)

  // Timers
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null)
  const restTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Start selected routine
  const handleStartWorkout = (routineIndex: number) => {
    const routine = DEFAULT_STUDIO_ROUTINES[routineIndex]
    // Deep copy exercises so edits don't mutate defaults
    const clonedExercises: StudioExerciseDetail[] = JSON.parse(
      JSON.stringify(routine.exercises)
    )

    const initial: StudioWorkoutState = {
      routineId: routine.id,
      routineName: routine.name,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      elapsedSeconds: 0,
      isPaused: false,
      restRemainingSeconds: 0,
      isResting: false,
      voiceEnabled: true,
      exercises: clonedExercises,
    }

    setWorkoutState(initial)
    speakStudioCue(
      `Starting ${routine.name}. First exercise is ${clonedExercises[0].name}. Let's crush it!`,
      true
    )
    toast.success(`Workout started: ${routine.name}`)
  }

  const isWorkoutActive = Boolean(workoutState && !workoutState.isPaused)

  // Elapsed workout timer
  useEffect(() => {
    if (isWorkoutActive) {
      workoutTimerRef.current = setInterval(() => {
        setWorkoutState((prev) => {
          if (!prev || prev.isPaused) return prev
          return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }
        })
      }, 1000)
    } else {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
    }

    return () => {
      if (workoutTimerRef.current) clearInterval(workoutTimerRef.current)
    }
  }, [isWorkoutActive])

  // Rest countdown timer
  useEffect(() => {
    if (workoutState?.isResting && workoutState.restRemainingSeconds > 0) {
      restTimerRef.current = setInterval(() => {
        setWorkoutState((prev) => {
          if (!prev || !prev.isResting) return prev
          if (prev.restRemainingSeconds <= 1) {
            playStudioChime()
            speakStudioCue('Rest complete! Ready for your next set.', prev.voiceEnabled)
            return {
              ...prev,
              restRemainingSeconds: 0,
              isResting: false,
            }
          }
          return {
            ...prev,
            restRemainingSeconds: prev.restRemainingSeconds - 1,
          }
        })
      }, 1000)
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current)
    }
  }, [workoutState?.isResting, workoutState?.restRemainingSeconds])

  // Current exercise derived
  const currentExercise = useMemo(() => {
    if (!workoutState) return null
    return workoutState.exercises[workoutState.currentExerciseIndex] || null
  }, [workoutState])

  // Progress metrics
  const progressMetrics = useMemo(() => {
    if (!workoutState) return { totalSets: 0, completedSets: 0, percent: 0 }
    let total = 0
    let completed = 0
    for (const ex of workoutState.exercises) {
      for (const s of ex.sets) {
        total++
        if (s.isCompleted) completed++
      }
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0
    return { totalSets: total, completedSets: completed, percent }
  }, [workoutState])

  // Toggle set completed
  const handleToggleSet = (exerciseIndex: number, setIndex: number) => {
    if (!workoutState) return

    setWorkoutState((prev) => {
      if (!prev) return null
      const updatedExercises = [...prev.exercises]
      const targetExercise = { ...updatedExercises[exerciseIndex] }
      const targetSets = [...targetExercise.sets]
      const targetSet = { ...targetSets[setIndex] }

      const willComplete = !targetSet.isCompleted
      targetSet.isCompleted = willComplete
      if (!targetSet.actualWeightKg) targetSet.actualWeightKg = targetSet.targetWeightKg
      if (!targetSet.actualReps) targetSet.actualReps = parseInt(targetSet.targetReps, 10) || 8

      targetSets[setIndex] = targetSet
      targetExercise.sets = targetSets
      updatedExercises[exerciseIndex] = targetExercise

      let restRemaining = prev.restRemainingSeconds
      let isResting = prev.isResting

      if (willComplete) {
        restRemaining = targetSet.restSeconds || 90
        isResting = true
        speakStudioCue(
          `Set ${targetSet.setNumber} complete. Resting for ${restRemaining} seconds.`,
          prev.voiceEnabled
        )
      }

      return {
        ...prev,
        exercises: updatedExercises,
        restRemainingSeconds: restRemaining,
        isResting,
      }
    })
  }

  // Update actual reps/weight input
  const handleUpdateSetValues = (
    exerciseIndex: number,
    setIndex: number,
    field: 'actualWeightKg' | 'actualReps',
    value: number
  ) => {
    if (!workoutState) return
    setWorkoutState((prev) => {
      if (!prev) return null
      const updatedExercises = [...prev.exercises]
      const ex = { ...updatedExercises[exerciseIndex] }
      const sets = [...ex.sets]
      sets[setIndex] = { ...sets[setIndex], [field]: value }
      ex.sets = sets
      updatedExercises[exerciseIndex] = ex
      return { ...prev, exercises: updatedExercises }
    })
  }

  // Pause / Resume
  const handleTogglePause = () => {
    if (!workoutState) return
    const nextPaused = !workoutState.isPaused
    setWorkoutState((prev) => (prev ? { ...prev, isPaused: nextPaused } : null))
    speakStudioCue(nextPaused ? 'Workout paused' : 'Workout resumed', workoutState.voiceEnabled)
  }

  // Voice toggle
  const handleToggleVoice = () => {
    if (!workoutState) return
    const nextVoice = !workoutState.voiceEnabled
    setWorkoutState((prev) => (prev ? { ...prev, voiceEnabled: nextVoice } : null))
    toast.info(nextVoice ? 'Voice coach enabled' : 'Voice coach muted')
  }

  // Rest timer controls
  const handleAddRestTime = (seconds: number) => {
    setWorkoutState((prev) =>
      prev ? { ...prev, restRemainingSeconds: prev.restRemainingSeconds + seconds, isResting: true } : null
    )
  }

  const handleSkipRest = () => {
    setWorkoutState((prev) =>
      prev ? { ...prev, restRemainingSeconds: 0, isResting: false } : null
    )
    speakStudioCue('Rest skipped. Get to work!', workoutState?.voiceEnabled || false)
  }

  // Exercise substitution
  const handleApplySubstitution = (sub: StudioExerciseSubstitution) => {
    if (!workoutState || !currentExercise) return

    setWorkoutState((prev) => {
      if (!prev) return null
      const updatedExercises = [...prev.exercises]
      const currentEx = updatedExercises[prev.currentExerciseIndex]

      updatedExercises[prev.currentExerciseIndex] = {
        ...currentEx,
        exerciseId: sub.id,
        name: sub.name,
      }

      return { ...prev, exercises: updatedExercises }
    })

    setIsSubModalOpen(false)
    speakStudioCue(`Substituted exercise with ${sub.name}`, workoutState.voiceEnabled)
    toast.success(`Substituted with ${sub.name}`)
  }

  // End workout
  const handleEndWorkout = () => {
    if (!workoutState) return
    setIsEndConfirmOpen(true)
  }

  const confirmEndWorkout = () => {
    if (!workoutState) return
    setIsEndConfirmOpen(false)
    const summary = completeStudioSession(workoutState)
    setSummaryData(summary)
    setIsSummaryOpen(true)

    // Enqueue for reliable offline-first synchronization
    enqueue(
      'LOG_WORKOUT',
      {
        routineName: summary.routineName,
        totalVolumeKg: summary.totalVolumeKg,
        totalSetsCompleted: summary.totalSetsCompleted,
        durationMinutes: summary.durationMinutes,
        completedAt: new Date().toISOString(),
      },
      summary.sessionId
    )

    speakStudioCue(
      `Outstanding work! You completed ${summary.totalSetsCompleted} sets and moved over ${summary.totalVolumeKg} kilograms!`,
      workoutState.voiceEnabled
    )
    setWorkoutState(null)
  }

  // Format mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                Interactive Smart Workout Studio
                <Badge variant="accent" className="text-xs">
                  Stage #34
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400">
                Biomechanical kinematics engine, live set logger, and audio-guided rest timer.
              </p>
            </div>
          </div>
        </div>

        {workoutState && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleToggleVoice}
              className="flex items-center gap-1.5 text-xs border-zinc-700"
            >
              {workoutState.voiceEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-lime-400" />
                  Voice On
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                  Voice Muted
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleTogglePause}
              className="flex items-center gap-1.5 text-xs border-zinc-700"
            >
              {workoutState.isPaused ? (
                <>
                  <Play className="w-4 h-4 text-lime-400" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-amber-400" />
                  Pause
                </>
              )}
            </Button>

            <Button
              variant="primary"
              onClick={handleEndWorkout}
              className="text-xs bg-lime-400 text-zinc-950 font-semibold"
            >
              Finish Workout
            </Button>
          </div>
        )}
      </div>

      {/* VIEW A: ROUTINE SELECTOR (When no active workout) */}
      {!workoutState && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Play className="w-5 h-5 text-lime-400" />
              Choose Studio Workout Routine
            </h2>
            <Badge variant="default" className="text-xs text-lime-400 border-lime-400/30">
              Biomechanical Kinematics Ready
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEFAULT_STUDIO_ROUTINES.map((routine, idx) => (
              <Card
                key={routine.id}
                className="p-5 bg-zinc-900 border-zinc-800 flex flex-col justify-between hover:border-lime-400/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                    <span>{routine.targetSplit}</span>
                    <span className="flex items-center gap-1 text-lime-400">
                      <Clock className="w-3.5 h-3.5" />
                      ~{routine.estimatedMinutes}m
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-100 mb-3">{routine.name}</h3>

                  <div className="space-y-2 mb-4">
                    {routine.exercises.map((ex, eIdx) => (
                      <div
                        key={ex.exerciseId}
                        className="text-xs text-zinc-300 flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/60"
                      >
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-[10px]">
                          {eIdx + 1}
                        </span>
                        <span className="font-medium">{ex.name}</span>
                        <span className="text-[10px] text-zinc-500 ml-auto">
                          {ex.sets.length} sets
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => handleStartWorkout(idx)}
                  className="w-full bg-lime-400 hover:bg-lime-500 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 mt-2"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  Launch Interactive Studio
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* VIEW B: ACTIVE WORKOUT CONSOLE */}
      {workoutState && currentExercise && (
        <div className="space-y-6">
          {/* Top Workout Progress Bar & Status */}
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-100">{workoutState.routineName}</span>
                <span className="text-xs text-zinc-500">•</span>
                <span className="text-xs text-zinc-400">
                  Exercise {workoutState.currentExerciseIndex + 1} of {workoutState.exercises.length}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-zinc-200">
                  <Clock className="w-4 h-4 text-lime-400" />
                  <span className="text-base font-bold text-lime-400">
                    {formatTimer(workoutState.elapsedSeconds)}
                  </span>
                </div>
                <div className="text-zinc-400">
                  Sets: <span className="text-zinc-100 font-semibold">{progressMetrics.completedSets}</span> / {progressMetrics.totalSets} ({progressMetrics.percent}%)
                </div>
              </div>
            </div>

            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-300"
                style={{ width: `${progressMetrics.percent}%` }}
              />
            </div>
          </Card>

          {/* Exercise Tabs Quick Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {workoutState.exercises.map((ex, idx) => {
              const isDone = ex.sets.every((s) => s.isCompleted)
              const isActive = idx === workoutState.currentExerciseIndex
              return (
                <button
                  key={`tab-ex-${ex.exerciseId}`}
                  onClick={() =>
                    setWorkoutState((prev) => (prev ? { ...prev, currentExerciseIndex: idx } : null))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-lime-400 text-zinc-950 font-semibold'
                      : isDone
                      ? 'bg-zinc-900 text-lime-400 border border-lime-400/30'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <span>{idx + 1}.</span>}
                  <span>{ex.name}</span>
                </button>
              )
            })}
          </div>

          {/* Two-Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Biomechanical Kinematics & Cues */}
            <div className="lg:col-span-5 space-y-4">
              <BiomechanicalAnimator
                motionKey={currentExercise.motionCycleKey}
                exerciseName={currentExercise.name}
                isPaused={workoutState.isPaused}
              />

              {/* Muscle Groups & Substitution button */}
              <Card className="p-4 bg-zinc-900 border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="accent" className="text-xs">
                      {currentExercise.primaryMuscle}
                    </Badge>
                    {currentExercise.secondaryMuscles.map((sec) => (
                      <Badge key={sec} variant="default" className="text-xs border-zinc-700 text-zinc-400">
                        {sec}
                      </Badge>
                    ))}
                  </div>

                  {currentExercise.substitutions.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setIsSubModalOpen(true)}
                      className="text-xs flex items-center gap-1.5 border-zinc-700 hover:border-lime-400/40 text-zinc-300"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-lime-400" />
                      Substitute
                    </Button>
                  )}
                </div>

                {/* Form Cues */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-semibold text-lime-400 uppercase tracking-wide">
                    Form Execution Cues
                  </div>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {currentExercise.cues.map((cue, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5">
                        <span className="text-lime-400 font-bold">•</span>
                        <span>{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Breathing Guidance */}
                <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-200">Breathing: </span>
                  {currentExercise.breathingGuidance}
                </div>

                {/* Beginner Cues (Accessibility & Inclusive Fitness) */}
                {preferences.showBeginnerCues && (
                  <div className="p-2.5 rounded-lg bg-lime-400/10 border border-lime-400/30 text-xs text-lime-300">
                    <span className="font-bold flex items-center gap-1.5 mb-1">
                      <Info size={14} /> Beginner Safety Cue
                    </span>
                    Maintain controlled tempo (2s lowering, 1s lift). If you feel joint discomfort, reduce load or tap Substitute above for a joint-friendly variant.
                  </div>
                )}
              </Card>
            </div>

            {/* Right 7 Cols: Interactive Set Logger & Rest Timer */}
            <div className="lg:col-span-7 space-y-4">
              {/* REST COUNTDOWN FLOATING BANNER */}
              {workoutState.isResting && (
                <Card className="p-4 bg-gradient-to-r from-lime-950/40 via-zinc-900 to-zinc-950 border border-lime-400/40 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-lime-400/20 text-lime-400">
                        <Clock className="w-5 h-5 animate-spin" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-lime-400">
                          Active Rest Timer
                        </div>
                        <div className="text-2xl font-mono font-bold text-zinc-100">
                          {formatTimer(workoutState.restRemainingSeconds)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleAddRestTime(15)}
                        className="text-xs border-zinc-700 text-zinc-300"
                      >
                        +15s
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSkipRest}
                        className="text-xs bg-lime-400 text-zinc-950 font-semibold"
                      >
                        Skip Rest
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* SETS LOGGING TABLE */}
              <Card className="p-5 bg-zinc-900 border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-lime-400" />
                    <span>Sets & Performance Logger</span>
                  </h3>
                  <Badge variant="default" className="text-xs text-zinc-400 border-zinc-700">
                    Auto Rest Audio Chime Active
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                        <th className="pb-3 w-12 text-center">Set</th>
                        <th className="pb-3">Target Reps</th>
                        <th className="pb-3">Weight (kg)</th>
                        <th className="pb-3">Actual Reps</th>
                        <th className="pb-3 text-right">Log Set</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {currentExercise.sets.map((set, sIdx) => {
                        const isSetDone = set.isCompleted
                        return (
                          <tr
                            key={`set-${set.setNumber}`}
                            className={`transition-colors ${
                              isSetDone ? 'bg-lime-400/5' : 'hover:bg-zinc-800/30'
                            }`}
                          >
                            <td className="py-3 text-center font-bold text-zinc-400">
                              {set.setNumber}
                            </td>
                            <td className="py-3 text-zinc-300 font-mono">
                              {set.targetReps} reps
                            </td>
                            <td className="py-3">
                              <input
                                type="number"
                                step="2.5"
                                value={set.actualWeightKg ?? set.targetWeightKg}
                                onChange={(e) =>
                                  handleUpdateSetValues(
                                    workoutState.currentExerciseIndex,
                                    sIdx,
                                    'actualWeightKg',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-lime-400 focus:outline-none"
                              />
                            </td>
                            <td className="py-3">
                              <input
                                type="number"
                                value={set.actualReps ?? (parseInt(set.targetReps, 10) || 8)}
                                onChange={(e) =>
                                  handleUpdateSetValues(
                                    workoutState.currentExerciseIndex,
                                    sIdx,
                                    'actualReps',
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className="w-16 p-1.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs focus:border-lime-400 focus:outline-none"
                              />
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() =>
                                  handleToggleSet(workoutState.currentExerciseIndex, sIdx)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${
                                  isSetDone
                                    ? 'bg-lime-400 text-zinc-950'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                              >
                                {isSetDone ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Done
                                  </>
                                ) : (
                                  'Complete'
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Instructions list */}
              <Card className="p-4 bg-zinc-900 border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wide">
                  Step-by-step Execution Instructions
                </h4>
                <ol className="space-y-1.5 text-xs text-zinc-400 list-decimal pl-4">
                  {currentExercise.instructions.map((inst, iIdx) => (
                    <li key={iIdx}>{inst}</li>
                  ))}
                </ol>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EXERCISE SUBSTITUTION */}
      {currentExercise && (
        <Modal
          isOpen={isSubModalOpen}
          onClose={() => setIsSubModalOpen(false)}
          title={`Substitute ${currentExercise.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-zinc-400">
              Select an biomechanically equivalent exercise for this session. Target sets will be preserved.
            </p>

            <div className="space-y-2">
              {currentExercise.substitutions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => handleApplySubstitution(sub)}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-lime-400/50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{sub.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{sub.reason}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsSubModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: WORKOUT COMPLETION SUMMARY */}
      {summaryData && (
        <Modal
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          title="Session Summary & Personal Records"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-lime-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Workout Successfully Saved!</h3>
                <p className="text-xs text-zinc-400">
                  Logged directly to your permanent YashFit workout database.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Total Volume</div>
                <div className="text-lg font-bold text-lime-400">{summaryData.totalVolumeKg} kg</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Sets Completed</div>
                <div className="text-lg font-bold text-zinc-100">{summaryData.totalSetsCompleted}</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Duration</div>
                <div className="text-lg font-bold text-zinc-100">{summaryData.durationMinutes} mins</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="text-xs text-zinc-400">Est. Calories</div>
                <div className="text-lg font-bold text-amber-400">
                  {summaryData.estimatedCaloriesBurned} kcal
                </div>
              </div>
            </div>

            {summaryData.personalRecordsHit.length > 0 && (
              <div className="p-3.5 rounded-lg bg-zinc-950 border border-amber-500/30 space-y-2">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  <span>Personal Records Smashed!</span>
                </div>
                <ul className="text-xs text-zinc-300 space-y-1">
                  {summaryData.personalRecordsHit.map((pr, pIdx) => (
                    <li key={pIdx} className="flex items-center gap-1.5">
                      <span className="text-amber-400 font-bold">★</span>
                      <span>{pr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={() => setIsSummaryOpen(false)}
                className="bg-lime-400 text-zinc-950 font-semibold"
              >
                Close Summary
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* End Workout Confirmation Modal */}
      <Modal
        isOpen={isEndConfirmOpen}
        onClose={() => setIsEndConfirmOpen(false)}
        title="Complete Workout Session"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you ready to complete and save today&apos;s workout session? Your completed sets, reps, and total moved volume will be logged to your fitness history.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEndConfirmOpen(false)}>
              Keep Training
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={confirmEndWorkout}
              className="bg-lime-400 text-zinc-950 font-semibold"
            >
              Finish &amp; Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

