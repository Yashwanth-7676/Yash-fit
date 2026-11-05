'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Rocket,
  Wrench,
  Bug,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Plus,
  ArrowLeft,
  ExternalLink,
  Shield,
  Tag,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button, Input } from '@/components/ui'
import {
  getPublishedReleaseNotes,
  publishReleaseNote,
} from '@/lib/changelog/changelogService'
import { isUserAdmin } from '@/lib/beta/betaService'
import { trackEvent } from '@/lib/analytics/betaAnalytics'
import type { ReleaseNoteItem, ReleaseNoteInput } from '@/types/betaFeedback'

export function ChangelogContent() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNoteItem[]>([])
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Publish Form State
  const [versionInput, setVersionInput] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [summaryInput, setSummaryInput] = useState('')
  const [featuresInput, setFeaturesInput] = useState('')
  const [improvementsInput, setImprovementsInput] = useState('')
  const [fixesInput, setFixesInput] = useState('')
  const [knownIssuesInput, setKnownIssuesInput] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    loadNotes()
    checkAdmin()
    trackEvent('feature_accessed', 'feature_usage', { feature: 'changelog' })
  }, [])

  async function checkAdmin() {
    const admin = await isUserAdmin('demo-user')
    setIsAdmin(admin)
  }

  async function loadNotes() {
    try {
      const notes = await getPublishedReleaseNotes()
      setReleaseNotes(notes)
    } catch {
      // Handled
    }
  }

  async function handlePublishRelease(e: React.FormEvent) {
    e.preventDefault()
    setIsPublishing(true)

    try {
      const parseLines = (text: string) =>
        text
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)

      const payload: ReleaseNoteInput = {
        version: versionInput.trim(),
        title: titleInput.trim(),
        releaseDate: new Date().toISOString().split('T')[0],
        summary: summaryInput.trim(),
        features: parseLines(featuresInput),
        improvements: parseLines(improvementsInput),
        bugFixes: parseLines(fixesInput),
        knownIssues: parseLines(knownIssuesInput),
      }

      await publishReleaseNote(payload)
      await loadNotes()
      setShowPublishModal(false)
      setVersionInput('')
      setTitleInput('')
      setSummaryInput('')
      setFeaturesInput('')
      setImprovementsInput('')
      setFixesInput('')
      setKnownIssuesInput('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish release note.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold mb-2">
              <Rocket size={14} />
              <span>Continuous Platform Evolution</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              YashFit Release Notes & Changelog
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Explore our chronological journey from initial architecture to advanced multi-system fitness intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
              Latest: <strong className="text-lime-400">{releaseNotes[0]?.version || 'v2.4.0'}</strong>
            </span>

            {isAdmin && (
              <Button
                size="sm"
                onClick={() => setShowPublishModal(true)}
                icon={<Plus size={16} />}
              >
                Publish Release
              </Button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'all', label: 'All Releases' },
            { key: 'features', label: '🚀 Major Features' },
            { key: 'improvements', label: '⚡ Performance & Polish' },
            { key: 'fixes', label: '🐛 Bug Fixes' },
          ].map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => setSelectedTag(tag.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === tag.key
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Timeline of Release Cards */}
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-zinc-800/60 hidden sm:block">
          {/* Timeline View for Desktop/Tablet */}
          {releaseNotes.map((release, idx) => (
            <div key={release.id} className="relative pl-12 space-y-3">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute left-3.5 top-5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 ${
                  idx === 0
                    ? 'bg-lime-400 border-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.5)]'
                    : 'bg-zinc-900 border-zinc-700'
                }`}
              />

              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 hover:border-zinc-700 transition-colors">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-extrabold text-lime-400">
                      {release.version}
                    </span>
                    <span className="text-sm font-bold text-white">{release.title}</span>
                    {idx === 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-lime-400 text-zinc-950">
                        Live / Latest
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                    <Calendar size={14} />
                    <span>
                      {new Date(release.releaseDate).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-zinc-300 leading-relaxed">{release.summary}</p>

                {/* Features */}
                {(selectedTag === 'all' || selectedTag === 'features') &&
                  release.features &&
                  release.features.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Rocket size={14} />
                        <span>New Features & Capabilities</span>
                      </h4>
                      <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-5 leading-relaxed">
                        {release.features.map((feat, i) => (
                          <li key={i}>{feat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Improvements */}
                {(selectedTag === 'all' || selectedTag === 'improvements') &&
                  release.improvements &&
                  release.improvements.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Wrench size={14} />
                        <span>Architectural Polish & Enhancements</span>
                      </h4>
                      <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-5 leading-relaxed">
                        {release.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Bug Fixes */}
                {(selectedTag === 'all' || selectedTag === 'fixes') &&
                  release.bugFixes &&
                  release.bugFixes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Bug size={14} />
                        <span>Resolved Glitches & Stability Fixes</span>
                      </h4>
                      <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-5 leading-relaxed">
                        {release.bugFixes.map((fix, i) => (
                          <li key={i}>{fix}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Known Issues */}
                {release.knownIssues && release.knownIssues.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 space-y-1">
                    <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-zinc-500" />
                      Known Observations Under Investigation:
                    </span>
                    <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                      {release.knownIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View: Stacked Cards */}
        <div className="space-y-4 sm:hidden">
          {releaseNotes.map((release, idx) => (
            <div
              key={release.id}
              className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-lime-400">{release.version}</span>
                <span className="text-[11px] text-zinc-500">{release.releaseDate}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{release.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{release.summary}</p>
            </div>
          ))}
        </div>

        {/* Admin Publish Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Rocket size={18} className="text-lime-400" />
                  Publish Release Note Update
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePublishRelease} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Version Tag"
                    placeholder="e.g. v2.4.1"
                    value={versionInput}
                    onChange={(e) => setVersionInput(e.target.value)}
                    required
                  />
                  <Input
                    label="Release Title"
                    placeholder="e.g. Biomechanical Pose Filtering Update"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Executive Summary</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Brief description of this release..."
                    value={summaryInput}
                    onChange={(e) => setSummaryInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 resize-none font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    New Features (One item per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Added dark-first feedback center&#10;Integrated screenshot attachment preview"
                    value={featuresInput}
                    onChange={(e) => setFeaturesInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Improvements & Bug Fixes (One item per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Fixed low-light camera joint flickering&#10;Optimized server response headers"
                    value={fixesInput}
                    onChange={(e) => setFixesInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setShowPublishModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={isPublishing}>
                    Publish to Changelog
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

