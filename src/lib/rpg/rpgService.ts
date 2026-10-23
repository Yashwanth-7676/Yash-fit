import type {
  AnimeRank,
  RankDefinition,
  UserRpgProgress,
  XpTransaction,
  Quest,
  Achievement,
} from '@/types/rpg'
import { generateDailyQuests, generateWeeklyQuests } from '@/data/quests'
import { DEFAULT_ACHIEVEMENTS } from '@/data/achievements'

export const RANKS_CONFIG: Record<AnimeRank, RankDefinition> = {
  Rookie: {
    rank: 'Rookie',
    minLevel: 1,
    title: 'Novice Adventurer',
    color: '#a1a1aa', // zinc-400
    bgGradient: 'from-zinc-800 to-zinc-900',
    badgeIcon: '🥋',
    description: 'Awakening athletic ki and mastering foundational compound mechanics.',
  },
  Fighter: {
    rank: 'Fighter',
    minLevel: 5,
    title: 'Disciplined Warrior',
    color: '#34d399', // emerald-400
    bgGradient: 'from-emerald-950/60 to-zinc-900',
    badgeIcon: '⚡',
    description: 'Consistent training rhythm with noticeable power and muscle endurance.',
  },
  Hunter: {
    rank: 'Hunter',
    minLevel: 10,
    title: 'Relentless Hunter',
    color: '#38bdf8', // sky-400
    bgGradient: 'from-sky-950/60 to-zinc-900',
    badgeIcon: '🏹',
    description: 'Precision technique, progressive overload mastery, and iron focus.',
  },
  Elite: {
    rank: 'Elite',
    minLevel: 15,
    title: 'Peak Striker',
    color: '#fbbf24', // amber-400
    bgGradient: 'from-amber-950/60 to-zinc-900',
    badgeIcon: '⚔️',
    description: 'Surpassing standard human limits in physical work capacity.',
  },
  Master: {
    rank: 'Master',
    minLevel: 20,
    title: 'Grandmaster of Iron',
    color: '#c084fc', // purple-400
    bgGradient: 'from-purple-950/60 to-zinc-900',
    badgeIcon: '🔮',
    description: 'Aura of physical mastery, legendary recovery habits, and flawless form.',
  },
  Legend: {
    rank: 'Legend',
    minLevel: 30,
    title: 'Mythic Titan',
    color: '#a3e635', // lime-400
    bgGradient: 'from-lime-950/70 to-zinc-900',
    badgeIcon: '👑',
    description: 'Ascended beyond mortal fitness. An inspiration to the entire community.',
  },
}

/**
 * Calculates cumulative total XP required to reach a specific level.
 */
export function totalXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0
  let total = 0
  for (let lvl = 1; lvl < level; lvl++) {
    total += Math.floor(100 * Math.pow(lvl, 1.45))
  }
  return total
}

/**
 * Calculates XP required to progress from `level` to `level + 1`.
 */
export function xpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.45))
}

/**
 * Calculates level from total XP.
 */
export function calculateLevelFromXp(totalXp: number): {
  level: number
  xpInCurrentLevel: number
  xpRequiredForNextLevel: number
  rank: AnimeRank
} {
  let level = 1
  while (true) {
    const costForNext = xpToNextLevel(level)
    const cumulativeAtNext = totalXpRequiredForLevel(level + 1)
    if (totalXp >= cumulativeAtNext) {
      level++
    } else {
      const currentLevelStart = totalXpRequiredForLevel(level)
      const xpInCurrentLevel = totalXp - currentLevelStart
      const rank = getRankFromLevel(level)
      return {
        level,
        xpInCurrentLevel,
        xpRequiredForNextLevel: costForNext,
        rank,
      }
    }
  }
}

export function getRankFromLevel(level: number): AnimeRank {
  if (level >= 30) return 'Legend'
  if (level >= 20) return 'Master'
  if (level >= 15) return 'Elite'
  if (level >= 10) return 'Hunter'
  if (level >= 5) return 'Fighter'
  return 'Rookie'
}

