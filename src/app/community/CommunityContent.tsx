'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Trophy,
  Flame,
  Search,
  UserPlus,
  UserCheck,
  Check,
  X,
  Share2,
  ThumbsUp,
  Shield,
  Lock,
  Eye,
  Settings,
  Sparkles,
  Award,
  Clock,
  Dumbbell,
  Droplet,
  Moon,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import { AvatarBadge } from '@/components/rpg/AvatarBadge'
import {
  getCommunityUsers,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFitnessChallenges,
  toggleJoinChallenge,
  getActivityFeed,
  publishActivity,
  toggleReaction,
  getLeaderboard,
  getUserPrivacySettings,
  saveUserPrivacySettings,
} from '@/lib/social/socialService'
import { getUserRpgProgress } from '@/lib/rpg/rpgService'
import type {
  PublicUserProfile,
  FitnessChallenge,
  SocialActivityItem,
  LeaderboardEntry,
  UserPrivacySettings,
} from '@/types/social'

export function CommunityContent() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'leaderboard' | 'friends'>('feed')

  // Search & Users state
  const [searchQuery, setSearchQuery] = useState('')
  const [usersList, setUsersList] = useState<PublicUserProfile[]>([])

  // Challenges, Feed & Leaderboard state
  const [challenges, setChallenges] = useState<FitnessChallenge[]>([])
  const [feed, setFeed] = useState<SocialActivityItem[]>([])
  const [leaderboardType, setLeaderboardType] = useState<'weekly_xp' | 'monthly_workouts' | 'streak'>('weekly_xp')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // Privacy Settings modal
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacySettings, setPrivacySettings] = useState<UserPrivacySettings>(getUserPrivacySettings())

  // New Post input
  const [postTitle, setPostTitle] = useState('')
  const [postDesc, setPostDesc] = useState('')

  useEffect(() => {
    setUsersList(getCommunityUsers())
    setChallenges(getFitnessChallenges())
    setFeed(getActivityFeed())
    setLeaderboard(getLeaderboard(leaderboardType))
    setPrivacySettings(getUserPrivacySettings())
  }, [leaderboardType])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    setUsersList(searchUsers(q))
  }

  const handleSendRequest = (userId: string, username: string) => {
    const ok = sendFriendRequest(userId)
    if (ok) {
      toast.success('Request Sent! 🤝', `Friend request sent to @${username}.`)
      setUsersList(getCommunityUsers())
    } else {
      toast.info('Already Connected', 'Friend request is already pending or accepted.')
    }
  }

  const handleAcceptRequest = (userId: string, username: string) => {
    acceptFriendRequest(userId)
    toast.success('Friend Accepted! 🎉', `You are now friends with @${username}.`)
    setUsersList(getCommunityUsers())
  }

  const handleDeclineRequest = (userId: string) => {
    declineFriendRequest(userId)
    toast.info('Request Declined', 'Friend request was removed.')
    setUsersList(getCommunityUsers())
  }

  const handleRemoveFriend = (userId: string, username: string) => {
    removeFriend(userId)
    toast.info('Friend Removed', `@${username} was removed from your friends list.`)
    setUsersList(getCommunityUsers())
  }

  const handleToggleChallenge = (challengeId: string, title: string) => {
    const isNowJoined = toggleJoinChallenge(challengeId)
    setChallenges(getFitnessChallenges())
    if (isNowJoined) {
      toast.success('Challenge Joined! 🏆', `You are now competing in "${title}".`)
    } else {
      toast.info('Left Challenge', `You left "${title}".`)
    }
  }

  const handleReaction = (activityId: string, reaction: 'like' | 'flex') => {
    toggleReaction(activityId, reaction)
    setFeed(getActivityFeed())
  }

  const handleSharePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle.trim()) return

    publishActivity('workout_completed', postTitle.trim(), postDesc.trim() || 'Crushed another solid session today!')
    setFeed(getActivityFeed())
    setPostTitle('')
    setPostDesc('')
    toast.success('Shared to Community! 🚀', 'Your milestone is now live on the feed.')
  }

  const handleSavePrivacy = () => {
    saveUserPrivacySettings(privacySettings)
    setShowPrivacyModal(false)
    toast.success('Privacy Updated', 'Your profile and social visibility settings have been saved.')
    setLeaderboard(getLeaderboard(leaderboardType))
  }

  const myFriends = usersList.filter((u) => u.isFriend)
  const pendingReceived = usersList.filter((u) => u.friendshipStatus === 'pending_received')

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Social Fitness Guild</Badge>
            <span className="text-xs text-zinc-500 font-medium">Community &amp; Challenges</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Social Community Hub</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Train together, participate in group challenges, view verified leaderboards, and support companion lifters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrivacyModal(true)}
            icon={<Settings size={14} />}
          >
            Privacy Settings
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800">
        {[
          { id: 'feed', label: 'Activity Feed', icon: <Share2 size={15} /> },
          { id: 'challenges', label: 'Challenges', icon: <Trophy size={15} /> },
          { id: 'leaderboard', label: 'Leaderboard', icon: <Award size={15} /> },
          { id: 'friends', label: `Companions (${myFriends.length})`, icon: <Users size={15} /> },
        ].map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
                isSelected
                  ? 'border-lime-400 text-lime-400'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: ACTIVITY FEED */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Feed (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Quick Share Box */}
            <Card className="p-4 sm:p-5 border-zinc-800 bg-zinc-900 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Share a Milestone
              </h3>
              <form onSubmit={handleSharePost} className="space-y-3">
                <Input
                  placeholder="What workout or goal did you achieve today? (e.g. 5x5 Barbell Squats at 100kg)"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full"
                />
                <Input
                  placeholder="Optional notes or form cues (e.g. strict parallel depth with 2s pause)"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  className="w-full"
                />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-zinc-500">
                    Shared with: <strong className="text-zinc-300">Public Community</strong>
                  </span>
                  <Button type="submit" size="sm" disabled={!postTitle.trim()} icon={<Share2 size={14} />}>
                    Post to Feed
                  </Button>
                </div>
              </form>
            </Card>

            {/* Feed Stream */}
            <div className="space-y-3.5">
              {feed.map((item) => (
                <Card key={item.id} className="p-5 border-zinc-800 bg-zinc-900 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        avatarId={item.userAvatarId}
                        rank={item.userRank}
                        level={item.userLevel}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">@{item.username}</h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            Lvl {item.userLevel} · {item.userRank}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500">{item.timestamp}</span>
                      </div>
                    </div>

                    {item.statHighlight && (
                      <span className="px-2 py-1 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20 text-xs font-semibold shrink-0">
                        {item.statHighlight}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{item.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Reaction Buttons */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleReaction(item.id, 'like')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        item.hasLiked
                          ? 'bg-lime-400/15 text-lime-400 border border-lime-400/30'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ThumbsUp size={13} className={item.hasLiked ? 'fill-lime-400' : ''} />
                      <span>{item.likeCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReaction(item.id, 'flex')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        item.hasFlexed
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>💪</span>
                      <span>{item.flexCount}</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column: Friends Preview & Active Challenge Widget (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Fitness Companions ({myFriends.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className="text-xs text-lime-400 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {myFriends.slice(0, 3).map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <AvatarBadge avatarId={friend.avatarId} rank={friend.rank} level={friend.level} size="sm" />
                      <div>
                        <h4 className="text-xs font-bold text-white">@{friend.username}</h4>
                        <span className="text-[10px] text-zinc-500">Level {friend.level} · {friend.rank}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-lime-400 flex items-center gap-1">
                      <Flame size={12} className="fill-lime-400" />
                      {friend.currentStreak}d
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacy Guarantee Note */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-lime-400 font-semibold">
                <Shield size={13} />
                <span>Privacy &amp; Safety Guaranteed</span>
              </div>
              <p className="leading-relaxed text-zinc-500">
                Email addresses, body weight measurements, exact GPS locations, and private health metrics are never exposed to other community members.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FITNESS CHALLENGES */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((chal) => {
              const pct = Math.min(100, Math.round((chal.currentProgress / chal.targetCount) * 100))
              return (
                <Card
                  key={chal.id}
                  className={`p-6 border flex flex-col justify-between space-y-4 transition-all ${
                    chal.isJoined
                      ? 'bg-zinc-900 border-lime-400/30 shadow-lg'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={chal.isJoined ? 'accent' : 'default'}>
                        {chal.isJoined ? 'Active Challenge' : 'Available'}
                      </Badge>
                      <span className="text-xs font-bold text-amber-400">
                        +{chal.rewardXp} XP
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{chal.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">{chal.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400 font-medium">Your Progress</span>
                      <span className="text-white font-mono font-bold">
                        {chal.currentProgress} / {chal.targetCount} {chal.targetMetricName} ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-lime-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                      <span>{chal.participantCount} Lifters participating</span>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock size={12} />
                        {chal.daysRemaining} days left
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant={chal.isJoined ? 'outline' : 'primary'}
                      fullWidth
                      onClick={() => handleToggleChallenge(chal.id, chal.title)}
                    >
                      {chal.isJoined ? 'Leave Challenge' : 'Join Challenge'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {[
                { id: 'weekly_xp', label: 'Weekly XP' },
                { id: 'monthly_workouts', label: 'Monthly Workouts' },
                { id: 'streak', label: 'Current Streak' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setLeaderboardType(btn.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    leaderboardType === btn.id
                      ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-zinc-500">
              Resets every Sunday at 23:59 Local Time
            </span>
          </div>

          <Card className="p-0 border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="divide-y divide-zinc-800">
              {leaderboard.map((entry) => (
                <div
                  key={entry.userId}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    entry.isCurrentUser
                      ? 'bg-lime-400/10 border-l-4 border-lime-400'
                      : 'hover:bg-zinc-850/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`w-7 text-center font-extrabold text-sm ${
                        entry.rankPosition === 1
                          ? 'text-amber-400'
                          : entry.rankPosition === 2
                          ? 'text-zinc-300'
                          : entry.rankPosition === 3
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                      }`}
                    >
                      #{entry.rankPosition}
                    </span>

                    <AvatarBadge avatarId={entry.avatarId} rank={entry.animeRank} level={entry.level} size="sm" />

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{entry.username}</span>
                        {entry.isCurrentUser && (
                          <span className="text-[10px] px-1.5 rounded bg-lime-400 text-zinc-950 font-extrabold">
                            YOU
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-zinc-400">Level {entry.level} · {entry.animeRank}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white font-mono">{entry.scoreLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: FRIENDS & COMPANIONS */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="max-w-md">
            <Input
              placeholder="Search fitness companions by @username or name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              className="w-full"
            />
          </div>

          {/* Pending Friend Requests */}
          {pendingReceived.length > 0 && (
            <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Pending Requests ({pendingReceived.length})
              </h3>
              <div className="divide-y divide-zinc-800">
                {pendingReceived.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarBadge avatarId={req.avatarId} rank={req.rank} level={req.level} size="sm" />
                      <div>
                        <h4 className="text-sm font-bold text-white">@{req.username}</h4>
                        <span className="text-xs text-zinc-400">{req.displayName} · Level {req.level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(req.id, req.username)}
                        icon={<Check size={14} />}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeclineRequest(req.id)}
                        icon={<X size={14} />}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Community Directory */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {searchQuery ? 'Search Results' : `Your Companions & Directory (${usersList.length})`}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usersList.map((user) => (
                <Card key={user.id} className="p-4 sm:p-5 border-zinc-800 bg-zinc-900 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatarId={user.avatarId} rank={user.rank} level={user.level} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-white">@{user.username}</h4>
                      <p className="text-xs text-zinc-400">{user.displayName}</p>
                      <span className="text-[11px] text-zinc-500 font-mono mt-0.5 block">
                        Lvl {user.level} · {user.rank} · {user.currentStreak}d streak
                      </span>
                    </div>
                  </div>

                  <div>
                    {user.isFriend ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFriend(user.id, user.username)}
                        className="text-zinc-500 hover:text-red-400 text-xs"
                      >
                        Connected
                      </Button>
                    ) : user.friendshipStatus === 'pending_sent' ? (
                      <span className="text-xs font-medium text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                        Pending
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendRequest(user.id, user.username)}
                        icon={<UserPlus size={14} />}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Social Privacy Settings"
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Control what other fitness community members can see on your public card and leaderboards.
          </p>

          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div>
              <label className="text-zinc-300 font-semibold block mb-1">Profile Visibility</label>
              <select
                value={privacySettings.profileVisibility}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value as any })
                }
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
              >
                <option value="public">Public (Visible to all community members)</option>
                <option value="friends">Friends Only (Visible only to accepted companions)</option>
                <option value="private">Private (Hidden from searches)</option>
              </select>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <span>Show my profile on Community Leaderboards</span>
              <input
                type="checkbox"
                checked={privacySettings.showOnLeaderboards}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, showOnLeaderboards: e.target.checked })
                }
                className="accent-lime-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <span>Allow incoming Friend Requests</span>
              <input
                type="checkbox"
                checked={privacySettings.allowFriendRequests}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, allowFriendRequests: e.target.checked })
                }
                className="accent-lime-400"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <span>Share completed workouts to the Social Activity Feed</span>
              <input
                type="checkbox"
                checked={privacySettings.shareWorkoutActivity}
                onChange={(e) =>
                  setPrivacySettings({ ...privacySettings, shareWorkoutActivity: e.target.checked })
                }
                className="accent-lime-400"
              />
            </label>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPrivacyModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePrivacy}>
              Save Privacy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
