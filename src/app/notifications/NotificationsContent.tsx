'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Bell,
  Dumbbell,
  Droplet,
  Heart,
  Award,
  Sparkles,
  Settings,
  CheckCheck,
  Trash2,
  Moon,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react'
import {
  getSmartNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
  isWithinQuietHours,
} from '@/lib/notifications/notificationService'
import type {
  SmartNotification,
  SmartNotificationCategory,
  NotificationPreferences,
} from '@/types/notifications'
import { Card, Badge, Button, Modal, Toggle, Select, EmptyState, useToast } from '@/components/ui'

export function NotificationsContent() {
  const toast = useToast()
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [selectedFilter, setSelectedFilter] = useState<SmartNotificationCategory | 'all'>('all')
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences())

  const reload = () => {
    setNotifications(getSmartNotifications())
    setPreferences(getNotificationPreferences())
  }

  useEffect(() => {
    reload()
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') return notifications
    return notifications.filter((n) => n.category === selectedFilter)
  }, [notifications, selectedFilter])

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead()
    reload()
    toast.success('Marked all as read')
  }

  const handleClearAll = () => {
    clearAllNotifications()
    reload()
    toast.info('Cleared all notifications')
  }

  const getCategoryIcon = (category: SmartNotificationCategory) => {
    switch (category) {
      case 'workout':
        return <Dumbbell size={18} className="text-lime-400" />
      case 'hydration':
        return <Droplet size={18} className="text-sky-400" />
      case 'recovery':
        return <Heart size={18} className="text-emerald-400" />
      case 'achievement':
        return <Award size={18} className="text-amber-400" />
      case 'weekly_summary':
        return <Sparkles size={18} className="text-purple-400" />
      default:
        return <Bell size={18} className="text-zinc-400" />
    }
  }

  const isQuietNow = isWithinQuietHours(new Date(), preferences.quietHours)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Bell size={20} />
            </span>
            <h1 className="text-2xl font-bold text-white">Smart Notification Center</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time workout alerts, hydration milestones, recovery check-ins, and anime RPG achievements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllRead} icon={<CheckCheck size={16} />}>
              Mark All Read
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowPreferences(true)}
            icon={<Settings size={16} />}
          >
            Preferences
          </Button>
        </div>
      </div>

      {/* Quiet Hours Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Moon size={14} className={isQuietNow ? 'text-amber-400' : 'text-zinc-500'} />
          <span>
            Circadian Quiet Hours:{' '}
            <strong className="text-zinc-200">
              {preferences.quietHours.startHour}:00 to {preferences.quietHours.endHour}:00
            </strong>{' '}
            ({isQuietNow ? 'Active right now · reminders silent' : 'Inactive · normal delivery'})
          </span>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'all', label: 'All Updates' },
            { id: 'workout', label: 'Workouts' },
            { id: 'hydration', label: 'Hydration' },
            { id: 'recovery', label: 'Recovery' },
            { id: 'achievement', label: 'Badges & RPG' },
            { id: 'weekly_summary', label: 'Weekly Reviews' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 border ${
              selectedFilter === filter.id
                ? 'bg-lime-400 text-zinc-950 border-lime-400'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="py-16 text-center">
            <EmptyState
              icon={<Bell size={36} />}
              title="No notifications to show"
              description="You have no notifications in this category. Workouts and recovery updates will appear here automatically."
            />
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const ItemWrapper = notif.link ? Link : 'div'
            return (
              <Card
                key={notif.id}
                className={`p-4 transition-all duration-150 border ${
                  notif.isRead
                    ? 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                    : 'border-lime-400/30 bg-zinc-900/60 shadow-lg hover:border-lime-400/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${notif.isRead ? 'text-zinc-200' : 'text-white'}`}>
                          {notif.title}
                        </h3>
                        {!notif.isRead && (
                          <Badge variant="accent" className="text-[10px] py-0 px-1.5">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notif.message}</p>

                    <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-zinc-800/60">
                      <div className="flex items-center gap-3">
                        {notif.link && (
                          <Link
                            href={notif.link}
                            className="text-xs text-lime-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <span>Open Module</span>
                            <ExternalLink size={12} />
                          </Link>
                        )}
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationAsRead(notif.id)
                              reload()
                            }}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          clearNotification(notif.id)
                          reload()
                        }}
                        className="text-zinc-600 hover:text-red-400 p-1 rounded transition-colors text-xs"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <Modal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          title="Notification Preferences"
          maxWidth="lg"
        >
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Category Subscriptions
              </h4>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <Toggle
                  label="Workout Reminders"
                  description="Pre-session routine schedule cues and progressive overload updates."
                  checked={preferences.categories.workout}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, workout: val },
                    }))
                  }
                />
                <Toggle
                  label="Hydration Milestones"
                  description="Water checkpoints to sustain muscle volume and metabolic rate."
                  checked={preferences.categories.hydration}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, hydration: val },
                    }))
                  }
                />
                <Toggle
                  label="Recovery & Sleep"
                  description="Biomarker readiness computation and restorative habit cues."
                  checked={preferences.categories.recovery}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, recovery: val },
                    }))
                  }
                />
                <Toggle
                  label="RPG Achievements"
                  description="Badges, XP rewards, and anime character evolutions."
                  checked={preferences.categories.achievement}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, achievement: val },
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  saveNotificationPreferences(preferences)
                  setShowPreferences(false)
                  toast.success('Preferences saved')
                }}
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
