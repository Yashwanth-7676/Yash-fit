'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { isWebGLAvailable, disposeThreeScene } from '@/lib/virtual-gym/webglCheck'
import { TRAINING_STATIONS_CATALOG } from '@/lib/virtual-world/virtualWorldService'
import type {
  AvatarAppearanceConfig,
  TrainingStation,
  EnvironmentPreset,
} from '@/types/virtualWorld'
import {
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Box,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui'

interface VirtualFitnessWorldViewportProps {
  avatarConfig: AvatarAppearanceConfig
  environment: EnvironmentPreset
  selectedStationId?: string | null
  onSelectStation?: (station: TrainingStation | null) => void
  onLaunchStationWorkout?: (station: TrainingStation) => void
}

export function VirtualFitnessWorldViewport({
  avatarConfig,
  environment,
  selectedStationId,
  onSelectStation,
  onLaunchStationWorkout,
}: VirtualFitnessWorldViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [hoveredStation, setHoveredStation] = useState<TrainingStation | null>(null)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const avatarGroupRef = useRef<THREE.Group | null>(null)

  const stationsRef = useRef(TRAINING_STATIONS_CATALOG)
  const onSelectStationRef = useRef(onSelectStation)
  onSelectStationRef.current = onSelectStation

  // Check WebGL availability
  useEffect(() => {
    setWebGlSupported(isWebGLAvailable())
  }, [])

  // Camera presets
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 3.5, 6.0)
    controlsRef.current.target.set(0, 1.0, 0)
    controlsRef.current.update()
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!webGlSupported || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 500

    // 1. Scene
    const scene = new THREE.Scene()
    let bgColor = 0x09090b
    let fogColor = 0x09090b
    if (environment === 'zen_outdoor') {
      bgColor = 0x0d151c
      fogColor = 0x0d151c
    } else if (environment === 'neon_powerhouse') {
      bgColor = 0x120e1f
      fogColor = 0x120e1f
    }
    scene.background = new THREE.Color(bgColor)
    scene.fog = new THREE.FogExp2(fogColor, 0.08)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 3.5, 6.0)
    cameraRef.current = camera

    // 3. Renderer
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
    renderer.toneMappingExposure = 1.2
    rendererRef.current = renderer

    container.replaceChildren(renderer.domElement)

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 + 0.02
    controls.minDistance = 2.0
    controls.maxDistance = 15.0
    controls.target.set(0, 1.0, 0)
    controlsRef.current = controls

    // 5. Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambient)

    // Key spotlight (lime accent)
    const keySpot = new THREE.SpotLight(0xa3e635, 2.5)
    keySpot.position.set(4, 7, 5)
    keySpot.angle = Math.PI / 4
    keySpot.penumbra = 0.4
    keySpot.castShadow = true
    scene.add(keySpot)

    // Rim light (sky blue)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    rimLight.position.set(-5, 4, -4)
    scene.add(rimLight)

    // 6. Gym Floor & Stylized Training Arena Platform
    const floorGrid = new THREE.GridHelper(16, 32, 0x3f3f46, 0x18181b)
    floorGrid.position.y = 0
    scene.add(floorGrid)

    // Circular central avatar platform
    const platformGeom = new THREE.CylinderGeometry(1.6, 1.7, 0.04, 32)
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.6,
      metalness: 0.3,
    })
    const platform = new THREE.Mesh(platformGeom, platformMat)
    platform.position.y = -0.02
    platform.receiveShadow = true
    scene.add(platform)

    // Glowing rim ring on platform
    const ringGeom = new THREE.RingGeometry(1.65, 1.72, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa3e635,
      side: THREE.DoubleSide,
    })
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    scene.add(ring)

    // 7. Training Stations (Interactive Mesh Pods)
    const stationMeshes: THREE.Mesh[] = []

    stationsRef.current.forEach((st) => {
      const podGroup = new THREE.Group()
      podGroup.position.set(...st.position)

      // Station Base Pod
      const podBaseGeom = new THREE.BoxGeometry(1.0, 0.1, 1.0)
      const podBaseMat = new THREE.MeshStandardMaterial({
        color: 0x27272a,
        roughness: 0.5,
      })
      const podBase = new THREE.Mesh(podBaseGeom, podBaseMat)
      podBase.position.y = 0.05
      podGroup.add(podBase)

      // Station Pillar / Upright
      const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 1.4, 16)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x3f3f46,
        metalness: 0.6,
      })
      const pillarL = new THREE.Mesh(pillarGeom, pillarMat)
      pillarL.position.set(-0.35, 0.7, 0)
      const pillarR = new THREE.Mesh(pillarGeom, pillarMat)
      pillarR.position.set(0.35, 0.7, 0)
      podGroup.add(pillarL)
      podGroup.add(pillarR)

      // Top Crossbar
      const barGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 16)
      const barMat = new THREE.MeshStandardMaterial({
        color: 0xa3e635,
        emissive: 0x3f6212,
        emissiveIntensity: 0.2,
      })
      const bar = new THREE.Mesh(barGeom, barMat)
      bar.rotation.z = Math.PI / 2
      bar.position.set(0, 1.35, 0)
      podGroup.add(bar)

      // Interactive Click Target Mesh
      const hitBoxGeom = new THREE.BoxGeometry(1.2, 1.8, 1.2)
      const hitBoxMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
      })
      const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat)
      hitBox.position.y = 0.9
      hitBox.userData = { isStation: true, stationId: st.id }
      podGroup.add(hitBox)
      stationMeshes.push(hitBox)

      scene.add(podGroup)
    })

    // 8. 3D Stylized Anime Fitness Avatar
    const avatarGroup = new THREE.Group()
    avatarGroupRef.current = avatarGroup

    const skinMat = new THREE.MeshStandardMaterial({
      color: avatarConfig.skinTone || '#fbbf24',
      roughness: 0.7,
    })
    const outfitMat = new THREE.MeshStandardMaterial({
      color: avatarConfig.outfitColor || '#18181b',
      roughness: 0.5,
    })
    const accentMat = new THREE.MeshStandardMaterial({
      color: avatarConfig.accentColor || '#a3e635',
      roughness: 0.3,
    })

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.48, 0.65, 0.28)
    const torso = new THREE.Mesh(torsoGeom, outfitMat)
    torso.position.y = 1.35
    avatarGroup.add(torso)

    // Chest YashFit emblem
    const badgeGeom = new THREE.BoxGeometry(0.12, 0.12, 0.02)
    const badgeMesh = new THREE.Mesh(badgeGeom, accentMat)
    badgeMesh.position.set(0, 1.45, 0.15)
    avatarGroup.add(badgeMesh)

    // Head
    const headGeom = new THREE.SphereGeometry(0.16, 24, 24)
    const head = new THREE.Mesh(headGeom, skinMat)
    head.position.y = 1.82
    avatarGroup.add(head)

    // Stylized Anime Hair
    const hairGeom = new THREE.ConeGeometry(0.2, 0.32, 16)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 })
    const hair = new THREE.Mesh(hairGeom, hairMat)
    hair.position.set(0, 1.95, 0)
    avatarGroup.add(hair)

    // Arms
    const armGeom = new THREE.CylinderGeometry(0.07, 0.06, 0.55, 16)
    const leftArm = new THREE.Mesh(armGeom, skinMat)
    leftArm.position.set(-0.35, 1.25, 0)
    const rightArm = new THREE.Mesh(armGeom, skinMat)
    rightArm.position.set(0.35, 1.25, 0)
    avatarGroup.add(leftArm)
    avatarGroup.add(rightArm)

    // Legs
    const legGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.75, 16)
    const leftLeg = new THREE.Mesh(legGeom, outfitMat)
    leftLeg.position.set(-0.16, 0.55, 0)
    const rightLeg = new THREE.Mesh(legGeom, outfitMat)
    rightLeg.position.set(0.16, 0.55, 0)
    avatarGroup.add(leftLeg)
    avatarGroup.add(rightLeg)

    // Shoes
    const shoeGeom = new THREE.BoxGeometry(0.12, 0.08, 0.22)
    const leftShoe = new THREE.Mesh(shoeGeom, accentMat)
    leftShoe.position.set(-0.16, 0.08, 0.04)
    const rightShoe = new THREE.Mesh(shoeGeom, accentMat)
    rightShoe.position.set(0.16, 0.08, 0.04)
    avatarGroup.add(leftShoe)
    avatarGroup.add(rightShoe)

    scene.add(avatarGroup)

    // 9. Raycasting for Clicking Stations
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    function onPointerMove(event: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(stationMeshes)
      if (hits.length > 0 && hits[0].object.userData.isStation) {
        const stId = hits[0].object.userData.stationId
        const match = stationsRef.current.find((s) => s.id === stId) || null
        setHoveredStation(match)
        if (containerRef.current) containerRef.current.style.cursor = 'pointer'
      } else {
        setHoveredStation(null)
        if (containerRef.current) containerRef.current.style.cursor = 'default'
      }
    }

    function onPointerClick(event: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(stationMeshes)
      if (hits.length > 0 && hits[0].object.userData.isStation) {
        const stId = hits[0].object.userData.stationId
        const match = stationsRef.current.find((s) => s.id === stId) || null
        if (onSelectStationRef.current) {
          onSelectStationRef.current(match)
        }
      }
    }

    renderer.domElement.addEventListener('mousemove', onPointerMove)
    renderer.domElement.addEventListener('click', onPointerClick)

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width
        const newH = entry.contentRect.height
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH
          camera.updateProjectionMatrix()
          renderer.setSize(newW, newH)
        }
      }
    })
    resizeObserver.observe(container)

    // 11. Animation Loop
    let clock = new THREE.Clock()
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      // Subtle breathing / idle motion for avatar
      if (avatarGroupRef.current) {
        if (avatarConfig.animationPose === 'squat') {
          const squatProgress = (Math.sin(elapsed * 2) + 1) / 2
          avatarGroupRef.current.position.y = -squatProgress * 0.35
        } else if (avatarConfig.animationPose === 'flex') {
          avatarGroupRef.current.rotation.y = Math.sin(elapsed * 1.5) * 0.15
        } else {
          avatarGroupRef.current.position.y = Math.sin(elapsed * 2.5) * 0.02
        }
      }

      renderer.render(scene, camera)
    }

    animFrameRef.current = requestAnimationFrame(animate)

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
  }, [webGlSupported, environment, avatarConfig])

  // Active selected station object
  const activeStation = TRAINING_STATIONS_CATALOG.find((s) => s.id === selectedStationId) || null

  if (!webGlSupported) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-3">
        <Box size={32} className="mx-auto text-zinc-600" />
        <h3 className="text-base font-bold text-white">2D Interactive Environment Fallback</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          WebGL acceleration is disabled or unsupported on this device. Explore the training stations using the interactive controls below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3 text-left">
          {TRAINING_STATIONS_CATALOG.map((st) => (
            <div
              key={st.id}
              onClick={() => onSelectStation?.(st)}
              className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-lime-400 transition-colors"
            >
              <span className="text-xs font-bold text-white block">{st.name}</span>
              <span className="text-[11px] text-lime-400">{st.recommendedExercise}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full block" />

      {/* Top HUD Controls */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span className="px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-xs font-bold text-white shadow-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <span>{environment.replace('_', ' ').toUpperCase()}</span>
        </span>

        {hoveredStation && (
          <span className="px-2.5 py-1 rounded-lg bg-lime-400/20 text-lime-400 border border-lime-400/30 text-xs font-bold shadow-md">
            Hover: {hoveredStation.name}
          </span>
        )}
      </div>

      {/* Top Right: Camera Reset & Fullscreen */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={resetCamera}
          className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 hover:text-white shadow-lg transition-colors"
          title="Reset View"
        >
          <RotateCcw size={15} />
        </button>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 hover:text-white shadow-lg transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>

      {/* Bottom Floating Station Action Banner */}
      {activeStation && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-950/95 backdrop-blur-md border border-lime-400/40 text-xs flex items-center justify-between gap-3 shadow-2xl">
            <div className="space-y-0.5 truncate">
              <span className="text-[10px] text-lime-400 font-semibold uppercase tracking-wider block">Selected Training Station</span>
              <h4 className="text-sm font-bold text-white truncate">{activeStation.name}</h4>
              <p className="text-zinc-400 truncate">
                Exercise: <span className="text-zinc-200 font-medium">{activeStation.recommendedExercise}</span> · Focus: <span className="text-zinc-200">{activeStation.targetMuscle}</span>
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onLaunchStationWorkout?.(activeStation)}
              icon={<ArrowRight size={14} />}
              className="shrink-0"
            >
              Start Exercise
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

