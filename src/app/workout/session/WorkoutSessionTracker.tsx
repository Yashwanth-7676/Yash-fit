'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Timer,
  CheckCircle2,
  Play,
  Pause,
  Plus,
  Trash2,
  Award,
  ArrowLeft,
  Flame,
  Check,
  FastForward,
  Video,
  ChevronDown,
  ChevronUp,
  Camera,
  Box,
} from 'lucide-react'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { PRESET_WORKOUT_ROUTINES } from '@/data/routines'
import { EXERCISE_DATABASE } from '@/data/exercises'
import { ExerciseVideoPlayer } from '@/components/video/ExerciseVideoPlayer'
import { awardXp, unlockAchievement } from '@/lib/rpg/rpgService'
import { publishActivity } from '@/lib/social/socialService'
import { applyExerciseOverrides, getFitnessUserId, workoutHistoryKey } from '@/lib/digitalTwin'
import { isSupabaseConfigured } from '@/lib/profileService'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutRoutine, CompletedSetLog, Exercise } from '@/types/workout'

function isMatchingRoutineDraft(draft: unknown, routine: WorkoutRoutine): boolean {
  if (!draft || typeof draft !== 'object') return false
  const record = draft as Record<string, unknown>
  const defaultRoutine = PRESET_WORKOUT_ROUTINES.find((item) => item.id === routine.id)
  const expectedIds = routine.exercises.map((exercise) => exercise.exerciseId)
  const draftIds = Array.isArray(record.exerciseIds)
    ? record.exerciseIds.filter((id): id is string => typeof id === 'string')
    : defaultRoutine?.exercises.map((exercise) => exercise.exerciseId) ?? []
  return JSON.stringify(draftIds) === JSON.stringify(expectedIds)
}

