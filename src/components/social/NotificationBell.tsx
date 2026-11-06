'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  Clock,
  ShieldCheck,
  ExternalLink,
  X,
  Volume2,
} from 'lucide-react'
import {
  getSmartNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotification,
  clearAllNotifications,
  getNotificationPreferences,
  saveNotificationPreferences,
  requestBrowserNotificationPermission,
  isWithinQuietHours,
} from '@/lib/notifications/notificationService'
import type {
  SmartNotification,
  SmartNotificationCategory,
  NotificationPreferences,
} from '@/types/notifications'
import { Badge, Button, Modal, Toggle, Select, useToast } from '@/components/ui'

export function NotificationBell() {
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [selectedFilter, setSelectedFilter] = useState<SmartNotificationCategory | 'all'>('all')
  const [preferences, setPreferences] = useState<NotificationPreferences>(getNotificationPreferences())
  const [browserPermission, setBrowserPermission] = useState<string>('default')

  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const reloadData = () => {
    setNotifications(getSmartNotifications())
    setPreferences(getNotificationPreferences())
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission)
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    reloadData()
    toast.success('Marked all as read')
  }

  const handleItemClick = (item: SmartNotification) => {
    if (!item.isRead) {
      markNotificationAsRead(item.id)
      reloadData()
    }
    if (item.link) {
      setIsOpen(false)
    }
  }

  const handleClearItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    clearNotification(id)
    reloadData()
  }

  const handleClearAll = () => {
    clearAllNotifications()
    reloadData()
    toast.info('Notification history cleared')
  }

  const handleSavePreferences = () => {
    saveNotificationPreferences(preferences)
    setShowPreferences(false)
    toast.success('Notification preferences updated')
  }

  const handleRequestBrowserPush = async () => {
    const result = await requestBrowserNotificationPermission()
    setBrowserPermission(result)
    if (result === 'granted') {
      const updated = { ...preferences, enableBrowserPush: true }
      setPreferences(updated)
      saveNotificationPreferences(updated)
      toast.success('Browser notifications enabled')
    } else if (result === 'denied') {
      const updated = { ...preferences, enableBrowserPush: false }
      setPreferences(updated)
      saveNotificationPreferences(updated)
      toast.warning('Browser notification permission was blocked in browser settings')
    }
  }

  const isQuietNow = isWithinQuietHours(new Date(), preferences.quietHours)

  const getCategoryIcon = (category: SmartNotificationCategory) => {
    switch (category) {
      case 'workout':
        return <Dumbbell size={16} className="text-lime-400" />
      case 'hydration':
        return <Droplet size={16} className="text-sky-400" />
      case 'recovery':
        return <Heart size={16} className="text-emerald-400" />
      case 'achievement':
        return <Award size={16} className="text-amber-400" />
      case 'weekly_summary':
        return <Sparkles size={16} className="text-purple-400" />
      default:
        return <Bell size={16} className="text-zinc-400" />
    }
  }

  const formatRelativeTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins}m ago`
      const diffHours = Math.floor(diffMins / 60)
      if (diffHours < 24) return `${diffHours}h ago`
      return `${Math.floor(diffHours / 24)}d ago`
    } catch {
      return 'recently'
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) reloadData()
        }}
        className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
        aria-label={`Smart Notification Center (${unreadCount} unread)`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-lime-400 text-[10px] font-bold text-zinc-950 ring-2 ring-zinc-950 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over / Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[400px] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-xs text-zinc-500">All caught up</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-lime-400 hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={15} />
                  <span className="hidden sm:inline text-[11px]">Read all</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Notification Preferences"
                aria-label="Notification Preferences"
              >
                <Settings size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="px-3 py-2 border-b border-zinc-800/60 bg-zinc-950 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'workout', label: 'Workouts' },
                { id: 'hydration', label: 'Hydration' },
                { id: 'recovery', label: 'Recovery' },
                { id: 'achievement', label: 'Badges' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all duration-150 ${
                  selectedFilter === filter.id
                    ? 'bg-zinc-800 text-lime-400 font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Notifications Scroll Area */}
          <div className="overflow-y-auto divide-y divide-zinc-900 flex-1 max-h-[380px]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Bell size={28} className="mx-auto text-zinc-700" />
                <p className="text-sm font-medium text-zinc-400">No notifications in this view</p>
                <p className="text-xs text-zinc-600">
                  {selectedFilter === 'all'
                    ? 'Your updates and workout reminders will appear here.'
                    : `No ${selectedFilter} updates logged yet.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const ItemWrapper = notif.link ? Link : 'div'
                return (
                  <ItemWrapper
                    key={notif.id}
                    href={notif.link || '#'}
                    onClick={() => handleItemClick(notif)}
                    className={`block p-3.5 transition-colors group relative ${
                      notif.isRead
                        ? 'bg-zinc-950/60 hover:bg-zinc-900/60'
                        : 'bg-zinc-900/40 hover:bg-zinc-900/90'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 shrink-0 mt-0.5">
                        {getCategoryIcon(notif.category)}
                      </div>

                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              notif.isRead ? 'text-zinc-300' : 'text-white'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500 font-mono">
                          <span>{formatRelativeTime(notif.createdAt)}</span>
                          {notif.link && (
                            <span className="inline-flex items-center gap-0.5 text-lime-400/90 group-hover:underline">
                              <span>Open</span>
                              <ExternalLink size={9} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete notification button */}
                      <button
                        type="button"
                        onClick={(e) => handleClearItem(e, notif.id)}
                        className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        aria-label="Remove notification"
                        title="Remove"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </ItemWrapper>
                )
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <Moon size={12} className={isQuietNow ? 'text-amber-400' : 'text-zinc-500'} />
              <span>
                {isQuietNow
                  ? 'Quiet hours active (reminders paused)'
                  : `Quiet hours: ${preferences.quietHours.startHour}:00–${preferences.quietHours.endHour}:00`}
              </span>
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1 text-[11px]"
              >
                <Trash2 size={12} />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <Modal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          title="Notification Preferences"
          maxWidth="lg"
        >
          <div className="space-y-6 pt-2">
            {/* Delivery Channels */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Delivery Channels
              </h4>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                <Toggle
                  label="In-App Notification Center"
                  description="Receive instant workout cues, hydration checkpoints, and badges inside YashFit."
                  checked={preferences.enableInApp}
                  onChange={(val) => setPreferences((p) => ({ ...p, enableInApp: val }))}
                />

                <div className="border-t border-zinc-800/60 pt-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Browser Push Notifications</p>
                      <p className="text-xs text-zinc-500">
                        {browserPermission === 'granted'
                          ? 'Permission granted · Browser notifications ready'
                          : browserPermission === 'denied'
                          ? 'Permission denied · Blocked by browser setting'
                          : 'Requires browser permission to display desktop reminders'}
                      </p>
                    </div>
                    {browserPermission === 'granted' ? (
                      <Toggle
                        checked={preferences.enableBrowserPush}
                        onChange={(val) =>
                          setPreferences((p) => ({ ...p, enableBrowserPush: val }))
                        }
                      />
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleRequestBrowserPush}>
                        Enable Push
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Preferences */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Notification Categories
              </h4>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <Toggle
                  label="Workout Reminders"
                  description="Scheduled routine alerts and progressive overload checkpoints."
                  checked={preferences.categories.workout}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, workout: val },
                    }))
                  }
                />
                <Toggle
                  label="Hydration Checkpoints"
                  description="Gentle daily reminders to drink water and meet target hydration."
                  checked={preferences.categories.hydration}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, hydration: val },
                    }))
                  }
                />
                <Toggle
                  label="Recovery & Readiness"
                  description="Morning readiness score calculation and evening sleep log cues."
                  checked={preferences.categories.recovery}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, recovery: val },
                    }))
                  }
                />
                <Toggle
                  label="RPG Achievements & Rank Ups"
                  description="Badges, XP milestone celebrations, and anime character level ups."
                  checked={preferences.categories.achievement}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, achievement: val },
                    }))
                  }
                />
                <Toggle
                  label="Weekly Progress Summaries"
                  description="Sunday weekly report summarizing volume, calories, and consistency."
                  checked={preferences.categories.weekly_summary}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, weekly_summary: val },
                    }))
                  }
                />
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Circadian Quiet Hours
              </h4>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                <Toggle
                  label="Enforce Quiet Hours"
                  description="Silence non-critical notifications while you are resting or sleeping."
                  checked={preferences.quietHours.enabled}
                  onChange={(val) =>
                    setPreferences((p) => ({
                      ...p,
                      quietHours: { ...p.quietHours, enabled: val },
                    }))
                  }
                />

                {preferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/60">
                    <Select
                      label="Start Time (Sleep)"
                      value={preferences.quietHours.startHour.toString()}
                      onChange={(e) =>
                        setPreferences((p) => ({
                          ...p,
                          quietHours: {
                            ...p.quietHours,
                            startHour: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      options={[
                        { value: '20', label: '8:00 PM' },
                        { value: '21', label: '9:00 PM' },
                        { value: '22', label: '10:00 PM (Default)' },
                        { value: '23', label: '11:00 PM' },
                        { value: '0', label: '12:00 AM' },
                      ]}
                    />

                    <Select
                      label="End Time (Wake)"
                      value={preferences.quietHours.endHour.toString()}
                      onChange={(e) =>
                        setPreferences((p) => ({
                          ...p,
                          quietHours: {
                            ...p.quietHours,
                            endHour: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      options={[
                        { value: '5', label: '5:00 AM' },
                        { value: '6', label: '6:00 AM' },
                        { value: '7', label: '7:00 AM (Default)' },
                        { value: '8', label: '8:00 AM' },
                        { value: '9', label: '9:00 AM' },
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <Button variant="ghost" onClick={() => setShowPreferences(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
