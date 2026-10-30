import type {
  AvatarAppearanceConfig,
  TrainingStation,
  MultiplayerRoom,
  EnvironmentPreset,
} from '../../types/virtualWorld'

const LOCAL_STORAGE_AVATAR_KEY = 'yashfit_virtual_world_avatar'
const LOCAL_STORAGE_ROOMS_KEY = 'yashfit_virtual_world_rooms'

export const DEFAULT_AVATAR_CONFIG: AvatarAppearanceConfig = {
  gender: 'masculine',
  skinTone: '#fbbf24', // Warm gold/anime tone
  outfitColor: '#18181b', // Zinc-900 stealth suit
  accentColor: '#a3e635', // YashFit lime
  hairStyle: 'spiky',
  unlockedCostumes: ['default_stealth', 'cyber_ronin', 'olympic_sleeveless'],
  activeCostume: 'cyber_ronin',
  animationPose: 'idle',
}

export const TRAINING_STATIONS_CATALOG: TrainingStation[] = [
  {
    id: 'station-squat',
    name: 'Power Squat Rack',
    stationType: 'squat_rack',
    position: [-2.5, 0, -1.5],
    recommendedExercise: 'Barbell Back Squat',
    targetMuscle: 'Quadriceps & Gluteal Complex',
    associatedRoute: '/workout',
  },
  {
    id: 'station-bench',
    name: 'Olympic Bench Press',
    stationType: 'bench_station',
    position: [2.5, 0, -1.5],
    recommendedExercise: 'Flat Barbell Bench Press',
    targetMuscle: 'Pectoralis Major & Triceps',
    associatedRoute: '/workout',
  },
  {
    id: 'station-pullup',
    name: 'Calisthenics Rig',
    stationType: 'pullup_rig',
    position: [0, 0, -3.2],
    recommendedExercise: 'Strict Dead-Hang Pull-Ups',
    targetMuscle: 'Latissimus Dorsi & Biceps',
    associatedRoute: '/biomechanics',
  },
  {
    id: 'station-cardio',
    name: 'Aerobic High-Cadence Zone',
    stationType: 'cardio_zone',
    position: [-2.8, 0, 1.8],
    recommendedExercise: '12-Minute Cooper Test',
    targetMuscle: 'Cardiorespiratory Endurance',
    associatedRoute: '/performance-lab',
  },
  {
    id: 'station-mobility',
    name: 'Zen Mobility & Recovery Mat',
    stationType: 'stretching_mat',
    position: [2.8, 0, 1.8],
    recommendedExercise: 'Diaphragmatic Breathing & Hip Flow',
    targetMuscle: 'Myofascial Relaxation',
    associatedRoute: '/recovery',
  },
]

export const SEED_ROOMS: MultiplayerRoom[] = [
  {
    id: 'room-tokyo-cyber',
    name: 'Tokyo Cyber Dojo (Open Training)',
    hostUserId: 'u-host-1',
    hostName: 'Coach Kenji',
    inviteCode: 'DOJO-77',
    environment: 'cyber_dojo',
    isPrivate: false,
    maxParticipants: 8,
    isRealtimeConnected: false,
    createdAt: new Date().toISOString(),
    participants: [
      { userId: 'u-host-1', name: 'Coach Kenji', avatarId: 'avatar-sensei', status: 'exercising', lastActiveTimestamp: Date.now() },
      { userId: 'u-user-2', name: 'Aarav Mehta', avatarId: 'avatar-ronin', status: 'ready', lastActiveTimestamp: Date.now() },
    ],
  },
  {
    id: 'room-zen-garden',
    name: 'Sunrise Recovery Sanctuary',
    hostUserId: 'u-host-2',
    hostName: 'Elena Rostova',
    inviteCode: 'ZEN-108',
    environment: 'zen_outdoor',
    isPrivate: false,
    maxParticipants: 6,
    isRealtimeConnected: false,
    createdAt: new Date().toISOString(),
    participants: [
      { userId: 'u-host-2', name: 'Elena Rostova', avatarId: 'avatar-valkyrie', status: 'resting', lastActiveTimestamp: Date.now() },
    ],
  },
]

let inMemoryAvatarConfig: AvatarAppearanceConfig = { ...DEFAULT_AVATAR_CONFIG }

export function getAvatarConfig(): AvatarAppearanceConfig {
  if (typeof window === 'undefined') return inMemoryAvatarConfig
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AVATAR_KEY)
    if (raw) return { ...DEFAULT_AVATAR_CONFIG, ...JSON.parse(raw) }
  } catch {
    // fallback
  }
  return inMemoryAvatarConfig
}

export function saveAvatarConfig(config: AvatarAppearanceConfig): void {
  inMemoryAvatarConfig = config
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_AVATAR_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function getMultiplayerRooms(): MultiplayerRoom[] {
  if (typeof window === 'undefined') return SEED_ROOMS
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ROOMS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return SEED_ROOMS
}

export function createMultiplayerRoom(
  name: string,
  environment: EnvironmentPreset,
  isPrivate: boolean
): MultiplayerRoom {
  const newRoom: MultiplayerRoom = {
    id: `room-${Date.now()}`,
    name: name.trim() || 'My Personal Training Room',
    hostUserId: 'demo-user',
    hostName: 'You (Host)',
    inviteCode: `YASH-${Math.floor(1000 + Math.random() * 9000)}`,
    environment,
    isPrivate,
    maxParticipants: 8,
    isRealtimeConnected: false,
    createdAt: new Date().toISOString(),
    participants: [
      {
        userId: 'demo-user',
        name: 'You (Host)',
        avatarId: 'avatar-ronin',
        status: 'ready',
        lastActiveTimestamp: Date.now(),
      },
    ],
  }

  if (typeof window !== 'undefined') {
    try {
      const current = getMultiplayerRooms()
      const updated = [newRoom, ...current]
      localStorage.setItem(LOCAL_STORAGE_ROOMS_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  return newRoom
}

