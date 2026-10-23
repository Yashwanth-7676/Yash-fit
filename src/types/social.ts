import type { AnimeRank } from './rpg'

export type ProfileVisibility = 'public' | 'friends' | 'private'

export interface UserPrivacySettings {
  profileVisibility: ProfileVisibility
  showOnLeaderboards: boolean
  allowFriendRequests: boolean
  shareWorkoutActivity: boolean
  shareAchievements: boolean
}

export interface PublicUserProfile {
  id: string
  username: string
  displayName: string
  bio: string
  avatarId: string
  rank: AnimeRank
  level: number
  totalXp: number
  currentStreak: number
  workoutsCompleted: number
  privacy: ProfileVisibility
  isFriend?: boolean
  friendshipStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'
}

export interface FriendRequest {
  id: string
  senderId: string
  senderUsername: string
  senderAvatarId: string
  senderRank: AnimeRank
  senderLevel: number
  receiverId: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
}

export type ChallengeCategory = 'workouts' | 'hydration' | 'consistency' | 'recovery' | 'form'

export interface FitnessChallenge {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  creatorName: string
  startDate: string
  endDate: string
  daysRemaining: number
  targetCount: number
  currentProgress: number
  targetMetricName: string // e.g. "Workouts", "Days", "ml"
  participantCount: number
  isJoined: boolean
  isCompleted: boolean
  rewardXp: number
  badgeIcon: string
  isPublic: boolean
}

export type ActivityType =
  | 'workout_completed'
  | 'achievement_unlocked'
  | 'level_up'
  | 'challenge_joined'
  | 'challenge_completed'
  | 'streak_milestone'

export interface SocialActivityItem {
  id: string
  userId: string
  username: string
  userAvatarId: string
  userRank: AnimeRank
  userLevel: number
  type: ActivityType
  title: string
  description: string
  statHighlight?: string
  timestamp: string // relative or ISO
  likeCount: number
  hasLiked: boolean
  flexCount: number
  hasFlexed: boolean
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'challenge_invite'
  | 'challenge_completed'
  | 'achievement_unlocked'
  | 'level_up'

export interface InAppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface LeaderboardEntry {
  rankPosition: number
  userId: string
  username: string
  avatarId: string
  animeRank: AnimeRank
  level: number
  scoreValue: number
  scoreLabel: string // e.g. "1,450 XP" or "18 Workouts"
  isCurrentUser: boolean
}
