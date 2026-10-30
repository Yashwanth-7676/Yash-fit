'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Palette,
  Users,
  ArrowRight,
  Plus,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'

const VirtualFitnessWorldViewport = dynamic(
  () =>
    import('@/components/virtual-world/VirtualFitnessWorldViewport').then(
      (mod) => mod.VirtualFitnessWorldViewport
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="text-xs font-medium text-zinc-400">Loading 3D Fitness World...</span>
      </div>
    ),
  }
)
import {
  getAvatarConfig,
  saveAvatarConfig,
  getMultiplayerRooms,
  createMultiplayerRoom,
  TRAINING_STATIONS_CATALOG,
} from '@/lib/virtual-world/virtualWorldService'
import type {
  AvatarAppearanceConfig,
  EnvironmentPreset,
  TrainingStation,
  MultiplayerRoom,
} from '@/types/virtualWorld'

const COLOR_PRESETS = [
  { name: 'YashFit Lime', color: '#a3e635' },
  { name: 'Cyber Blue', color: '#38bdf8' },
  { name: 'Crimson Fury', color: '#ef4444' },
  { name: 'Synth Purple', color: '#c084fc' },
  { name: 'Stealth Gold', color: '#f59e0b' },
]

export function FitnessWorldContent() {
  const toast = useToast()
  const router = useRouter()

  const [avatarConfig, setAvatarConfig] = useState<AvatarAppearanceConfig>(getAvatarConfig())
  const [environment, setEnvironment] = useState<EnvironmentPreset>('cyber_dojo')
  const [selectedStation, setSelectedStation] = useState<TrainingStation | null>(null)
  const [rooms, setRooms] = useState<MultiplayerRoom[]>([])
  const [activeSideTab, setActiveSideTab] = useState<'avatar' | 'rooms' | 'stations'>('avatar')
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false)

  useEffect(() => {
    setRooms(getMultiplayerRooms())
  }, [])

  const handleUpdateAvatar = (updated: Partial<AvatarAppearanceConfig>) => {
    const next = { ...avatarConfig, ...updated }
    setAvatarConfig(next)
    saveAvatarConfig(next)
    toast.success('Avatar Updated', 'New cosmetic appearance saved.')
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) return

    const room = createMultiplayerRoom(newRoomName, environment, newRoomIsPrivate)
    setRooms(getMultiplayerRooms())
    setShowCreateRoomModal(false)
    setNewRoomName('')
    toast.success('Room Created! 🌐', `Invite code: ${room.inviteCode}. Your training session is live.`)
  }

  const handleLaunchStation = (station: TrainingStation) => {
    toast.info(`Entering ${station.name}`, `Launching exercise: ${station.recommendedExercise}`)
    router.push(station.associatedRoute)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">3D Fitness Metaverse</Badge>
            <span className="text-xs text-zinc-400 font-mono">Real-Time Procedural Graphics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Immersive Virtual Fitness World
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Explore interactive training environments, customize your 3D avatar, interact with workout stations, and join multiplayer training rooms.
          </p>
        </div>

        {/* Environment Preset Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs self-start sm:self-auto overflow-x-auto">
          {(
            [
              { id: 'cyber_dojo', label: 'Cyber Dojo' },
              { id: 'zen_outdoor', label: 'Zen Sanctuary' },
              { id: 'neon_powerhouse', label: 'Neon Gym' },
              { id: 'olympic_hall', label: 'Olympic Hall' },
            ] as const
          ).map((env) => (
            <button
              key={env.id}
              type="button"
              onClick={() => setEnvironment(env.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                environment === env.id
                  ? 'bg-lime-400 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {env.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: 3D Viewport + Side Customizer / Rooms Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Three.js Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <VirtualFitnessWorldViewport
            avatarConfig={avatarConfig}
            environment={environment}
            selectedStationId={selectedStation?.id}
            onSelectStation={(st) => setSelectedStation(st)}
            onLaunchStationWorkout={handleLaunchStation}
          />

          <div className="flex items-center justify-between text-xs text-zinc-400 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400" />
              <span>Click any training pod (Squat Rack, Bench, Rig, Cardio, Zen Mat) to start that workout</span>
            </span>
            <span className="font-mono text-zinc-500">Rotate &amp; zoom with mouse / touch</span>
          </div>
        </div>

        {/* Right Column: Customizer & Multiplayer Controls */}
        <div className="space-y-4">
          {/* Side Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveSideTab('avatar')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all text-center ${
                activeSideTab === 'avatar'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Avatar Customizer
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('rooms')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all text-center ${
                activeSideTab === 'rooms'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Rooms ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSideTab('stations')}
              className={`flex-1 py-1.5 rounded-lg font-semibold transition-all text-center ${
                activeSideTab === 'stations'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Stations
            </button>
          </div>

          {/* Subtab: Avatar Customizer */}
          {activeSideTab === 'avatar' && (
            <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette size={16} className="text-lime-400" />
                  Avatar Appearance
                </h3>
                <span className="text-[10px] text-zinc-400 font-mono">Real-Time Reactive</span>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Accent Rim Color</span>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => handleUpdateAvatar({ accentColor: p.color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        avatarConfig.accentColor === p.color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>

              {/* Animation Pose Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Avatar Stance &amp; Motion</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'idle', label: 'Idle Respiration' },
                      { id: 'squat', label: 'Squat Kinematics' },
                      { id: 'flex', label: 'Physique Flex' },
                      { id: 'yoga', label: 'Zen Meditation' },
                    ] as const
                  ).map((pose) => (
                    <button
                      key={pose.id}
                      type="button"
                      onClick={() => handleUpdateAvatar({ animationPose: pose.id })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        avatarConfig.animationPose === pose.id
                          ? 'bg-lime-400 text-zinc-950 font-bold border-lime-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pose.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Presentation */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Avatar Build</span>
                <div className="flex items-center gap-2">
                  {(['masculine', 'feminine', 'neutral'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleUpdateAvatar({ gender: g })}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        avatarConfig.gender === g
                          ? 'bg-lime-400 text-zinc-950 font-bold border-lime-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Subtab: Multiplayer Rooms */}
          {activeSideTab === 'rooms' && (
            <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users size={16} className="text-lime-400" />
                    Multiplayer Rooms
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">Peer Workout Lobbies</span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreateRoomModal(true)}
                  icon={<Plus size={13} />}
                >
                  Create
                </Button>
              </div>

              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-white">{room.name}</h4>
                        <span className="text-[10px] text-zinc-400">Host: {room.hostName}</span>
                      </div>
                      <Badge variant="accent">
                        {room.participants.length}/{room.maxParticipants} Active
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span className="font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        Code: {room.inviteCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.info('Joined Room', `Connected to "${room.name}". Ready to train.`)}
                        className="text-lime-400 hover:text-white font-bold flex items-center gap-1"
                      >
                        <span>Join</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Honest Multiplayer Status Notice */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 leading-normal">
                <span className="font-semibold text-zinc-300">Connection Status: </span>
                Local Host Session. Realtime mesh sync will activate automatically when Supabase Realtime credentials are connected.
              </div>
            </Card>
          )}

          {/* Subtab: Training Stations */}
          {activeSideTab === 'stations' && (
            <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">World Stations</h3>
              <div className="space-y-2">
                {TRAINING_STATIONS_CATALOG.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStation(st)}
                    className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-lime-400 transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{st.name}</span>
                      <ArrowRight size={12} className="text-zinc-500" />
                    </div>
                    <p className="text-zinc-400 text-[11px]">{st.recommendedExercise}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <Modal
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          title="Create Multiplayer Training Room"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-zinc-300 block mb-1">Room Name</label>
              <Input
                placeholder="e.g. Sunday Morning Compound Blitz..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-zinc-300 block">World Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentPreset)}
                className="w-full h-10 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-sm text-white"
              >
                <option value="cyber_dojo">Cyber Dojo (Tokyo Neon)</option>
                <option value="zen_outdoor">Zen Sanctuary (Bamboo &amp; Sunrise)</option>
                <option value="neon_powerhouse">Neon Powerhouse (Synthwave)</option>
                <option value="olympic_hall">Olympic Hall (Minimalist)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newRoomIsPrivate}
                onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
                className="rounded border-zinc-700 text-lime-400 focus:ring-lime-400"
              />
              <span className="text-zinc-300">Make room private (require invite code to join)</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setShowCreateRoomModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Launch Room
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

