import type {
  PublicUserProfile,
  UserPrivacySettings,
  FitnessChallenge,
  SocialActivityItem,
  InAppNotification,
  LeaderboardEntry,
  FitnessGroup,
  GroupMember,
  SocialReport,
} from '../../types/social'
import { DEMO_COMMUNITY_USERS, DEMO_ACTIVITY_FEED, DEMO_NOTIFICATIONS } from '../../data/demoCommunity'
import { DEFAULT_CHALLENGES } from '../../data/challenges'
import { awardXp, getUserRpgProgress } from '../rpg/rpgService'

const STORAGE_KEYS = {
  PRIVACY: 'yashfit_privacy_settings',
  FRIENDS: 'yashfit_friends_list',
  CHALLENGES: 'yashfit_challenges',
  FEED: 'yashfit_social_feed',
  NOTIFICATIONS: 'yashfit_notifications',
  GROUPS: 'yashfit_fitness_groups',
  REPORTS: 'yashfit_social_reports',
  BLOCKED: 'yashfit_blocked_users',
  CLAIMED_CHALLENGES: 'yashfit_claimed_challenges',
}

const inMemoryStorage = new Map<string, string>()

function getStoredItem(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key)
  }
  return inMemoryStorage.get(key) ?? null
}

function setStoredItem(key: string, value: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
    } catch {
      // ignore
    }
  }
  inMemoryStorage.set(key, value)
}

export function getUserPrivacySettings(): UserPrivacySettings {
  try {
    const raw = getStoredItem(STORAGE_KEYS.PRIVACY)
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
    hideSpecificMetrics: true,
    anonymousInLeaderboard: false,
  }
  saveUserPrivacySettings(defaultSettings)
  return defaultSettings
}

export function saveUserPrivacySettings(settings: UserPrivacySettings): void {
  setStoredItem(STORAGE_KEYS.PRIVACY, JSON.stringify(settings))
}

// FRIENDS & COMMUNITY USERS
export function getCommunityUsers(): PublicUserProfile[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.FRIENDS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveCommunityUsers(DEMO_COMMUNITY_USERS)
  return DEMO_COMMUNITY_USERS
}

export function saveCommunityUsers(users: PublicUserProfile[]): void {
  setStoredItem(STORAGE_KEYS.FRIENDS, JSON.stringify(users))
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
  try {
    const raw = getStoredItem(STORAGE_KEYS.CHALLENGES)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveFitnessChallenges(DEFAULT_CHALLENGES)
  return DEFAULT_CHALLENGES
}

export function saveFitnessChallenges(challenges: FitnessChallenge[]): void {
  setStoredItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges))
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
  let feed = DEMO_ACTIVITY_FEED
  try {
    const raw = getStoredItem(STORAGE_KEYS.FEED)
    if (raw) feed = JSON.parse(raw)
    else saveActivityFeed(DEMO_ACTIVITY_FEED)
  } catch {
    // fallback
  }
  const blocked = new Set(getBlockedUserIds())
  return feed.filter((item) => !blocked.has(item.userId))
}

export function saveActivityFeed(feed: SocialActivityItem[]): void {
  setStoredItem(STORAGE_KEYS.FEED, JSON.stringify(feed))
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
  try {
    const raw = getStoredItem(STORAGE_KEYS.NOTIFICATIONS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveNotifications(DEMO_NOTIFICATIONS)
  return DEMO_NOTIFICATIONS
}

export function saveNotifications(notifs: InAppNotification[]): void {
  setStoredItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs))
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
      username: privacy.anonymousInLeaderboard ? 'Anonymous Athlete #772' : 'You (Current Hero)',
      avatarId: privacy.anonymousInLeaderboard ? 'avatar-1' : rpg.avatarId,
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

export const DEFAULT_FITNESS_GROUPS: FitnessGroup[] = [
  {
    id: 'grp-delhi-lifters',
    name: 'Delhi Power & Hypertrophy Club',
    description: 'Strength enthusiasts and powerlifters training compound lifts and progressive overload.',
    creatorId: 'user-vikram',
    inviteCode: 'DELHI-POWER',
    isPrivate: false,
    memberCount: 14,
    isJoined: true,
    role: 'member',
    createdAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'grp-bangalore-sunrise',
    name: 'Bangalore Sunrise Conditioning',
    description: 'Early morning HIIT, running, and bodyweight conditioning community.',
    creatorId: 'user-priya',
    inviteCode: 'BLR-SUNRISE',
    isPrivate: false,
    memberCount: 22,
    isJoined: false,
    createdAt: '2026-09-20T00:00:00.000Z',
  },
  {
    id: 'grp-mumbai-calisthenics',
    name: 'Mumbai Calisthenics & Mobility',
    description: 'Bodyweight mastery, handstands, muscle-ups, and active joint mobility.',
    creatorId: 'user-arjun',
    inviteCode: 'MUMBAI-BARS',
    isPrivate: true,
    memberCount: 9,
    isJoined: false,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
]

// FITNESS GROUPS
export function getFitnessGroups(): FitnessGroup[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.GROUPS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  saveFitnessGroups(DEFAULT_FITNESS_GROUPS)
  return DEFAULT_FITNESS_GROUPS
}

export function saveFitnessGroups(groups: FitnessGroup[]): void {
  setStoredItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups))
}

