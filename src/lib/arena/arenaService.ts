import type {
  ArenaCompetition,
  ArenaLeaderboardEntry,
  PersonalArenaHistory,
  ArenaScoringRule,
} from '../../types/arena'

const LOCAL_STORAGE_REGISTRATIONS_KEY = 'yashfit_arena_registrations'
const LOCAL_STORAGE_REPORTS_KEY = 'yashfit_arena_moderation_reports'

export const PRESET_ARENA_COMPETITIONS: ArenaCompetition[] = [
  {
    id: 'comp-volume-weekly',
    title: 'Weekly Volume Masters',
    subtitle: 'Compound Lifting Workload Championship',
    description: 'Score points for every verified kilogram of compound training volume, capped at 8,000 kg/day to encourage safe volume management without overtraining.',
    scope: 'public',
    format: 'solo',
    cadence: 'weekly',
    status: 'active',
    tier: 'open',
    startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    scoringRule: {
      type: 'volume_points',
      pointsPerUnit: 0.1, // 10 points per 100 kg
      dailyCapPoints: 800, // 800 pts cap / day (corresponds to 8,000 kg volume)
      description: '1 point per 10 kg lifted on verified workouts. Daily safety cap: 800 pts.',
    },
    xpPrizePool: 2500,
    badgeRewardTitle: 'Titan of Volume',
    participantsCount: 42,
    isRegistered: true,
    rulesDescription: [
      'Sets must be verified through the Workout Tracker or Session Tracker.',
      'Daily score ceiling enforced automatically to discourage excessive training volume.',
      'Rest days protect your streak without score degradation.',
    ],
    fairPlayNotice: 'Automated telemetry verification detects duplicate set logs and unrealistically high jump spikes.',
  },
  {
    id: 'comp-streak-monthly',
    title: '30-Day Consistency Odyssey',
    subtitle: 'Daily Habit & Recovery Discipline Tournament',
    description: 'Build habit durability. Receive points for logging workouts, completing daily recovery check-ins, and hitting hydration goals.',
    scope: 'public',
    format: 'solo',
    cadence: 'monthly',
    status: 'active',
    tier: 'open',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    scoringRule: {
      type: 'streak_consistency',
      pointsPerUnit: 50,
      dailyCapPoints: 150,
      description: '50 points per daily active streak habit. Daily safety cap: 150 pts.',
    },
    xpPrizePool: 5000,
    badgeRewardTitle: 'Iron Will Legend',
    participantsCount: 88,
    isRegistered: false,
    rulesDescription: [
      'Awarded once per calendar day for habit adherence.',
      'Rest days logged with recovery check-ins count toward consistency points.',
    ],
    fairPlayNotice: 'Requires actual log timestamps; multiple logs on the same date count as a single day.',
  },
  {
    id: 'comp-rookie-sprint',
    title: 'Rookie Foundations League',
    subtitle: 'Beginner & Novice Movement Mastery',
    description: 'Tailored for lifters in their first 6 months. Rewards consistent 3-4 days/week training with emphasis on movement execution rather than heavy 1RMs.',
    scope: 'public',
    format: 'solo',
    cadence: 'weekly',
    status: 'active',
    tier: 'rookie',
    startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    scoringRule: {
      type: 'workout_frequency',
      pointsPerUnit: 100,
      dailyCapPoints: 100,
      description: '100 points per completed workout session. Maximum 1 session credited per day.',
    },
    xpPrizePool: 1500,
    badgeRewardTitle: 'Rookie Vanguard',
    participantsCount: 28,
    isRegistered: false,
    rulesDescription: [
      'Restricted to athletes with Beginner or Intermediate profile status.',
      'Focuses on exercise adherence rather than maximum poundages.',
    ],
    fairPlayNotice: 'Encourages balanced programming without peer pressure to lift hazardous loads.',
  },
  {
    id: 'comp-benchmarks-apex',
    title: '1RM Strength Benchmark Apex',
    subtitle: 'Performance Lab Progress Invitational',
    description: 'Score points for verified improvements against your personal baseline in the Performance Lab.',
    scope: 'public',
    format: 'solo',
    cadence: 'monthly',
    status: 'upcoming',
    tier: 'intermediate',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    scoringRule: {
      type: 'benchmark_pr',
      pointsPerUnit: 25,
      dailyCapPoints: 200,
      description: '25 points per 1% verified improvement above personal baseline.',
    },
    xpPrizePool: 4000,
    badgeRewardTitle: 'Apex Breaker',
    participantsCount: 16,
    isRegistered: false,
    rulesDescription: [
      'Submaximal 3-5 rep tests calculate 1RM using Brzycki formula.',
      'Baseline must be established before competition start date.',
    ],
    fairPlayNotice: 'Comparisons are strictly normalized to your own starting baseline.',
  },
]

