import {
  SyncActionType,
  SyncQueueItem,
  SyncHistoryEntry,
} from '@/types/offline'

export const OFFLINE_QUEUE_KEY = 'yashfit_offline_sync_queue'
export const SYNC_HISTORY_KEY = 'yashfit_sync_history'
export const LAST_SYNC_KEY = 'yashfit_last_sync_timestamp'

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'uuid_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

export function getOfflineQueue(): SyncQueueItem[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncQueueItem[]
  } catch (err) {
    console.warn('Failed to load offline queue', err)
    return []
  }
}

export function saveOfflineQueue(queue: SyncQueueItem[]): void {
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.warn('Failed to save offline queue', err)
  }
}

export function getSyncHistory(): SyncHistoryEntry[] {
  if (!hasLocalStorage()) return []
  try {
    const raw = localStorage.getItem(SYNC_HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SyncHistoryEntry[]
  } catch {
    return []
  }
}

export function recordSyncHistory(entry: Omit<SyncHistoryEntry, 'id'>): void {
  if (!hasLocalStorage()) return
  try {
    const history = getSyncHistory()
    const newEntry: SyncHistoryEntry = {
      ...entry,
      id: generateUUID(),
    }
    const updated = [newEntry, ...history].slice(0, 50)
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(updated))
  } catch (err) {
    console.warn('Failed to save sync history', err)
  }
}

export function getLastSyncedAt(): string | null {
  if (!hasLocalStorage()) return null
  try {
    return localStorage.getItem(LAST_SYNC_KEY)
  } catch {
    return null
  }
}

export function setLastSyncedAt(timestamp: string): void {
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(LAST_SYNC_KEY, timestamp)
  } catch (err) {
    console.warn('Failed to set last sync timestamp', err)
  }
}

/**
 * Enqueue an action to be synced with client idempotency key
 */
export function enqueueOfflineAction(
  action: SyncActionType,
  payload: Record<string, unknown>,
  customId?: string
): SyncQueueItem {
  const queue = getOfflineQueue()
  const id = customId || (payload.client_id as string) || generateUUID()

  // Prevent duplicate insertion
  const existing = queue.find((q) => q.id === id)
  if (existing) {
    return existing
  }

  const newItem: SyncQueueItem = {
    id,
    action,
    payload,
    createdAt: new Date().toISOString(),
    clientTimestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  }

  const updatedQueue = [...queue, newItem]
  saveOfflineQueue(updatedQueue)
  return newItem
}

/**
 * Conflict detection between local offline record and server record
 */
export function detectConflict(
  localItem: SyncQueueItem,
  serverRecord?: { updated_at?: string; timestamp?: number }
): { hasConflict: boolean; winner: 'local' | 'server'; reason: string } {
  if (!serverRecord || !serverRecord.updated_at) {
    return { hasConflict: false, winner: 'local', reason: 'No conflicting server version' }
  }

  const serverTime = new Date(serverRecord.updated_at).getTime()
  if (isNaN(serverTime)) {
    return { hasConflict: false, winner: 'local', reason: 'Invalid server timestamp' }
  }

  if (localItem.clientTimestamp > serverTime) {
    return {
      hasConflict: true,
      winner: 'local',
      reason: `Local change (${new Date(localItem.clientTimestamp).toLocaleTimeString()}) is newer than server version (${new Date(serverTime).toLocaleTimeString()})`,
    }
  } else {
    return {
      hasConflict: true,
      winner: 'server',
      reason: `Server version is newer (${new Date(serverTime).toLocaleTimeString()}). Preserving server record to avoid overwriting recent edits.`,
    }
  }
}

/**
 * Process pending queue items
 */
export async function processSyncQueue(
  onItemProcess?: (item: SyncQueueItem) => Promise<boolean>
): Promise<{
  synced: number
  failed: number
  conflicts: number
  remaining: number
}> {
  const queue = getOfflineQueue()
  if (queue.length === 0) {
    return { synced: 0, failed: 0, conflicts: 0, remaining: 0 }
  }

  let synced = 0
  let failed = 0
  let conflicts = 0
  const remainingQueue: SyncQueueItem[] = []

  for (const item of queue) {
    try {
      let success = true
      if (onItemProcess) {
        success = await onItemProcess(item)
      } else {
        // Default processor handles demo/offline resolution
        // In local mode or standard sync, simulate network commit or mock RPC
        await new Promise((res) => setTimeout(res, 30))
        success = true
      }

      if (success) {
        synced++
        recordSyncHistory({
          queueItemId: item.id,
          action: item.action,
          syncedAt: new Date().toISOString(),
          status: 'success',
          summary: `Successfully synchronized ${item.action}`,
        })
      } else {
        failed++
        item.retryCount++
        item.status = 'failed'
        if (item.retryCount < 5) {
          remainingQueue.push(item)
        } else {
          recordSyncHistory({
            queueItemId: item.id,
            action: item.action,
            syncedAt: new Date().toISOString(),
            status: 'failed',
            summary: `Max retries exceeded for ${item.action}`,
            error: 'Sync attempts exhausted after 5 retries',
          })
        }
      }
    } catch (err: unknown) {
      failed++
      item.retryCount++
      item.status = 'failed'
      item.lastError = err instanceof Error ? err.message : 'Unknown sync failure'
      if (item.retryCount < 5) {
        remainingQueue.push(item)
      } else {
        recordSyncHistory({
          queueItemId: item.id,
          action: item.action,
          syncedAt: new Date().toISOString(),
          status: 'failed',
          summary: `Sync failed for ${item.action}`,
          error: item.lastError,
        })
      }
    }
  }

  saveOfflineQueue(remainingQueue)
  const now = new Date().toISOString()
  setLastSyncedAt(now)

  return {
    synced,
    failed,
    conflicts,
    remaining: remainingQueue.length,
  }
}
