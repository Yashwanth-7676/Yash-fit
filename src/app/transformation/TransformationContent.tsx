'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Camera,
  Ruler,
  Download,
  Award,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  FileCode,
  RefreshCw,
} from 'lucide-react'
import { Card, Badge, Button, useToast } from '@/components/ui'
import {
  getBodyMeasurements,
  getTransformationPhotos,
  extractTransformationMilestones,
  exportMeasurementsToCsv,
  exportMeasurementsToJson,
} from '@/lib/transformation/transformationService'
import { BeforeAfterComparisonSlider } from '@/components/transformation/BeforeAfterComparisonSlider'
import { MeasurementHistoryCharts } from '@/components/transformation/MeasurementHistoryCharts'
import { PhotoUploadModal } from '@/components/transformation/PhotoUploadModal'
import { LogMeasurementModal } from '@/components/transformation/LogMeasurementModal'
import type {
  BodyMeasurementEntry,
  TransformationPhoto,
  TransformationMilestone,
} from '@/types/transformation'

export function TransformationContent() {
  const toast = useToast()
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([])
  const [photos, setPhotos] = useState<TransformationPhoto[]>([])
  const [milestones, setMilestones] = useState<TransformationMilestone[]>([])
  const [loading, setLoading] = useState(true)

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const m = await getBodyMeasurements('demo-user')
      const p = await getTransformationPhotos('demo-user')
      setMeasurements(m)
      setPhotos(p)
      setMilestones(extractTransformationMilestones(m, p))
      setLoading(false)
    }
    loadData()
  }, [])

  const handleExportCsv = () => {
    const csv = exportMeasurementsToCsv(measurements)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-measurements-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.showToast({
      title: 'Export Completed',
      message: 'Downloaded measurements CSV file.',
      type: 'success',
    })
  }

  const handleExportJson = () => {
    const json = exportMeasurementsToJson(measurements)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-measurements-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.showToast({
      title: 'Export Completed',
      message: 'Downloaded measurements JSON file.',
      type: 'success',
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center space-y-4">
        <RefreshCw size={32} className="animate-spin text-lime-400 mx-auto" />
        <p className="text-zinc-400 text-sm">Loading Body Transformation Intelligence...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="accent">Body Transformation Intelligence</Badge>
            <span className="text-xs text-zinc-500 font-medium">Visual &amp; Biometric Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Transformation Hub</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Longitudinal body measurements, before-and-after photo comparisons, rate estimation with uncertainty bounds, and full data export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-zinc-800 text-zinc-300 hover:border-zinc-700 text-xs"
            onClick={() => setIsMeasureModalOpen(true)}
          >
            <Ruler size={14} className="mr-1.5 text-lime-400" /> Log Measurements
          </Button>
          <Button
            variant="primary"
            className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-xs"
            onClick={() => setIsPhotoModalOpen(true)}
          >
            <Camera size={14} className="mr-1.5" /> Upload Photo
          </Button>

          {/* Export dropdown / buttons */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button
              onClick={handleExportCsv}
              title="Export as CSV"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              onClick={handleExportJson}
              title="Export as JSON"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <FileCode size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Milestone Highlights */}
      {milestones.length > 0 && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles size={14} className="text-lime-400" /> Verified Transformation Milestones
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {milestones.map((m) => (
              <Card
                key={m.id}
                className="p-4 bg-zinc-900/90 border-zinc-800 flex items-start gap-3 shadow-md"
              >
                <div className="p-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-lime-400 shrink-0 mt-0.5">
                  <Award size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{m.date}</span>
                  <h3 className="text-xs font-bold text-white">{m.title}</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{m.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Visual Photo Comparison Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Camera size={14} className="text-lime-400" /> Visual Comparison Slider
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {photos.length} Photos Archived
          </span>
        </div>
        <BeforeAfterComparisonSlider photos={photos} />
      </div>

      {/* Longitudinal Measurement Trend Charts */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-lime-400" /> Biometric Measurement Trajectory
        </span>
        <MeasurementHistoryCharts entries={measurements} />
      </div>

      {/* Measurement Log Table */}
      <Card className="p-6 bg-zinc-950 border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Full Checkpoint Logbook</h2>
            <p className="text-xs text-zinc-400">All recorded circumferences and weight milestones</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">{measurements.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Weight</th>
                <th className="py-2.5 px-3">Waist</th>
                <th className="py-2.5 px-3">Chest</th>
                <th className="py-2.5 px-3">Hips</th>
                <th className="py-2.5 px-3">Arm</th>
                <th className="py-2.5 px-3">Thigh</th>
                <th className="py-2.5 px-3">Neck</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {measurements.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/50 transition">
                  <td className="py-2.5 px-3 font-mono font-medium text-white">{row.recordedDate}</td>
                  <td className="py-2.5 px-3 font-mono text-lime-400 font-semibold">
                    {row.weightKg ? `${row.weightKg} kg` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.waistCm ? `${row.waistCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.chestCm ? `${row.chestCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.hipsCm ? `${row.hipsCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.armCm ? `${row.armCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.thighCm ? `${row.thighCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-300">
                    {row.neckCm ? `${row.neckCm} cm` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 max-w-xs truncate">{row.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSaved={(newPhoto) => {
          const updated = [...photos, newPhoto]
          setPhotos(updated)
          setMilestones(extractTransformationMilestones(measurements, updated))
          toast.showToast({
            title: 'Progress Photo Archived',
            message: `Saved ${newPhoto.poseType} angle snapshot.`,
            type: 'success',
          })
        }}
      />

      <LogMeasurementModal
        isOpen={isMeasureModalOpen}
        onClose={() => setIsMeasureModalOpen(false)}
        onSaved={(newEntry) => {
          const updated = [...measurements, newEntry].sort(
            (a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime()
          )
          setMeasurements(updated)
          setMilestones(extractTransformationMilestones(updated, photos))
          toast.showToast({
            title: 'Measurements Recorded',
            message: 'Body metrics added to trajectory tracker.',
            type: 'success',
          })
        }}
      />
    </div>
  )
}

