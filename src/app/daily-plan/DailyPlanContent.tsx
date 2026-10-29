'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  Circle,
  Dumbbell,
  Utensils,
  Droplet,
  Moon,
  Sparkles,
  Settings,
  ArrowRight,
} from 'lucide-react'
import { Card, Badge, Button, Modal, useToast } from '@/components/ui'
import {
  buildDailyPlan,
  getReminderPreferences,
  saveReminderPreferences,
  toggleTaskCompletion,
} from '@/lib/daily-plan/dailyPlanService'
import type {
  DailyPlanSummary,
  DailyPlanTask,
  ReminderPreferences,
  TaskCategory,
} from '@/types/dailyPlan'

export function DailyPlanContent() {
  const toast = useToast()
  const [plan, setPlan] = useState<DailyPlanSummary | null>(null)
  const [filterCategory, setFilterCategory] = useState<TaskCategory | 'all'>('all')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPreferences>(getReminderPreferences())

  useEffect(() => {
    refreshPlan()
    setReminderPrefs(getReminderPreferences())
  }, [])

  const refreshPlan = () => {
    setPlan(buildDailyPlan(new Date()))
  }

  const handleToggleTask = (task: DailyPlanTask) => {
    if (!plan) return
    const isNowCompleted = toggleTaskCompletion(plan.date, task.id)
    refreshPlan()
    if (isNowCompleted) {
      toast.success('Task Completed! 🎉', `Checked off "${task.title}".`)
    } else {
      toast.info('Task Reopened', `"${task.title}" marked as pending.`)
    }
  }

  const handleSavePreferences = () => {
    saveReminderPreferences(reminderPrefs)
    setShowSettingsModal(false)
    toast.success('Preferences Saved', 'Reminder time slots and quiet hours have been updated.')
  }

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'workout':
        return <Dumbbell size={15} className="text-lime-400" />
      case 'nutrition':
        return <Utensils size={15} className="text-amber-400" />
      case 'hydration':
        return <Droplet size={15} className="text-sky-400" />
      case 'recovery':
        return <Moon size={15} className="text-indigo-400" />
      case 'quest':
        return <Sparkles size={15} className="text-purple-400" />
    }
  }

  if (!plan) {
    return (
      <div className="max-w-5xl mx-auto py-16 text-center text-sm text-zinc-400">
        Loading your daily plan...
      </div>
    )
  }

  const filteredTasks = filterCategory === 'all'
    ? plan.tasks
    : plan.tasks.filter((t) => t.category === filterCategory)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Fitness Life Autopilot</Badge>
            <span className="text-xs text-zinc-500 font-medium">Daily Synchronizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Today&apos;s Training &amp; Life Agenda</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            A morning-to-night plan synthesizing scheduled workouts, regional nutrition, hydration milestones, recovery requirements, and daily quests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettingsModal(true)}
            icon={<Settings size={14} />}
          >
            Reminders &amp; Quiet Hours
          </Button>
        </div>
      </div>

      {/* Today Banner with Progress & Goals */}
      <Card className="p-5 sm:p-6 border-lime-400/20 bg-gradient-to-r from-zinc-900 via-zinc-900 to-lime-950/20 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Calendar size={14} className="text-lime-400" />
              <span>{plan.dayOfWeek}, {new Date(plan.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">{plan.workoutTitle}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={plan.isRestDay ? 'default' : 'accent'}>
                {plan.isRestDay ? 'ACTIVE RECOVERY DAY' : 'TRAINING DAY'}
              </Badge>
              <Badge variant="info">
                {plan.readinessScore}/100 — {plan.readinessLabel}
              </Badge>
            </div>
          </div>

          {/* Adherence Rate */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
            <div className="text-right">
              <span className="text-xs text-zinc-400 block font-medium">Daily Adherence</span>
              <span className="text-2xl font-black text-lime-400 block">
                {plan.adherencePercentage}%
              </span>
              <span className="text-[11px] text-zinc-500 block">
                {plan.completedCount} of {plan.totalCount} completed
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
              <span className="text-xs font-bold text-white">{plan.completedCount}/{plan.totalCount}</span>
            </div>
          </div>
        </div>

        {/* Macro targets strip */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800 text-xs">
          <div className="rounded-xl bg-zinc-950/50 p-2.5 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[11px]">Caloric Target</span>
            <span className="font-bold text-white mt-0.5 block">{plan.dailyCalorieTarget} kcal</span>
          </div>
          <div className="rounded-xl bg-zinc-950/50 p-2.5 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[11px]">Protein Target</span>
            <span className="font-bold text-white mt-0.5 block">{plan.dailyProteinTargetGrams}g Protein</span>
          </div>
          <div className="rounded-xl bg-zinc-950/50 p-2.5 border border-zinc-800/80">
            <span className="text-zinc-500 block text-[11px]">Hydration Goal</span>
            <span className="font-bold text-white mt-0.5 block">{plan.dailyWaterTargetLiters} Liters</span>
          </div>
        </div>
      </Card>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800">
        {[
          { id: 'all', label: `All Tasks (${plan.tasks.length})` },
          { id: 'workout', label: 'Workout' },
          { id: 'nutrition', label: 'Nutrition' },
          { id: 'hydration', label: 'Hydration' },
          { id: 'recovery', label: 'Recovery' },
          { id: 'quest', label: 'Daily Quests' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilterCategory(btn.id as typeof filterCategory)}
            className={`px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-xl border ${
              filterCategory === btn.id
                ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Agenda Stream */}
      <div className="space-y-3.5">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`p-4 sm:p-5 border-zinc-800 bg-zinc-900 transition-all ${
              task.completed ? 'opacity-65 border-zinc-800/60 bg-zinc-950/40' : 'hover:border-zinc-700'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggleTask(task)}
                className="mt-0.5 text-zinc-500 hover:text-lime-400 transition-colors cursor-pointer shrink-0"
                aria-label={`Toggle ${task.title}`}
              >
                {task.completed ? (
                  <CheckCircle2 size={22} className="text-lime-400 fill-lime-400/20" />
                ) : (
                  <Circle size={22} />
                )}
              </button>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-zinc-800 shrink-0">
                      {getCategoryIcon(task.category)}
                    </span>
                    <span className="text-xs font-mono font-semibold text-zinc-400">
                      {task.suggestedTime}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {task.period}
                    </span>
                  </div>

                  {task.targetValue && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                      {task.targetValue}
                    </span>
                  )}
                </div>

                <h3
                  className={`text-sm font-bold ${
                    task.completed ? 'line-through text-zinc-400' : 'text-white'
                  }`}
                >
                  {task.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{task.detail}</p>

                {task.linkedRoute && (
                  <div className="pt-1.5">
                    <Link
                      href={task.linkedRoute}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-lime-400 hover:underline"
                    >
                      Open section <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card className="p-8 text-center text-xs text-zinc-500">
            No agenda items match this category filter.
          </Card>
        )}
      </div>

      {/* Reminder & Notification Preferences Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Autopilot Reminder & Quiet Hours Settings"
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            Configure automated daily time slots and enforce strict quiet hours so you are never disturbed during sleep.
          </p>

          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Quiet Hours Start</label>
                <input
                  type="time"
                  value={reminderPrefs.quietHoursStart}
                  onChange={(e) =>
                    setReminderPrefs({ ...reminderPrefs, quietHoursStart: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Quiet Hours End</label>
                <input
                  type="time"
                  value={reminderPrefs.quietHoursEnd}
                  onChange={(e) =>
                    setReminderPrefs({ ...reminderPrefs, quietHoursEnd: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Workout Reminder</label>
                <input
                  type="time"
                  value={reminderPrefs.workoutReminderTime}
                  onChange={(e) =>
                    setReminderPrefs({ ...reminderPrefs, workoutReminderTime: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>
              <div>
                <label className="text-zinc-300 font-semibold block mb-1">Meal Prep Reminder</label>
                <input
                  type="time"
                  value={reminderPrefs.mealReminderTime}
                  onChange={(e) =>
                    setReminderPrefs({ ...reminderPrefs, mealReminderTime: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
              <div>
                <span className="block font-medium text-zinc-200">Enforce Quiet Hours Filter</span>
                <span className="text-[11px] text-zinc-500 block">
                  Suppresses all notifications between {reminderPrefs.quietHoursStart} and {reminderPrefs.quietHoursEnd}
                </span>
              </div>
              <input
                type="checkbox"
                checked={reminderPrefs.quietHoursEnabled}
                onChange={(e) =>
                  setReminderPrefs({ ...reminderPrefs, quietHoursEnabled: e.target.checked })
                }
                className="accent-lime-400"
              />
            </label>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-zinc-400 block font-semibold">Background Notification Engine</span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                YashFit utilizes the standardized W3C Service Worker &amp; Push API for reliable background alerts when tabs are closed. No fake JavaScript interval timers are used.
              </p>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
