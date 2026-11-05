'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Sparkles,
  Star,
  Upload,
  Image as ImageIcon,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  UserCheck,
  LogOut,
  ExternalLink,
  Filter,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Input } from '@/components/ui'
import {
  submitFeedback,
  getUserFeedbackList,
  validateScreenshot,
} from '@/lib/feedback/feedbackService'
import {
  getTesterProfile,
  registerTester,
  leaveBetaProgram,
  validateInviteCode,
} from '@/lib/beta/betaService'
import { trackEvent } from '@/lib/analytics/betaAnalytics'
import type {
  UserFeedbackItem,
  FeedbackType,
  FeedbackCategory,
  FeedbackSeverity,
  BetaTesterProfile,
} from '@/types/betaFeedback'

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; label: string }> = [
  { value: 'workout_studio', label: 'Workout Studio & Kinematics' },
  { value: 'food_scanner', label: 'AI Food Vision & Meal Scanner' },
  { value: 'nutrition', label: 'Indian Nutrition & Meal Planner' },
  { value: 'recovery', label: 'Recovery & Readiness Scoring' },
  { value: 'ai_coach', label: 'AI Coach & Astra Companion' },
  { value: 'body_intelligence', label: 'Body Intelligence & Progress' },
  { value: 'arena', label: 'Global Fitness Arena' },
  { value: 'virtual_gym', label: '3D Virtual Gym' },
  { value: 'analytics', label: 'Predictive Analytics & Reports' },
  { value: 'ui_ux', label: 'UI / Design / Usability' },
  { value: 'performance', label: 'Speed & App Performance' },
  { value: 'other', label: 'General / Other' },
]

