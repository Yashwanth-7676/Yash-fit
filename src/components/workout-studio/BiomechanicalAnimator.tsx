'use client'

import React, { useEffect, useState, useRef } from 'react'

interface BiomechanicalAnimatorProps {
  motionKey: string
  exerciseName: string
  isPaused: boolean
  playbackSpeed?: number
}

export function BiomechanicalAnimator({
  motionKey,
  exerciseName,
  isPaused,
  playbackSpeed = 1,
}: BiomechanicalAnimatorProps) {
  // Phase 0 to 1 cyclic normalized timer
  const [cycleProgress, setCycleProgress] = useState(0)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  useEffect(() => {
    const cycleDurationMs = 3200 / playbackSpeed // ~3.2 seconds per repetition

    const loop = (timestamp: number) => {
      if (document.hidden) {
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      if (lastTimeRef.current === null) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      if (!isPaused) {
        setCycleProgress((prev) => (prev + delta / cycleDurationMs) % 1)
      }
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      lastTimeRef.current = null
    }
  }, [isPaused, playbackSpeed])

  // Sinusoidal movement 0 -> 1 -> 0
  const sinFactor = (Math.sin(cycleProgress * Math.PI * 2 - Math.PI / 2) + 1) / 2
  // Phase description: 0..0.4 eccentric, 0.4..0.6 bottom pause, 0.6..1.0 concentric
  let phaseLabel = 'Eccentric (Lowering)'
  if (sinFactor > 0.85) phaseLabel = 'Contraction / Concentric Peak'
  else if (sinFactor < 0.15) phaseLabel = 'Full Stretch / Bottom Pause'

  return (
    <div className="relative w-full h-64 md:h-80 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center overflow-hidden p-4">
      {/* Top Overlay Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
        <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider">
          Biomechanical Kinematics Solver
        </span>
      </div>

      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 border border-zinc-700 text-lime-400">
          {phaseLabel}
        </span>
      </div>

      {/* SVG Kinematics Engine */}
      <svg
        viewBox="0 0 300 240"
        className="w-full h-full max-h-72 select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
          </radialGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Floor Grid */}
        <line x1="20" y1="210" x2="280" y2="210" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />

        {/* 1. BENCH PRESS KINEMATICS */}
        {motionKey === 'bench_press' && (
          <g transform="translate(40, 20)">
            {/* Flat Bench */}
            <rect x="30" y="160" width="160" height="12" rx="3" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
            <line x1="50" y1="172" x2="50" y2="200" stroke="#3f3f46" strokeWidth="4" />
            <line x1="170" y1="172" x2="170" y2="200" stroke="#3f3f46" strokeWidth="4" />

            {/* Torso lying on bench */}
            <circle cx="55" cy="150" r="10" fill="#71717a" /> {/* Head */}
            <line x1="65" y1="154" x2="140" y2="154" stroke="#a1a1aa" strokeWidth="14" strokeLinecap="round" /> {/* Torso */}
            {/* Bent Legs */}
            <polyline points="140,154 165,160 175,190" fill="none" stroke="#71717a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

            {/* Chest muscle activation aura */}
            <ellipse cx="95" cy="150" rx="18" ry="10" fill="url(#muscleGlow)" opacity={0.3 + sinFactor * 0.5} />

            {/* Dynamic Bar & Arms: bar height varies between 90 (lockout) and 142 (touching chest) */}
            {(() => {
              const barY = 90 + (1 - sinFactor) * 52
              const elbowX = 80 + (1 - sinFactor) * 18
              const elbowY = 135 + (1 - sinFactor) * 12
              return (
                <>
                  {/* Left & Right Arm Skeleton */}
                  <polyline
                    points={`95,152 ${elbowX},${elbowY} 95,${barY}`}
                    fill="none"
                    stroke="#a3e635"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlow)"
                  />
                  {/* Barbell */}
                  <line x1="20" y1={barY} x2="170" y2={barY} stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" />
                  {/* Weight Plates */}
                  <rect x="25" y={barY - 20} width="8" height="40" rx="2" fill="#71717a" stroke="#a1a1aa" />
                  <rect x="157" y={barY - 20} width="8" height="40" rx="2" fill="#71717a" stroke="#a1a1aa" />
                </>
              )
            })()}
          </g>
        )}

        {/* 2. SQUAT KINEMATICS */}
        {motionKey === 'squat' && (
          <g transform="translate(60, 20)">
            {(() => {
              // Upright standing: hipY ~ 100, kneeY ~ 150. Squat bottom: hipY ~ 145, kneeY ~ 140
              const hipY = 90 + (1 - sinFactor) * 55
              const hipX = 90 - (1 - sinFactor) * 20
              const kneeY = 145 + (1 - sinFactor) * 5
              const kneeX = 95 + (1 - sinFactor) * 15
              const torsoX = hipX + 15
              const torsoY = hipY - 50
              const barY = torsoY + 4

              return (
                <>
                  {/* Quadriceps & Glute Muscle Activation Glow */}
                  <ellipse cx={kneeX - 10} cy={kneeY - 15} rx="16" ry="12" fill="url(#muscleGlow)" opacity={0.3 + (1 - sinFactor) * 0.6} />

                  {/* Head */}
                  <circle cx={torsoX + 5} cy={torsoY - 14} r="10" fill="#71717a" />
                  {/* Spine / Torso */}
                  <line x1={torsoX} y1={torsoY} x2={hipX} y2={hipY} stroke="#a1a1aa" strokeWidth="12" strokeLinecap="round" />
                  {/* Femur (Thigh) */}
                  <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#a3e635" strokeWidth="8" strokeLinecap="round" filter="url(#neonGlow)" />
                  {/* Tibia (Shin) to Foot */}
                  <polyline points={`${kneeX},${kneeY} 100,195 115,195`} fill="none" stroke="#71717a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Barbell on Traps */}
                  <line x1="20" y1={barY} x2="160" y2={barY} stroke="#e4e4e7" strokeWidth="5" strokeLinecap="round" />
                  <rect x="25" y={barY - 22} width="8" height="44" rx="2" fill="#71717a" stroke="#a1a1aa" />
                  <rect x="147" y={barY - 22} width="8" height="44" rx="2" fill="#71717a" stroke="#a1a1aa" />
                </>
              )
            })()}
          </g>
        )}

        {/* 3. DEADLIFT KINEMATICS */}
        {motionKey === 'deadlift' && (
          <g transform="translate(60, 20)">
            {(() => {
              // Lockout: barY ~ 125, hipX ~ 90. Floor: barY ~ 180, hipX ~ 65
              const barY = 125 + (1 - sinFactor) * 55
              const hipX = 90 - (1 - sinFactor) * 25
              const hipY = 110 + (1 - sinFactor) * 20
              const kneeX = 92 - (1 - sinFactor) * 5
              const kneeY = 150
              const shoulderX = hipX + 10 + (1 - sinFactor) * 15
              const shoulderY = hipY - 45 + (1 - sinFactor) * 20

              return (
                <>
                  {/* Posterior Chain Glow */}
                  <ellipse cx={hipX} cy={hipY} rx="16" ry="12" fill="url(#muscleGlow)" opacity={0.3 + sinFactor * 0.5} />

                  {/* Head */}
                  <circle cx={shoulderX + 5} cy={shoulderY - 14} r="10" fill="#71717a" />
                  {/* Torso */}
                  <line x1={shoulderX} y1={shoulderY} x2={hipX} y2={hipY} stroke="#a1a1aa" strokeWidth="12" strokeLinecap="round" />
                  {/* Thigh */}
                  <line x1={hipX} y1={hipY} x2={kneeX} y2={kneeY} stroke="#71717a" strokeWidth="8" strokeLinecap="round" />
                  {/* Shin */}
                  <line x1={kneeX} y1={kneeY} x2="90" y2="195" stroke="#71717a" strokeWidth="7" strokeLinecap="round" />

                  {/* Arm hanging straight down to bar */}
                  <line x1={shoulderX} y1={shoulderY} x2="95" y2={barY} stroke="#a3e635" strokeWidth="5" strokeLinecap="round" filter="url(#neonGlow)" />

                  {/* Barbell */}
                  <line x1="20" y1={barY} x2="160" y2={barY} stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="28" cy={barY} r="18" fill="#52525b" stroke="#a1a1aa" strokeWidth="1.5" />
                  <circle cx="152" cy={barY} r="18" fill="#52525b" stroke="#a1a1aa" strokeWidth="1.5" />
                </>
              )
            })()}
          </g>
        )}

        {/* 4. OVERHEAD PRESS OR GENERAL FALLBACK */}
        {(motionKey === 'overhead_press' || !['bench_press', 'squat', 'deadlift'].includes(motionKey)) && (
          <g transform="translate(60, 20)">
            {(() => {
              const barY = 50 + (1 - sinFactor) * 55
              const elbowX = 85 - (1 - sinFactor) * 15
              const elbowY = 100 + (1 - sinFactor) * 15

              return (
                <>
                  {/* Deltoid Glow */}
                  <ellipse cx="85" cy="90" rx="14" ry="10" fill="url(#muscleGlow)" opacity={0.3 + sinFactor * 0.5} />

                  {/* Head */}
                  <circle cx="85" cy="75" r="10" fill="#71717a" />
                  {/* Torso */}
                  <line x1="85" y1="90" x2="85" y2="140" stroke="#a1a1aa" strokeWidth="12" strokeLinecap="round" />
                  {/* Legs */}
                  <line x1="85" y1="140" x2="75" y2="195" stroke="#71717a" strokeWidth="7" strokeLinecap="round" />
                  <line x1="85" y1="140" x2="95" y2="195" stroke="#71717a" strokeWidth="7" strokeLinecap="round" />

                  {/* Arms */}
                  <polyline
                    points={`85,95 ${elbowX},${elbowY} 85,${barY}`}
                    fill="none"
                    stroke="#a3e635"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#neonGlow)"
                  />

                  {/* Barbell */}
                  <line x1="20" y1={barY} x2="150" y2={barY} stroke="#e4e4e7" strokeWidth="4" strokeLinecap="round" />
                  <rect x="25" y={barY - 16} width="6" height="32" rx="2" fill="#71717a" />
                  <rect x="139" y={barY - 16} width="6" height="32" rx="2" fill="#71717a" />
                </>
              )
            })()}
          </g>
        )}
      </svg>

      {/* Movement name and joint angle indicator */}
      <div className="absolute bottom-2 inset-x-4 flex items-center justify-between text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">{exerciseName}</span>
        <span className="font-mono text-lime-400">Tempo: 3-0-1-0</span>
      </div>
    </div>
  )
}