const STORAGE_KEYS = {
  RPG_PROGRESS: 'yashfit_rpg_progress',
  XP_TRANSACTIONS: 'yashfit_xp_transactions',
  PROCESSED_EVENTS: 'yashfit_processed_xp_events',
  QUESTS: 'yashfit_quests',
  ACHIEVEMENTS: 'yashfit_achievements',
}

export function getInitialProgress(userId = 'demo-user'): UserRpgProgress {
  return {
    userId,
    totalXp: 350,
    currentLevel: 2,
    xpInCurrentLevel: 110,
    xpRequiredForNextLevel: 273,
    rank: 'Rookie',
    currentStreak: 4,
    longestStreak: 7,
    lastActiveDate: new Date().toISOString().split('T')[0],
    avatarId: 'avatar-kenji',
    equippedTitle: 'The Iron Disciple',
    unlockedAvatars: ['avatar-kenji', 'avatar-aoi'],
    unlockedTitles: ['The Iron Disciple', 'Novice Adventurer'],
    completedQuestsCount: 3,
    unlockedAchievementsCount: 1,
  }
}

export function getUserRpgProgress(): UserRpgProgress {
  if (typeof window === 'undefined') return getInitialProgress()
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.RPG_PROGRESS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // fallback
  }
  const initial = getInitialProgress()
  saveUserRpgProgress(initial)
  return initial
}

export function saveUserRpgProgress(progress: UserRpgProgress): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.RPG_PROGRESS, JSON.stringify(progress))
  } catch {
    // ignore
  }
}

/**
 * Awards XP with idempotency check, daily caps, and level-up detection.
 */
export function awardXp(
  source: XpTransaction['source'],
  amount: number,
  description: string,
  eventId?: string
): { success: boolean; newProgress: UserRpgProgress; leveledUp: boolean; rankUp: boolean } {
  const current = getUserRpgProgress()
  const todayStr = new Date().toISOString().split('T')[0]

  // Idempotency check: prevent duplicate event processing
  if (eventId && typeof window !== 'undefined') {
    try {
      const processed: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROCESSED_EVENTS) || '[]')
      if (processed.includes(eventId)) {
        return { success: false, newProgress: current, leveledUp: false, rankUp: false }
      }
      processed.push(eventId)
      if (processed.length > 500) processed.shift()
      localStorage.setItem(STORAGE_KEYS.PROCESSED_EVENTS, JSON.stringify(processed))
    } catch {
      // ignore
    }
  }

  // Daily XP cap check (800 XP max per day)
  const transactions = getXpTransactions()
  const todayXp = transactions
    .filter((tx) => new Date(tx.timestamp).toISOString().split('T')[0] === todayStr)
    .reduce((sum, tx) => sum + tx.amount, 0)

  const allowedAmount = Math.max(0, Math.min(amount, 800 - todayXp))
  if (allowedAmount <= 0) {
    return { success: false, newProgress: current, leveledUp: false, rankUp: false }
  }

  const prevLevel = current.currentLevel
  const prevRank = current.rank
  const newTotalXp = current.totalXp + allowedAmount

  const calc = calculateLevelFromXp(newTotalXp)
  const leveledUp = calc.level > prevLevel
  const rankUp = calc.rank !== prevRank

  // Update streak if active on a new calendar date
  let streak = current.currentStreak
  let longest = current.longestStreak
  if (current.lastActiveDate !== todayStr) {
    const lastDate = new Date(current.lastActiveDate)
    const todayDate = new Date(todayStr)
    const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24))

    if (diffDays === 1) {
      streak += 1
      if (streak > longest) longest = streak
    } else if (diffDays > 1) {
      streak = 1
    }
  }

  // Check newly unlocked avatars/titles based on new level/rank
  const unlockedAvatars = [...current.unlockedAvatars]
  if (calc.level >= 5 && !unlockedAvatars.includes('avatar-ryu')) unlockedAvatars.push('avatar-ryu')
  if (calc.level >= 7 && !unlockedAvatars.includes('avatar-hana')) unlockedAvatars.push('avatar-hana')
  if (calc.level >= 10 && !unlockedAvatars.includes('avatar-ren')) unlockedAvatars.push('avatar-ren')
  if (calc.level >= 15 && !unlockedAvatars.includes('avatar-daiki')) unlockedAvatars.push('avatar-daiki')
  if (calc.level >= 20 && !unlockedAvatars.includes('avatar-mira')) unlockedAvatars.push('avatar-mira')
  if (calc.level >= 30 && !unlockedAvatars.includes('avatar-zane')) unlockedAvatars.push('avatar-zane')

  const updated: UserRpgProgress = {
    ...current,
    totalXp: newTotalXp,
    currentLevel: calc.level,
    xpInCurrentLevel: calc.xpInCurrentLevel,
    xpRequiredForNextLevel: calc.xpRequiredForNextLevel,
    rank: calc.rank,
    currentStreak: streak,
    longestStreak: longest,
    lastActiveDate: todayStr,
    unlockedAvatars,
  }

  saveUserRpgProgress(updated)

  // Save transaction
  const tx: XpTransaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: current.userId,
    amount: allowedAmount,
    source,
    description,
    timestamp: Date.now(),
  }
  saveXpTransaction(tx)

  return {
    success: true,
    newProgress: updated,
    leveledUp,
    rankUp,
  }
}

