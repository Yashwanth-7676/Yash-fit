'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import {
  MotionVerseExercise,
  CameraViewAngle,
  MotionVerseTheme,
  MovementDifficulty,
} from '@/types/motionverse'
import { calculateKinematicJoints } from '@/lib/motionverse/motionverseService'
import { useAccessibility } from '@/lib/accessibility/accessibilityContext'

interface MotionVerseCanvasProps {
  exercise: MotionVerseExercise
  cycleProgress: number
  cameraAngle: CameraViewAngle
  theme: MotionVerseTheme
  difficulty: MovementDifficulty
  isPlaying: boolean
  className?: string
}

export function MotionVerseCanvas({
  exercise,
  cycleProgress,
  cameraAngle,
  theme,
  difficulty,
  isPlaying,
  className = '',
}: MotionVerseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const barPathHistoryRef = useRef<Array<{ x: number; y: number }>>([])
  const { preferences } = useAccessibility()

  // Calculate joint positions for current normalized frame
  const joints = useMemo(() => {
    return calculateKinematicJoints(exercise.id, cycleProgress, cameraAngle, difficulty)
  }, [exercise.id, cycleProgress, cameraAngle, difficulty])

  // Track bar path history
  useEffect(() => {
    if (joints.barbell) {
      const midX = (joints.barbell.x1 + joints.barbell.x2) / 2
      const midY = (joints.barbell.y1 + joints.barbell.y2) / 2
      barPathHistoryRef.current.push({ x: midX, y: midY })
      if (barPathHistoryRef.current.length > 45) {
        barPathHistoryRef.current.shift()
      }
    }
  }, [joints.barbell])

  // Reset bar path on exercise change
  useEffect(() => {
    barPathHistoryRef.current = []
  }, [exercise.id, cameraAngle])

  // Render on 2D Canvas with high-DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const width = 300
    const height = 240

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear frame
    ctx.clearRect(0, 0, width, height)

    // Floor line
    ctx.strokeStyle = '#27272a'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, 210)
    ctx.lineTo(280, 210)
    ctx.stroke()
    ctx.setLineDash([])

    // ─── ANIME THEME: KINETIC SPEED LINES & AURA ──────────────────────────
    if (theme === 'anime' && !preferences.reducedMotion) {
      const auraColor = exercise.animeConfig.auraColor || '#a3e635'
      const concentricPhase = cycleProgress >= 0.5 && cycleProgress <= 0.9

      // Kinetic speed lines during concentric drive
      if (concentricPhase) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
        ctx.lineWidth = 1
        for (let i = 0; i < 8; i++) {
          const x = 30 + Math.random() * 240
          ctx.beginPath()
          ctx.moveTo(x, 10)
          ctx.lineTo(x + (Math.random() - 0.5) * 20, 230)
          ctx.stroke()
        }
      }

      // Energy Aura Glow around core & joints
      const auraPulse = Math.sin(cycleProgress * Math.PI * 4) * 6 + 18
      const gradient = ctx.createRadialGradient(
        joints.spineMid.x,
        joints.spineMid.y,
        5,
        joints.spineMid.x,
        joints.spineMid.y,
        auraPulse + 30
      )
      gradient.addColorStop(0, `${auraColor}66`)
      gradient.addColorStop(0.5, `${auraColor}22`)
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(joints.spineMid.x, joints.spineMid.y, auraPulse + 30, 0, Math.PI * 2)
      ctx.fill()
    }

    // ─── BENCH (IF PRESENT) ────────────────────────────────────────────────
    if (joints.bench) {
      ctx.fillStyle = '#18181b'
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(joints.bench.x, joints.bench.y, joints.bench.width, joints.bench.height, 4)
      ctx.fill()
      ctx.stroke()

      // Bench Leg Support
      ctx.strokeStyle = '#3f3f46'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(joints.bench.x + 20, joints.bench.y + joints.bench.height)
      ctx.lineTo(joints.bench.x + 20, 210)
      ctx.moveTo(joints.bench.x + joints.bench.width - 20, joints.bench.y + joints.bench.height)
      ctx.lineTo(joints.bench.x + joints.bench.width - 20, 210)
      ctx.stroke()
    }

    // ─── BAR PATH TRACER ───────────────────────────────────────────────────
    if (barPathHistoryRef.current.length > 2) {
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.45)'
      ctx.lineWidth = 2
      ctx.beginPath()
      const pts = barPathHistoryRef.current
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y)
      }
      ctx.stroke()
    }

    // ─── BONES & SKELETON ──────────────────────────────────────────────────
    const boneColor = theme === 'anime' ? '#ffffff' : '#d4d4d8'
    const jointAccentColor = theme === 'anime' ? exercise.animeConfig.auraColor : '#a3e635'

    ctx.strokeStyle = boneColor
    ctx.lineWidth = theme === 'anime' ? 6 : 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Spine
    ctx.beginPath()
    ctx.moveTo(joints.neck.x, joints.neck.y)
    ctx.lineTo(joints.spineMid.x, joints.spineMid.y)
    ctx.lineTo((joints.hipLeft.x + joints.hipRight.x) / 2, (joints.hipLeft.y + joints.hipRight.y) / 2)
    ctx.stroke()

    // Left Arm
    ctx.beginPath()
    ctx.moveTo(joints.shoulderLeft.x, joints.shoulderLeft.y)
    ctx.lineTo(joints.elbowLeft.x, joints.elbowLeft.y)
    ctx.lineTo(joints.wristLeft.x, joints.wristLeft.y)
    ctx.stroke()

    // Right Arm
    ctx.beginPath()
    ctx.moveTo(joints.shoulderRight.x, joints.shoulderRight.y)
    ctx.lineTo(joints.elbowRight.x, joints.elbowRight.y)
    ctx.lineTo(joints.wristRight.x, joints.wristRight.y)
    ctx.stroke()

    // Clavicle Bar
    ctx.beginPath()
    ctx.moveTo(joints.shoulderLeft.x, joints.shoulderLeft.y)
    ctx.lineTo(joints.shoulderRight.x, joints.shoulderRight.y)
    ctx.stroke()

    // Pelvis Bar
    ctx.beginPath()
    ctx.moveTo(joints.hipLeft.x, joints.hipLeft.y)
    ctx.lineTo(joints.hipRight.x, joints.hipRight.y)
    ctx.stroke()

    // Left Leg
    ctx.beginPath()
    ctx.moveTo(joints.hipLeft.x, joints.hipLeft.y)
    ctx.lineTo(joints.kneeLeft.x, joints.kneeLeft.y)
    ctx.lineTo(joints.ankleLeft.x, joints.ankleLeft.y)
    ctx.stroke()

    // Right Leg
    ctx.beginPath()
    ctx.moveTo(joints.hipRight.x, joints.hipRight.y)
    ctx.lineTo(joints.kneeRight.x, joints.kneeRight.y)
    ctx.lineTo(joints.ankleRight.x, joints.ankleRight.y)
    ctx.stroke()

    // ─── HEAD ──────────────────────────────────────────────────────────────
    ctx.fillStyle = theme === 'anime' ? '#f43f5e' : '#71717a'
    ctx.strokeStyle = boneColor
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(joints.head.x, joints.head.y, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // ─── JOINTS (PIVOT CIRCLES) ────────────────────────────────────────────
    const jointPoints = [
      joints.shoulderLeft,
      joints.shoulderRight,
      joints.elbowLeft,
      joints.elbowRight,
      joints.wristLeft,
      joints.wristRight,
      joints.hipLeft,
      joints.hipRight,
      joints.kneeLeft,
      joints.kneeRight,
      joints.ankleLeft,
      joints.ankleRight,
    ]

    ctx.fillStyle = jointAccentColor
    for (const pt of jointPoints) {
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // ─── BARBELL & WEIGHT PLATES ───────────────────────────────────────────
    if (joints.barbell) {
      // Bar
      ctx.strokeStyle = '#e4e4e7'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(joints.barbell.x1, joints.barbell.y1)
      ctx.lineTo(joints.barbell.x2, joints.barbell.y2)
      ctx.stroke()

      // Outer plates
      ctx.fillStyle = '#27272a'
      ctx.strokeStyle = '#a1a1aa'
      ctx.lineWidth = 1.5

      // Left plate
      ctx.beginPath()
      ctx.roundRect(joints.barbell.x1 + 6, joints.barbell.y1 - 18, 8, 36, 2)
      ctx.fill()
      ctx.stroke()

      // Right plate
      ctx.beginPath()
      ctx.roundRect(joints.barbell.x2 - 14, joints.barbell.y2 - 18, 8, 36, 2)
      ctx.fill()
      ctx.stroke()
    }
  }, [joints, theme, cycleProgress, exercise.animeConfig.auraColor, preferences.reducedMotion])

  return (
    <div
      className={`relative w-full h-64 sm:h-80 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden select-none ${className}`}
    >
      {/* 2D High-DPI Canvas */}
      <canvas ref={canvasRef} className="w-full h-full max-h-80 object-contain" />

      {/* Top Left: Camera Perspective & Theme Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span
          className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border ${
            theme === 'anime'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-zinc-900 border-zinc-700 text-lime-400'
          }`}
        >
          {theme === 'anime' ? 'Hero Mode' : 'Biomechanics'} • {cameraAngle.toUpperCase()} VIEW
        </span>
        <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
          {difficulty.toUpperCase()}
        </span>
      </div>

      {/* Top Right: Joint Angle Readouts */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {joints.jointAngles.kneeAngleDeg !== undefined && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            Knee: <span className="text-lime-400 font-bold">{joints.jointAngles.kneeAngleDeg}°</span>
          </span>
        )}
        {joints.jointAngles.elbowFlexionDeg !== undefined && (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            Elbow: <span className="text-sky-400 font-bold">{joints.jointAngles.elbowFlexionDeg}°</span>
          </span>
        )}
      </div>

      {/* Bottom Center: Anime Special Technique or Anatomical Cue */}
      {theme === 'anime' && (
        <div className="absolute bottom-2 inset-x-3 text-center z-10 pointer-events-none">
          <div className="inline-block px-3 py-1 rounded-full bg-zinc-950/80 border border-zinc-800 text-[11px] font-bold text-white shadow-xl backdrop-blur-md">
            <span style={{ color: exercise.animeConfig.auraColor }} className="mr-1.5">
              ⚡ {exercise.animeConfig.heroTitle}
            </span>
            <span className="text-zinc-400 font-normal">[{exercise.animeConfig.specialTechnique}]</span>
          </div>
        </div>
      )}
    </div>
  )
}
