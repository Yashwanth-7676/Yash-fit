'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  SyncQueueItem,
  SyncHistoryEntry,
  SyncActionType,
} from '@/types/offline'
import {
  getOfflineQueue,
  enqueueOfflineAction,
  processSyncQueue,
  getLastSyncedAt,
  getSyncHistory,
} from './syncEngine'

interface OfflineSyncContextValue {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  pendingItems: SyncQueueItem[]
  lastSyncedAt: string | null
  syncHistory: SyncHistoryEntry[]
  enqueue: (action: SyncActionType, payload: Record<string, unknown>, customId?: string) => SyncQueueItem
  syncNow: () => Promise<{ synced: number; failed: number; conflicts: number; remaining: number }>
  refreshQueue: () => void
}

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null)

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([])
  const [lastSyncedAt, setLastSyncedAtState] = useState<string | null>(null)
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([])

  const refreshQueue = useCallback(() => {
    setPendingItems(getOfflineQueue())
    setLastSyncedAtState(getLastSyncedAt())
    setSyncHistory(getSyncHistory())
  }, [])

  // Sync execution
  const syncNow = useCallback(async () => {
    if (isSyncing) return { synced: 0, failed: 0, conflicts: 0, remaining: pendingItems.length }
    setIsSyncing(true)
    try {
      const result = await processSyncQueue()
      refreshQueue()
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, pendingItems.length, refreshQueue])

  // Setup network status listeners
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)
    refreshQueue()

    const handleOnline = () => {
      setIsOnline(true)
      // Automatically attempt queue sync when connection is restored
      syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshQueue, syncNow])

  const enqueue = useCallback(
    (action: SyncActionType, payload: Record<string, unknown>, customId?: string) => {
      const item = enqueueOfflineAction(action, payload, customId)
      refreshQueue()
      if (isOnline) {
        // Attempt sync immediately if online
        syncNow()
      }
      return item
    },
    [isOnline, refreshQueue, syncNow]
  )

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      pendingCount: pendingItems.length,
      pendingItems,
      lastSyncedAt,
      syncHistory,
      enqueue,
      syncNow,
      refreshQueue,
    }),
    [
      isOnline,
      isSyncing,
      pendingItems,
      lastSyncedAt,
      syncHistory,
      enqueue,
      syncNow,
      refreshQueue,
    ]
  )

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>
}

export function useOfflineSync(): OfflineSyncContextValue {
  const context = useContext(OfflineSyncContext)
  if (!context) {
    return {
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      pendingItems: [],
      lastSyncedAt: null,
      syncHistory: [],
      enqueue: () => ({
        id: 'noop',
        action: 'LOG_WORKOUT',
        payload: {},
        createdAt: new Date().toISOString(),
        clientTimestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      }),
      syncNow: async () => ({ synced: 0, failed: 0, conflicts: 0, remaining: 0 }),
      refreshQueue: () => {},
    }
  }
  return context
}
