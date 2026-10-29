'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import {
  SKELETON_CONNECTIONS,
  extractJointAngles,
  checkFullBodyVisibility,
} from '@/lib/vision/poseGeometry'
import {
  EXERCISE_FORM_CONFIGS,
  createInitialTrackerState,
  analyzeMovementFrame,
  type MovementTrackerState,
} from '@/lib/vision/exerciseRules'
import type {
  SupportedVisionExercise,
  PoseLandmark,
  FormAnalysisResult,
} from '@/types/pose'

interface PoseCameraFeedProps {
  exercise: SupportedVisionExercise
  onAnalysisUpdate?: (result: FormAnalysisResult, reps: number, partialReps: number) => void
  className?: string
}

export function PoseCameraFeed({
  exercise,
  onAnalysisUpdate,
  className = '',
}: PoseCameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const landmarkerRef = useRef<any>(null)
  const stateTrackerRef = useRef<MovementTrackerState>(createInitialTrackerState(exercise))

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true)
  const [soundFeedback, setSoundFeedback] = useState<boolean>(true)
  const [currentResult, setCurrentResult] = useState<FormAnalysisResult | null>(null)
  const [repsCount, setRepsCount] = useState<number>(0)
  const [partialRepsCount, setPartialRepsCount] = useState<number>(0)

  // Reset tracker state when exercise changes
  useEffect(() => {
    stateTrackerRef.current = createInitialTrackerState(exercise)
    setRepsCount(0)
    setPartialRepsCount(0)
    setCurrentResult(null)
  }, [exercise])

  // Play auditory cue for rep completion
  const playChime = useCallback((isSuccess = true) => {
    if (!soundFeedback || typeof window === 'undefined') return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = isSuccess ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(isSuccess ? 587.33 : 329.63, ctx.currentTime) // D5 or E4
      if (isSuccess) {
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
      }
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch {
      // AudioContext blocked or unsupported
    }
  }, [soundFeedback])

  // Initialize MediaPipe PoseLandmarker
  const initPoseLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current

    try {
      setIsModelLoading(true)
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      landmarkerRef.current = landmarker
      return landmarker
    } catch (err: any) {
      console.warn('Pose landmarker load notice:', err?.message || err)
      return null
    } finally {
      setIsModelLoading(false)
    }
  }

  // Start Camera
  const startCamera = async () => {
    setPermissionError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser environment.')
      }

      setIsModelLoading(true)
      await initPoseLandmarker()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsCameraActive(true)
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera permission was denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setPermissionError('No webcam or video capture device was detected on your device.')
      } else {
        setPermissionError(err.message || 'Unable to access camera feed.')
      }
      setIsCameraActive(false)
    } finally {
      setIsModelLoading(false)
    }
  }

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsCameraActive(false)
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  // Reset Session
  const resetSession = () => {
    stateTrackerRef.current = createInitialTrackerState(exercise)
    setRepsCount(0)
    setPartialRepsCount(0)
    setCurrentResult(null)
  }

  // Detection and Drawing Frame Loop
  useEffect(() => {
    if (!isCameraActive) return

    let lastVideoTime = -1

    const renderLoop = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      const landmarker = landmarkerRef.current

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (landmarker && video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime
            const startTimeMs = performance.now()
            const detections = landmarker.detectForVideo(video, startTimeMs)

            if (detections && detections.landmarks && detections.landmarks.length > 0) {
              const rawLandmarks: PoseLandmark[] = detections.landmarks[0]
              const isBodyVisible = checkFullBodyVisibility(rawLandmarks)
              const angles = extractJointAngles(rawLandmarks)

              if (angles) {
                const { result, nextState } = analyzeMovementFrame(
                  exercise,
                  angles,
                  stateTrackerRef.current,
                  isBodyVisible
                )

                stateTrackerRef.current = nextState
                setCurrentResult(result)
                setRepsCount(nextState.repsCount)
                setPartialRepsCount(nextState.partialRepsCount)

                if (result.repCompleted) {
                  playChime(true)
                } else if (result.isPartialRep) {
                  playChime(false)
                }

                onAnalysisUpdate?.(result, nextState.repsCount, nextState.partialRepsCount)

                // DRAW SKELETAL OVERLAY
                if (showSkeleton) {
                  const w = canvas.width
                  const h = canvas.height

                  // Bones
                  ctx.lineWidth = 3
                  ctx.lineCap = 'round'

                  for (const [idxA, idxB] of SKELETON_CONNECTIONS) {
                    const ptA = rawLandmarks[idxA]
                    const ptB = rawLandmarks[idxB]
                    if (
                      ptA &&
                      ptB &&
                      (ptA.visibility === undefined || ptA.visibility > 0.4) &&
                      (ptB.visibility === undefined || ptB.visibility > 0.4)
                    ) {
                      ctx.beginPath()
                      ctx.moveTo(ptA.x * w, ptA.y * h)
                      ctx.lineTo(ptB.x * w, ptB.y * h)
                      // Lime if form is good, amber if warning
                      ctx.strokeStyle =
                        result.formScore >= 80 ? 'rgba(163, 230, 53, 0.85)' : 'rgba(245, 158, 11, 0.85)'
                      ctx.stroke()
                    }
                  }

                  // Joint Nodes
                  for (let i = 11; i <= 28; i++) {
                    const pt = rawLandmarks[i]
                    if (pt && (pt.visibility === undefined || pt.visibility > 0.4)) {
                      ctx.beginPath()
                      ctx.arc(pt.x * w, pt.y * h, 5, 0, Math.PI * 2)
                      ctx.fillStyle = '#ffffff'
                      ctx.fill()
                      ctx.lineWidth = 2
                      ctx.strokeStyle = '#a3e635'
                      ctx.stroke()
                    }
                  }
                }
              }
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderLoop)
    }

    animFrameRef.current = requestAnimationFrame(renderLoop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [isCameraActive, exercise, showSkeleton, onAnalysisUpdate, playChime])

  const config = EXERCISE_FORM_CONFIGS[exercise]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video & Canvas Viewport */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
        {/* Hidden Camera Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Canvas Overlay for Pose Landmarks */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1] ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Camera Off / Permission Setup State */}
        {!isCameraActive && (
          <div className="p-6 text-center max-w-md space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 mx-auto flex items-center justify-center shadow-lg">
              <Camera size={28} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">AI Real-Time Form Analysis</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Position your camera <span className="text-lime-400 font-semibold">{config.recommendedDistance}</span> away at waist height with <span className="text-lime-400 font-semibold">{config.recommendedAngle}</span>.
              </p>
            </div>

            {permissionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2 text-left">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5 font-semibold text-lime-400">
                <ShieldCheck size={14} />
                <span>100% On-Device Privacy</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                Webcam frames are analyzed strictly on your device using WebAssembly. Camera footage is never uploaded, recorded, or saved to any server.
              </p>
            </div>

            <Button
              onClick={startCamera}
              disabled={isModelLoading}
              icon={isModelLoading ? <RefreshCw className="animate-spin" size={16} /> : <Camera size={16} />}
              size="lg"
              fullWidth
            >
              {isModelLoading ? 'Initializing Neural Model...' : 'Allow Camera & Start Form Check'}
            </Button>
          </div>
        )}

        {/* Live HUD Overlays when Active */}
        {isCameraActive && (
          <>
            {/* Top Left: Phase & Accuracy Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-700/60 text-xs font-bold text-white shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                {currentResult ? currentResult.phase : 'READY'}
              </span>

              {currentResult && (
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                  currentResult.formScore >= 80
                    ? 'bg-lime-400/20 text-lime-400 border-lime-400/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {currentResult.formScore}% Score
                </span>
              )}
            </div>

            {/* Top Right: Real-time Reps Counter */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/60 shadow-lg text-right">
                <span className="text-[10px] text-zinc-400 font-semibold block uppercase tracking-wider">Confirmed Reps</span>
                <span className="text-2xl font-extrabold text-lime-400 font-mono leading-none">{repsCount}</span>
              </div>
              {partialRepsCount > 0 && (
                <div className="px-2 py-1.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 text-amber-400 text-xs text-center font-bold">
                  <span className="text-[10px] block opacity-70">Partial</span>
                  <span>{partialRepsCount}</span>
                </div>
              )}
            </div>

            {/* Bottom Real-Time Form Feedback Banner */}
            {currentResult && currentResult.feedback.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 z-20">
                <div className="p-2.5 sm:p-3 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-xs flex items-center justify-between gap-3 shadow-2xl">
                  <div className="flex items-center gap-2 truncate">
                    {currentResult.feedback[0].severity === 'good' ? (
                      <CheckCircle2 size={16} className="text-lime-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                    )}
                    <span className="text-zinc-200 font-medium truncate">
                      {currentResult.feedback[0].message}
                    </span>
                  </div>

                  {currentResult.angles && (
                    <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-400 shrink-0">
                      <span>Knee: {currentResult.angles.kneeAngle}°</span>
                      <span>Elbow: {currentResult.angles.elbowAngle}°</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Control Bar */}
      {isCameraActive && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={stopCamera}
              icon={<CameraOff size={14} className="text-red-400" />}
            >
              Stop Camera
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSession}
              icon={<RefreshCw size={14} />}
            >
              Reset Reps
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Skeleton */}
            <button
              type="button"
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showSkeleton
                  ? 'bg-lime-400/10 text-lime-400 border-lime-400/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
              title="Toggle skeletal overlay"
            >
              {showSkeleton ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">Skeleton</span>
            </button>

            {/* Toggle Audio Chimes */}
            <button
              type="button"
              onClick={() => setSoundFeedback(!soundFeedback)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                soundFeedback
                  ? 'bg-zinc-800 text-lime-400 border-zinc-700'
                  : 'bg-zinc-800 text-zinc-500 border-zinc-700'
              }`}
              title="Toggle rep sound feedback"
            >
              {soundFeedback ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

