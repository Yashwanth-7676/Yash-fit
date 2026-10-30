'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Calendar,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Flag,
  UserPlus,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  getArenaCompetitions,
  registerForCompetition,
  leaveCompetition,
  getCompetitionLeaderboard,
  getUserArenaHistory,
  reportArenaParticipant,
} from '@/lib/arena/arenaService'
import type {
  ArenaCompetition,
  ArenaLeaderboardEntry,
  PersonalArenaHistory,
  EligibilityTier,
} from '@/types/arena'

export function ArenaContent() {
  const toast = useToast()

  const [competitions, setCompetitions] = useState<ArenaCompetition[]>([])
  const [selectedCompId, setSelectedCompId] = useState<string>('comp-volume-weekly')
  const [activeTab, setActiveTab] = useState<'competitions' | 'leaderboard' | 'history' | 'rules'>('competitions')
  const [tierFilter, setTierFilter] = useState<EligibilityTier | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [history, setHistory] = useState<PersonalArenaHistory | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState<ArenaLeaderboardEntry | null>(null)
  const [reportReason, setReportReason] = useState('')

  useEffect(() => {
    setCompetitions(getArenaCompetitions())
    setHistory(getUserArenaHistory())
  }, [])

  const activeCompetition = useMemo(() => {
    return competitions.find((c) => c.id === selectedCompId) || competitions[0]
  }, [competitions, selectedCompId])

  const leaderboardEntries: ArenaLeaderboardEntry[] = useMemo(() => {
    if (!activeCompetition) return []
    return getCompetitionLeaderboard(activeCompetition.id)
  }, [activeCompetition])

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((c) => {
      const matchTier = tierFilter === 'all' || c.tier === tierFilter
      const matchQuery =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchTier && matchQuery
    })
  }, [competitions, tierFilter, searchQuery])

  const handleRegister = (id: string, title: string) => {
    registerForCompetition(id)
    setCompetitions(getArenaCompetitions())
    toast.success('Registration Confirmed! 🏅', `You joined "${title}". Verified sets will now score points.`)
  }

  const handleLeave = (id: string, title: string) => {
    leaveCompetition(id)
    setCompetitions(getArenaCompetitions())
    toast.info('Left Competition', `Withdrew from "${title}".`)
  }

  const handleRefreshLeaderboard = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast.info('Leaderboard Synced', 'Refreshed latest verified competition telemetry.')
    }, 600)
  }

  const handleOpenReport = (entry: ArenaLeaderboardEntry) => {
    setReportTarget(entry)
    setShowReportModal(true)
  }

  const handleConfirmReport = () => {
    if (!reportTarget || !reportReason.trim()) return
    reportArenaParticipant(reportTarget.userId, reportReason)
    setShowReportModal(false)
    setReportReason('')
    toast.success('Report Filed', 'Moderation review request submitted. Thank you for protecting fair play.')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Global Arena & Tournaments</Badge>
            <span className="text-xs text-zinc-400 font-mono">Anti-Exploit Fair Play</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Global Fitness Arena
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Compete in verified solo and team leagues. Points are strictly verified through your recorded workouts with automatic safety caps to prevent overtraining.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('competitions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'competitions'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Leagues &amp; Events
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            My Arena History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'rules'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Fair Play
          </button>
        </div>
      </div>

      {/* Main Tab: Competitions List */}
      {activeTab === 'competitions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search tournaments by name or scoring rule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
              {(['all', 'open', 'rookie', 'intermediate'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                    tierFilter === tier
                      ? 'bg-lime-400 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : `${tier} Tier`}
                </button>
              ))}
            </div>
          </div>

          {/* Competitions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCompetitions.map((comp) => {
              const isSelected = comp.id === selectedCompId
              return (
                <Card
                  key={comp.id}
                  className={`p-5 border space-y-4 transition-all ${
                    isSelected
                      ? 'border-lime-400/80 bg-zinc-900 shadow-xl'
                      : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="accent">{comp.cadence.toUpperCase()}</Badge>
                        <span className="text-[10px] text-zinc-400 font-mono capitalize">
                          {comp.format} · {comp.tier} Tier
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">{comp.title}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">{comp.subtitle}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Prize Pool</span>
                      <span className="text-sm font-extrabold text-lime-400 font-mono">+{comp.xpPrizePool} XP</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {comp.description}
                  </p>

                  {/* Scoring Rule Badge Strip */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-1">
                    <span className="text-[10px] text-lime-400 font-semibold uppercase tracking-wider block">Scoring Rule</span>
                    <p className="text-zinc-300">{comp.scoringRule.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} />
                      <span>{comp.startDate} to {comp.endDate}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      <span>{comp.participantsCount} enrolled</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompId(comp.id)
                        setActiveTab('leaderboard')
                      }}
                      className="text-xs text-lime-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>View Standings</span>
                      <ArrowRight size={12} />
                    </button>

                    {comp.isRegistered ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-lime-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          <span>Registered</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLeave(comp.id, comp.title)}
                        >
                          Leave
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleRegister(comp.id, comp.title)}
                        icon={<UserPlus size={14} />}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="accent">{activeCompetition?.title || 'Tournament'}</Badge>
                <span className="text-xs text-zinc-400 font-mono">Telemetry Verified Standings</span>
              </div>
              <h2 className="text-lg font-bold text-white">Active Competition Leaderboard</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Standings refresh periodically based on verified workouts. Daily volume caps prevent overtraining.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshLeaderboard}
              loading={isRefreshing}
              icon={<RefreshCw size={14} />}
            >
              Refresh Standings
            </Button>
          </div>

          {/* Standings Table */}
          <div className="divide-y divide-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead>
                <tr className="text-[10px] text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Athlete</th>
                  <th className="py-2.5 px-3">Verified Events</th>
                  <th className="py-2.5 px-3 text-right">Points</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {leaderboardEntries.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-lime-400/10 font-bold'
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                          entry.rank === 1
                            ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                            : entry.rank === 2
                            ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                            : entry.rank === 3
                            ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                            : 'text-zinc-500'
                        }`}
                      >
                        {entry.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{entry.displayName}</span>
                        {entry.isCurrentUser && (
                          <span className="px-1.5 py-0.5 rounded bg-lime-400 text-zinc-950 text-[10px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-400">{entry.verifiedEventsCount} workouts</td>
                    <td className="py-3 px-3 text-right text-lime-400 font-extrabold text-sm">
                      {entry.score.toLocaleString()} pts
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!entry.isCurrentUser && (
                        <button
                          type="button"
                          onClick={() => handleOpenReport(entry)}
                          className="p-1 rounded text-zinc-500 hover:text-amber-400 transition-colors"
                          title="Report suspicious telemetry"
                        >
                          <Flag size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Main Tab: Personal History */}
      {activeTab === 'history' && history && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Card className="p-4 border-zinc-800 bg-zinc-900/80">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Tournaments Entered</span>
              <span className="text-2xl font-extrabold text-white font-mono mt-0.5 block">{history.totalCompetitionsJoined}</span>
            </Card>
            <Card className="p-4 border-zinc-800 bg-zinc-900/80">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Podium Finishes</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5 block">{history.podiumFinishes}</span>
            </Card>
            <Card className="p-4 border-zinc-800 bg-zinc-900/80">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Personal Best Rank</span>
              <span className="text-2xl font-extrabold text-lime-400 font-mono mt-0.5 block">#{history.bestRank}</span>
            </Card>
            <Card className="p-4 border-zinc-800 bg-zinc-900/80">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Arena XP Earned</span>
              <span className="text-2xl font-extrabold text-sky-400 font-mono mt-0.5 block">+{history.totalArenaXpEarned}</span>
            </Card>
          </div>

          <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3">Past Competition Results</h3>
            <div className="divide-y divide-zinc-800">
              {history.history.map((h, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-white">{h.title}</h4>
                    <span className="text-zinc-500 font-mono text-[11px]">{h.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lime-400 font-bold block">{h.score} pts</span>
                    <span className="text-zinc-400 text-[11px]">Rank #{h.rank}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Main Tab: Fair Play Rules */}
      {activeTab === 'rules' && (
        <Card className="p-6 border-zinc-800 bg-zinc-900/90 space-y-4">
          <div className="flex items-center gap-2 text-lime-400 font-bold text-sm border-b border-zinc-800 pb-3">
            <ShieldCheck size={18} />
            <span>YashFit Global Arena Fair Play Manifesto</span>
          </div>

          <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
            <p>
              The YashFit Arena exists to inspire healthy consistency, not destructive extreme exercise. All competitions enforce automated safety boundaries:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-bold text-white block">1. Strict Daily Safety Caps</span>
                <p className="text-zinc-400">
                  Every challenge imposes a strict daily points ceiling. This ensures athletes who train safely for 45-60 minutes are not penalized by extreme multi-hour binge workouts.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-bold text-white block">2. Zero Reward for Extreme Deficits</span>
                <p className="text-zinc-400">
                  Scoring rules deliberately exclude dangerous rapid calorie restriction, water dehydration, or crash dieting.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-bold text-white block">3. Server-Side Verification</span>
                <p className="text-zinc-400">
                  XP and points are calculated on verified session completions. Client-side payload tampering is rejected.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="font-bold text-white block">4. Anonymous Leaderboard Option</span>
                <p className="text-zinc-400">
                  Users maintain full control over leaderboard identity. You can mask your profile and appear as an anonymous athlete anytime in settings.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Moderation Report Modal */}
      {showReportModal && reportTarget && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={`Report User: ${reportTarget.displayName}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-zinc-300">
              Please specify the fair play concern with this athlete&apos;s logged telemetry:
            </p>

            <Input
              placeholder="e.g., Unrealistic volume spike, impossible workout duration..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setShowReportModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmReport}>
                Submit Report
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

