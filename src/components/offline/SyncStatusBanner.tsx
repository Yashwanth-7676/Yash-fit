'use client'

import React, { useState } from 'react'
import { useOfflineSync } from '@/lib/offline/offlineContext'
import { Modal, Button } from '@/components/ui'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  History,
} from 'lucide-react'

export function SyncStatusBanner() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    pendingItems,
    lastSyncedAt,
    syncHistory,
    syncNow,
  } = useOfflineSync()

  const [isOpen, setIsOpen] = useState(false)

  // Compact indicator for headers / navbars
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={
          !isOnline
            ? `Offline mode. ${pendingCount} changes pending sync.`
            : isSyncing
            ? 'Syncing offline changes'
            : pendingCount > 0
            ? `${pendingCount} changes waiting to sync`
            : 'Connection optimal. All data synced.'
        }
        title={
          !isOnline
            ? `Offline Mode (${pendingCount} pending)`
            : isSyncing
            ? 'Syncing changes...'
            : pendingCount > 0
            ? `${pendingCount} pending sync`
            : 'Online & Synced'
        }
        className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
            : isSyncing
            ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
            : pendingCount > 0
            ? 'bg-lime-400/10 border-lime-400/40 text-lime-400'
            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Offline</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw size={14} className="text-sky-400 animate-spin" />
            <span className="hidden sm:inline">Syncing</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw size={14} className="text-lime-400" />
            <span className="hidden sm:inline">{pendingCount} Pending</span>
          </>
        ) : (
          <>
            <Wifi size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Online</span>
          </>
        )}
      </button>

      {/* Sync Manager Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Reliability & Offline Sync Center"
        maxWidth="lg"
      >
        <div className="space-y-6 pt-2">
          {/* Status Header */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  !isOnline
                    ? 'bg-amber-500/20 text-amber-400'
                    : isSyncing
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {!isOnline ? (
                  <WifiOff size={20} />
                ) : isSyncing ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Wifi size={20} />
                )}
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{isOnline ? 'Network Connected' : 'Offline Mode Active'}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  {lastSyncedAt
                    ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                    : 'Sync engine ready'}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSyncing}
              onClick={() => syncNow()}
              className="border-zinc-700 text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          </div>

          {/* Pending Changes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-lime-400" />
                <h4 className="text-sm font-semibold text-white">Pending Offline Queue</h4>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {pendingCount} action{pendingCount === 1 ? '' : 's'}
              </span>
            </div>

            {pendingCount === 0 ? (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-center text-xs text-zinc-500">
                <CheckCircle2 size={18} className="mx-auto mb-1 text-emerald-400" />
                All local workout, nutrition, and recovery logs are synchronized.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-zinc-200">{item.action}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          ID: {item.id.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sync History */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <History size={15} className="text-lime-400" />
              <h4 className="text-sm font-semibold text-white">Sync History & Audit Log</h4>
            </div>

            {syncHistory.length === 0 ? (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-center text-xs text-zinc-500">
                No previous sync events logged yet.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {syncHistory.slice(0, 8).map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {entry.status === 'success' ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle size={14} className="text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-zinc-300">{entry.summary}</div>
                        <div className="text-[10px] text-zinc-500">
                          {new Date(entry.syncedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        entry.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conflict Resolution Guarantee */}
          <div className="p-3 rounded-xl bg-lime-400/5 border border-lime-400/20 text-xs text-zinc-300">
            <span className="font-bold text-lime-400 block mb-0.5">
              Conflict Detection & Data Integrity Guarantee
            </span>
            YashFit automatically validates timestamps before committing offline mutations. Newer edits are never overwritten by stale offline snapshots, and client idempotency keys prevent duplicate records.
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-xs px-5"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