export function createFitnessGroup(name: string, description: string, isPrivate = true): FitnessGroup {
  const groups = getFitnessGroups()
  const rpg = getUserRpgProgress()
  const inviteCode = `${name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'YASH')}-${Math.floor(1000 + Math.random() * 9000)}`
  const newGroup: FitnessGroup = {
    id: `grp-${Date.now()}`,
    name: name.trim(),
    description: description.trim(),
    creatorId: rpg.userId,
    inviteCode,
    isPrivate,
    memberCount: 1,
    isJoined: true,
    role: 'admin',
    createdAt: new Date().toISOString(),
  }
  const updated = [newGroup, ...groups]
  saveFitnessGroups(updated)
  return newGroup
}

export function joinFitnessGroupByCode(inviteCode: string): { success: boolean; group?: FitnessGroup; message: string } {
  const groups = getFitnessGroups()
  const targetCode = inviteCode.trim().toUpperCase()
  const group = groups.find((g) => g.inviteCode.toUpperCase() === targetCode)
  if (!group) {
    return { success: false, message: 'Invalid group invite code. Please check and try again.' }
  }
  if (group.isJoined) {
    return { success: true, group, message: 'You are already a member of this group.' }
  }
  group.isJoined = true
  group.memberCount += 1
  group.role = 'member'
  saveFitnessGroups(groups)
  return { success: true, group, message: `Successfully joined ${group.name}!` }
}

export function leaveFitnessGroup(groupId: string): boolean {
  const groups = getFitnessGroups()
  const group = groups.find((g) => g.id === groupId)
  if (!group || !group.isJoined) return false
  group.isJoined = false
  group.memberCount = Math.max(1, group.memberCount - 1)
  delete group.role
  saveFitnessGroups(groups)
  return true
}

export function getGroupMembers(groupId: string): GroupMember[] {
  return [
    {
      id: `mem-1-${groupId}`,
      groupId,
      userId: 'user-vikram',
      username: 'vikram_sharma',
      avatarId: 'avatar-vikram',
      role: 'admin',
      joinedAt: '2026-09-15T00:00:00.000Z',
    },
    {
      id: `mem-2-${groupId}`,
      groupId,
      userId: 'user-priya',
      username: 'priya_fitsoul',
      avatarId: 'avatar-priya',
      role: 'member',
      joinedAt: '2026-09-22T00:00:00.000Z',
    },
  ]
}

// MODERATION: REPORT & BLOCK
export function getBlockedUserIds(): string[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.BLOCKED)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return []
}

export function blockUser(userIdToBlock: string): void {
  if (!userIdToBlock) return
  const current = getBlockedUserIds()
  if (!current.includes(userIdToBlock)) {
    const updated = [...current, userIdToBlock]
    setStoredItem(STORAGE_KEYS.BLOCKED, JSON.stringify(updated))
  }
}

export function unblockUser(userIdToUnblock: string): void {
  const current = getBlockedUserIds()
  const updated = current.filter((id) => id !== userIdToUnblock)
  setStoredItem(STORAGE_KEYS.BLOCKED, JSON.stringify(updated))
}

export function getSocialReports(): SocialReport[] {
  try {
    const raw = getStoredItem(STORAGE_KEYS.REPORTS)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return []
}

export function reportContent(
  targetType: 'user' | 'activity' | 'comment' | 'group',
  targetId: string,
  reason: string,
  details?: string
): SocialReport {
  const rpg = getUserRpgProgress()
  const reports = getSocialReports()
  const report: SocialReport = {
    id: `rep-${Date.now()}`,
    reporterId: rpg.userId,
    targetType,
    targetId,
    reason,
    details,
    createdAt: new Date().toISOString(),
  }
  const updated = [report, ...reports]
  setStoredItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated))
  return report
}

// IDEMPOTENT CHALLENGE REWARD CLAIMING
export function claimChallengeRewardIdempotent(
  challengeId: string,
  userId = 'demo-user'
): { success: boolean; xpAwarded: number; message: string } {
  const challenges = getFitnessChallenges()
  const challenge = challenges.find((c) => c.id === challengeId)
  if (!challenge) {
    return { success: false, xpAwarded: 0, message: 'Challenge not found.' }
  }

  // Idempotency event key
  const eventKey = `challenge_${challengeId}_${userId}_reward`
  let claimedKeys: string[] = []
  try {
    const raw = getStoredItem(STORAGE_KEYS.CLAIMED_CHALLENGES)
    if (raw) claimedKeys = JSON.parse(raw)
  } catch {
    // fallback
  }

  if (claimedKeys.includes(eventKey)) {
    return {
      success: false,
      xpAwarded: 0,
      message: 'Reward has already been claimed for this challenge.',
    }
  }

  // Award XP via RPG engine with deterministic idempotency key
  awardXp(
    'challenge',
    challenge.rewardXp,
    `Completed Challenge: ${challenge.title}`,
    eventKey
  )

  claimedKeys.push(eventKey)
  setStoredItem(STORAGE_KEYS.CLAIMED_CHALLENGES, JSON.stringify(claimedKeys))

  challenge.isCompleted = true
  saveFitnessChallenges(challenges)

  return {
    success: true,
    xpAwarded: challenge.rewardXp,
    message: `Claimed +${challenge.rewardXp} XP for completing "${challenge.title}"!`,
  }
}


