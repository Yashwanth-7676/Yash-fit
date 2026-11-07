'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  CameraViewAngle,
  MotionVerseTheme,
  MovementDifficulty,
  PlaybackRate,
  MotionVerseExercise,
} from '@/types/motionverse'
import {
  getMotionVerseExercise,
  MOTIONVERSE_EXERCISES,
} from '@/lib/motionverse/motionverseService'
import { MotionVerseCanvas } from './MotionVerseCanvas'
import { MuscleActivationMap } from './MuscleActivationMap'
import { MotionVerseFormCoach } from './MotionVerseFormCoach'
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Maximize2,
  Minimize2,
  Eye,
  Activity,
  Sliders,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { Button, Badge } from '@/components/ui'

interface MotionVersePlayerProps {
  exerciseId?: string
  onExerciseChange?: (id: string) => void
  initialTheme?: MotionVerseTheme
  initialAngle?: CameraViewAngle
  initialDifficulty?: MovementDifficulty
  compact?: boolean
  className?: string
}

export function MotionVersePlayer({
  exerciseId = 'squat',
  onExerciseChange,
  initialTheme = 'anatomical',
  initialAngle = 'side',
  initialDifficulty = 'intermediate',
  compact = false,
  className = '',
}: MotionVersePlayerProps) {
  const [selectedId, setSelectedId] = useState(exerciseId)
  const [isPlaying, setIsPlaying] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackRate>(1.0)
  const [cycleProgress, setCycleProgress] = useState(0)
  const [cameraAngle, setCameraAngle] = useState<CameraViewAngle>(initialAngle)
  const [theme, setTheme] = useState<MotionVerseTheme>(initialTheme)
  const [difficulty, setDifficulty] = useState<MovementDifficulty>(initialDifficulty)
  const [repCount, setRepCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState<'animation' | 'muscles' | 'coach' | 'instructions'>('animation')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const prevProgressRef = useRef(0)

  // Sync external exerciseId
  useEffect(() => {
    if (exerciseId && exerciseId !== selectedId) {
      setSelectedId(exerciseId)
      setCycleProgress(0)
      setRepCount(0)
    }
  }, [exerciseId, selectedId])

  const exercise = getMotionVerseExercise(selectedId)

  // Animation Loop with document.hidden guard and smooth normalization
  useEffect(() => {
    const cycleDurationMs = (exercise.cycleDurationSeconds * 1000) / playbackSpeed

    const loop = (timestamp: number) => {
      if (document.hidden) {
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      if (lastTimeRef.current === null) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      if (isPlaying) {
        setCycleProgress((prev) => {
          const next = (prev + delta / cycleDurationMs) % 1
          // Count completed rep when wrapping from ~0.9 to <0.1
          if (prev > 0.85 && next < 0.15 && prevProgressRef.current > 0.85) {
            setRepCount((r) => r + 1)
          }
          prevProgressRef.current = next
          return next
        })
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      lastTimeRef.current = null
    }
  }, [isPlaying, playbackSpeed, exercise.cycleDurationSeconds])

  // Current movement phase lookup
  const currentPhase = exercise.phases.find(
    (p) => cycleProgress >= p.phaseStartNorm && cycleProgress < p.phaseEndNorm
  ) || exercise.phases[0]

  // Frame Stepper: advance or rewind cycle by 0.05 (~5% of rep)
  const handleStep = (stepDelta: number) => {
    setIsPlaying(false)
    setCycleProgress((prev) => {
      let next = prev + stepDelta
      if (next < 0) next = 0.99
      if (next >= 1) next = 0
      return next
    })
  }

  // Handle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const handleSelectExercise = (id: string) => {
    setSelectedId(id)
    setCycleProgress(0)
    setRepCount(0)
    onExerciseChange?.(id)
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-3xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 space-y-5 overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''
      } ${className}`}
    >
      {/* Top Header & Exercise Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="accent" className="text-xs uppercase font-mono tracking-wider">
              MotionVerse Engine
            </Badge>
            <span className="text-xs text-zinc-500 font-mono">60fps Kinematics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            {exercise.name}
            {theme === 'anime' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                ⚡ Anime Hero
              </span>
            )}
          </h2>
        </div>

        {/* Action Pills: Theme Switcher & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'anatomical' ? 'anime' : 'anatomical')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
              theme === 'anime'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles size={14} className={theme === 'anime' ? 'animate-spin' : ''} />
            <span>{theme === 'anime' ? 'Anime Mode Active' : 'Switch to Anime Mode'}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="space-y-3">
        {/* Visualizer Canvas */}
        <MotionVerseCanvas
          exercise={exercise}
          cycleProgress={cycleProgress}
          cameraAngle={cameraAngle}
          theme={theme}
          difficulty={difficulty}
          isPlaying={isPlaying}
        />

        {/* Phase Timeline & Progress Scrub Bar */}
        <div className="space-y-1.5 px-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-lime-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Phase: {currentPhase.name}
            </span>
            <span className="text-zinc-400">
              Reps Completed: <span className="text-white font-bold">{repCount}</span>
            </span>
          </div>

          {/* Interactive Scrub Bar */}
          <div className="relative w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 cursor-pointer">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                theme === 'anime' ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-lime-400' : 'bg-lime-400'
              }`}
              style={{ width: `${Math.round(cycleProgress * 100)}%` }}
            />
          </div>

          <p className="text-xs text-zinc-400 italic">
            <span className="font-semibold text-zinc-300 not-italic">Movement Cue:</span> {currentPhase.cue}
          </p>
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStep(-0.05)}
              title="Step Back 0.1s"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <Rewind size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2.5 rounded-xl bg-lime-400 hover:bg-lime-500 text-zinc-950 font-bold transition shadow-md shadow-lime-400/20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <button
              type="button"
              onClick={() => handleStep(0.05)}
              title="Step Forward 0.1s"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <FastForward size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setCycleProgress(0)
                setRepCount(0)
              }}
              title="Reset Rep Cycle"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition ml-1"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          {/* Center: Playback Speed Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {([0.5, 1.0, 1.5, 2.0] as PlaybackRate[]).map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setPlaybackSpeed(rate)}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold transition ${
                  playbackSpeed === rate
                    ? 'bg-lime-400 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {rate}x{rate === 0.5 ? ' (Slow)' : ''}
              </button>
            ))}
          </div>

          {/* Right: Camera Angle Selector */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['side', 'front', 'rear'] as CameraViewAngle[]).map((ang) => (
              <button
                key={ang}
                type="button"
                onClick={() => setCameraAngle(ang)}
                className={`px-2.5 py-1 rounded-lg uppercase font-semibold text-[11px] transition ${
                  cameraAngle === ang
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ang}
              </button>
            ))}
          </div>

          {/* Right-most: Difficulty Tier */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            {(['beginner', 'intermediate', 'advanced'] as MovementDifficulty[]).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg capitalize text-[11px] font-semibold transition ${
                  difficulty === diff
                    ? 'bg-lime-400/20 text-lime-400 border border-lime-400/30 font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Animation Details, Muscle Activation Map, AI Form Coach */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('animation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'animation'
                ? 'bg-lime-400 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Layers size={14} /> Exercise Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('muscles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'muscles'
                ? 'bg-lime-400 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Activity size={14} /> Muscle Activation Map
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'coach'
                ? 'bg-lime-400 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sliders size={14} /> AI Form Coach & Camera
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instructions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'instructions'
                ? 'bg-lime-400 text-zinc-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BookOpen size={14} /> Phase Instructions
          </button>
        </div>

        {/* Tab 1: Exercise Overview */}
        {activeTab === 'animation' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-400 block">
                Target Muscle Groups
              </span>
              <div className="flex flex-wrap gap-1.5">
                {exercise.targetMuscles.primary.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded text-xs bg-lime-400/15 border border-lime-400/30 text-lime-300 font-semibold">
                    {m} (Primary)
                  </span>
                ))}
                {exercise.targetMuscles.secondary.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded text-xs bg-sky-400/15 border border-sky-400/30 text-sky-300">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Cadence & Equipment
              </span>
              <div className="text-xs text-zinc-300">
                <span className="text-zinc-500">Standard Cadence:</span> <span className="font-mono text-lime-400 font-bold">{exercise.defaultTempo}</span>
              </div>
              <div className="text-xs text-zinc-300">
                <span className="text-zinc-500">Required Gear:</span> {exercise.equipment}
              </div>
              <div className="text-xs text-zinc-300">
                <span className="text-zinc-500">Cycle Time:</span> {exercise.cycleDurationSeconds}s per rep
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 block">
                Anime Hero Theme Persona
              </span>
              <div className="text-xs text-zinc-200 font-bold">
                {exercise.animeConfig.characterName}
              </div>
              <p className="text-xs text-zinc-400 leading-snug">
                {exercise.animeConfig.heroTitle} • {exercise.animeConfig.energyTier}
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Muscle Activation Map */}
        {activeTab === 'muscles' && (
          <MuscleActivationMap exercise={exercise} cycleProgress={cycleProgress} />
        )}

        {/* Tab 3: AI Form Coach & Live Pose Camera */}
        {activeTab === 'coach' && (
          <MotionVerseFormCoach exercise={exercise} />
        )}

        {/* Tab 4: Step-by-Step Movement Phases */}
        {activeTab === 'instructions' && (
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <h3 className="text-sm font-bold text-white">Full Repetition Cycle Breakdown</h3>
            <div className="space-y-2.5">
              {exercise.phases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {idx + 1}. {phase.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded">
                      Breathing: {phase.breathing}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{phase.cue}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
