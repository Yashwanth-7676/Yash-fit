'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Exercise3DConfig } from '@/types/virtualGym'
import type { MuscleGroup } from '@/types/workout'
import { buildMannequinRig, MannequinRig } from '@/lib/virtual-gym/mannequinModel'
import { isWebGLAvailable, disposeThreeScene, prefersReducedMotion } from '@/lib/virtual-gym/webglCheck'
import { Anatomy2DFallback } from './Anatomy2DFallback'
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  Eye,
  Sliders,
  Layers,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react'

interface VirtualGymViewportProps {
  config: Exercise3DConfig
  selectedMuscle?: MuscleGroup | null
  onSelectMuscle?: (muscle: MuscleGroup | null) => void
  onToggleViewMode?: (mode: '3d' | '2d') => void
  currentViewMode?: '3d' | '2d'
}

type CameraPreset = 'front' | 'side' | 'back' | 'angle' | 'iso'

export function VirtualGymViewport({
  config,
  selectedMuscle,
  onSelectMuscle,
  onToggleViewMode,
  currentViewMode = '3d',
}: VirtualGymViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [animationProgress, setAnimationProgress] = useState<number>(0)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0)

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const rigRef = useRef<MannequinRig | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const clockRef = useRef<THREE.Clock>(new THREE.Clock())
  const progressRef = useRef<number>(0)

  // Initialize WebGL check
  useEffect(() => {
    const supported = isWebGLAvailable()
    setWebGlSupported(supported)
    if (!supported && onToggleViewMode) {
      onToggleViewMode('2d')
    }
  }, [onToggleViewMode])

  // Camera presets
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    if (!cameraRef.current || !controlsRef.current) return
    const controls = controlsRef.current
    const cam = cameraRef.current

    switch (preset) {
      case 'front':
        cam.position.set(0, 1.1, 2.7)
        controls.target.set(0, 0.95, 0)
        break
      case 'side':
        cam.position.set(2.8, 1.0, 0)
        controls.target.set(0, 0.9, 0)
        break
      case 'back':
        cam.position.set(0, 1.1, -2.7)
        controls.target.set(0, 0.95, 0)
        break
      case 'angle':
        cam.position.set(1.9, 1.25, 2.0)
        controls.target.set(0, 0.95, 0)
        break
      case 'iso':
        cam.position.set(2.2, 1.8, 2.2)
        controls.target.set(0, 0.85, 0)
        break
    }
    controls.update()
  }, [])

  // Setup Three.js scene
  useEffect(() => {
    if (!webGlSupported || currentViewMode === '2d' || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 600
    const height = container.clientHeight || 450

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x09090b) // zinc-950
    scene.fog = new THREE.FogExp2(0x09090b, 0.12)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50)
    camera.position.set(1.9, 1.35, 2.2)
    cameraRef.current = camera

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    rendererRef.current = renderer

    container.replaceChildren(renderer.domElement)

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.05 // Don't allow flipping under ground
    controls.minDistance = 1.0
    controls.maxDistance = 5.0
    controls.target.set(0, 0.95, 0)
    controlsRef.current = controls

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    // Key Light (Lime tinted high rim)
    const keyLight = new THREE.DirectionalLight(0xd9f99d, 1.8) // soft lime
    keyLight.position.set(2.5, 4, 3)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    scene.add(keyLight)

    // Fill Light (Cool sky blue rim from behind)
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(-3, 2.5, -2)
    scene.add(fillLight)

    // Bottom bounce light
    const bounceLight = new THREE.DirectionalLight(0x27272a, 0.6)
    bounceLight.position.set(0, -2, 0)
    scene.add(bounceLight)

    // 6. Gym Floor Grid
    const gridHelper = new THREE.GridHelper(8, 24, 0x3f3f46, 0x18181b)
    gridHelper.position.y = 0
    scene.add(gridHelper)

    // Subtle dark circular platform under feet
    const platformGeom = new THREE.CylinderGeometry(1.4, 1.45, 0.02, 32)
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.8,
      metalness: 0.2,
    })
    const platform = new THREE.Mesh(platformGeom, platformMat)
    platform.position.y = -0.01
    platform.receiveShadow = true
    scene.add(platform)

    // 7. Mannequin Rig
    const rig = buildMannequinRig()
    rigRef.current = rig
    scene.add(rig.rootGroup)

    // Initial highlight
    rig.highlightMuscles(config.primaryMuscles, config.secondaryMuscles, selectedMuscle)

    // 8. Raycaster for clicking muscles
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onPointerMove(event: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(rig.muscleMeshes.map((m) => m.mesh))
      if (hits.length > 0 && hits[0].object.userData.isMuscle) {
        setHoveredMuscle(hits[0].object.userData.muscleGroup as string)
        if (containerRef.current) containerRef.current.style.cursor = 'pointer'
      } else {
        setHoveredMuscle(null)
        if (containerRef.current) containerRef.current.style.cursor = 'default'
      }
    }

    function onPointerClick(event: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(rig.muscleMeshes.map((m) => m.mesh))
      if (hits.length > 0 && hits[0].object.userData.isMuscle) {
        const clickedMuscle = hits[0].object.userData.muscleGroup as MuscleGroup
        if (onSelectMuscle) {
          onSelectMuscle(clickedMuscle === selectedMuscle ? null : clickedMuscle)
        }
      }
    }

    renderer.domElement.addEventListener('mousemove', onPointerMove)
    renderer.domElement.addEventListener('click', onPointerClick)

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight
          camera.updateProjectionMatrix()
          renderer.setSize(newWidth, newHeight)
        }
      }
    })
    resizeObserver.observe(container)

    // Cleanup
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('mousemove', onPointerMove)
      renderer.domElement.removeEventListener('click', onPointerClick)
      controls.dispose()
      disposeThreeScene(scene, renderer)
    }
  }, [webGlSupported, currentViewMode])

  // Update muscle highlights when config or selection changes
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.highlightMuscles(config.primaryMuscles, config.secondaryMuscles, selectedMuscle)
    }
  }, [config, selectedMuscle])

  // Animation Loop
  useEffect(() => {
    if (!webGlSupported || currentViewMode === '2d') return

    const cycleDuration = config.cycleDurationSeconds || 4.0

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (isPlaying) {
        const delta = clockRef.current.getDelta()
        const speed = playbackSpeed
        progressRef.current = (progressRef.current + (delta * speed) / cycleDuration) % 1.0
        setAnimationProgress(progressRef.current)

        // Find active phase
        const currentProgress = progressRef.current
        const phaseIdx = config.phases.findIndex(
          (p) => currentProgress >= p.startProgress && currentProgress < p.endProgress
        )
        if (phaseIdx !== -1) {
          setActivePhaseIndex(phaseIdx)
        }
      } else {
        clockRef.current.getDelta() // Keep clock synchronized
      }

      // Evaluate kinematic joint angles and update mannequin pose
      if (rigRef.current && config.kinematics) {
        const angles = config.kinematics(progressRef.current)
        rigRef.current.updatePose(angles)
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [webGlSupported, currentViewMode, isPlaying, playbackSpeed, config])

  // Manual scrubber change
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    progressRef.current = val
    setAnimationProgress(val)
    if (rigRef.current && config.kinematics) {
      const angles = config.kinematics(val)
      rigRef.current.updatePose(angles)
    }
    const phaseIdx = config.phases.findIndex(
      (p) => val >= p.startProgress && val < p.endProgress
    )
    if (phaseIdx !== -1) setActivePhaseIndex(phaseIdx)
  }

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Fallback to 2D view if WebGL is unsupported or user switched
  if (!webGlSupported || currentViewMode === '2d') {
    return (
      <div className="relative w-full h-[540px] flex flex-col">
        {!webGlSupported && (
          <div className="mb-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              WebGL hardware acceleration is unavailable on this device. Displaying interactive 2D anatomical map.
            </span>
          </div>
        )}
        <Anatomy2DFallback
          primaryMuscles={config.primaryMuscles}
          secondaryMuscles={config.secondaryMuscles}
          selectedMuscle={selectedMuscle}
          onSelectMuscle={onSelectMuscle}
        />
      </div>
    )
  }

  const currentPhase = config.phases[activePhaseIndex] || config.phases[0]

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/90 shadow-2xl flex flex-col select-none group">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full relative outline-none focus:ring-1 focus:ring-lime-400/50"
        tabIndex={0}
        aria-label={`3D Biomechanical Viewport demonstrating ${config.name}`}
      />

      {/* TOP FLOATING OVERLAY: Title, Camera Presets & Honest Attribution */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none z-10 gap-2">
        {/* Left: Exercise Tag & Hovered Muscle */}
        <div className="pointer-events-auto flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">{config.name}</span>
            <span className="text-[10px] uppercase font-semibold text-lime-400/90 bg-lime-950/60 px-1.5 py-0.5 rounded border border-lime-800/60">
              3D Rig
            </span>
          </div>

          {hoveredMuscle && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 backdrop-blur-md border border-amber-700/80 text-amber-300 text-xs shadow-md animate-fade-in">
              <Sparkles size={11} />
              <span>Target: <strong>{hoveredMuscle}</strong> (Click to filter)</span>
            </div>
          )}
        </div>

        {/* Right: Camera Presets & Mode Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 shadow-lg">
          <button
            type="button"
            onClick={() => applyCameraPreset('front')}
            title="Front Camera"
            className="px-2 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('side')}
            title="Side Profile"
            className="px-2 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Side
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('angle')}
            title="45° Angle"
            className="px-2 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Angle
          </button>
          <button
            type="button"
            onClick={() => applyCameraPreset('iso')}
            title="Isometric"
            className="px-2 py-1 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Iso
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          {onToggleViewMode && (
            <button
              type="button"
              onClick={() => onToggleViewMode('2d')}
              title="Switch to 2D Map"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <Layers size={12} className="text-lime-400" />
              <span>2D Map</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* BOTTOM FLOATING CONTROLS: Timeline Scrubber, Playback Controls & Legend */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none z-10 flex flex-col gap-2">
        {/* Active Movement Phase Banner */}
        {currentPhase && (
          <div className="self-center pointer-events-auto px-3.5 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 text-xs shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400" />
            <span className="font-semibold text-white">{currentPhase.name}:</span>
            <span className="text-zinc-300 italic">{currentPhase.cue}</span>
          </div>
        )}

        {/* Control Bar */}
        <div className="pointer-events-auto w-full p-2.5 rounded-xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="p-2 rounded-lg bg-lime-400 hover:bg-lime-300 text-zinc-950 font-bold transition-all transform active:scale-95 shadow-md shadow-lime-400/20"
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <button
              type="button"
              onClick={() => {
                progressRef.current = 0
                setAnimationProgress(0)
              }}
              title="Replay from start"
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
            >
              <RotateCcw size={14} />
            </button>

            {/* Playback speed selector */}
            <div className="flex items-center bg-zinc-950/80 rounded-lg p-0.5 border border-zinc-800 text-[11px] font-semibold">
              {[0.5, 1.0, 1.5, 2.0].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 rounded transition-colors ${
                    playbackSpeed === spd
                      ? 'bg-zinc-800 text-lime-400 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="flex-1 w-full flex items-center gap-2 px-2">
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
              {Math.round(animationProgress * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={animationProgress}
              onChange={handleScrubberChange}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-lime-400 focus:outline-none"
              aria-label="Movement phase progress scrubber"
            />
          </div>

          {/* Muscle Color Legend */}
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-2.5 h-2.5 rounded-full bg-lime-400 shadow-sm shadow-lime-400/50" />
              Primary
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400/50" />
              Assister
            </span>
            {selectedMuscle && (
              <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                Filtered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Honest Scientific Attribution Badge */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none hidden lg:flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800/70 text-[10px] text-zinc-400">
        <Info size={11} className="text-zinc-400" />
        <span>Procedural Biomechanical Mannequin • YashFit Kinetic Lab (Not Motion Capture)</span>
      </div>
    </div>
  )
}