// Mock Leaderboard seed data
export const SEED_LEADERBOARDS: Record<string, ArenaLeaderboardEntry[]> = {
  'comp-volume-weekly': [
    { rank: 1, userId: 'u-101', displayName: 'Rohan Sharma', avatarId: 'avatar-ninja', score: 3840, verifiedEventsCount: 5, isCurrentUser: false, tier: 'open' },
    { rank: 2, userId: 'u-102', displayName: 'Ananya Verma', avatarId: 'avatar-valkyrie', score: 3620, verifiedEventsCount: 5, isCurrentUser: false, tier: 'open' },
    { rank: 3, userId: 'demo-user', displayName: 'You (Yash)', avatarId: 'avatar-ronin', score: 3250, verifiedEventsCount: 4, isCurrentUser: true, tier: 'open' },
    { rank: 4, userId: 'u-104', displayName: 'Vikram Singh', avatarId: 'avatar-titan', score: 2980, verifiedEventsCount: 4, isCurrentUser: false, tier: 'open' },
    { rank: 5, userId: 'u-105', displayName: 'Pooja Nair', avatarId: 'avatar-sensei', score: 2750, verifiedEventsCount: 4, isCurrentUser: false, tier: 'open' },
    { rank: 6, userId: 'u-106', displayName: 'Arjun Das', avatarId: 'avatar-ninja', score: 2410, verifiedEventsCount: 3, isCurrentUser: false, tier: 'open' },
  ],
  'comp-streak-monthly': [
    { rank: 1, userId: 'u-201', displayName: 'Deepak Patel', avatarId: 'avatar-titan', score: 1450, verifiedEventsCount: 29, isCurrentUser: false, tier: 'open' },
    { rank: 2, userId: 'u-202', displayName: 'Kavita Joshi', avatarId: 'avatar-valkyrie', score: 1400, verifiedEventsCount: 28, isCurrentUser: false, tier: 'open' },
    { rank: 3, userId: 'demo-user', displayName: 'You (Yash)', avatarId: 'avatar-ronin', score: 1350, verifiedEventsCount: 27, isCurrentUser: true, tier: 'open' },
  ],
}

/**
 * Calculates competition points earned from a workout event, enforcing the daily safety cap.
 */
export function calculateEventPoints(
  rule: ArenaScoringRule,
  rawMetricValue: number,
  existingDayPoints = 0
): number {
  if (rawMetricValue <= 0) return 0
  const grossPoints = Math.round(rawMetricValue * rule.pointsPerUnit)
  const availableUnderCap = Math.max(0, rule.dailyCapPoints - existingDayPoints)
  return Math.min(grossPoints, availableUnderCap)
}

/**
 * Storage helpers for Arena Registrations & History
 */
export function getRegisteredCompetitionIds(): string[] {
  if (typeof window === 'undefined') return ['comp-volume-weekly']
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTRATIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fallback
  }
  return ['comp-volume-weekly']
}

export function registerForCompetition(competitionId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    const current = getRegisteredCompetitionIds()
    if (!current.includes(competitionId)) {
      const updated = [...current, competitionId]
      localStorage.setItem(LOCAL_STORAGE_REGISTRATIONS_KEY, JSON.stringify(updated))
      return true
    }
  } catch {
    // fallback
  }
  return false
}

export function leaveCompetition(competitionId: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    const current = getRegisteredCompetitionIds()
    const updated = current.filter((id) => id !== competitionId)
    localStorage.setItem(LOCAL_STORAGE_REGISTRATIONS_KEY, JSON.stringify(updated))
    return true
  } catch {
    // fallback
  }
  return false
}

export function getArenaCompetitions(): ArenaCompetition[] {
  const registeredIds = getRegisteredCompetitionIds()
  return PRESET_ARENA_COMPETITIONS.map((c) => ({
    ...c,
    isRegistered: registeredIds.includes(c.id),
  }))
}

export function getCompetitionById(competitionId: string): ArenaCompetition | undefined {
  return PRESET_ARENA_COMPETITIONS.find((c) => c.id === competitionId)
}

export function getCompetitionLeaderboard(competitionId: string): ArenaLeaderboardEntry[] {
  return SEED_LEADERBOARDS[competitionId] || [
    { rank: 1, userId: 'demo-user', displayName: 'You (Yash)', avatarId: 'avatar-ronin', score: 100, verifiedEventsCount: 1, isCurrentUser: true, tier: 'open' },
  ]
}

export function getUserArenaHistory(): PersonalArenaHistory {
  return {
    totalCompetitionsJoined: 4,
    podiumFinishes: 2,
    bestRank: 2,
    totalArenaXpEarned: 3500,
    history: [
      {
        competitionId: 'comp-volume-prev',
        title: 'Weekly Volume Masters #41',
        rank: 3,
        score: 4120,
        date: '2026-10-23',
        rewardClaimed: true,
      },
      {
        competitionId: 'comp-streak-prev',
        title: '14-Day Consistency Blitz',
        rank: 2,
        score: 700,
        date: '2026-10-14',
        rewardClaimed: true,
      },
    ],
  }
}

export function reportArenaParticipant(reportedUserId: string, reason: string): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY)
    const reports = raw ? JSON.parse(raw) : []
    reports.push({
      reportedUserId,
      reason,
      timestamp: Date.now(),
    })
    localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(reports))
    return true
  } catch {
    return false
  }
}
