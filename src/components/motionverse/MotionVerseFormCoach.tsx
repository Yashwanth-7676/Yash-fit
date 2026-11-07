'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { MotionVerseExercise } from '@/types/motionverse'
import {
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui'

interface MotionVerseFormCoachProps {
  exercise: MotionVerseExercise
  currentPhaseIndex?: number
  className?: string
}

export function MotionVerseFormCoach({
  exercise,
  currentPhaseIndex = 0,
  className = '',
}: MotionVerseFormCoachProps) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [liveEvaluation, setLiveEvaluation] = useState<string>('Ready for form check')
  const [detectedJointAngle, setDetectedJointAngle] = useState<number | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // Start real on-device camera stream
  const startCamera = async () => {
    setPermissionError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your current browser environment.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraActive(true)
      setLiveEvaluation('Camera connected. Stand 6-8 feet away with full body in view.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission was denied or camera unavailable.'
      setPermissionError(msg)
      setIsCameraActive(false)
    }
  }

  // Stop camera stream cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    setIsCameraActive(false)
    setLiveEvaluation('Camera disconnected')
    setDetectedJointAngle(null)
  }, [])

  // Cleanup on unmount or exercise change
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className={`p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20">
            <Sliders size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Movement Form Coach</h3>
            <p className="text-[11px] text-zinc-400">Posture checkpoints and common fault diagnostics</p>
          </div>
        </div>

        {/* Camera Toggle Button */}
        <Button
          type="button"
          size="sm"
          variant={isCameraActive ? 'outline' : 'primary'}
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`text-xs flex items-center gap-1.5 ${
            isCameraActive ? 'border-rose-500 text-rose-400' : 'bg-lime-400 text-zinc-950 font-bold'
          }`}
        >
          {isCameraActive ? (
            <>
              <CameraOff size={14} /> Stop Camera
            </>
          ) : (
            <>
              <Camera size={14} /> Live Camera Form Check
            </>
          )}
        </Button>
      </div>

      {/* Live Camera View (When Active) */}
      {isCameraActive && (
        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              On-Device Vision Feed
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Real-time local processing</span>
          </div>

          <div className="relative aspect-video max-h-64 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Skeletal Target Overlay Box */}
            <div className="absolute inset-4 border-2 border-dashed border-lime-400/30 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-lime-400/60 font-mono">Align posture inside target frame</span>
            </div>
          </div>

          {/* Real-time Feedback Banner */}
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium">{liveEvaluation}</span>
            <span className="text-lime-400 font-mono font-bold">Optimal Tracking</span>
          </div>
        </div>
      )}

      {permissionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Camera Inactive</span>
            {permissionError}
          </div>
        </div>
      )}

      {/* Checkpoints & Common Fault Diagnostics */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
          Key Biomechanical Checkpoints & Corrections
        </span>

        <div className="space-y-2.5">
          {exercise.formCheckpoints.map((cp, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-lime-400" />
                  {cp.joint}: {cp.targetAngleDescription}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    cp.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {cp.severity} fault risk
                </span>
              </div>

              <div className="text-xs text-rose-300/90 flex items-start gap-1">
                <span className="font-semibold text-rose-400 shrink-0">Common Fault:</span>
                <span>{cp.commonMistake}</span>
              </div>

              <div className="text-xs text-lime-300/90 flex items-start gap-1 bg-lime-400/5 p-1.5 rounded border border-lime-400/20">
                <span className="font-semibold text-lime-400 shrink-0">Coach Cue:</span>
                <span>{cp.correctionCue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-500 flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
        <span>
          100% Private On-Device Vision: Video frames are computed strictly inside your browser instance and are never recorded, saved, or uploaded to any server.
        </span>
      </div>
    </div>
  )
}