export function FeedbackContent() {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit')
  const [testerProfile, setTesterProfile] = useState<BetaTesterProfile | null>(null)
  const [inviteInput, setInviteInput] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<FeedbackCategory>('workout_studio')
  const [severity, setSeverity] = useState<FeedbackSeverity>('medium')
  const [rating, setRating] = useState<number>(5)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [screenshotName, setScreenshotName] = useState<string>('')
  const [screenshotError, setScreenshotError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Submissions history state
  const [submissions, setSubmissions] = useState<UserFeedbackItem[]>([])
  const [historyFilter, setHistoryFilter] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadTesterData()
    loadSubmissions()
    trackEvent('feature_accessed', 'feature_usage', { feature: 'feedback_center' })
  }, [])

  async function loadTesterData() {
    try {
      const profile = await getTesterProfile('demo-user')
      setTesterProfile(profile)
    } catch {
      // Fallback handled
    }
  }

  async function loadSubmissions() {
    try {
      const items = await getUserFeedbackList('demo-user')
      setSubmissions(items)
    } catch {
      // Fallback handled
    }
  }

  async function handleJoinBeta(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    if (!inviteInput.trim()) return

    setIsJoining(true)
    try {
      const res = await registerTester('demo-user', inviteInput.trim())
      if (res.success && res.tester) {
        setTesterProfile(res.tester)
        setInviteSuccess(`Welcome aboard! You are now an active ${res.tester.role.replace('_', ' ').toUpperCase()}.`)
        setInviteInput('')
        trackEvent('onboarding_completed', 'onboarding', { role: res.tester.role })
      } else {
        setInviteError(res.error || 'Invalid invitation code.')
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to join beta.')
    } finally {
      setIsJoining(false)
    }
  }

  async function handleLeaveBeta() {
    if (!confirm('Are you sure you want to leave the YashFit Beta Program? You can rejoin anytime with a valid invite code.')) {
      return
    }
    try {
      await leaveBetaProgram('demo-user')
      await loadTesterData()
    } catch {
      // Handle
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setScreenshotError('')
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateScreenshot(file)
    if (!validation.valid) {
      setScreenshotError(validation.error || 'Invalid image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string
      setScreenshotData(base64)
      setScreenshotName(file.name)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setIsSubmitting(true)

    try {
      await submitFeedback({
        userId: 'demo-user',
        userName: 'Yash (Demo)',
        userEmail: 'yash@example.com',
        type: feedbackType,
        title,
        description,
        category,
        severity,
        rating: feedbackType === 'rating' ? rating : undefined,
        screenshotUrl: screenshotData,
      })

      setSubmitSuccess(true)
      setTitle('')
      setDescription('')
      setScreenshotData(null)
      setScreenshotName('')
      await loadSubmissions()
      await loadTesterData()
      trackEvent('feedback_submitted', 'workflow', { type: feedbackType, category })
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (historyFilter === 'all') return true
    return s.status === historyFilter
  })

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold mb-2">
              <Sparkles size={14} />
              <span>Beta Feedback Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Community Feedback & Issue Tracker
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Direct telemetry from our athletes to the engineering team. Report bugs, suggest enhancements, and track progress.
            </p>
          </div>

          {/* Quick link to admin if tester has admin rights */}
          {testerProfile?.role === 'admin' && (
            <a
              href="/admin/feedback"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
            >
              <Shield size={14} />
              <span>Admin Dashboard →</span>
            </a>
          )}
        </div>

        {/* Beta Tester Membership Banner */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
          {testerProfile && testerProfile.status === 'active' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Registered Beta Tester</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-lime-400 text-zinc-950">
                      {testerProfile.role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Invite Code: <span className="font-mono text-zinc-300">{testerProfile.inviteCode || 'N/A'}</span> · Contributions Logged:{' '}
                    <span className="font-semibold text-lime-400">{submissions.length}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLeaveBeta}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <LogOut size={14} />
                <span>Leave Beta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                <Shield size={16} className="text-lime-400" />
                <span>Join the YashFit Exclusive Beta Program</span>
              </div>
              <p className="text-xs text-zinc-400">
                Enter your invite code (e.g. <span className="font-mono text-lime-400">YASH-BETA-2026</span>) to unlock direct developer triage, early feature drops, and VIP community badges.
              </p>
              <form onSubmit={handleJoinBeta} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md pt-1">
                <Input
                  placeholder="Enter invitation code"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="uppercase font-mono text-xs"
                />
                <Button type="submit" size="sm" loading={isJoining} className="shrink-0">
                  Join Beta
                </Button>
              </form>
              {inviteError && <p className="text-xs text-red-400 font-medium">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-emerald-400 font-medium">{inviteSuccess}</p>}
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'submit'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            <span>Submit Feedback</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Clock size={16} />
            <span>My Submissions</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
              {submissions.length}
            </span>
          </button>
        </div>

        {/* TAB 1: SUBMIT FEEDBACK */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
              {submitSuccess && (
                <div className="p-4 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-300 text-sm flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-lime-400 shrink-0" />
                  <div>
                    <p className="font-semibold">Feedback Submitted Successfully!</p>
                    <p className="text-xs text-zinc-400">
                      Our engineering team has received your ticket and added it to the resolution queue.
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle size={18} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* 1. Feedback Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Feedback Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { type: 'bug', label: 'Bug Report', icon: <Bug size={16} /> },
                      { type: 'feature_request', label: 'Feature Idea', icon: <Lightbulb size={16} /> },
                      { type: 'improvement', label: 'Improvement', icon: <Sparkles size={16} /> },
                      { type: 'rating', label: 'App Rating', icon: <Star size={16} /> },
                    ].map((item) => {
                      const isSelected = feedbackType === item.type
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setFeedbackType(item.type as FeedbackType)}
                          className={`p-3 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-lime-400 bg-lime-400/10 text-white'
                              : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          }`}
                        >
                          <span className={isSelected ? 'text-lime-400' : 'text-zinc-500'}>
                            {item.icon}
                          </span>
                          <span className="text-xs font-semibold">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Rating Selector if type is rating */}
                {feedbackType === 'rating' && (
                  <div className="space-y-2 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                    <label className="text-xs font-semibold text-zinc-300">
                      Overall Experience Rating
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-zinc-600 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">{rating} / 5 Stars</span>
                    </div>
                  </div>
                )}

                {/* 3. Affected Module & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Affected Module</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 transition-colors"
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Severity / Priority</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as FeedbackSeverity)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 transition-colors"
                    >
                      <option value="low">Low — Minor cosmetic or non-blocking</option>
                      <option value="medium">Medium — Standard priority</option>
                      <option value="high">High — Significant workflow impairment</option>
                      <option value="critical">Critical — Crash or total feature blockage</option>
                    </select>
                  </div>
                </div>

                {/* 4. Title Input */}
                <Input
                  label="Title / Summary"
                  placeholder="e.g. Squat rep counter flickers under low lighting"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />

                {/* 5. Description Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      Description & Reproduction Steps
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {description.length} / 3000
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder="Describe what occurred, what you expected to happen, and steps to reproduce..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors resize-none font-sans"
                  />
                </div>

                {/* 6. Screenshot Attachment */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300">
                    Screenshot Attachment (Optional, max 3 MB)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {screenshotData ? (
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Thumbnail */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={screenshotData}
                          alt="Screenshot preview"
                          className="w-12 h-12 object-cover rounded-lg border border-zinc-800"
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{screenshotName || 'Attached Screenshot'}</p>
                          <span className="text-[10px] text-lime-400 font-medium">Ready for upload</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotData(null)
                          setScreenshotName('')
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-zinc-800 rounded-xl hover:border-zinc-700 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        <Upload size={18} />
                      </div>
                      <span className="text-xs font-semibold text-zinc-300">Click to upload screenshot</span>
                      <span className="text-[10px] text-zinc-500">Supports PNG, JPEG, or WebP up to 3 MB</span>
                    </button>
                  )}
                  {screenshotError && (
                    <p className="text-xs text-red-400 font-medium">{screenshotError}</p>
                  )}
                </div>

                {/* 7. Submit Action */}
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={<Send size={16} />}
                  className="w-full sm:w-auto"
                >
                  Submit Ticket
                </Button>
              </form>
            </div>

            {/* Sidebar Guide */}
            <div className="lg:col-span-4 space-y-5">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-lime-400" />
                  Effective Bug Reporting
                </h3>
                <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong className="text-zinc-200">Device Details:</strong> Mention your browser and operating system if relevant.</li>
                  <li><strong className="text-zinc-200">Steps:</strong> Tell us what actions caused the glitch step by step.</li>
                  <li><strong className="text-zinc-200">Expectation:</strong> What should have happened vs what actually occurred?</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Release Intelligence</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Curious what was recently deployed? Check out the official YashFit release notes portal.
                </p>
                <a
                  href="/changelog"
                  className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:underline pt-1 font-semibold"
                >
                  <span>View Public Changelog</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY SUBMISSIONS */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-300">Filter Status:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: 'all', label: 'All Tickets' },
                  { key: 'submitted', label: 'Submitted' },
                  { key: 'under_review', label: 'Under Review' },
                  { key: 'in_progress', label: 'In Progress' },
                  { key: 'resolved', label: 'Resolved' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setHistoryFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      historyFilter === f.key
                        ? 'bg-lime-400 text-zinc-950 font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <MessageSquare size={32} className="mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-white">No feedback tickets found</p>
                <p className="text-xs text-zinc-500">
                  {historyFilter === 'all'
                    ? "You haven't submitted any feedback yet. Share your thoughts using the form above."
                    : `No tickets matching filter "${historyFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((item) => {
                  const statusColors: Record<string, string> = {
                    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    under_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    in_progress: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    declined: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                    duplicate: 'bg-zinc-800 text-zinc-400 border-zinc-700',
                  }

                  const severityColors: Record<string, string> = {
                    low: 'text-zinc-400',
                    medium: 'text-blue-400',
                    high: 'text-amber-400',
                    critical: 'text-red-400 font-bold',
                  }

                  return (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 transition-colors hover:border-zinc-700"
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
                          <span className={`text-[10px] uppercase font-semibold ${severityColors[item.severity]}`}>
                            {item.severity} severity
                          </span>
                        </div>

                        <span className="text-[11px] text-zinc-500">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>
                      </div>

                      {/* Screenshot thumbnail if present */}
                      {item.screenshotUrl && (
                        <div className="pt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.screenshotUrl}
                            alt="Submitted screenshot"
                            className="max-h-48 rounded-xl border border-zinc-800 object-contain bg-zinc-950"
                          />
                        </div>
                      )}

                      {/* Official Admin Response Callout */}
                      {item.adminResponse && (
                        <div className="mt-3 p-4 rounded-xl bg-lime-400/5 border border-lime-400/20 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-lime-400">
                            <Shield size={14} />
                            <span>Response from YashFit Engineering Team:</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {item.adminResponse}
                          </p>
                          {item.resolvedAt && (
                            <p className="text-[10px] text-zinc-500 pt-1">
                              Resolved on {new Date(item.resolvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
