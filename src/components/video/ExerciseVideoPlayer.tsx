'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Flame,
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react'
import { AnimeExerciseCanvas } from './AnimeExerciseCanvas'
import type {
  Exercise,
  ExerciseVideoMetadata,
  CameraAngle,
  PlaybackSpeed,
} from '@/types/workout'

interface ExerciseVideoPlayerProps {
  exercise: Exercise
  autoPlay?: boolean
  initialAngle?: CameraAngle
  compact?: boolean
  className?: string
  onClose?: () => void
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.25, 1.5]

export function ExerciseVideoPlayer({
  exercise,
  autoPlay = false,
  initialAngle = 'Side',
  compact = false,
  className = '',
  onClose,
}: ExerciseVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const videoMeta: ExerciseVideoMetadata | undefined = exercise.video

  // State
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [duration, setDuration] = useState<number>(videoMeta?.durationSeconds || 8)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(0.8)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1.0)
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>(initialAngle)
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true)
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [hasError, setHasError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [displayMode, setDisplayMode] = useState<'anime' | 'stream'>('anime')

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (mediaQuery.matches) {
        setIsPlaying(false)
      }
    }
  }, [])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Keyboard shortcut controls: Space (Play/Pause), M (Mute), F (Fullscreen), Arrow keys (Seek)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      } else if (e.code === 'KeyM') {
        e.preventDefault()
        setIsMuted((prev) => !prev)
      } else if (e.code === 'KeyF') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        handleSeek(Math.max(0, currentTime - 2))
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        handleSeek(Math.min(duration, currentTime + 2))
      }
    }

    const currentContainer = containerRef.current
    if (currentContainer) {
      currentContainer.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [currentTime, duration])

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => setHasError(true))
      }
    }
  }, [isPlaying])

  // Replay
  const handleReplay = useCallback(() => {
    setCurrentTime(0)
    setIsPlaying(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => setHasError(true))
    }
  }, [])

  // Seek bar scrub
  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  // Speed change
  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {
        // Fullscreen not supported or blocked
      })
    } else {
      document.exitFullscreen?.().catch(() => {
        // Exit failed
      })
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // 1. HONEST UNAVAILABLE STATE (Prompt Rule 2)
  if (!videoMeta) {
    return (
      <div className={`p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="text-base font-semibold text-white">Demonstration In Preparation</h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            A verified anime-style animated demonstration for <span className="text-white font-medium">{exercise.name}</span> is currently being rendered to ensure strict anatomical mechanics.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-lime-400">
            <CheckCircle2 size={14} />
            <span>Key Technique Cues:</span>
          </div>
          <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
            {exercise.instructions.slice(0, 3).map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl focus:outline-none focus:ring-1 focus:ring-lime-400 ${
        isFullscreen ? 'w-screen h-screen rounded-none' : ''
      } ${className}`}
    >
      {/* Player Header Banner */}
      <div className="px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-white truncate">{videoMeta.title}</h3>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20 shrink-0">
            {videoMeta.animationType === 'anime_2d' ? 'Anime 2D Cel' : 'Procedural 3D'}
          </span>
        </div>

        {/* Multi-angle & Mode Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          {videoMeta.cameraAngles.map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setCameraAngle(angle)}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all ${
                cameraAngle === angle
                  ? 'bg-lime-400 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {angle}
            </button>
          ))}
        </div>
      </div>

      {/* Main Video / Anime Canvas Viewport */}
      <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        {displayMode === 'anime' ? (
          <AnimeExerciseCanvas
            motionCycleKey={videoMeta.motionCycleKey}
            exerciseName={exercise.name}
            primaryMuscle={exercise.primaryMuscle}
            secondaryMuscles={exercise.secondaryMuscles}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            currentTime={currentTime}
            duration={duration}
            cameraAngle={cameraAngle}
            showHeatmap={showHeatmap}
            showTrajectory={showTrajectory}
            onTimeUpdate={(t) => setCurrentTime(t)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
            {/* HTML5 or External verified stream */}
            {videoMeta.sourceUrl ? (
              <video
                ref={videoRef}
                src={videoMeta.sourceUrl}
                poster={videoMeta.posterUrl}
                playsInline
                muted={isMuted}
                loop
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                onError={() => {
                  setHasError(true)
                  setDisplayMode('anime')
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-4 text-center">
                <p>Stream source currently unconfigured. Switched to Anime Kinetic Engine.</p>
              </div>
            )}
          </div>
        )}

        {/* Big Centered Play/Pause Overlay Indicator on click */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 w-full h-full cursor-pointer flex items-center justify-center bg-transparent group-hover:bg-black/15 transition-colors focus:outline-none"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {!isPlaying && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-lime-400/90 text-zinc-950 flex items-center justify-center shadow-lg shadow-lime-400/20 transform hover:scale-105 transition-transform">
              <Play size={26} className="ml-1 fill-zinc-950" />
            </div>
          )}
        </button>

        {/* Heatmap & Trajectory Quick Floating Toggles */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            title="Toggle Muscle Activation Heatmap"
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-all ${
              showHeatmap
                ? 'bg-lime-400/20 border-lime-400/40 text-lime-400'
                : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-400 hover:text-white'
            }`}
          >
            <Flame size={12} className={showHeatmap ? 'fill-lime-400' : ''} />
            <span>Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrajectory((prev) => !prev)}
            title="Toggle Bar Path Trajectory"
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 border transition-all ${
              showTrajectory
                ? 'bg-lime-400/20 border-lime-400/40 text-lime-400'
                : 'bg-zinc-900/80 border-zinc-700/60 text-zinc-400 hover:text-white'
            }`}
          >
            <Activity size={12} />
            <span>Bar Path</span>
          </button>
        </div>
      </div>

      {/* Scrub Bar */}
      <div className="px-3 pt-2 bg-zinc-900">
        <input
          type="range"
          min="0"
          max={duration}
          step="0.05"
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400 focus:outline-none"
          aria-label="Seek playback position"
        />
      </div>

      {/* Transport Controls Bar */}
      <div className="px-3 pb-2.5 pt-1 bg-zinc-900 flex items-center justify-between gap-2 text-xs text-zinc-300">
        {/* Play/Pause, Replay & Timestamp */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 rounded-lg text-white hover:text-lime-400 hover:bg-zinc-800 transition-colors"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current" />}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Replay from start"
            aria-label="Replay"
          >
            <RotateCcw size={15} />
          </button>

          <span className="font-mono text-[11px] text-zinc-400 select-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Speed, Volume, Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-zinc-800/80 rounded-md p-0.5">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-lime-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Mute / Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            aria-label="Toggle mute"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Toggle fullscreen (F)"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Attribution & Cadence Footer */}
      {!compact && (
        <div className="px-4 py-2 bg-zinc-950/60 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-lime-400" />
            <span>{videoMeta.attribution || 'YashFit Anime Kinetic Lab'}</span>
          </div>
          {videoMeta.tempo && (
            <div className="font-mono text-zinc-400">
              Tempo: <span className="text-lime-400 font-semibold">{videoMeta.tempo}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

