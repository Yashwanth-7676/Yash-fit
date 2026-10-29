'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import type { MotionCycleKey, CameraAngle, MuscleGroup } from '@/types/workout'

interface AnimeExerciseCanvasProps {
  motionCycleKey: MotionCycleKey
  exerciseName: string
  primaryMuscle: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  isPlaying: boolean
  playbackSpeed: number
  currentTime: number
  duration: number
  cameraAngle: CameraAngle
  showHeatmap: boolean
  showTrajectory: boolean
  onTimeUpdate?: (time: number) => void
  onCycleComplete?: (reps: number) => void
  className?: string
}

// Ease function for natural kinetic acceleration and deceleration
function easeInOutSine(x: number): number {
  return -(Math.cos(Math.PI * x) - 1) / 2
}

export function AnimeExerciseCanvas({
  motionCycleKey,
  exerciseName,
  primaryMuscle,
  isPlaying,
  playbackSpeed,
  currentTime,
  duration,
  cameraAngle,
  showHeatmap,
  showTrajectory,
  onTimeUpdate,
  onCycleComplete,
  className = '',
}: AnimeExerciseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const localTimeRef = useRef<number>(currentTime)
  const completedRepsRef = useRef<number>(0)
  const trajectoryPointsRef = useRef<{ x: number; y: number; opacity: number }[]>([])

  // Keep local time synced when parent scrubs seekbar while paused
  useEffect(() => {
    if (!isPlaying) {
      localTimeRef.current = currentTime
    }
  }, [currentTime, isPlaying])

  // Draw the entire anime exercise scene on canvas
  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, timeSec: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Background anime training dojo / modern fitness gym aesthetic
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#09090b')
      bgGrad.addColorStop(0.65, '#121217')
      bgGrad.addColorStop(1, '#18181b')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // Floor perspective grid & subtle lime ambient rim lighting
      const floorY = height * 0.78
      ctx.save()
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 6; i++) {
        const y = floorY + (height - floorY) * (i / 6)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      // Floor spotlight shadow under athlete
      const shadowGrad = ctx.createRadialGradient(width / 2, floorY, 10, width / 2, floorY, 110)
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)')
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = shadowGrad
      ctx.beginPath()
      ctx.ellipse(width / 2, floorY, 110, 22, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Calculate normalized cycle progress (0.0 to 1.0)
      const cycleDuration = Math.max(2, duration)
      const normalizedTime = (timeSec % cycleDuration) / cycleDuration

      // Calculate kinematic movement factor (0.0 = top / start, 1.0 = bottom / peak inflection)
      let movementFactor = 0
      let phaseText: 'Eccentric (Lowering)' | 'Isometric (Pause)' | 'Concentric (Drive)' = 'Concentric (Drive)'

      if (normalizedTime < 0.45) {
        // Eccentric phase: 0 -> 1
        const p = normalizedTime / 0.45
        movementFactor = easeInOutSine(p)
        phaseText = 'Eccentric (Lowering)'
      } else if (normalizedTime < 0.55) {
        // Isometric peak squeeze: hold at 1
        movementFactor = 1.0
        phaseText = 'Isometric (Pause)'
      } else {
        // Concentric drive: 1 -> 0
        const p = (normalizedTime - 0.55) / 0.45
        movementFactor = 1.0 - easeInOutSine(p)
        phaseText = 'Concentric (Drive)'
      }

      // Base coordinate anchor for athlete
      const centerX = width * 0.5
      const baseY = floorY - 20

      // Anime Style Cel Shading Palette
      const skinBase = '#fde68a'
      const skinShadow = '#fbbf24'
      const hairBase = '#09090b'
      const hairHighlight = '#a3e635'
      const clothesBase = '#18181b'
      const clothesAccent = '#a3e635'
      const lineArt = '#040405'
      const barColor = '#e4e4e7'
      const plateColor = '#3f3f46'

      // Helper function to draw anime cel-shaded joint segment
      const drawSegment = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        thickness: number,
        fillColor: string,
        isHighlightMuscle = false
      ) => {
        ctx.save()
        const angle = Math.atan2(y2 - y1, x2 - x1)
        const dist = Math.hypot(x2 - x1, y2 - y1)

        ctx.translate(x1, y1)
        ctx.rotate(angle)

        // Muscle Heatmap aura if active
        if (showHeatmap && isHighlightMuscle) {
          ctx.shadowColor = phaseText === 'Concentric (Drive)' ? 'rgba(163, 230, 53, 0.9)' : 'rgba(245, 158, 11, 0.7)'
          ctx.shadowBlur = 18
        }

        // Draw pill shape
        ctx.beginPath()
        ctx.roundRect(0, -thickness / 2, dist, thickness, thickness / 2)
        ctx.fillStyle = showHeatmap && isHighlightMuscle ? (phaseText === 'Concentric (Drive)' ? '#a3e635' : '#f59e0b') : fillColor
        ctx.fill()

        // Cel-shaded shadow underline
        ctx.beginPath()
        ctx.roundRect(0, 0, dist, thickness / 2, [0, thickness / 2, thickness / 2, 0])
        ctx.fillStyle = showHeatmap && isHighlightMuscle ? 'rgba(0,0,0,0.2)' : skinShadow
        ctx.fill()

        // Clean outline
        ctx.lineWidth = 2.5
        ctx.strokeStyle = lineArt
        ctx.stroke()
        ctx.restore()
      }

      // Draw Anime Head with styled hair & eyes
      const drawAnimeHead = (headX: number, headY: number, facing: 'side' | 'front' | 'angle') => {
        ctx.save()
        ctx.translate(headX, headY)

        // Face / Head shape
        ctx.beginPath()
        ctx.arc(0, 0, 16, 0, Math.PI * 2)
        ctx.fillStyle = skinBase
        ctx.fill()
        ctx.lineWidth = 2.5
        ctx.strokeStyle = lineArt
        ctx.stroke()

        // Anime Jaw / Chin
        ctx.beginPath()
        if (facing === 'side') {
          ctx.moveTo(8, -2)
          ctx.lineTo(17, 6)
          ctx.lineTo(10, 16)
          ctx.lineTo(0, 16)
        } else {
          ctx.moveTo(-12, 4)
          ctx.lineTo(0, 18)
          ctx.lineTo(12, 4)
        }
        ctx.fillStyle = skinBase
        ctx.fill()
        ctx.stroke()

        // Anime Eyes
        ctx.fillStyle = '#09090b'
        if (facing === 'front' || facing === 'angle') {
          // Left eye
          ctx.beginPath()
          ctx.ellipse(-6, 2, 2.5, 3.5, 0, 0, Math.PI * 2)
          ctx.fill()
          // Right eye
          ctx.beginPath()
          ctx.ellipse(6, 2, 2.5, 3.5, 0, 0, Math.PI * 2)
          ctx.fill()
          // Eye highlight dots
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(-5.5, 1, 1, 0, Math.PI * 2)
          ctx.arc(6.5, 1, 1, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Side eye
          ctx.beginPath()
          ctx.ellipse(9, 2, 2.2, 3.5, 0.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(9.5, 1, 1, 0, Math.PI * 2)
          ctx.fill()
        }

        // Anime Spiky Hair with Lime Highlights
        ctx.fillStyle = hairBase
        ctx.beginPath()
        ctx.moveTo(-16, -2)
        ctx.quadraticCurveTo(-18, -18, -6, -24)
        ctx.lineTo(-2, -22)
        ctx.lineTo(6, -26)
        ctx.lineTo(10, -20)
        ctx.lineTo(18, -18)
        ctx.lineTo(16, -4)
        ctx.lineTo(12, 0)
        ctx.lineTo(8, -8)
        ctx.lineTo(0, -6)
        ctx.lineTo(-8, -2)
        ctx.closePath()
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = lineArt
        ctx.stroke()

        // Lime Hair Highlight Streak
        ctx.fillStyle = hairHighlight
        ctx.beginPath()
        ctx.moveTo(-4, -20)
        ctx.lineTo(2, -23)
        ctx.lineTo(4, -18)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      }

      // Track bar or limb position for motion path trajectory
      let trackedPoint: { x: number; y: number } | null = null

      // RENDER SPECIFIC KINETIC EXERCISE
      switch (motionCycleKey) {
        case 'squat':
        case 'goblet_squat': {
          // Barbell Back Squat / Goblet Squat
          const squatDepth = movementFactor * 42
          const hipX = cameraAngle === 'Side' ? centerX - movementFactor * 26 : centerX
          const hipY = baseY - 82 + squatDepth

          const kneeX = cameraAngle === 'Side' ? centerX + 18 - movementFactor * 8 : centerX - 24
          const kneeY = baseY - 42 + squatDepth * 0.4
          const ankleX = cameraAngle === 'Side' ? centerX + 8 : centerX - 24
          const ankleY = baseY

          const kneeX2 = cameraAngle === 'Side' ? centerX + 12 - movementFactor * 6 : centerX + 24
          const kneeY2 = baseY - 42 + squatDepth * 0.4
          const ankleX2 = cameraAngle === 'Side' ? centerX + 6 : centerX + 24
          const ankleY2 = baseY

          // Torso
          const torsoAngle = cameraAngle === 'Side' ? -movementFactor * 0.35 : 0
          const shoulderX = hipX + Math.sin(torsoAngle) * 52
          const shoulderY = hipY - 56

          // Draw legs (Quads & Glutes)
          const isQuad = primaryMuscle === 'Quads'
          drawSegment(ankleX, ankleY, kneeX, kneeY, 14, skinBase, isQuad)
          drawSegment(kneeX, kneeY, hipX, hipY, 18, skinBase, isQuad)
          if (cameraAngle !== 'Side') {
            drawSegment(ankleX2, ankleY2, kneeX2, kneeY2, 14, skinBase, isQuad)
            drawSegment(kneeX2, kneeY2, hipX, hipY, 18, skinBase, isQuad)
          }

          // Pelvis & Torso
          drawSegment(hipX, hipY, shoulderX, shoulderY, 26, clothesBase, showHeatmap && primaryMuscle === 'Core')

          // Head
          drawAnimeHead(shoulderX, shoulderY - 14, cameraAngle === 'Side' ? 'side' : 'front')

          // Barbell or Dumbbell
          if (motionCycleKey === 'squat') {
            const barY = shoulderY + 4
            trackedPoint = { x: shoulderX, y: barY }

            // Barbell shaft
            ctx.fillStyle = barColor
            ctx.fillRect(shoulderX - 70, barY - 3, 140, 6)
            ctx.strokeStyle = lineArt
            ctx.lineWidth = 1.5
            ctx.strokeRect(shoulderX - 70, barY - 3, 140, 6)

            // Plates on both sides
            ctx.fillStyle = plateColor
            ctx.fillRect(shoulderX - 74, barY - 24, 8, 48)
            ctx.fillRect(shoulderX + 66, barY - 24, 8, 48)
            // Accent ring on plates
            ctx.fillStyle = clothesAccent
            ctx.fillRect(shoulderX - 72, barY - 18, 4, 36)
            ctx.fillRect(shoulderX + 68, barY - 18, 4, 36)

            // Arms holding bar
            drawSegment(shoulderX, shoulderY, shoulderX - 18, barY + 8, 10, skinBase)
            drawSegment(shoulderX - 18, barY + 8, shoulderX - 32, barY, 9, skinBase)
          } else {
            // Goblet dumbbell held against chest
            trackedPoint = { x: shoulderX + 12, y: shoulderY + 20 }
            ctx.fillStyle = '#27272a'
            ctx.fillRect(shoulderX + 6, shoulderY + 10, 16, 22)
            ctx.fillStyle = clothesAccent
            ctx.fillRect(shoulderX + 2, shoulderY + 8, 24, 6)
            ctx.fillRect(shoulderX + 2, shoulderY + 28, 24, 6)
          }
          break
        }

        case 'push_up':
        case 'plank': {
          // Standard Push-Up & Forearm Plank
          const pushDepth = motionCycleKey === 'plank' ? 0 : movementFactor * 26
          const toeX = centerX - 80
          const toeY = baseY
          const hipY = baseY - 24 + pushDepth * 0.45
          const hipX = centerX - 10
          const shoulderX = centerX + 55
          const shoulderY = baseY - 36 + pushDepth

          // Lower Body
          drawSegment(toeX, toeY, hipX, hipY, 15, skinBase, primaryMuscle === 'Core')
          // Torso & Core
          drawSegment(hipX, hipY, shoulderX, shoulderY, 24, clothesBase, primaryMuscle === 'Core' || primaryMuscle === 'Chest')

          // Head
          drawAnimeHead(shoulderX + 14, shoulderY - 6, 'side')

          // Arms: Planks rest on forearms; push-ups flex elbows
          if (motionCycleKey === 'plank') {
            drawSegment(shoulderX, shoulderY, shoulderX, baseY - 6, 11, skinBase)
            drawSegment(shoulderX, baseY - 6, shoulderX + 22, baseY - 6, 10, skinBase)
            // Glowing core stabilizer line
            if (showHeatmap) {
              ctx.strokeStyle = '#a3e635'
              ctx.lineWidth = 3
              ctx.setLineDash([4, 4])
              ctx.beginPath()
              ctx.moveTo(toeX, toeY - 8)
              ctx.lineTo(shoulderX, shoulderY - 8)
              ctx.stroke()
              ctx.setLineDash([])
            }
          } else {
            const elbowX = shoulderX - 16
            const elbowY = baseY - 16 - pushDepth * 0.3
            drawSegment(shoulderX, shoulderY, elbowX, elbowY, 12, skinBase, primaryMuscle === 'Chest')
            drawSegment(elbowX, elbowY, shoulderX - 6, baseY, 11, skinBase, primaryMuscle === 'Chest')
            trackedPoint = { x: shoulderX, y: shoulderY }
          }
          break
        }

        case 'bench_press': {
          // Barbell Bench Press & Incline Press
          const benchY = baseY - 22
          // Bench drawing
          ctx.fillStyle = '#27272a'
          ctx.fillRect(centerX - 80, benchY, 160, 14)
          ctx.fillStyle = '#18181b'
          ctx.fillRect(centerX - 60, benchY + 14, 12, 22)
          ctx.fillRect(centerX + 48, benchY + 14, 12, 22)

          const headX = centerX - 45
          const chestX = centerX
          const hipX = centerX + 45

          // Athlete lying on bench
          drawSegment(headX + 15, benchY - 6, hipX, benchY - 6, 24, clothesBase, primaryMuscle === 'Chest')
          drawAnimeHead(headX, benchY - 10, 'side')

          // Feet planted on floor
          drawSegment(hipX, benchY - 6, hipX + 14, baseY, 14, skinBase)

          // Barbell path: from extended (chestY - 50) to chest level (benchY - 14)
          const barY = benchY - 52 + movementFactor * 38
          trackedPoint = { x: chestX, y: barY }

          // Arms pushing bar
          const elbowY = benchY - 10 + movementFactor * 16
          const elbowX = chestX - 14
          drawSegment(chestX, benchY - 12, elbowX, elbowY, 12, skinBase, true)
          drawSegment(elbowX, elbowY, chestX, barY, 11, skinBase, true)

          // Barbell
          ctx.fillStyle = barColor
          ctx.fillRect(chestX - 65, barY - 3, 130, 6)
          ctx.strokeRect(chestX - 65, barY - 3, 130, 6)
          ctx.fillStyle = plateColor
          ctx.fillRect(chestX - 70, barY - 22, 8, 44)
          ctx.fillRect(chestX + 62, barY - 22, 8, 44)
          ctx.fillStyle = clothesAccent
          ctx.fillRect(chestX - 68, barY - 16, 4, 32)
          ctx.fillRect(chestX + 64, barY - 16, 4, 32)
          break
        }

        case 'pull_up':
        case 'lat_pulldown': {
          // Overhead Pull-Up Bar / Lat Pulldown
          const barY = height * 0.16
          // Barbell / Pullup bar frame
          ctx.fillStyle = '#3f3f46'
          ctx.fillRect(centerX - 90, barY - 4, 180, 8)
          ctx.strokeRect(centerX - 90, barY - 4, 180, 8)

          // Pullup body height: deadhang (movementFactor = 0) vs chin over bar (movementFactor = 1)
          const pullHeight = movementFactor * 46
          const shoulderY = barY + 70 - pullHeight
          const hipY = shoulderY + 54
          const legY = hipY + 58

          // Draw arms pulling
          const elbowX1 = centerX - 36
          const elbowY1 = barY + 28 - pullHeight * 0.4
          drawSegment(centerX - 42, barY, elbowX1, elbowY1, 12, skinBase, primaryMuscle === 'Back')
          drawSegment(elbowX1, elbowY1, centerX - 18, shoulderY, 13, skinBase, primaryMuscle === 'Back')

          const elbowX2 = centerX + 36
          const elbowY2 = barY + 28 - pullHeight * 0.4
          drawSegment(centerX + 42, barY, elbowX2, elbowY2, 12, skinBase, primaryMuscle === 'Back')
          drawSegment(elbowX2, elbowY2, centerX + 18, shoulderY, 13, skinBase, primaryMuscle === 'Back')

          // Torso with Lat wings
          drawSegment(centerX, shoulderY, centerX, hipY, 28, clothesBase, primaryMuscle === 'Back')
          drawAnimeHead(centerX, shoulderY - 16, cameraAngle === 'Side' ? 'side' : 'front')

          // Legs hanging
          drawSegment(centerX, hipY, centerX - 8, legY, 14, skinBase)
          drawSegment(centerX, hipY, centerX + 8, legY, 14, skinBase)

          trackedPoint = { x: centerX, y: shoulderY - 16 }
          break
        }

        case 'deadlift':
        case 'rdl': {
          // Conventional Deadlift & Romanian Deadlift
          const hinge = movementFactor // 0 = standing lockout, 1 = bottom shin
          const hipX = cameraAngle === 'Side' ? centerX - 12 - hinge * 28 : centerX
          const hipY = baseY - 84 + hinge * 26

          const kneeX = cameraAngle === 'Side' ? centerX + 8 - hinge * 6 : centerX - 16
          const kneeY = baseY - 42 + hinge * 12
          const ankleX = cameraAngle === 'Side' ? centerX + 2 : centerX - 16
          const ankleY = baseY

          const shoulderX = hipX + (cameraAngle === 'Side' ? 18 + hinge * 32 : 0)
          const shoulderY = hipY - 56 + hinge * 34

          // Legs (Hamstrings & Glutes)
          drawSegment(ankleX, ankleY, kneeX, kneeY, 14, skinBase, primaryMuscle === 'Hamstrings')
          drawSegment(kneeX, kneeY, hipX, hipY, 18, skinBase, primaryMuscle === 'Hamstrings' || primaryMuscle === 'Glutes')

          // Torso & Back
          drawSegment(hipX, hipY, shoulderX, shoulderY, 26, clothesBase, primaryMuscle === 'Back' || primaryMuscle === 'Hamstrings')
          drawAnimeHead(shoulderX, shoulderY - 14, cameraAngle === 'Side' ? 'side' : 'front')

          // Barbell in hands hanging straight down
          const barX = shoulderX + (cameraAngle === 'Side' ? 10 : 0)
          const barY = shoulderY + 44
          trackedPoint = { x: barX, y: barY }

          // Arms holding bar
          drawSegment(shoulderX, shoulderY, barX, barY, 10, skinBase)

          // Barbell
          ctx.fillStyle = barColor
          ctx.fillRect(barX - 65, barY - 3, 130, 6)
          ctx.strokeRect(barX - 65, barY - 3, 130, 6)
          ctx.fillStyle = plateColor
          ctx.fillRect(barX - 70, barY - 22, 8, 44)
          ctx.fillRect(barX + 62, barY - 22, 8, 44)
          ctx.fillStyle = clothesAccent
          ctx.fillRect(barX - 68, barY - 16, 4, 32)
          ctx.fillRect(barX + 64, barY - 16, 4, 32)
          break
        }

        case 'bicep_curl': {
          // Standing Dumbbell Bicep Curl
          const hipX = centerX
          const hipY = baseY - 78
          const shoulderX = centerX
          const shoulderY = hipY - 54

          // Legs & Torso
          drawSegment(centerX - 12, baseY, centerX - 10, hipY, 15, skinBase)
          drawSegment(centerX + 12, baseY, centerX + 10, hipY, 15, skinBase)
          drawSegment(hipX, hipY, shoulderX, shoulderY, 26, clothesBase)
          drawAnimeHead(shoulderX, shoulderY - 14, 'front')

          // Arm & Forearm curl arc
          const elbowX = shoulderX + 22
          const elbowY = shoulderY + 30
          const curlAngle = 0.4 + movementFactor * 2.2
          const handX = elbowX + Math.sin(curlAngle) * 30
          const handY = elbowY + Math.cos(curlAngle) * 30

          // Upper Arm
          drawSegment(shoulderX + 16, shoulderY + 6, elbowX, elbowY, 13, skinBase, true)
          // Forearm & Hand
          drawSegment(elbowX, elbowY, handX, handY, 11, skinBase, true)

          // Dumbbell
          trackedPoint = { x: handX, y: handY }
          ctx.fillStyle = '#27272a'
          ctx.fillRect(handX - 14, handY - 4, 28, 8)
          ctx.fillStyle = clothesAccent
          ctx.fillRect(handX - 18, handY - 10, 6, 20)
          ctx.fillRect(handX + 12, handY - 10, 6, 20)
          break
        }

        case 'overhead_press': {
          // Overhead Shoulder Press
          const hipX = centerX
          const hipY = baseY - 78
          const shoulderX = centerX
          const shoulderY = hipY - 54

          // Legs & Torso
          drawSegment(centerX - 14, baseY, centerX - 10, hipY, 15, skinBase)
          drawSegment(centerX + 14, baseY, centerX + 10, hipY, 15, skinBase)
          drawSegment(hipX, hipY, shoulderX, shoulderY, 26, clothesBase)
          drawAnimeHead(shoulderX, shoulderY - 14, 'front')

          // Press path: shoulder height (movementFactor = 0) to overhead extension (movementFactor = 1)
          const pressDist = movementFactor * 44
          const handY = shoulderY - 4 - pressDist
          trackedPoint = { x: shoulderX, y: handY }

          // Left Arm
          const elbowX1 = centerX - 30 + movementFactor * 12
          const elbowY1 = shoulderY + 22 - pressDist * 0.5
          drawSegment(shoulderX - 16, shoulderY + 4, elbowX1, elbowY1, 12, skinBase, true)
          drawSegment(elbowX1, elbowY1, centerX - 24, handY, 11, skinBase, true)

          // Right Arm
          const elbowX2 = centerX + 30 - movementFactor * 12
          const elbowY2 = shoulderY + 22 - pressDist * 0.5
          drawSegment(shoulderX + 16, shoulderY + 4, elbowX2, elbowY2, 12, skinBase, true)
          drawSegment(elbowX2, elbowY2, centerX + 24, handY, 11, skinBase, true)

          // Dumbbells in hands
          ctx.fillStyle = '#27272a'
          ctx.fillRect(centerX - 36, handY - 4, 24, 8)
          ctx.fillRect(centerX + 12, handY - 4, 24, 8)
          ctx.fillStyle = clothesAccent
          ctx.fillRect(centerX - 40, handY - 10, 6, 20)
          ctx.fillRect(centerX - 16, handY - 10, 6, 20)
          ctx.fillRect(centerX + 8, handY - 10, 6, 20)
          ctx.fillRect(centerX + 32, handY - 10, 6, 20)
          break
        }

        default: {
          // Standard kinetic compound representation (Rows, Lunges, Raises)
          const depth = movementFactor * 32
          const hipX = centerX
          const hipY = baseY - 74 + depth * 0.4
          const shoulderX = hipX + (cameraAngle === 'Side' ? 14 : 0)
          const shoulderY = hipY - 52

          drawSegment(centerX - 12, baseY, hipX - 8, hipY, 15, skinBase, primaryMuscle === 'Quads')
          drawSegment(centerX + 12, baseY, hipX + 8, hipY, 15, skinBase, primaryMuscle === 'Quads')
          drawSegment(hipX, hipY, shoulderX, shoulderY, 26, clothesBase, showHeatmap)
          drawAnimeHead(shoulderX, shoulderY - 14, cameraAngle === 'Side' ? 'side' : 'front')

          const handY = shoulderY + 26 - depth * 0.5
          trackedPoint = { x: shoulderX + 18, y: handY }
          drawSegment(shoulderX + 12, shoulderY + 4, shoulderX + 18, handY, 11, skinBase, true)
          break
        }
      }

      // Record & Render Motion Path Trajectory
      if (trackedPoint && showTrajectory) {
        trajectoryPointsRef.current.push({ x: trackedPoint.x, y: trackedPoint.y, opacity: 1.0 })
        if (trajectoryPointsRef.current.length > 36) {
          trajectoryPointsRef.current.shift()
        }

        ctx.save()
        ctx.beginPath()
        for (let i = 0; i < trajectoryPointsRef.current.length; i++) {
          const pt = trajectoryPointsRef.current[i]
          pt.opacity *= 0.96
          if (i === 0) {
            ctx.moveTo(pt.x, pt.y)
          } else {
            ctx.lineTo(pt.x, pt.y)
          }
        }
        ctx.strokeStyle = '#a3e635'
        ctx.lineWidth = 2.5
        ctx.shadowColor = '#a3e635'
        ctx.shadowBlur = 8
        ctx.stroke()
        ctx.restore()
      }

      // Render Rep Phase Banner & Metronome Cadence HUD
      ctx.save()
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)'
      ctx.roundRect(14, 14, 210, 48, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.25)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Phase title
      ctx.fillStyle = phaseText === 'Concentric (Drive)' ? '#a3e635' : phaseText === 'Isometric (Pause)' ? '#f59e0b' : '#38bdf8'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(phaseText.toUpperCase(), 24, 32)

      // Subtitle with muscle focus
      ctx.fillStyle = '#a1a1aa'
      ctx.font = '10px sans-serif'
      ctx.fillText(`Target: ${primaryMuscle} · ${cameraAngle} View`, 24, 48)

      // Rep Counter Top Right
      ctx.fillStyle = 'rgba(9, 9, 11, 0.75)'
      ctx.roundRect(width - 86, 14, 72, 48, 8)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.stroke()

      ctx.fillStyle = '#71717a'
      ctx.font = '10px sans-serif'
      ctx.fillText('REPS', width - 66, 30)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(`${completedRepsRef.current}`, width - 62, 50)
      ctx.restore()
    },
    [
      motionCycleKey,
      primaryMuscle,
      duration,
      cameraAngle,
      showHeatmap,
      showTrajectory,
    ]
  )

  // Silky 60fps Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isMounted = true

    const render = (timestamp: number) => {
      if (!isMounted) return

      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }

      const delta = (timestamp - lastTimestampRef.current) / 1000
      lastTimestampRef.current = timestamp

      if (isPlaying) {
        localTimeRef.current += delta * playbackSpeed
        if (localTimeRef.current >= duration) {
          localTimeRef.current = 0
          completedRepsRef.current += 1
          onCycleComplete?.(completedRepsRef.current)
        }
        onTimeUpdate?.(localTimeRef.current)
      }

      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      drawScene(ctx, rect.width, rect.height, localTimeRef.current)
      ctx.restore()

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      isMounted = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, playbackSpeed, duration, drawScene, onTimeUpdate, onCycleComplete])

  return (
    <div className={`relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label={`Anime animated demonstration for ${exerciseName}`}
      />
    </div>
  )
}

