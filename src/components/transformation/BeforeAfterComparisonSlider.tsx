'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Split } from 'lucide-react'
import type { TransformationPhoto, PoseType } from '@/types/transformation'

interface Props {
  photos: TransformationPhoto[]
}

export function BeforeAfterComparisonSlider({ photos }: Props) {
  const [selectedPose, setSelectedPose] = useState<PoseType>('front')
  const [sliderPosition, setSliderPosition] = useState<number>(50)
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef<boolean>(false)

  // Filter photos by selected pose
  const posePhotos = photos.filter((p) => p.poseType === selectedPose)

  // Pick first (baseline) and last (latest)
  const beforePhoto = posePhotos[0] || null
  const afterPhoto = posePhotos.length > 1 ? posePhotos[posePhotos.length - 1] : beforePhoto

  const handlePointerDown = () => {
    isDragging.current = true
  }

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'clientX' in e ? e.clientX : 0
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100))
    setSliderPosition(pct)
  }, [])

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointermove', handlePointerMove)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [handlePointerUp, handlePointerMove])

  if (!beforePhoto) {
    return (
      <div className="p-8 text-center bg-zinc-950/60 rounded-3xl border border-zinc-850">
        <p className="text-zinc-400 text-sm">
          No transformation photos recorded for the {selectedPose} angle yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Pose selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          {(['front', 'side', 'back'] as PoseType[]).map((pose) => (
            <button
              key={pose}
              onClick={() => setSelectedPose(pose)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                selectedPose === pose
                  ? 'bg-lime-400 text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {pose} View
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSideBySide(!isSideBySide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
          >
            <Split size={14} className="text-lime-400" />
            {isSideBySide ? 'Slider Mode' : 'Side-by-Side View'}
          </button>
        </div>
      </div>

      {/* Comparison Viewport */}
      {isSideBySide ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Before Card */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-400 uppercase tracking-wider">Before (Baseline)</span>
              <span className="font-mono text-zinc-500">{beforePhoto.recordedDate}</span>
            </div>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-850">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhoto.photoData}
                alt="Before Checkpoint"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400 text-center">
              Weight: {beforePhoto.weightAtTime ? `${beforePhoto.weightAtTime} kg` : 'Unrecorded'}
            </div>
          </div>

          {/* After Card */}
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-lime-400 uppercase tracking-wider">Current Checkpoint</span>
              <span className="font-mono text-zinc-500">{afterPhoto?.recordedDate}</span>
            </div>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-850">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={afterPhoto?.photoData || beforePhoto.photoData}
                alt="Current Checkpoint"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs font-mono text-lime-400 text-center font-bold">
              Weight: {afterPhoto?.weightAtTime ? `${afterPhoto.weightAtTime} kg` : 'Unrecorded'}
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Split Slider */
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          className="relative aspect-[3/4] sm:aspect-[4/3] max-h-[500px] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 select-none cursor-ew-resize mx-auto"
        >
          {/* Base Image (After / Current) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterPhoto?.photoData || beforePhoto.photoData}
              alt="Current"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Overlaid Clipped Image (Before / Baseline) */}
          <div
            className="absolute inset-0 overflow-hidden flex items-center justify-center"
            style={{ width: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                width: containerRef.current?.getBoundingClientRect().width || '100%',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhoto.photoData}
                alt="Baseline"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Slider Divider Bar */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-lime-400 cursor-ew-resize shadow-lg shadow-black/80 flex items-center justify-center"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-lime-400 text-black flex items-center justify-center font-bold text-xs shadow-md shadow-black/50 border-2 border-black">
              ↔
            </div>
          </div>

          {/* Floating Labels */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-white">
            Before: {beforePhoto.recordedDate}
          </div>
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-lime-400/90 backdrop-blur-md text-black text-[11px] font-mono font-bold">
            Current: {afterPhoto?.recordedDate}
          </div>
        </div>
      )}
    </div>
  )
}