export function WorkoutSessionTracker() {
  const toast = useToast()
  const searchParams = useSearchParams()
  const routineId = searchParams.get('routineId') || 'routine-push-day'

  const selectedRoutine: WorkoutRoutine = useMemo(() => {
    const routine = PRESET_WORKOUT_ROUTINES.find((item) => item.id === routineId) || PRESET_WORKOUT_ROUTINES[0]
    const encodedOverrides = searchParams.get('exerciseOverrides')
    if (!encodedOverrides) return routine
    try {
      const overrides = JSON.parse(encodedOverrides) as Record<string, string>
      return applyExerciseOverrides(routine, overrides)
    } catch (error) {
      console.warn('Unable to read exercise substitutions for this session:', error)
      return routine
    }
  }, [routineId, searchParams])

  // Overall workout timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isWorkoutActive, setIsWorkoutActive] = useState(true)

  // Rest timer
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [isResting, setIsResting] = useState(false)
  const [isRestPaused, setIsRestPaused] = useState(false)

  // Demo viewer active state (does not disrupt active workout or rest countdown)
  const [expandedDemoId, setExpandedDemoId] = useState<string | null>(null)

  // Session complete flag
  const [sessionFinished, setSessionFinished] = useState(false)

  // Exercise tracking state: map of exerciseId -> CompletedSetLog[]
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, CompletedSetLog[]>>(() => {
    // Check if session draft exists in sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const draftStr = sessionStorage.getItem('yashfit_active_session_draft')
        if (draftStr) {
          const draft = JSON.parse(draftStr)
          if (draft.routineId === routineId && draft.logs && isMatchingRoutineDraft(draft, selectedRoutine)) {
            return draft.logs
          }
        }
      } catch {
        // ignore
      }
    }

    const initial: Record<string, CompletedSetLog[]> = {}
    selectedRoutine.exercises.forEach((ex) => {
      initial[ex.exerciseId] = Array.from({ length: ex.targetSets }, (_, i) => ({
        setNumber: i + 1,
        weightKg: 20,
        reps: 10,
        completed: false,
      }))
    })
    return initial
  })

  // Recover elapsed time on mount if draft exists
  useEffect(() => {
    try {
      const draftStr = sessionStorage.getItem('yashfit_active_session_draft')
      if (draftStr) {
        const draft = JSON.parse(draftStr)
        if (draft.routineId === routineId && typeof draft.elapsedSeconds === 'number' &&
          isMatchingRoutineDraft(draft, selectedRoutine)) {
          setElapsedSeconds(draft.elapsedSeconds)
          toast.info('Active Session Restored', 'Continuing your logged weights & sets.')
        }
      }
    } catch {
      // ignore
    }
  }, [routineId, selectedRoutine, toast])

  // Sync draft to sessionStorage on every change
  useEffect(() => {
    if (!sessionFinished && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'yashfit_active_session_draft',
          JSON.stringify({
            routineId,
            exerciseIds: selectedRoutine.exercises.map((exercise) => exercise.exerciseId),
            elapsedSeconds,
            logs: exerciseLogs,
          })
        )
      } catch {
        // ignore
      }
    }
  }, [exerciseLogs, elapsedSeconds, routineId, selectedRoutine, sessionFinished])

  // Workout duration counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isWorkoutActive && !sessionFinished) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutActive, sessionFinished])

  // Rest countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (isResting && !isRestPaused && restRemaining !== null && restRemaining > 0) {
      timer = setInterval(() => {
        setRestRemaining((prev) => {
          if (prev !== null && prev > 1) {
            return prev - 1
          }
          setIsResting(false)
          setIsRestPaused(false)
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([200, 100, 200])
            } catch {
              // ignore
            }
          }
          toast.info('Rest Time Over! 💪', 'Ready for your next set.')
          return null
        })
      }, 1000)
    } else if (restRemaining === 0) {
      setIsResting(false)
      setIsRestPaused(false)
      setRestRemaining(null)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isResting, isRestPaused, restRemaining, toast])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSetChange = (
    exerciseId: string,
    setIndex: number,
    field: 'weightKg' | 'reps',
    val: number
  ) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exerciseId] || [])]
      if (sets[setIndex]) {
        sets[setIndex] = { ...sets[setIndex], [field]: val }
      }
      return { ...prev, [exerciseId]: sets }
    })
  }

  const handleToggleSetComplete = (exerciseId: string, setIndex: number, restSeconds: number) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exerciseId] || [])]
      if (sets[setIndex]) {
        const nextState = !sets[setIndex].completed
        sets[setIndex] = { ...sets[setIndex], completed: nextState }

        // Start rest timer if completed
        if (nextState) {
          setRestRemaining(restSeconds)
          setIsResting(true)
        }
      }
      return { ...prev, [exerciseId]: sets }
    })
  }

  const handleAddSet = (exerciseId: string) => {
    setExerciseLogs((prev) => {
      const existing = prev[exerciseId] || []
      const lastSet = existing[existing.length - 1]
      const newSet: CompletedSetLog = {
        setNumber: existing.length + 1,
        weightKg: lastSet ? lastSet.weightKg : 20,
        reps: lastSet ? lastSet.reps : 10,
        completed: false,
      }
      return { ...prev, [exerciseId]: [...existing, newSet] }
    })
  }

  const handleRemoveSet = (exerciseId: string, setIndex: number) => {
    setExerciseLogs((prev) => {
      const existing = prev[exerciseId] || []
      if (existing.length <= 1) return prev // Keep at least one set
      const updated = existing.filter((_, idx) => idx !== setIndex)
      // Renumber
      return {
        ...prev,
        [exerciseId]: updated.map((s, idx) => ({ ...s, setNumber: idx + 1 })),
      }
    })
  }

  // Calculate stats on completion
  const totalVolume = Object.values(exerciseLogs).reduce((acc, sets) => {
    return (
      acc +
      sets.reduce((setAcc, s) => (s.completed ? setAcc + s.weightKg * s.reps : setAcc), 0)
    )
  }, 0)

  const totalCompletedSets = Object.values(exerciseLogs).reduce((acc, sets) => {
    return acc + sets.filter((s) => s.completed).length
  }, 0)

  const handleFinishSession = async () => {
    setIsWorkoutActive(false)
    setSessionFinished(true)

    // Save session in local history storage
    let accountSyncFailed = false
    let completedWorkoutCount = 0
    try {
      const sessionPayload = {
        routineName: selectedRoutine.name,
        durationSeconds: elapsedSeconds,
        totalVolume,
        totalCompletedSets,
        date: new Date().toISOString(),
        exercises: selectedRoutine.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          primaryMuscle: exercise.primaryMuscle,
          sets: (exerciseLogs[exercise.exerciseId] || []).map((set) => ({
            weightKg: set.weightKg,
            reps: set.reps,
            completed: set.completed,
          })),
        })),
      }
      try {
        const userId = await getFitnessUserId()
        const userHistory = JSON.parse(localStorage.getItem(workoutHistoryKey(userId)) || '[]')
        const scopedHistory = Array.isArray(userHistory) ? userHistory : []
        const saved = userId === 'demo-user'
          ? JSON.parse(localStorage.getItem('yashfit_completed_workouts') || '[]')
          : scopedHistory
        const existing = Array.isArray(saved) ? saved : []
        const updatedHistory = [sessionPayload, ...existing]
        completedWorkoutCount = updatedHistory.length
        localStorage.setItem(workoutHistoryKey(userId), JSON.stringify(updatedHistory))
        if (userId === 'demo-user') {
          localStorage.setItem('yashfit_completed_workouts', JSON.stringify(updatedHistory))
        }
        if (userId !== 'demo-user' && isSupabaseConfigured()) {
          const { error } = await createClient().from('workout_logs').insert({
            user_id: userId,
            routine_name: sessionPayload.routineName,
            duration_seconds: sessionPayload.durationSeconds,
            total_volume_kg: sessionPayload.totalVolume,
            total_sets_completed: sessionPayload.totalCompletedSets,
            exercise_logs: sessionPayload.exercises,
            completed_at: sessionPayload.date,
          })
          if (error) {
            console.warn('Unable to sync workout summary to Supabase:', error.message)
            accountSyncFailed = true
          }
        }
      } catch (error) {
        console.warn('Unable to save workout to the account-specific digital twin history:', error)
        accountSyncFailed = true
      }
      sessionStorage.removeItem('yashfit_active_session_draft')

      // Award Anime RPG Experience Points & Check Achievements
      awardXp('workout', 150, `Completed ${selectedRoutine.name}`, `session-${Date.now()}`)
      unlockAchievement('ach-first-blood')
      if (completedWorkoutCount >= 7) unlockAchievement('ach-iron-streak-7')
      if (completedWorkoutCount >= 3) unlockAchievement('ach-iron-streak-3')

      // Share milestone to social community feed
      publishActivity(
        'workout_completed',
        `Completed ${selectedRoutine.name}`,
        `Finished session with ${totalCompletedSets} sets and ${totalVolume.toLocaleString()}kg total volume!`,
        `${totalVolume.toLocaleString()} kg`
      )

      if (accountSyncFailed) {
        toast.info('Workout Complete — saved locally', `${selectedRoutine.name} finished, but account sync failed.`)
      } else {
        toast.success('Workout Complete! +150 XP 🏆', `${selectedRoutine.name} finished with ${totalCompletedSets} sets lifted.`)
      }
    } catch {
      // ignore storage errors
    }
  }

  if (sessionFinished) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6 border-lime-400/30 bg-zinc-900 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-lime-400/20 text-lime-400 mx-auto flex items-center justify-center">
            <Award size={36} />
          </div>

          <div>
            <span className="text-xs font-semibold text-lime-400 uppercase tracking-widest">
              Session Completed
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Outstanding Effort!</h1>
            <p className="text-zinc-400 text-sm mt-1">
              You completed your &quot;{selectedRoutine.name}&quot; session.
            </p>
          </div>

          {/* Performance Summary Grid */}
          <div className="grid grid-cols-4 gap-2 bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-center">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Time</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Volume</span>
              <span className="text-base font-bold text-lime-400 mt-0.5 block">
                {totalVolume.toLocaleString()}kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Sets</span>
              <span className="text-base font-bold text-white mt-0.5 block">
                {totalCompletedSets}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">RPG Gain</span>
              <span className="text-base font-bold text-amber-400 mt-0.5 block">
                +150 XP
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link href="/dashboard">
              <Button size="lg" fullWidth>
                Back to Dashboard
              </Button>
            </Link>
            <Link href="/workout">
              <Button variant="outline" fullWidth>
                View Workout Planner
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between">
      {/* Sticky Active Bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/workout"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              {selectedRoutine.name}
            </h1>
            <span className="text-xs text-lime-400 font-medium">Session in progress</span>
          </div>
        </div>

        {/* Timers & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Active Rest Countdown Notification with Controls */}
          {restRemaining !== null && (
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <Timer size={14} className={isRestPaused ? '' : 'animate-pulse'} />
              <span>{restRemaining}s</span>
              <button
                type="button"
                onClick={() => setIsRestPaused(!isRestPaused)}
                className="p-1 hover:text-white rounded transition-colors"
                title={isRestPaused ? 'Resume rest' : 'Pause rest'}
                aria-label="Pause/Resume rest"
              >
                {isRestPaused ? <Play size={12} /> : <Pause size={12} />}
              </button>
              <button
                type="button"
                onClick={() => setRestRemaining((prev) => (prev ? prev + 30 : 30))}
                className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-300 font-bold transition-colors"
                title="Add 30 seconds"
              >
                +30s
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResting(false)
                  setRestRemaining(null)
                  setIsRestPaused(false)
                }}
                className="p-1 hover:text-white rounded transition-colors"
                title="Skip rest"
                aria-label="Skip rest"
              >
                <FastForward size={12} />
              </button>
            </div>
          )}

          {/* Total elapsed time */}
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-sm font-mono font-bold text-white flex items-center gap-1.5">
            <Flame size={15} className="text-lime-400" />
            {formatTime(elapsedSeconds)}
          </div>

          <Button size="sm" onClick={handleFinishSession} variant="primary">
            Finish Session
          </Button>
        </div>
      </header>

      {/* Main Exercises Tracking Sheet */}
      <main className="max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6 flex-1">
        {selectedRoutine.exercises.map((item, exIdx) => {
          const sets = exerciseLogs[item.exerciseId] || []
          const isDemoExpanded = expandedDemoId === item.exerciseId
          const matchedExercise: Exercise =
            EXERCISE_DATABASE.find((ex) => ex.id === item.exerciseId) || {
              id: item.exerciseId,
              name: item.exerciseName,
              primaryMuscle: item.primaryMuscle,
              equipment: item.equipment,
              difficulty: 'Intermediate',
              instructions: ['Perform with strict control and full range of motion.'],
            }

          return (
            <Card key={item.exerciseId} className="space-y-4 p-5 sm:p-6 border-zinc-800 bg-zinc-900">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-lime-400">#{exIdx + 1}</span>
                    <Badge variant="default">{item.primaryMuscle}</Badge>
                    <span className="text-xs text-zinc-500">{item.equipment}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{item.exerciseName}</h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => setExpandedDemoId(isDemoExpanded ? null : item.exerciseId)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isDemoExpanded
                        ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-lime-400/50 hover:text-white'
                    }`}
                    title="Toggle animated exercise technique demonstration"
                  >
                    <Video size={13} className={isDemoExpanded ? 'text-zinc-950' : 'text-lime-400'} />
                    <span>{isDemoExpanded ? 'Hide Anime' : 'Anime Demo'}</span>
                    {isDemoExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  <Link
                    href={`/virtual-gym?exercise=${item.exerciseId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-lime-400/50 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Open 3D Virtual Gym biomechanics in new tab"
                  >
                    <Box size={13} className="text-lime-400" />
                    <span className="hidden sm:inline">3D Gym</span>
                  </Link>

                  <Link
                    href="/form-analysis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-lime-400/50 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Open live AI camera form checker in new tab"
                  >
                    <Camera size={13} className="text-lime-400" />
                    <span className="hidden sm:inline">Camera Check</span>
                  </Link>

                  <div className="text-right text-xs text-zinc-400 shrink-0">
                    Target: <span className="text-white font-medium">{item.targetReps} reps</span>
                  </div>
                </div>
              </div>

              {/* Expandable Anime Technique Demonstration */}
              {isDemoExpanded && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span className="font-semibold text-white">Technique Form Checker</span>
                    <span>Rest timer &amp; sets stay active</span>
                  </div>
                  <ExerciseVideoPlayer
                    exercise={matchedExercise}
                    compact={true}
                    autoPlay={true}
                  />
                </div>
              )}

              {/* Set logging table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-400 px-2 uppercase tracking-wider">
                  <span className="col-span-2 text-center">Set</span>
                  <span className="col-span-4 text-center">Weight (kg)</span>
                  <span className="col-span-3 text-center">Reps</span>
                  <span className="col-span-3 text-center">Done</span>
                </div>

                {sets.map((s, setIdx) => (
                  <div
                    key={setIdx}
                    className={[
                      'grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-colors',
                      s.completed ? 'bg-lime-400/10 border border-lime-400/20' : 'bg-zinc-950/60 border border-zinc-800/80',
                    ].join(' ')}
                  >
                    <span className="col-span-2 text-center text-sm font-bold text-zinc-400">
                      {s.setNumber}
                    </span>
                    <div className="col-span-4 px-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={s.weightKg}
                        disabled={s.completed}
                        onChange={(e) =>
                          handleSetChange(
                            item.exerciseId,
                            setIdx,
                            'weightKg',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-lg text-center font-bold text-sm text-white focus:outline-none focus:border-lime-400 disabled:opacity-60"
                      />
                    </div>
                    <div className="col-span-3 px-1">
                      <input
                        type="number"
                        min="1"
                        value={s.reps}
                        disabled={s.completed}
                        onChange={(e) =>
                          handleSetChange(
                            item.exerciseId,
                            setIdx,
                            'reps',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full h-9 bg-zinc-900 border border-zinc-700 rounded-lg text-center font-bold text-sm text-white focus:outline-none focus:border-lime-400 disabled:opacity-60"
                      />
                    </div>
                    <div className="col-span-3 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSetComplete(item.exerciseId, setIdx, item.restSeconds)
                        }
                        className={[
                          'h-9 w-9 rounded-lg flex items-center justify-center transition-all cursor-pointer',
                          s.completed
                            ? 'bg-lime-400 text-zinc-950 font-bold'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white',
                        ].join(' ')}
                        aria-label={`Mark set ${s.setNumber} complete`}
                      >
                        <Check size={18} />
                      </button>
                      {sets.length > 1 && !s.completed && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(item.exerciseId, setIdx)}
                          className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                          aria-label="Remove set"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add set button */}
              <div className="pt-1 flex justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddSet(item.exerciseId)}
                  icon={<Plus size={14} />}
                >
                  Add Set
                </Button>
              </div>
            </Card>
          )
        })}

        {/* Finish session action */}
        <div className="pt-4 flex justify-end">
          <Button size="lg" onClick={handleFinishSession} icon={<CheckCircle2 size={18} />}>
            Complete Workout Session
          </Button>
        </div>
      </main>
    </div>
  )
}
