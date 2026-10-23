export type AnimeRank = 'Rookie' | 'Fighter' | 'Hunter' | 'Elite' | 'Master' | 'Legend'

export interface RankDefinition {
  rank: AnimeRank
  minLevel: number
  title: string
  color: string // Tailwind color / hex
  bgGradient: string
  badgeIcon: string
  description: string
}

export interface UserRpgProgress {
  userId: string
  totalXp: number
  currentLevel: number
  xpInCurrentLevel: number
  xpRequiredForNextLevel: number
  rank: AnimeRank
  currentStreak: number
  longestStreak: number
  lastActiveDate: string // YYYY-MM-DD
  avatarId: string
  equippedTitle: string
  unlockedAvatars: string[]
  unlockedTitles: string[]
  completedQuestsCount: number
  unlockedAchievementsCount: number
}

export interface XpTransaction {
  id: string
  userId: string
  amount: number
  source: 'workout' | 'quest' | 'nutrition' | 'water' | 'recovery' | 'achievement' | 'challenge'
  description: string
  timestamp: number
}

export type QuestFrequency = 'daily' | 'weekly'

export interface Quest {
  id: string
  title: string
  description: string
  frequency: QuestFrequency
  targetMetric: 'workout_count' | 'water_ml' | 'meal_logs' | 'recovery_checkin' | 'form_check' | 'streak_days'
  targetValue: number
  currentValue: number
  rewardXp: number
  completed: boolean
  claimed: boolean
  expiresAt: string // ISO string or local date
  iconName: string
}

export type AchievementCategory = 'workout' | 'streak' | 'nutrition' | 'recovery' | 'form'

export interface Achievement {
  id: string
  title: string
  description: string
  category: AchievementCategory
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'mythic'
  rewardXp: number
  iconName: string
  unlocked: boolean
  unlockedAt?: string
  progress: number // 0 to 100
  criteriaText: string
}

export interface AnimeAvatar {
  id: string
  name: string
  title: string
  quote: string
  rarity: 'starter' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  requiredLevel: number
  requiredRank?: AnimeRank
  themeColor: string
  gender: 'male' | 'female' | 'neutral'
  badgeEmoji: string
  imageUri?: string
  svgAvatarPath?: string
  statBoost: string
}
