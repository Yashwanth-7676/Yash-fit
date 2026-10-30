export type EnvironmentPreset =
  | 'cyber_dojo'
  | 'zen_outdoor'
  | 'neon_powerhouse'
  | 'olympic_hall'

export type AvatarAnimationPose = 'idle' | 'squat' | 'push_up' | 'flex' | 'yoga'

export interface AvatarAppearanceConfig {
  gender: 'masculine' | 'feminine' | 'neutral'
  skinTone: string // Hex color
  outfitColor: string // Hex color
  accentColor: string // Hex color
  hairStyle: 'short' | 'spiky' | 'ponytail' | 'buzz'
  unlockedCostumes: string[]
  activeCostume: string
  animationPose: AvatarAnimationPose
}

export interface TrainingStation {
  id: string
  name: string
  stationType: 'squat_rack' | 'bench_station' | 'cardio_zone' | 'stretching_mat' | 'pullup_rig'
  position: [number, number, number]
  recommendedExercise: string
  targetMuscle: string
  associatedRoute: string
}

export interface MultiplayerParticipant {
  userId: string
  name: string
  avatarId: string
  status: 'ready' | 'exercising' | 'resting'
  lastActiveTimestamp: number
}

export interface MultiplayerRoom {
  id: string
  name: string
  hostUserId: string
  hostName: string
  inviteCode: string
  environment: EnvironmentPreset
  isPrivate: boolean
  maxParticipants: number
  participants: MultiplayerParticipant[]
  createdAt: string
  isRealtimeConnected: boolean
}

