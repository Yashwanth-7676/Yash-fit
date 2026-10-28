'use client'

import React, { useState, useEffect } from 'react'
import {
  Watch,
  Activity,
  Heart,
  Moon,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Card, Badge, Button, Modal, useToast } from '@/components/ui'
import {
  getWearableProviders,
  getWearableMetrics,
  saveWearableStatus,
  disconnectWearable,
  clearWearableMetrics,
  parseHealthExportData,
} from '@/lib/wearables/wearableService'
import type {
  WearableProviderInfo,
  WearableDailyMetric,
} from '@/types/wearables'

export function IntegrationsContent() {
  const toast = useToast()
  const [providers, setProviders] = useState<WearableProviderInfo[]>([])
  const [metrics, setMetrics] = useState<WearableDailyMetric[]>([])
  const [selectedProvider, setSelectedProvider] = useState<WearableProviderInfo | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [rawTextInput, setRawTextInput] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = () => {
    setProviders(getWearableProviders())
    setMetrics(getWearableMetrics())
  }

  const handleDisconnect = (providerId: WearableProviderInfo['id']) => {
    disconnectWearable(providerId)
    refreshData()
    toast.info('Device Disconnected', 'Synced connection status has been reset.')
  }

  const handleClearMetrics = () => {
    clearWearableMetrics()
    refreshData()
    toast.info('Metrics Cleared', 'All imported wearable history has been erased from local storage.')
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider || !rawTextInput.trim()) return

    const result = parseHealthExportData(rawTextInput, selectedProvider.id)
    if (result.success) {
      toast.success('Import Successful! 🎉', result.message)
      refreshData()
      setShowImportModal(false)
      setRawTextInput('')
    } else {
      toast.error('Import Error', result.message)
    }
  }

  const handleLoadSampleData = () => {
    if (!selectedProvider) return
    const today = new Date()
    const samples = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10)
      samples.push({
        date: d,
        steps: 8500 + Math.floor(Math.random() * 4000),
        resting_hr: 58 + Math.floor(Math.random() * 8),
        sleep_hours: (7.0 + Math.random() * 1.5).toFixed(1),
        active_calories: 420 + Math.floor(Math.random() * 250),
      })
    }
    setRawTextInput(JSON.stringify(samples, null, 2))
  }

  const connectedCount = providers.filter((p) => p.status === 'connected').length
  const filteredProviders = filterCategory === 'all'
    ? providers
    : providers.filter((p) => p.category === filterCategory)

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Wearable Intelligence Hub</Badge>
            <span className="text-xs text-zinc-500 font-medium">Biometric Telemetry &amp; Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Wearables &amp; Health Bridges</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Ingest authentic telemetry from Apple Health, Google Health Connect, Garmin, Whoop, and Oura. Disconnected devices honestly display inactive states—no fabricated biometric numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            icon={<RefreshCw size={14} />}
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Biometric Telemetry Truth & Privacy Banner */}
      <Card className="p-4 sm:p-5 border-lime-400/20 bg-lime-950/10 flex items-start gap-3">
        <ShieldCheck className="text-lime-400 shrink-0 mt-0.5" size={20} />
        <div className="text-xs space-y-1">
          <h2 className="font-bold text-white text-sm">Deterministic Telemetry Verification</h2>
          <p className="text-zinc-300 leading-relaxed">
            YashFit strictly distinguishes real recorded wearable metrics from estimates. If a device is disconnected or unconfigured, resting heart rate and sleep durations remain unrecorded rather than simulated.
          </p>
        </div>
      </Card>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-zinc-800 bg-zinc-900">
          <span className="text-xs text-zinc-500 block">Connected Bridges</span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            {connectedCount} / {providers.length}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {connectedCount > 0 ? 'Active telemetry feed' : 'No active sync bridges'}
          </span>
        </Card>

        <Card className="p-4 border-zinc-800 bg-zinc-900">
          <span className="text-xs text-zinc-500 block">Imported Metric Days</span>
          <span className="text-xl font-extrabold text-lime-400 mt-1 block">
            {new Set(metrics.map((m) => m.date)).size} days
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {metrics.length} total biometric rows
          </span>
        </Card>

        <Card className="p-4 border-zinc-800 bg-zinc-900">
          <span className="text-xs text-zinc-500 block">Avg Resting HR</span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            {metrics.filter((m) => m.restingHeartRate).length > 0
              ? `${Math.round(
                  metrics.reduce((acc, m) => acc + (m.restingHeartRate || 0), 0) /
                    metrics.filter((m) => m.restingHeartRate).length
                )} bpm`
              : 'No data'}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            From connected wearables
          </span>
        </Card>

        <Card className="p-4 border-zinc-800 bg-zinc-900">
          <span className="text-xs text-zinc-500 block">Avg Sleep Recorded</span>
          <span className="text-xl font-extrabold text-white mt-1 block">
            {metrics.filter((m) => m.sleepHours).length > 0
              ? `${(
                  metrics.reduce((acc, m) => acc + (m.sleepHours || 0), 0) /
                  metrics.filter((m) => m.sleepHours).length
                ).toFixed(1)} hrs`
              : 'No data'}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Real tracked duration
          </span>
        </Card>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-zinc-800">
        {[
          { id: 'all', label: 'All Providers' },
          { id: 'mobile_os', label: 'Mobile Health (iOS/Android)' },
          { id: 'smartwatch', label: 'Smartwatches' },
          { id: 'band', label: 'Bands & Sensors' },
          { id: 'ring', label: 'Smart Rings' },
          { id: 'gps', label: 'GPS & Cardio' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer rounded-xl border ${
              filterCategory === tab.id
                ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProviders.map((provider) => (
          <Card
            key={provider.id}
            className={`p-5 border-zinc-800 bg-zinc-900 flex flex-col justify-between space-y-4 transition-all ${
              provider.status === 'connected' ? 'border-lime-400/40 bg-zinc-900/90' : ''
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" role="img" aria-label={provider.name}>
                    {provider.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">{provider.name}</h3>
                    <span className="text-[11px] text-zinc-500 capitalize">{provider.category.replace('_', ' ')}</span>
                  </div>
                </div>

                <Badge variant={provider.status === 'connected' ? 'accent' : 'default'}>
                  {provider.status === 'connected' ? 'CONNECTED' : 'AVAILABLE'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">{provider.description}</p>

              {/* Supported metric badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {provider.supportedMetrics.map((metric) => (
                  <span
                    key={metric}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300"
                  >
                    {metric.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              {provider.authType === 'file_export' ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setSelectedProvider(provider)
                      setShowInstructionsModal(true)
                    }}
                  >
                    Setup Guide
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon={<Upload size={13} />}
                    onClick={() => {
                      setSelectedProvider(provider)
                      setShowImportModal(true)
                    }}
                  >
                    Import Export
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {provider.status === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      Disconnect Device
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => {
                        setSelectedProvider(provider)
                        setShowInstructionsModal(true)
                      }}
                    >
                      Connect &amp; API Guide
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Synced Telemetry Data Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Imported Daily Telemetry</h2>
            <p className="text-xs text-zinc-400">
              Verified records with exact provider attribution.
            </p>
          </div>
          {metrics.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleClearMetrics}
            >
              Clear Telemetry Log
            </Button>
          )}
        </div>

        {metrics.length > 0 ? (
          <Card className="p-0 border-zinc-800 bg-zinc-900 overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300 divide-y divide-zinc-800">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Steps</th>
                  <th className="py-3 px-4">Resting HR</th>
                  <th className="py-3 px-4">Sleep</th>
                  <th className="py-3 px-4">Active Burn</th>
                  <th className="py-3 px-4">Attribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {metrics.slice(0, 15).map((m, idx) => (
                  <tr key={`${m.date}_${m.provider}_${idx}`} className="hover:bg-zinc-850/40">
                    <td className="py-3 px-4 font-mono font-medium text-white">{m.date}</td>
                    <td className="py-3 px-4">{m.steps ? `${m.steps.toLocaleString()} steps` : '—'}</td>
                    <td className="py-3 px-4">{m.restingHeartRate ? `${m.restingHeartRate} bpm` : '—'}</td>
                    <td className="py-3 px-4">{m.sleepHours ? `${m.sleepHours} hrs` : '—'}</td>
                    <td className="py-3 px-4">{m.activeCalories ? `${m.activeCalories} kcal` : '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-semibold text-zinc-300">
                        {m.sourceLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="p-8 text-center border-zinc-800 bg-zinc-900 text-zinc-500 text-xs space-y-2">
            <Activity className="mx-auto text-zinc-600 mb-1" size={24} />
            <p className="font-semibold text-zinc-300">No Biometric Telemetry Synced Yet</p>
            <p className="max-w-md mx-auto text-zinc-500">
              Click &quot;Import Export&quot; on Apple Health or Google Health Connect above, or use the sample telemetry generator to test sync.
            </p>
          </Card>
        )}
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title={`Import Telemetry: ${selectedProvider?.name || 'Wearable'}`}
      >
        <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
          <p className="text-zinc-400">
            Paste exported JSON or CSV content from {selectedProvider?.name}. YashFit validates dates, step ranges, and resting HR values deterministically.
          </p>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLoadSampleData}
              className="text-xs text-lime-400 hover:underline font-semibold cursor-pointer"
            >
              + Load Sample Telemetry Dump
            </button>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold block mb-1">Export Data (JSON or CSV)</label>
            <textarea
              rows={8}
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              placeholder='[{"date":"2026-10-28","steps":10450,"resting_hr":62,"sleep_hours":7.8}]'
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-lime-400 resize-none"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowImportModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={!rawTextInput.trim()}>
              Parse &amp; Ingest Telemetry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Setup Instructions Modal */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title={`Connection Guide: ${selectedProvider?.name || 'Wearable'}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            Follow these documented steps to link telemetry from {selectedProvider?.name}:
          </p>

          <div className="space-y-2.5">
            {selectedProvider?.connectionInstructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-lime-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                  {idx + 1}
                </span>
                <span className="text-zinc-300 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {selectedProvider?.envRequired && selectedProvider.envRequired.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-amber-300 space-y-1">
              <span className="font-bold block">Developer Credentials Required:</span>
              <span className="text-[11px] font-mono block">
                {selectedProvider.envRequired.join(', ')}
              </span>
            </div>
          )}

          <div className="pt-3 flex justify-end">
            <Button size="sm" onClick={() => setShowInstructionsModal(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
