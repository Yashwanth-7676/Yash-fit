'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  UserCheck,
  ShieldCheck,
  Lock,
  Dumbbell,
  Activity,
  Calendar,
  Send,
  Copy,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  getTrainerProfile,
  getTrainerClients,
  assignPlanToClient,
  addTrainerNote,
  getTrainerNotes,
  getClientCheckIns,
  sendTrainerFeedback,
  submitClientCheckIn,
  updateClientConsent,
  revokeTrainerAccess,
  DEMO_TRAINER_PROFILE,
} from '@/lib/trainer/trainerService'
import type {
  TrainerProfile,
  TrainerClientRelationship,
  TrainerNote,
  ClientCheckIn,
  ClientConsentScope,
} from '@/types/trainer'

export function TrainerContent() {
  const toast = useToast()

  // View state: 'trainer' or 'client'
  const [activeRole, setActiveRole] = useState<'trainer' | 'client'>('trainer')

  // Trainer data
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile>(DEMO_TRAINER_PROFILE)
  const [clients, setClients] = useState<TrainerClientRelationship[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('client-rohan')
  const [clientSearch, setClientSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all')

  // Selected client deep-dive
  const [trainerNotes, setTrainerNotes] = useState<TrainerNote[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [clientCheckins, setClientCheckins] = useState<ClientCheckIn[]>([])
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({})

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignRoutineName, setAssignRoutineName] = useState('Upper Body Push & Anterior Delts')
  const [assignRoutineId, setAssignRoutineId] = useState('routine-push-day')
  const [assignCalories, setAssignCalories] = useState('2400')
  const [assignProtein, setAssignProtein] = useState('160')

  // Client Portal Form State
  const [clientWeight, setClientWeight] = useState('76.5')
  const [clientEnergy, setClientEnergy] = useState('8')
  const [clientSoreness, setClientSoreness] = useState<'Low' | 'Moderate' | 'High'>('Moderate')
  const [clientComments, setClientComments] = useState('')

  // Load on mount
  useEffect(() => {
    setTrainerProfile(getTrainerProfile())
    const loadedClients = getTrainerClients()
    setClients(loadedClients)
    if (loadedClients.length > 0) {
      setSelectedClientId(loadedClients[0].clientId)
      setTrainerNotes(getTrainerNotes(loadedClients[0].clientId))
      setClientCheckins(getClientCheckIns(loadedClients[0].clientId))
    }
  }, [])

  // When selected client changes
  useEffect(() => {
    if (selectedClientId) {
      setTrainerNotes(getTrainerNotes(selectedClientId))
      setClientCheckins(getClientCheckIns(selectedClientId))
    }
  }, [selectedClientId])

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.clientId === selectedClientId) || clients[0] || null
  }, [clients, selectedClientId])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchName = c.clientName.toLowerCase().includes(clientSearch.toLowerCase())
      if (!matchName) return false
      if (statusFilter === 'all') return true
      return c.status === statusFilter
    })
  }, [clients, clientSearch, statusFilter])

  // Copy invite link
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(`https://yashfit.app/join-coach?code=${trainerProfile.inviteCode}`)
    toast.success('Invite Link Copied', `Code ${trainerProfile.inviteCode} copied to clipboard.`)
  }

  // Add Trainer Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim() || !selectedClientId) return

    const created = addTrainerNote(selectedClientId, newNoteText)
    setTrainerNotes([created, ...trainerNotes])
    setNewNoteText('')
    toast.success('Private Note Saved', 'Visible only to you as coach.')
  }

  // Send Feedback on a Check-In
  const handleSendFeedback = (checkInId: string) => {
    const text = feedbackDrafts[checkInId]
    if (!text || !text.trim()) return

    sendTrainerFeedback(checkInId, text)
    setClientCheckins(getClientCheckIns(selectedClientId))
    setFeedbackDrafts((prev) => ({ ...prev, [checkInId]: '' }))
    toast.success('Feedback Dispatched', 'Your feedback was sent to the client.')
  }

  // Assign Plan
  const handleAssignPlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId) return

    assignPlanToClient(selectedClientId, {
      clientId: selectedClientId,
      routineId: assignRoutineId,
      routineName: assignRoutineName,
      targetCalories: Number(assignCalories) || 2200,
      targetProtein: Number(assignProtein) || 140,
    })

    const updated = getTrainerClients()
    setClients(updated)
    setIsAssignModalOpen(false)
    toast.success('Plan Prescribed', `Assigned ${assignRoutineName} to ${selectedClient?.clientName}.`)
  }

  // Client submits check-in
  const handleClientSubmitCheckin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientComments.trim()) return

    const created = submitClientCheckIn({
      clientId: selectedClientId,
      clientName: selectedClient?.clientName || 'You',
      date: new Date().toISOString().slice(0, 10),
      weightKg: Number(clientWeight) || undefined,
      energyScore: Number(clientEnergy) || 8,
      soreness: clientSoreness,
      comments: clientComments,
    })

    setClientCheckins([created, ...clientCheckins])
    setClientComments('')
    toast.success('Check-In Submitted', 'Your progress update has been sent to Coach Yash.')
  }

  // Client toggles consent scope
  const handleConsentToggle = (scopeKey: keyof ClientConsentScope) => {
    if (!selectedClient) return
    const currentVal = selectedClient.consentScopes[scopeKey]
    updateClientConsent(selectedClient.clientId, { [scopeKey]: !currentVal })
    const updated = getTrainerClients()
    setClients(updated)
    toast.info('Privacy Scope Updated', `${scopeKey} sharing preference updated.`)
  }

  // Client revokes trainer access
  const handleRevokeTrainer = () => {
    if (!selectedClient) return
    revokeTrainerAccess(selectedClient.clientId)
    const updated = getTrainerClients()
    setClients(updated)
    toast.info('Access Revoked', 'Coach access to your records has been terminated.')
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Professional Trainer Workspace
                <Badge variant="accent" className="text-xs font-semibold">
                  PRO PORTAL
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Client roster management, program prescription, private notes & consent-governed check-ins
              </p>
            </div>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveRole('trainer')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeRole === 'trainer'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Trainer Dashboard</span>
          </button>
          <button
            onClick={() => setActiveRole('client')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeRole === 'client'
                ? 'bg-lime-400 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Client Consent Portal</span>
          </button>
        </div>
      </div>

      {activeRole === 'trainer' ? (
        /* TRAINER DASHBOARD VIEW */
        <div className="space-y-8">
          {/* Trainer Overview Card */}
          <Card className="p-6 border-zinc-800 bg-zinc-900 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{trainerProfile.fullName}</h2>
                  <Badge variant="success" className="text-[10px]">
                    ACCEPTING ATHLETES
                  </Badge>
                </div>
                <p className="text-xs text-lime-400 font-medium">{trainerProfile.specialization}</p>
                <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">{trainerProfile.bio}</p>
              </div>

              {/* Invite Code Box */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 shrink-0 space-y-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Client Invitation Code
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-extrabold text-lime-400">
                    {trainerProfile.inviteCode}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyInvite}
                    icon={<Copy className="w-3.5 h-3.5" />}
                    className="text-xs py-1 h-7"
                  >
                    Copy Link
                  </Button>
                </div>
                <span className="text-[10px] text-zinc-500 block">
                  Athletes use this code to link their accounts with explicit consent.
                </span>
              </div>
            </div>
          </Card>

          {/* Roster Left, Client Deep-Dive Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Client Roster (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-lime-400" />
                  Client Roster ({filteredClients.length})
                </h3>

                <div className="flex items-center gap-1 text-[11px]">
                  {(['all', 'active', 'pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded capitalize ${
                        statusFilter === st
                          ? 'bg-zinc-800 text-white font-bold'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="text"
                placeholder="Search athlete by name..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />

              <div className="space-y-2.5">
                {filteredClients.map((client) => {
                  const isSelected = client.clientId === selectedClientId

                  return (
                    <Card
                      key={client.id}
                      onClick={() => setSelectedClientId(client.clientId)}
                      className={`p-4 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-zinc-900 border-lime-400 shadow-sm shadow-lime-400/10'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{client.clientName}</span>
                            <Badge
                              variant={client.status === 'active' ? 'success' : 'warning'}
                              className="text-[9px] px-1.5 py-0"
                            >
                              {client.status.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-xs text-zinc-400 block mt-0.5">{client.primaryGoal}</span>
                          <span className="text-[11px] text-zinc-500 font-mono block mt-1">
                            Last Active: {client.lastActiveDate}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-lime-400 font-mono block">
                            {client.adherenceScorePct}%
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">adherence</span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Right: Selected Client Deep-Dive (8 Cols) */}
            {selectedClient && (
              <div className="lg:col-span-8 space-y-6">
                {/* Client Profile Banner */}
                <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500 font-mono">Client ID: {selectedClient.clientId}</span>
                        <Badge variant="accent" className="text-[10px]">
                          GOAL: {selectedClient.primaryGoal?.toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white">{selectedClient.clientName}</h3>
                      <p className="text-xs text-zinc-400">{selectedClient.clientEmail}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                        icon={<Dumbbell className="w-4 h-4" />}
                      >
                        Prescribe Plan
                      </Button>
                    </div>
                  </div>

                  {/* Active Prescribed Split & Targets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Assigned Workout Routine
                      </span>
                      <span className="text-sm font-bold text-white block truncate">
                        {selectedClient.assignedRoutineName || 'None prescribed yet'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                        Assigned Daily Nutrition Targets
                      </span>
                      <div className="flex items-baseline gap-3 text-xs font-mono">
                        <span className="text-lime-400 font-bold">
                          {selectedClient.targetCalories ?? 2200} kcal
                        </span>
                        <span>•</span>
                        <span className="text-sky-400 font-bold">
                          {selectedClient.targetProtein ?? 140}g Protein
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Consent Scopes Privacy Disclosure */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-lime-400" />
                      Client Privacy Scopes Granted:
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className={selectedClient.consentScopes.shareWorkouts ? 'text-lime-400' : 'text-zinc-600'}>
                        Workouts
                      </span>
                      <span>•</span>
                      <span className={selectedClient.consentScopes.shareNutrition ? 'text-lime-400' : 'text-zinc-600'}>
                        Nutrition
                      </span>
                      <span>•</span>
                      <span className={selectedClient.consentScopes.shareMeasurements ? 'text-lime-400' : 'text-zinc-600 line-through'}>
                        Measurements
                      </span>
                      <span>•</span>
                      <span className={selectedClient.consentScopes.shareTransformationPhotos ? 'text-lime-400' : 'text-zinc-600 line-through'}>
                        Photos
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Check-ins & Progress Updates */}
                <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-lime-400" />
                      Client Check-Ins & Training Logs
                    </h4>
                    <span className="text-xs text-zinc-500 font-mono">
                      {clientCheckins.length} recorded
                    </span>
                  </div>

                  {clientCheckins.length > 0 ? (
                    <div className="space-y-3">
                      {clientCheckins.map((checkin) => (
                        <div
                          key={checkin.id}
                          className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white font-mono">{checkin.date}</span>
                              {checkin.weightKg && (
                                <Badge variant="default" className="text-[10px]">
                                  {checkin.weightKg} kg
                                </Badge>
                              )}
                              <Badge
                                variant={checkin.soreness === 'Low' ? 'success' : checkin.soreness === 'Moderate' ? 'warning' : 'danger'}
                                className="text-[10px]"
                              >
                                {checkin.soreness} Soreness
                              </Badge>
                            </div>

                            <span className="text-[11px] text-zinc-400 font-mono">
                              Energy: {checkin.energyScore}/10
                            </span>
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                            &quot;{checkin.comments}&quot;
                          </p>

                          {/* Trainer Feedback Thread */}
                          {checkin.trainerFeedback ? (
                            <div className="p-3 rounded-lg bg-lime-400/5 border border-lime-400/20 text-xs text-lime-300 space-y-1">
                              <span className="font-bold text-[10px] uppercase tracking-wider block text-lime-400">
                                Your Feedback Sent
                              </span>
                              <p className="leading-relaxed">{checkin.trainerFeedback}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 pt-1">
                              <Input
                                type="text"
                                placeholder="Type coach feedback / directive..."
                                value={feedbackDrafts[checkin.id] || ''}
                                onChange={(e) =>
                                  setFeedbackDrafts({
                                    ...feedbackDrafts,
                                    [checkin.id]: e.target.value,
                                  })
                                }
                                className="text-xs h-8"
                              />
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSendFeedback(checkin.id)}
                                icon={<Send className="w-3.5 h-3.5" />}
                                className="text-xs h-8 px-3"
                              >
                                Send
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center rounded-xl bg-zinc-950/40 border border-zinc-800 text-xs text-zinc-500">
                      No check-ins logged by this client yet.
                    </div>
                  )}
                </Card>

                {/* Private Trainer Notes (Visible strictly to coach) */}
                <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        Private Trainer Notes
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Encrypted and strictly confidential. Never shown to the client.
                      </p>
                    </div>
                    <Badge variant="warning" className="text-[10px]">
                      CONFIDENTIAL
                    </Badge>
                  </div>

                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Add private technical note on client form, cues, or recovery limits..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="text-xs"
                    />
                    <Button variant="secondary" size="sm" type="submit" className="text-xs shrink-0">
                      Save Note
                    </Button>
                  </form>

                  {/* Notes List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                    {trainerNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          <span className="text-amber-400">COACH PRIVATE</span>
                        </div>
                        <p className="leading-relaxed">{note.noteText}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CLIENT PORTAL & CONSENT VIEW */
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6 border-zinc-800 bg-zinc-900 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="success" className="text-xs font-semibold">
                  CONNECTED COACH
                </Badge>
                <span className="text-xs text-zinc-500 font-mono">Active Program</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{trainerProfile.fullName}</h2>
              <p className="text-xs text-zinc-400 mt-1">{trainerProfile.specialization}</p>
            </div>

            {/* Prescribed Plan Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                  Assigned Workout Program
                </span>
                <span className="text-sm font-bold text-lime-400 block">
                  {selectedClient?.assignedRoutineName || 'Push Hypertrophy Focus (Chest & Delts)'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 uppercase tracking-wider block">
                  Prescribed Daily Targets
                </span>
                <span className="text-sm font-bold text-white block font-mono">
                  {selectedClient?.targetCalories || 2400} kcal • {selectedClient?.targetProtein || 160}g Protein
                </span>
              </div>
            </div>

            {/* Submit Weekly Check-in */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-lime-400" />
                Submit Progress Check-In to Coach
              </h3>

              <form onSubmit={handleClientSubmitCheckin} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Morning Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={clientWeight}
                      onChange={(e) => setClientWeight(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Energy (1-10)</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={clientEnergy}
                      onChange={(e) => setClientEnergy(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 block mb-1">Muscle Soreness</label>
                    <select
                      value={clientSoreness}
                      onChange={(e) =>
                        setClientSoreness(e.target.value as 'Low' | 'Moderate' | 'High')
                      }
                      className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-lime-400"
                    >
                      <option value="Low">Low</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Training Notes & Feedback for Coach</label>
                  <textarea
                    rows={3}
                    placeholder="How did this week's volume feel? Any joint fatigue or dietary constraints?"
                    value={clientComments}
                    onChange={(e) => setClientComments(e.target.value)}
                    className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div className="flex justify-end">
                  <Button variant="primary" size="sm" type="submit">
                    Send Check-In
                  </Button>
                </div>
              </form>
            </div>

            {/* Granular Privacy Consent Scopes */}
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-lime-400" />
                    Data Sharing Permissions & Consent
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Control exactly what telemetry your coach is permitted to inspect. Revocable at any time.
                  </p>
                </div>
              </div>

              {selectedClient && (
                <div className="space-y-2.5">
                  {[
                    { key: 'shareWorkouts', label: 'Workout Sessions & Tonnage Logs', desc: 'Allows trainer to review sets, reps, and volume progression.' },
                    { key: 'shareNutrition', label: 'Nutrition Adherence & Scanned Meals', desc: 'Allows trainer to inspect daily calorie and protein tracking.' },
                    { key: 'shareRecovery', label: 'Morning Recovery & Readiness Scores', desc: 'Allows trainer to see readiness ratings and sleep durations.' },
                    { key: 'shareMeasurements', label: 'Body Measurements (Chest, Waist, Weight)', desc: 'Kept private unless explicitly permitted.' },
                    { key: 'shareTransformationPhotos', label: 'Transformation Photos', desc: 'Strictly encrypted and hidden from coach by default.' },
                  ].map((scope) => {
                    const isAllowed = selectedClient.consentScopes[scope.key as keyof ClientConsentScope]

                    return (
                      <div
                        key={scope.key}
                        className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
                      >
                        <div>
                          <span className="text-xs font-semibold text-white block">{scope.label}</span>
                          <span className="text-[11px] text-zinc-400">{scope.desc}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={() => handleConsentToggle(scope.key as keyof ClientConsentScope)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400" />
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Revoke Access Button */}
              <div className="pt-4 flex justify-between items-center">
                <span className="text-xs text-zinc-500">
                  Terminating coach access instantly purges relationship authorizations.
                </span>
                <Button variant="destructive" size="sm" onClick={handleRevokeTrainer}>
                  Revoke Coach Access
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Prescribe Plan Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Prescribe Workout & Nutrition Program"
      >
        <form onSubmit={handleAssignPlan} className="space-y-4">
          <p className="text-xs text-zinc-400">
            Set custom program parameters for {selectedClient?.clientName}. The athlete will receive these prescriptions immediately.
          </p>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Prescribed Workout Routine</label>
            <select
              value={assignRoutineId}
              onChange={(e) => {
                setAssignRoutineId(e.target.value)
                const text = e.target.options[e.target.selectedIndex].text
                setAssignRoutineName(text)
              }}
              className="w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-white focus:outline-none focus:border-lime-400"
            >
              <option value="routine-push-day">Push Hypertrophy Focus (Chest & Delts)</option>
              <option value="routine-pull-day">Upper Pull & Posterior Chain</option>
              <option value="routine-legs-day">Quad & Glute Power Hypertrophy</option>
              <option value="routine-full-body">Full Body Athletic Recomp Split</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Daily Calories (kcal)</label>
              <Input
                type="number"
                value={assignCalories}
                onChange={(e) => setAssignCalories(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Daily Protein (g)</label>
              <Input
                type="number"
                value={assignProtein}
                onChange={(e) => setAssignProtein(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Prescribe to Client
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

