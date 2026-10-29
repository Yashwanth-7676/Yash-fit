'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Bell,
  Users,
  Award,
  Zap,
  ChevronRight,
} from 'lucide-react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/social/socialService'
import type { InAppNotification } from '@/types/social'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setNotifications(getNotifications())
  }, [])

  // Close on outside click
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

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
    setNotifications(getNotifications())
  }

  const handleItemClick = (id: string) => {
    markNotificationRead(id)
    setNotifications(getNotifications())
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors relative cursor-pointer"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-lime-400 text-zinc-950 font-extrabold text-[10px] flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
          <div className="p-3.5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-lime-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link || '/community'}
                  onClick={() => handleItemClick(notif.id)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-zinc-850/60 transition-colors block ${
                    !notif.isRead ? 'bg-lime-400/5' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {notif.type === 'friend_request' || notif.type === 'friend_accepted' ? (
                      <Users size={15} className="text-sky-400" />
                    ) : notif.type === 'achievement_unlocked' ? (
                      <Award size={15} className="text-amber-400" />
                    ) : (
                      <Zap size={15} className="text-lime-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                      <span className="text-[10px] text-zinc-500 shrink-0">{notif.createdAt}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="p-2.5 bg-zinc-950/60 border-t border-zinc-800 text-center">
            <Link
              href="/community"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <span>View Social Community Hub</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

