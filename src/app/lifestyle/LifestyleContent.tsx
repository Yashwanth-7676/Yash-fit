'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  CheckCircle2,
  Circle,
  Sparkles,
  Droplets,
  Dumbbell,
  Utensils,
  Moon,
  HeartPulse,
  Briefcase,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  buildDailyLifestyleSchedule,
  getSavedLifestyleSchedule,
  saveLifestyleSchedule,
  toggleLifestyleSlotCompletion,
  applyProposalDecision,
  DEFAULT_USER_CONSTRAINTS,
  LOCAL_STORAGE_CONSTRAINTS_KEY,
} from '@/lib/lifestyle/lifestyleService'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import type { CoachUserContext } from '@/lib/ai/providers'
import type {
  DailyLifestyleSchedule,
  TimeSlotCategory,
  UserTimeConstraint,
} from '@/types/lifestyle'

const CATEGORY_ICONS: Record<TimeSlotCategory, React.ElementType> = {
  workout: Dumbbell,
  nutrition: Utensils,
  hydration: Droplets,
  sleep: Moon,
  recovery: HeartPulse,
  work_commitment: Briefcase,
  mindfulness: HeartPulse,
}

const CATEGORY_COLORS: Record<TimeSlotCategory, string> = {
  workout: 'text-lime-400 bg-lime-400/10 border-lime-400/20',
  nutrition: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  hydration: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
  sleep: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  recovery: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  work_commitment: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  mindfulness: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
}

