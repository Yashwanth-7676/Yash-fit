import type {
  PublicUserProfile,
  UserPrivacySettings,
  FitnessChallenge,
  SocialActivityItem,
  InAppNotification,
  LeaderboardEntry,
} from '@/types/social'
import { DEMO_COMMUNITY_USERS, DEMO_ACTIVITY_FEED, DEMO_NOTIFICATIONS } from '@/data/demoCommunity'
import { DEFAULT_CHALLENGES } from '@/data/challenges'
import { getUserRpgProgress } from '@/lib/rpg/rpgService'

const STORAGE_KEYS = {
  PRIVACY: 'yashfit_privacy_settings',
  FRIENDS: 'yashfit_friends_list',
  CHALLENGES: 'yashfit_challenges',
  FEED: 'yashfit_social_feed',
  NOTIFICATIONS: 'yashfit_notifications',
}

export function getUserPrivacySettings(): UserPrivacySettings {
  if (typeof window === 'undefined') {
    return {
      profileVisibility: 'public',
      showOnLeaderboards: true,
      allowFriendRequests: true,
      shareWorkoutActivity: true,
      shareAchievements: true,
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRIVACY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  const defaultSettings: UserPrivacySettings = {
    profileVisibility: 'public',
    showOnLeaderboards: true,
    allowFriendRequests: true,
    shareWorkoutActivity: true,
    shareAchievements: true,
  }
  saveUserPrivacySettings(defaultSettings)
  return defaultSettings
}

export function saveUserPrivacySettings(settings: UserPrivacySettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

// FRIENDS & COMMUNITY USERS
export function getCommunityUsers(): PublicUserProfile[] {
  if (typeof window === 'undefined') return DEMO_COMMUNITY_USERS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRIENDS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveCommunityUsers(DEMO_COMMUNITY_USERS)
  return DEMO_COMMUNITY_USERS
}

export function saveCommunityUsers(users: PublicUserProfile[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(users))
  } catch {
    // ignore
  }
}

export function searchUsers(query: string): PublicUserProfile[] {
  const users = getCommunityUsers()
  if (!query.trim()) return users
  const q = query.toLowerCase()
  return users.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
  )
}

export function sendFriendRequest(targetUserId: string): boolean {
  const users = getCommunityUsers()
  const target = users.find((u) => u.id === targetUserId)
  if (!target || target.friendshipStatus === 'friends' || target.friendshipStatus === 'pending_sent') {
    return false
  }

  target.friendshipStatus = 'pending_sent'
  saveCommunityUsers(users)
  return true
}

export function acceptFriendRequest(senderId: string): boolean {
  const users = getCommunityUsers()
  const sender = users.find((u) => u.id === senderId)
  if (!sender) return false

  sender.friendshipStatus = 'friends'
  sender.isFriend = true
  saveCommunityUsers(users)

  // Add notification
  addNotification({
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    message: `You and @${sender.username} are now fitness companions!`,
    link: '/community?tab=friends',
  })
  return true
}

export function declineFriendRequest(senderId: string): boolean {
  const users = getCommunityUsers()
  const sender = users.find((u) => u.id === senderId)
  if (!sender) return false

  sender.friendshipStatus = 'none'
  saveCommunityUsers(users)
  return true
}

export function removeFriend(friendId: string): boolean {
  const users = getCommunityUsers()
  const friend = users.find((u) => u.id === friendId)
  if (!friend) return false

  friend.friendshipStatus = 'none'
  friend.isFriend = false
  saveCommunityUsers(users)
  return true
}

// CHALLENGES
export function getFitnessChallenges(): FitnessChallenge[] {
  if (typeof window === 'undefined') return DEFAULT_CHALLENGES
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHALLENGES)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveFitnessChallenges(DEFAULT_CHALLENGES)
  return DEFAULT_CHALLENGES
}

export function saveFitnessChallenges(challenges: FitnessChallenge[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges))
  } catch {
    // ignore
  }
}

export function toggleJoinChallenge(challengeId: string): boolean {
  const list = getFitnessChallenges()
  const chal = list.find((c) => c.id === challengeId)
  if (!chal) return false

  chal.isJoined = !chal.isJoined
  chal.participantCount += chal.isJoined ? 1 : -1
  saveFitnessChallenges(list)

  if (chal.isJoined) {
    addNotification({
      type: 'challenge_invite',
      title: 'Joined Challenge',
      message: `You entered "${chal.title}". Complete ${chal.targetCount} ${chal.targetMetricName} to earn +${chal.rewardXp} XP!`,
      link: '/community?tab=challenges',
    })
  }
  return chal.isJoined
}

// ACTIVITY FEED
export function getActivityFeed(): SocialActivityItem[] {
  if (typeof window === 'undefined') return DEMO_ACTIVITY_FEED
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FEED)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveActivityFeed(DEMO_ACTIVITY_FEED)
  return DEMO_ACTIVITY_FEED
}

