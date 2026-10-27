'use client'

import React, { useState } from 'react'
import { Ruler, X, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { addBodyMeasurement } from '@/lib/transformation/transformationService'
import { awardXp } from '@/lib/rpg/rpgService'
import type { BodyMeasurementEntry } from '@/types/transformation'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (entry: BodyMeasurementEntry) => void
  userId?: string
}

export function LogMeasurementModal({
  isOpen,
  onClose,
  onSaved,
  userId = 'demo-user',
}: Props) {
  const [recordedDate, setRecordedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [weightKg, setWeightKg] = useState<string>('')
  const [waistCm, setWaistCm] = useState<string>('')
  const [chestCm, setChestCm] = useState<string>('')
  const [hipsCm, setHipsCm] = useState<string>('')
  const [armCm, setArmCm] = useState<string>('')
  const [thighCm, setThighCm] = useState<string>('')
  const [neckCm, setNeckCm] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!weightKg && !waistCm && !chestCm && !hipsCm && !armCm && !thighCm && !neckCm) {
      setErrorMsg('Please enter at least one metric to log.')
      return
    }

    setSaving(true)
    try {
      const entry = await addBodyMeasurement(userId, {
        recordedDate,
        weightKg: weightKg ? Number(weightKg) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        chestCm: chestCm ? Number(chestCm) : undefined,
        hipsCm: hipsCm ? Number(hipsCm) : undefined,
        armCm: armCm ? Number(armCm) : undefined,
        thighCm: thighCm ? Number(thighCm) : undefined,
        neckCm: neckCm ? Number(neckCm) : undefined,
        notes: notes || undefined,
      })

      // Award XP for tracking
      awardXp(
        'workout',
        50,
        `Logged Body Measurements (${recordedDate})`,
        `meas_${recordedDate}`
      )

      onSaved(entry)
      onClose()
    } catch {
      setErrorMsg('Failed to save measurements. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Ruler size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Record Body Measurements</h2>
              <span className="text-xs text-zinc-500">Track longitudinal body recomposition</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Date
            </label>
            <Input
              type="date"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Weight (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="72.0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Waist (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="82.0"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Chest (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="98.0"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Hips (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="95.0"
                value={hipsCm}
                onChange={(e) => setHipsCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Arm (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="35.5"
                value={armCm}
                onChange={(e) => setArmCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Thigh (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="56.0"
                value={thighCm}
                onChange={(e) => setThighCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                Neck (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="38.0"
                value={neckCm}
                onChange={(e) => setNeckCm(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Check-in Notes (Optional)
            </label>
            <Input
              placeholder="e.g. Morning fasted, post-bathroom"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} className="border-zinc-800 text-xs">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
              className="bg-lime-400 text-black font-bold text-xs hover:bg-lime-500"
            >
              {saving ? 'Saving...' : 'Save Checkpoint (+50 XP)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

