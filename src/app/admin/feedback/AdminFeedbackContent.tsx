'use client'

import { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  Bug,
  Lightbulb,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  Key,
  Trash2,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Input } from '@/components/ui'
import {
  getAllFeedbackForAdmin,
  updateFeedbackStatus,
  markAsDuplicate,
} from '@/lib/feedback/feedbackService'
import {
  isUserAdmin,
  getAdminInvitations,
  createAdminInvitation,
  revokeAdminInvitation,
  setDemoAdminMode,
  isDemoAdminModeEnabled,
} from '@/lib/beta/betaService'
import { getAnalyticsSummary } from '@/lib/analytics/betaAnalytics'
import type {
  UserFeedbackItem,
  FeedbackStatus,
  FeedbackMetrics,
  BetaInvitation,
  BetaRole,
  AnalyticsSummary,
} from '@/types/betaFeedback'

export function AdminFeedbackContent() {
  const [isAdmin, setIsAdmin] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'triage' | 'invites' | 'analytics'>('triage')

  // Feedback State
  const [feedbackItems, setFeedbackItems] = useState<UserFeedbackItem[]>([])
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<UserFeedbackItem | null>(null)

  // Edit Modal State
  const [modalStatus, setModalStatus] = useState<FeedbackStatus>('submitted')
  const [modalResponse, setModalResponse] = useState('')
  const [modalNotes, setModalNotes] = useState('')
  const [modalDuplicateOf, setModalDuplicateOf] = useState('')
  const [isSavingTicket, setIsSavingTicket] = useState(false)

  // Invitations State
  const [invitations, setInvitations] = useState<BetaInvitation[]>([])
  const [newInviteCode, setNewInviteCode] = useState('')
  const [newInviteRole, setNewInviteRole] = useState<BetaRole>('beta_tester')
  const [newInviteMaxUses, setNewInviteMaxUses] = useState(25)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)

  useEffect(() => {
    checkAdminStatus()
    loadAdminData()
  }, [])

  async function checkAdminStatus() {
    const admin = await isUserAdmin('demo-user')
    const override = isDemoAdminModeEnabled()
    setIsAdmin(admin || override)
  }

  async function loadAdminData() {
    try {
      const { items, metrics: m } = await getAllFeedbackForAdmin()
      setFeedbackItems(items)
      setMetrics(m)

      const invites = await getAdminInvitations()
      setInvitations(invites)

      const summary = await getAnalyticsSummary()
      setAnalytics(summary)
    } catch {
      // Fallback handled
    }
  }

  function handleOpenTicketModal(item: UserFeedbackItem) {
    setSelectedTicket(item)
    setModalStatus(item.status)
    setModalResponse(item.adminResponse || '')
    setModalNotes(item.adminNotes || '')
    setModalDuplicateOf(item.isDuplicateOf || '')
  }

  async function handleSaveTicketChanges(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket) return

    setIsSavingTicket(true)
    try {
      if (modalDuplicateOf && modalDuplicateOf !== selectedTicket.id) {
        await markAsDuplicate(selectedTicket.id, modalDuplicateOf)
      } else {
        await updateFeedbackStatus(
          selectedTicket.id,
          modalStatus,
          modalNotes,
          modalResponse
        )
      }

      await loadAdminData()
      setSelectedTicket(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update ticket.')
    } finally {
      setIsSavingTicket(false)
    }
  }

  async function handleCreateInvitation(e: React.FormEvent) {
    e.preventDefault()
    setIsCreatingInvite(true)
    try {
      await createAdminInvitation({
        code: newInviteCode || undefined,
        role: newInviteRole,
        maxUses: Number(newInviteMaxUses),
      })
      setNewInviteCode('')
      await loadAdminData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create invite.')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  async function handleRevokeInvitation(id: string) {
    if (!confirm('Are you sure you want to deactivate this invitation code?')) return
    await revokeAdminInvitation(id)
    await loadAdminData()
  }

  const filteredTickets = feedbackItems.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    }
    return true
  })

  // If unauthorized and demo override is off
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Administrator Access Required</h1>
            <p className="text-sm text-zinc-400">
              This dashboard is restricted to authorized YashFit administrators and engineering leads.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-3">
            <p>Evaluating this module in demonstration mode?</p>
            <Button
              onClick={() => {
                setDemoAdminMode(true)
                setIsAdmin(true)
                loadAdminData()
              }}
              variant="outline"
              size="sm"
            >
              Enable Demo Admin Mode
            </Button>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <ShieldCheck size={14} />
              <span>Engineering HQ</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Admin Feedback & Operations Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Review incoming athlete telemetry, resolve tickets, publish release notes, and provision beta invitations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              <span>Admin Session Active</span>
            </span>
          </div>
        </div>

        {/* KPI Metrics Strip */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{metrics.totalCount}</p>
              <p className="text-[11px] text-zinc-500">Across all categories</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Open Bugs</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-red-400">{metrics.openBugsCount}</p>
              <p className="text-[11px] text-zinc-500">Requiring engineer triage</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Resolved</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{metrics.resolvedCount}</p>
              <p className="text-[11px] text-zinc-500">Fixed & verified in releases</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Feature Ideas</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">{metrics.featureRequestsCount}</p>
              <p className="text-[11px] text-zinc-500">Athlete improvement proposals</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Avg Rating</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">{metrics.averageRating} ★</p>
              <p className="text-[11px] text-zinc-500">Out of 5.0 satisfaction</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('triage')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'triage'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Bug size={16} />
            <span>Feedback Triage</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
              {feedbackItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invites')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'invites'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Key size={16} />
            <span>Beta Invitations</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
              {invitations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            <span>Product Telemetry</span>
          </button>
        </div>

        {/* TAB 1: FEEDBACK TRIAGE */}
        {activeTab === 'triage' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search feedback by keyword or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-400"
                  >
                    <option value="all">All Statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-400"
                  >
                    <option value="all">All Types</option>
                    <option value="bug">Bugs</option>
                    <option value="feature_request">Feature Requests</option>
                    <option value="improvement">Improvements</option>
                    <option value="rating">Ratings</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets Table / List */}
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <p className="text-sm font-semibold text-white">No tickets match criteria</p>
                <p className="text-xs text-zinc-500 mt-1">Try relaxing your search query or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((item) => {
                  const statusColors: Record<string, string> = {
                    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    declined: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                    duplicate: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                  }

                  const severityBadge: Record<string, string> = {
                    low: 'text-zinc-400',
                    medium: 'text-blue-400',
                    high: 'text-amber-400 font-semibold',
                    critical: 'text-red-400 font-bold',
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 transition-colors hover:border-zinc-700"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              statusColors[item.status] || 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-950 text-zinc-400 border border-zinc-800">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] uppercase ${severityBadge[item.severity]}`}>
                            {item.severity} severity
                          </span>
                          <span className="text-xs text-zinc-400">· Submitter: <strong className="text-white">{item.userName || item.userId}</strong></span>
                        </div>

                        <span className="text-[11px] text-zinc-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-zinc-300 line-clamp-3">{item.description}</p>
                      </div>

                      {/* Attached Screenshot thumbnail if present */}
                      {item.screenshotUrl && (
                        <div className="pt-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.screenshotUrl}
                            alt="Screenshot"
                            className="max-h-32 rounded-lg border border-zinc-800 object-contain bg-zinc-950"
                          />
                        </div>
                      )}

                      {/* Admin Response & Internal Note preview */}
                      {(item.adminResponse || item.adminNotes) && (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5 text-xs">
                          {item.adminResponse && (
                            <p className="text-lime-300">
                              <strong className="text-lime-400">Public Response:</strong> {item.adminResponse}
                            </p>
                          )}
                          {item.adminNotes && (
                            <p className="text-zinc-400 font-mono text-[11px]">
                              <strong className="text-zinc-300">Internal Team Note:</strong> {item.adminNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex items-center justify-end pt-2 border-t border-zinc-800/60">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenTicketModal(item)}
                          icon={<ChevronRight size={14} />}
                          iconPosition="right"
                        >
                          Triage & Respond
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BETA INVITATIONS */}
        {activeTab === 'invites' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Invite Form */}
            <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus size={18} className="text-lime-400" />
                  Generate Beta Invitation
                </h3>
                <p className="text-xs text-zinc-400">
                  Create new redemption codes for alpha athletes, VIP gym coaches, or staff admins.
                </p>
              </div>

              <form onSubmit={handleCreateInvitation} className="space-y-4">
                <Input
                  label="Custom Code (Optional, leave blank to auto-generate)"
                  placeholder="e.g. VIP-YASH-2027"
                  value={newInviteCode}
                  onChange={(e) => setNewInviteCode(e.target.value)}
                  className="uppercase font-mono text-xs"
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Tester Role</label>
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value as BetaRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400"
                  >
                    <option value="beta_tester">Standard Beta Tester</option>
                    <option value="vip_tester">VIP Tester (Priority Triage)</option>
                    <option value="admin">Administrator (Full Dashboard Access)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Maximum Allowed Uses</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newInviteMaxUses}
                    onChange={(e) => setNewInviteMaxUses(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400"
                  />
                </div>

                <Button type="submit" loading={isCreatingInvite} className="w-full">
                  Create Invitation Code
                </Button>
              </form>
            </div>

            {/* Invitations Table */}
            <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-lime-400" />
                Active Beta Invitations
              </h3>

              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-lime-400">{inv.code}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300">
                          {inv.role.replace('_', ' ')}
                        </span>
                        {!inv.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-950 text-red-400 border border-red-900">
                            Revoked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        Uses: <strong className="text-white">{inv.usedCount}</strong> / {inv.maxUses}
                        {inv.expiresAt && ` · Expires ${new Date(inv.expiresAt).toLocaleDateString()}`}
                      </p>
                    </div>

                    {inv.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeInvitation(inv.id)}
                        className="text-zinc-500 hover:text-red-400 shrink-0"
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCT TELEMETRY */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Privacy-Conscious Operational Telemetry
                </h3>
                <p className="text-xs text-zinc-400">
                  Strictly measures onboarding funnels, module engagement, and client error rates with zero PII.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                GDPR Compliant
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Onboarding Funnel Completion
                </p>
                <p className="text-3xl font-extrabold text-lime-400">{analytics.onboardingCompletionRate}%</p>
                <p className="text-xs text-zinc-500">From start to personalized dashboard</p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Completed Workflows
                </p>
                <p className="text-3xl font-extrabold text-white">{analytics.completedWorkflowsCount}</p>
                <p className="text-xs text-zinc-500">Workouts, meal scans, recovery check-ins</p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Mean Client Render Time
                </p>
                <p className="text-3xl font-extrabold text-emerald-400">{analytics.avgClientRenderTimeMs} ms</p>
                <p className="text-xs text-zinc-500">60-120 FPS high performance target</p>
              </div>
            </div>

            {/* Top Features Chart */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Top Active Modules by Athlete Engagement
              </h4>
              <div className="space-y-3">
                {analytics.topFeaturesUsed.map((feat) => {
                  const maxCount = Math.max(...analytics.topFeaturesUsed.map((f) => f.count), 1)
                  const percent = Math.round((feat.count / maxCount) * 100)
                  return (
                    <div key={feat.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-200">{feat.feature}</span>
                        <span className="text-zinc-400 font-mono">{feat.count} sessions</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-lime-400 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Triage Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">
                    Ticket #{selectedTicket.id.slice(-6)}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selectedTicket.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-zinc-500 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.description}
              </div>

              <form onSubmit={handleSaveTicketChanges} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Update Ticket Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as FeedbackStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="declined">Declined</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Official Response to Submitter (Visible to Athlete)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Thank you for reporting! This has been patched in release v2.4.1."
                    value={modalResponse}
                    onChange={(e) => setModalResponse(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Private Engineering Notes (Internal Staff Only)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Reproducible on Chromium WebGL worker thread. See PR #114."
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 resize-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Consolidate as Duplicate (Optional Ticket ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. fb-seed-01"
                    value={modalDuplicateOf}
                    onChange={(e) => setModalDuplicateOf(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setSelectedTicket(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isSavingTicket}>
                    Save Ticket Resolution
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