export function saveActivityFeed(feed: SocialActivityItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.FEED, JSON.stringify(feed))
  } catch {
    // ignore
  }
}

export function publishActivity(
  type: SocialActivityItem['type'],
  title: string,
  description: string,
  statHighlight?: string
): void {
  const privacy = getUserPrivacySettings()
  if (!privacy.shareWorkoutActivity && type === 'workout_completed') return
  if (!privacy.shareAchievements && type === 'achievement_unlocked') return

  const rpg = getUserRpgProgress()
  const feed = getActivityFeed()

  const item: SocialActivityItem = {
    id: `act-${Date.now()}`,
    userId: rpg.userId,
    username: 'You',
    userAvatarId: rpg.avatarId,
    userRank: rpg.rank,
    userLevel: rpg.currentLevel,
    type,
    title,
    description,
    statHighlight,
    timestamp: 'Just now',
    likeCount: 0,
    hasLiked: false,
    flexCount: 0,
    hasFlexed: false,
  }

  feed.unshift(item)
  if (feed.length > 50) feed.pop()
  saveActivityFeed(feed)
}

export function toggleReaction(activityId: string, reaction: 'like' | 'flex'): void {
  const feed = getActivityFeed()
  const item = feed.find((a) => a.id === activityId)
  if (!item) return

  if (reaction === 'like') {
    item.hasLiked = !item.hasLiked
    item.likeCount += item.hasLiked ? 1 : -1
  } else {
    item.hasFlexed = !item.hasFlexed
    item.flexCount += item.hasFlexed ? 1 : -1
  }

  saveActivityFeed(feed)
}

// NOTIFICATIONS
export function getNotifications(): InAppNotification[] {
  if (typeof window === 'undefined') return DEMO_NOTIFICATIONS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveNotifications(DEMO_NOTIFICATIONS)
  return DEMO_NOTIFICATIONS
}

export function saveNotifications(notifs: InAppNotification[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs))
  } catch {
    // ignore
  }
}

export function addNotification(notif: Omit<InAppNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>): void {
  const list = getNotifications()
  const item: InAppNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    userId: 'current-user',
    isRead: false,
    createdAt: 'Just now',
  }
  list.unshift(item)
  if (list.length > 30) list.pop()
  saveNotifications(list)
}

export function markNotificationRead(id: string): void {
  const list = getNotifications()
  const item = list.find((n) => n.id === id)
  if (item) {
    item.isRead = true
    saveNotifications(list)
  }
}

export function markAllNotificationsRead(): void {
  const list = getNotifications().map((n) => ({ ...n, isRead: true }))
  saveNotifications(list)
}

export function getUnreadNotificationCount(): number {
  return getNotifications().filter((n) => !n.isRead).length
}

// LEADERBOARD
export function getLeaderboard(type: 'weekly_xp' | 'monthly_workouts' | 'streak'): LeaderboardEntry[] {
  const rpg = getUserRpgProgress()
  const privacy = getUserPrivacySettings()
  const communityUsers = getCommunityUsers()

  const entries: LeaderboardEntry[] = communityUsers.map((u, i) => {
    let scoreValue = 0
    let scoreLabel = ''
    if (type === 'weekly_xp') {
      scoreValue = Math.round(u.totalXp * 0.28) + (i * 45)
      scoreLabel = `${scoreValue.toLocaleString()} XP`
    } else if (type === 'monthly_workouts') {
      scoreValue = Math.round(u.workoutsCompleted * 0.35)
      scoreLabel = `${scoreValue} sessions`
    } else {
      scoreValue = u.currentStreak
      scoreLabel = `${scoreValue} days streak`
    }

    return {
      rankPosition: 0,
      userId: u.id,
      username: `@${u.username}`,
      avatarId: u.avatarId,
      animeRank: u.rank,
      level: u.level,
      scoreValue,
      scoreLabel,
      isCurrentUser: false,
    }
  })

  // Add current user if allowed by privacy
  if (privacy.showOnLeaderboards) {
    let myScore = 0
    let myLabel = ''
    if (type === 'weekly_xp') {
      myScore = Math.round(rpg.totalXp * 0.4) + 120
      myLabel = `${myScore.toLocaleString()} XP`
    } else if (type === 'monthly_workouts') {
      myScore = 8
      myLabel = `${myScore} sessions`
    } else {
      myScore = rpg.currentStreak
      myLabel = `${myScore} days streak`
    }

    entries.push({
      rankPosition: 0,
      userId: rpg.userId,
      username: 'You (Current Hero)',
      avatarId: rpg.avatarId,
      animeRank: rpg.rank,
      level: rpg.currentLevel,
      scoreValue: myScore,
      scoreLabel: myLabel,
      isCurrentUser: true,
    })
  }

  // Sort descending
  entries.sort((a, b) => b.scoreValue - a.scoreValue)

  // Assign 1-based ranks
  entries.forEach((e, idx) => {
    e.rankPosition = idx + 1
  })

  return entries
}