export function LifestyleContent() {
  const toast = useToast()

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [schedule, setSchedule] = useState<DailyLifestyleSchedule | null>(null)
  const [constraints, setConstraints] = useState<UserTimeConstraint>(DEFAULT_USER_CONSTRAINTS)
  const [activeCategory, setActiveCategory] = useState<TimeSlotCategory | 'all'>('all')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempConstraints, setTempConstraints] = useState<UserTimeConstraint>(DEFAULT_USER_CONSTRAINTS)
  const [coachContext, setCoachContext] = useState<CoachUserContext | null>(null)

  // Load context and schedule
  useEffect(() => {
    async function init() {
      const ctx = await buildCoachContext('current-user')
      const userCtx: CoachUserContext = {
        profile: ctx.profile,
        workouts: ctx.workouts,
        recovery: ctx.recovery,
        nutritionPlan: ctx.nutritionPlan || undefined,
        waterLoggedLiters: ctx.waterLoggedLiters,
        waterTargetLiters: ctx.waterTargetLiters,
        activeStreak: ctx.activeStreak,
        rpgLevel: ctx.rpgLevel,
        rpgRank: ctx.rpgRank,
      }
      setCoachContext(userCtx)

      // Load saved constraints
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_CONSTRAINTS_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setConstraints(parsed)
          setTempConstraints(parsed)
        }
      } catch {
        // fallback
      }

      const loadedSchedule = getSavedLifestyleSchedule(selectedDate, userCtx)
      setSchedule(loadedSchedule)
    }

    init()
  }, [selectedDate])

  const handleToggleCompletion = (slotId: string) => {
    if (!schedule) return
    const updated = toggleLifestyleSlotCompletion(schedule, slotId)
    setSchedule(updated)
  }

  const handleProposalAction = (proposalId: string, decision: 'accepted' | 'dismissed') => {
    if (!schedule) return
    const updated = applyProposalDecision(schedule, proposalId, decision)
    setSchedule(updated)

    if (decision === 'accepted') {
      toast.success(
        'Proposal Accepted',
        'Your schedule has been adapted based on physiological recovery.'
      )
    } else {
      toast.info('Proposal Dismissed', 'Schedule retained as originally planned.')
    }
  }

  const handleSaveConstraints = () => {
    setConstraints(tempConstraints)
    try {
      localStorage.setItem(LOCAL_STORAGE_CONSTRAINTS_KEY, JSON.stringify(tempConstraints))
    } catch {
      // fallback
    }

    if (coachContext) {
      const refreshed = buildDailyLifestyleSchedule(selectedDate, coachContext, tempConstraints)
      setSchedule(refreshed)
      saveLifestyleSchedule(refreshed)
    }

    setIsSettingsOpen(false)
    toast.success(
      'Time Constraints Updated',
      'Daily lifestyle timeline reorganized around your work and training windows.'
    )
  }

  const filteredSlots = useMemo(() => {
    if (!schedule) return []
    if (activeCategory === 'all') return schedule.timeSlots
    return schedule.timeSlots.filter((s) => s.category === activeCategory)
  }, [schedule, activeCategory])

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                AI Lifestyle Optimization
                <Badge variant="accent" className="text-xs font-semibold">
                  24H AUTOPILOT
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">
                Harmonizing workouts, nutrition courses, hydration checkpoints & circadian wind-down
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                selectedDate === todayStr ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Today
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs h-7 py-0 w-32 border-none bg-transparent focus:ring-0"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTempConstraints(constraints)
              setIsSettingsOpen(true)
            }}
            icon={<Settings className="w-4 h-4" />}
          >
            Preferences
          </Button>
        </div>
      </div>

      {schedule && (
        <>
          {/* Readiness & Adherence Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-1">Adherence Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-lime-400">{schedule.adherenceScorePct}%</span>
                <span className="text-xs text-zinc-500 font-mono">completed</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-lime-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${schedule.adherenceScorePct}%` }}
                />
              </div>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-1">Recovery Readiness</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {schedule.recoveryScore ?? 75}
                </span>
                <span className="text-xs text-zinc-500 font-mono">/ 100</span>
              </div>
              <Badge
                variant={(schedule.recoveryScore ?? 75) >= 70 ? 'success' : 'warning'}
                className="mt-2 text-[10px]"
              >
                {(schedule.recoveryScore ?? 75) >= 70 ? 'Peak Neurological State' : 'Fatigued • Modified'}
              </Badge>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-1">Target Hydration</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-sky-400">{schedule.targetWaterLiters}</span>
                <span className="text-xs text-zinc-500 font-mono">liters</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-2">Circadian fluid pacing</span>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <span className="text-xs text-zinc-400 block mb-1">Prescribed Sleep</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-400">
                  {schedule.targetSleepDurationHours}
                </span>
                <span className="text-xs text-zinc-500 font-mono">hours</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-2">Restorative non-REM goal</span>
            </Card>
          </div>

          {/* AI Autonomous Schedule Proposals */}
          {schedule.pendingProposals.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-lime-400" />
                Adaptive Schedule Proposals (User Approval Required)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schedule.pendingProposals.map((prop) => {
                  const isPending = prop.userDecision === 'pending'
                  const isAccepted = prop.userDecision === 'accepted'

                  return (
                    <Card
                      key={prop.id}
                      className="p-5 border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-900/60 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={isAccepted ? 'success' : isPending ? 'warning' : 'default'}>
                              {prop.userDecision.toUpperCase()}
                            </Badge>
                            <span className="text-xs font-semibold text-white">{prop.title}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{prop.rationale}</p>
                        </div>
                      </div>

                      {/* Evidence */}
                      <div className="mt-3 pt-3 border-t border-zinc-800/80">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                          Telemetry Triggered
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {prop.basedOnData.map((d, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-zinc-800 text-[11px] font-mono text-zinc-300"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Proposed Modification */}
                      <div className="mt-3 p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300">
                        {prop.proposedChanges.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                            <span>{c.title}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      {isPending && (
                        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-zinc-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleProposalAction(prop.id, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleProposalAction(prop.id, 'accepted')}
                          >
                            Accept Adaptation
                          </Button>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-lime-400 text-zinc-950 font-semibold'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              All Events ({schedule.timeSlots.length})
            </button>
            {(
              [
                'workout',
                'nutrition',
                'hydration',
                'sleep',
                'recovery',
                'work_commitment',
              ] as TimeSlotCategory[]
            ).map((cat) => {
              const count = schedule.timeSlots.filter((s) => s.category === cat).length
              if (count === 0) return null
              const active = activeCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors capitalize ${
                    active
                      ? 'bg-lime-400 text-zinc-950 font-semibold'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {cat.replace('_', ' ')} ({count})
                </button>
              )
            })}
          </div>

          {/* 24-Hour Timeline */}
          <div className="space-y-3">
            {filteredSlots.map((slot) => {
              const Icon = CATEGORY_ICONS[slot.category] || Clock
              const colorClass = CATEGORY_COLORS[slot.category] || 'text-zinc-400 bg-zinc-800'

              return (
                <Card
                  key={slot.id}
                  className={`p-4 transition-all duration-200 border ${
                    slot.isCompleted
                      ? 'bg-zinc-900/40 border-zinc-800/50 opacity-60'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Completion Checkbox Button */}
                    <button
                      onClick={() => handleToggleCompletion(slot.id)}
                      className="mt-1 text-zinc-500 hover:text-lime-400 transition-colors focus:outline-none shrink-0"
                      title={slot.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {slot.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-lime-400" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Time Pill */}
                    <div className="shrink-0 text-center w-14">
                      <span className="font-mono text-sm font-semibold text-white block">
                        {slot.time}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        {slot.durationMinutes}m
                      </span>
                    </div>

                    {/* Main Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colorClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          {slot.category.replace('_', ' ')}
                        </span>

                        {slot.isAiSuggested && (
                          <Badge variant="accent" className="text-[10px]">
                            AI ADAPTED
                          </Badge>
                        )}

                        {slot.adherencePriority === 'high' && (
                          <Badge variant="warning" className="text-[10px]">
                            HIGH PRIORITY
                          </Badge>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-semibold text-white ${
                          slot.isCompleted ? 'line-through text-zinc-400' : ''
                        }`}
                      >
                        {slot.title}
                      </h3>

                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{slot.description}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* AI Optimization Notes & Advice */}
          <Card className="p-5 border-zinc-800 bg-zinc-900 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" />
              Circadian Scheduling Logic & Guardrails
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {schedule.aiOptimizationNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-800 text-xs text-zinc-300 leading-relaxed"
                >
                  {note}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Constraints & Preferences Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Schedule Constraints & Preferences"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">
            Customize your work windows and preferred workout times. The lifestyle engine will automatically organize meal timing and hydration around your commitments.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Work Start Time</label>
              <Input
                type="time"
                value={tempConstraints.workStartTime}
                onChange={(e) =>
                  setTempConstraints({ ...tempConstraints, workStartTime: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Work End Time</label>
              <Input
                type="time"
                value={tempConstraints.workEndTime}
                onChange={(e) =>
                  setTempConstraints({ ...tempConstraints, workEndTime: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Preferred Workout Window</label>
            <div className="grid grid-cols-3 gap-2">
              {(['morning', 'afternoon', 'evening'] as const).map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() =>
                    setTempConstraints({ ...tempConstraints, preferredWorkoutTime: win })
                  }
                  className={`p-2.5 rounded-lg border text-xs font-medium capitalize text-center transition-colors ${
                    tempConstraints.preferredWorkoutTime === win
                      ? 'bg-lime-400/10 border-lime-400 text-lime-400'
                      : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveConstraints}>
              Save & Recalculate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
