export type CompetitionScope = 'public' | 'private'
export type CompetitionFormat = 'solo' | 'team'
export type CompetitionCadence = 'weekly' | 'monthly' | 'special_event'
export type CompetitionStatus = 'upcoming' | 'active' | 'completed'
export type EligibilityTier = 'open' | 'rookie' | 'intermediate' | 'elite'

export interface ArenaScoringRule {
  type: 'volume_points' | 'streak_consistency' | 'workout_frequency' | 'benchmark_pr'
  pointsPerUnit: number
  dailyCapPoints: number
  description: string
}

export interface ArenaCompetition {
  id: string
  title: string
  subtitle: string
  description: string
  scope: CompetitionScope
  format: CompetitionFormat
  cadence: CompetitionCadence
  status: CompetitionStatus
  tier: EligibilityTier
  startDate: string
  endDate: string
  scoringRule: ArenaScoringRule
  xpPrizePool: number
  badgeRewardTitle: string
  participantsCount: number
  isRegistered: boolean
  rulesDescription: string[]
  fairPlayNotice: string
  inviteCode?: string
}

export interface ArenaLeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatarId: string
  score: number
  verifiedEventsCount: number
  isCurrentUser: boolean
  teamName?: string
  tier: EligibilityTier
}

export interface PersonalArenaHistory {
  totalCompetitionsJoined: number
  podiumFinishes: number
  bestRank: number | null
  totalArenaXpEarned: number
  history: {
    competitionId: string
    title: string
    rank: number
    score: number
    date: string
    rewardClaimed: boolean
  }[]
}

