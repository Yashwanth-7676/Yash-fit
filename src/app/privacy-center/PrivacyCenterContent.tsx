'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Key,
  AlertTriangle,
  Clock,
  Smartphone,
  Laptop,
  Database,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  getDataCategoriesAudit,
  getSecurityOverview,
  terminateActiveSession,
  getPrivacyPreferences,
  savePrivacyPreferences,
  buildFullDataExport,
  triggerFileDownload,
  executeAccountPurge,
  recordSecurityEvent,
} from '@/lib/privacy-center/privacyCenterService'
import type {
  DataCategoryAudit,
  PrivacyPreferences,
  SecurityOverview,
} from '@/types/privacyCenter'

export function PrivacyCenterContent() {
  const toast = useToast()

  // State
  const [categories, setCategories] = useState<DataCategoryAudit[]>([])
  const [security, setSecurity] = useState<SecurityOverview | null>(null)
  const [preferences, setPreferences] = useState<PrivacyPreferences>(getPrivacyPreferences())
  const [activeTab, setActiveTab] = useState<'audit' | 'security' | 'privacy' | 'export'>('audit')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    setCategories(getDataCategoriesAudit())
    setSecurity(getSecurityOverview())
    setPreferences(getPrivacyPreferences())
  }, [])

  // Toggle privacy control
  const handleTogglePref = (key: keyof PrivacyPreferences) => {
    if (typeof preferences[key] === 'boolean') {
      const updated = {
        ...preferences,
        [key]: !preferences[key],
      }
      setPreferences(updated)
      savePrivacyPreferences(updated)
      recordSecurityEvent('permission_change', `Updated privacy preference: ${key}`)
      toast.info('Privacy Setting Updated', `${key} preference saved.`)
    }
  }

  // Handle visibility dropdown
  const handleVisibilityChange = (val: 'public' | 'friends_only' | 'private') => {
    const updated = { ...preferences, profileVisibility: val }
    setPreferences(updated)
    savePrivacyPreferences(updated)
    recordSecurityEvent('permission_change', `Changed profile visibility to ${val}`)
    toast.info('Visibility Updated', `Profile is now ${val.replace('_', ' ')}.`)
  }

  // Terminate session
  const handleTerminateSession = (sessionId: string) => {
    const updatedSessions = terminateActiveSession(sessionId)
    if (security) {
      setSecurity({ ...security, activeSessions: updatedSessions })
    }
    toast.success('Session Terminated', 'Remote device was logged out.')
  }

  // Export JSON Archive
  const handleExportJson = () => {
    setIsExporting(true)
    try {
      const data = buildFullDataExport()
      const jsonStr = JSON.stringify(data, null, 2)
      triggerFileDownload(
        jsonStr,
        `yashfit-personal-data-export-${new Date().toISOString().slice(0, 10)}.json`,
        'application/json'
      )
      toast.success('Archive Downloaded', 'Full JSON data portability package exported.')
    } catch {
      toast.error('Export Failed', 'Could not generate data archive.')
    } finally {
      setIsExporting(false)
    }
  }

  // Account Purge (Danger Zone)
  const handleConfirmAccountDeletion = () => {
    if (deleteConfirmationInput !== 'DELETE MY ACCOUNT') {
      toast.error('Confirmation Mismatch', 'Type DELETE MY ACCOUNT exactly to proceed.')
      return
    }

    executeAccountPurge()
    setIsDeleteModalOpen(false)
    toast.success('Data Purged', 'All local records and profile credentials have been permanently erased.')

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }, 1500)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Privacy & Security Command Center
                <Badge variant="accent" className="text-xs font-semibold">
                  GDPR ART. 20
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Data inventory audits, full portability export, active session revocation & consent control
              </p>
            </div>
          </div>
        </div>

        {/* Global Export Action */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportJson}
            disabled={isExporting}
            icon={<Download className="w-4 h-4" />}
          >
            Export Archive (JSON)
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        {[
          { id: 'audit', label: 'Personal Data Inventory', icon: Database },
          { id: 'security', label: 'Security & Active Sessions', icon: Key },
          { id: 'privacy', label: 'Consent & Sharing Controls', icon: Lock },
          { id: 'export', label: 'Portability & Deletion', icon: Download },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? 'bg-lime-400 text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: PERSONAL DATA AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-lime-400" />
              Transparent Data Inventory Audit
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
              YashFit operates under a transparent privacy model. The table below discloses every data domain stored by the platform, its operational necessity, and the data retention window.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.key} className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-white block">{cat.name}</span>
                  <Badge variant={cat.isSensitive ? 'warning' : 'default'} className="text-[10px]">
                    {cat.isSensitive ? 'SENSITIVE' : 'TELEMETRY'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-400">
                  <p className="leading-relaxed">{cat.purpose}</p>
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Record Count:</span>
                    <span className="text-lime-400 font-bold">{cat.recordsCount} entries</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Retention:</span>
                    <span className="text-zinc-300">{cat.retentionPeriod}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & ACTIVE SESSIONS */}
      {activeTab === 'security' && security && (
        <div className="space-y-6">
          {/* Security Score Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">Security Posture Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-lime-400">{security.securityScore}</span>
                <span className="text-xs text-zinc-500 font-mono">/ 100</span>
              </div>
              <span className="text-[11px] text-zinc-500 block pt-1">
                Password updated {security.passwordAgeDays} days ago
              </span>
            </Card>

            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">Two-Factor Authentication</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white">
                  {security.twoFactorEnabled ? 'Enabled' : 'Standard Auth'}
                </span>
              </div>
              <Badge variant={security.twoFactorEnabled ? 'success' : 'default'} className="text-[10px] mt-1">
                {security.twoFactorEnabled ? 'TOTP ACTIVE' : 'PASSWORD PROTECTED'}
              </Badge>
            </Card>

            <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">Active Authorized Sessions</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-sky-400">{security.activeSessions.length}</span>
                <span className="text-xs text-zinc-500 font-mono">devices</span>
              </div>
              <span className="text-[11px] text-zinc-500 block pt-1">Monitored for concurrent logins</span>
            </Card>
          </div>

          {/* Active Sessions Manager */}
          <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-lime-400" />
                Active Logged-In Sessions
              </h3>
              <span className="text-xs text-zinc-500 font-mono">
                {security.activeSessions.length} devices connected
              </span>
            </div>

            <div className="space-y-3">
              {security.activeSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 text-zinc-400">
                      {sess.device.includes('iPhone') || sess.device.includes('Android') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{sess.device}</span>
                        {sess.isCurrent && (
                          <Badge variant="success" className="text-[9px]">
                            CURRENT SESSION
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {sess.browser} • {sess.location}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">{sess.lastActive}</span>
                    </div>
                  </div>

                  {!sess.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTerminateSession(sess.id)}
                      className="text-xs text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                    >
                      Log Out
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Security Event Log */}
          <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-400" />
              Security Audit Event Log
            </h3>

            <div className="space-y-2">
              {security.recentSecurityEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="text-white font-medium block">{ev.description}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(ev.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Badge variant={ev.severity === 'warning' ? 'warning' : 'default'} className="text-[10px]">
                    {ev.eventType.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PRIVACY & SHARING CONTROLS */}
      {activeTab === 'privacy' && (
        <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-lime-400" />
              Granular Privacy & Data Sharing Preferences
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure your visibility across global leaderboards, community feeds, and coaching integrations.
            </p>
          </div>

          <div className="space-y-4">
            {/* Profile Visibility */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-sm font-semibold text-white block">Profile Visibility</span>
                <span className="text-xs text-zinc-400">
                  Controls who can see your avatar, fitness level, and quest completion badges.
                </span>
              </div>
              <select
                value={preferences.profileVisibility}
                onChange={(e) =>
                  handleVisibilityChange(e.target.value as 'public' | 'friends_only' | 'private')
                }
                className="h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-lime-400"
              >
                <option value="public">Public (Visible to Community)</option>
                <option value="friends_only">Friends Only</option>
                <option value="private">Strictly Private (Hidden)</option>
              </select>
            </div>

            {/* Toggle Items */}
            {[
              {
                key: 'shareWorkoutActivity',
                title: 'Broadcast Workout Achievements to Feed',
                desc: 'Automatically publishes completed personal records and streak badges to your friends.',
              },
              {
                key: 'anonymousInLeaderboards',
                title: 'Anonymous Global Leaderboard Mode',
                desc: 'Masks your display name with an anonymous handle (e.g. YashFit Athlete #409) in public Arena standings.',
              },
              {
                key: 'trainerAccessAllowed',
                title: 'Allow Certified Trainer Connections',
                desc: 'Permits coaches using YashFit Pro to send client invitations and review permitted workouts.',
              },
              {
                key: 'encryptProgressPhotos',
                title: 'Encrypt Transformation Photographs',
                desc: 'Restricts transformation photos to local device decryption. Strictly hidden from trainers and friends.',
              },
              {
                key: 'aiDataProcessingAllowed',
                title: 'Permit Autonomous AI Coach Synthesis',
                desc: 'Allows the server-side AI engine to analyze workout tonnage and recovery check-ins for Autopilot recommendations.',
              },
            ].map((item) => {
              const checked = preferences[item.key as keyof PrivacyPreferences] as boolean

              return (
                <div
                  key={item.key}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-sm font-semibold text-white block">{item.title}</span>
                    <span className="text-xs text-zinc-400 leading-relaxed">{item.desc}</span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePref(item.key as keyof PrivacyPreferences)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400" />
                  </label>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* TAB 4: PORTABILITY & DELETION */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Data Portability */}
          <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-lime-400" />
                GDPR Article 20 Full Data Portability Package
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                Download a complete, machine-readable JSON archive containing all your workout histories, body measurements, recovery ratings, meal scans, and security logs.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">Complete Telemetry Archive (.JSON)</span>
                <span className="text-[11px] text-zinc-500 font-mono">Format: Standard RFC 8259 JSON</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportJson}
                disabled={isExporting}
                icon={<Download className="w-4 h-4" />}
              >
                Download Archive
              </Button>
            </div>
          </Card>

          {/* Account Deletion (Danger Zone) */}
          <Card className="p-6 border-rose-900/40 bg-zinc-900 space-y-4">
            <div>
              <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Permanent Account Deletion (Danger Zone)
              </h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                Request permanent erasure of your account, biometric profiles, workout progression logs, and coach authorizations. This action is irreversible.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-rose-950 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-300 block">Purge All Account Records</span>
                <span className="text-[11px] text-zinc-500">
                  Instantly erases all local and authenticated database records.
                </span>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Permanent Account Deletion"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed space-y-1">
            <span className="font-bold block text-rose-400">Irreversible Action Notice:</span>
            <p>
              Deleting your account will permanently erase your lifetime strength records, Arena XP, meal scan logs, and coach associations.
            </p>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Type <span className="font-mono font-bold text-white">DELETE MY ACCOUNT</span> to confirm:
            </label>
            <Input
              type="text"
              placeholder="DELETE MY ACCOUNT"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirmationInput !== 'DELETE MY ACCOUNT'}
              onClick={handleConfirmAccountDeletion}
            >
              Permanently Purge Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