export function getXpTransactions(): XpTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.XP_TRANSACTIONS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveXpTransaction(tx: XpTransaction): void {
  if (typeof window === 'undefined') return
  try {
    const list = getXpTransactions()
    list.unshift(tx)
    if (list.length > 100) list.pop()
    localStorage.setItem(STORAGE_KEYS.XP_TRANSACTIONS, JSON.stringify(list))
  } catch {
    // ignore
  }
}

// QUESTS MANAGEMENT
export function getActiveQuests(): Quest[] {
  if (typeof window === 'undefined') return []
  const todayStr = new Date().toISOString().split('T')[0]
  const weekId = `${new Date().getFullYear()}-W${Math.ceil((new Date().getDate() + 6) / 7)}`

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTS)
    if (raw) {
      const stored: Quest[] = JSON.parse(raw)
      // Check if stored daily quests match today's date
      const hasToday = stored.some((q) => q.frequency === 'daily' && q.id.includes(todayStr))
      if (hasToday) {
        return stored
      }
    }
  } catch {
    // fallback
  }

  const fresh = [...generateDailyQuests(todayStr), ...generateWeeklyQuests(weekId)]
  saveActiveQuests(fresh)
  return fresh
}

export function saveActiveQuests(quests: Quest[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests))
  } catch {
    // ignore
  }
}

export function claimQuestReward(questId: string): { success: boolean; xpAwarded: number } {
  const quests = getActiveQuests()
  const q = quests.find((item) => item.id === questId)
  if (!q || !q.completed || q.claimed) {
    return { success: false, xpAwarded: 0 }
  }

  q.claimed = true
  saveActiveQuests(quests)

  awardXp('quest', q.rewardXp, `Completed Quest: ${q.title}`, `claim-${questId}`)

  // Increment completed quest count
  const prog = getUserRpgProgress()
  prog.completedQuestsCount += 1
  saveUserRpgProgress(prog)

  return { success: true, xpAwarded: q.rewardXp }
}

// ACHIEVEMENTS MANAGEMENT
export function getAchievements(): Achievement[] {
  if (typeof window === 'undefined') return DEFAULT_ACHIEVEMENTS
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // fallback
  }
  saveAchievements(DEFAULT_ACHIEVEMENTS)
  return DEFAULT_ACHIEVEMENTS
}

export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements))
  } catch {
    // ignore
  }
}

export function unlockAchievement(achievementId: string): { success: boolean; xpAwarded: number } {
  const list = getAchievements()
  const ach = list.find((a) => a.id === achievementId)
  if (!ach || ach.unlocked) {
    return { success: false, xpAwarded: 0 }
  }

  ach.unlocked = true
  ach.unlockedAt = new Date().toISOString()
  ach.progress = 100
  saveAchievements(list)

  awardXp('achievement', ach.rewardXp, `Unlocked Achievement: ${ach.title}`, `ach-${achievementId}`)

  const prog = getUserRpgProgress()
  prog.unlockedAchievementsCount += 1
  saveUserRpgProgress(prog)

  return { success: true, xpAwarded: ach.rewardXp }
}

