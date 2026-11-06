export type SyncActionType =
  | 'LOG_WORKOUT'
  | 'LOG_MEAL'
  | 'LOG_HYDRATION'
  | 'UPDATE_PROFILE'
  | 'LOG_MEASUREMENT'
  | 'FEEDBACK_SUBMISSION'

export type SyncItemStatus = 'pending' | 'syncing' | 'failed' | 'synced' | 'conflict'

export interface SyncQueueItem {
  id: string
  action: SyncActionType
  payload: Record<string, unknown>
  createdAt: string
  clientTimestamp: number
  retryCount: number
  lastError?: string
  status: SyncItemStatus
}

export interface SyncHistoryEntry {
  id: string
  queueItemId: string
  action: SyncActionType
  syncedAt: string
  status: 'success' | 'conflict_resolved' | 'failed'
  summary: string
  error?: string
}

export interface SyncState {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncedAt: string | null
  syncError: string | null
}
