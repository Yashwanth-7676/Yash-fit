'use client'

import React, { useState } from 'react'
import { Camera, X, UploadCloud, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import type { PoseType, TransformationPhoto } from '@/types/transformation'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: (photo: TransformationPhoto) => void
  userId?: string
}

export function PhotoUploadModal({ isOpen, onClose, onSaved, userId = 'demo-user' }: Props) {
  const [poseType, setPoseType] = useState<PoseType>('front')
  const [recordedDate, setRecordedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [weightAtTime, setWeightAtTime] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [previewUri, setPreviewUri] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    const file = e.target.files?.[0]
    if (!file) return

    // 5MB limit check
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please select a compressed image.')
      return
    }

    // Type validation
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selected file must be an image (PNG, JPG, or WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUri(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!previewUri) {
      setErrorMsg('Please select or capture a progress photo.')
      return
    }

    setSaving(true)
    try {
      const { addTransformationPhoto } = await import('@/lib/transformation/transformationService')
      const created = await addTransformationPhoto(userId, {
        recordedDate,
        poseType,
        photoData: previewUri,
        weightAtTime: weightAtTime ? Number(weightAtTime) : undefined,
        notes: notes || undefined,
      })
      onSaved(created)
      onClose()
    } catch {
      setErrorMsg('Failed to save photo. Please try again.')
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
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Upload Private Progress Photo</h2>
              <span className="text-xs text-zinc-500">Stored privately and securely</span>
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
          {/* File Picker / Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Photo Upload (&lt; 5MB)
            </label>
            {previewUri ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUri} alt="Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setPreviewUri(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl cursor-pointer hover:border-lime-400/50 hover:bg-zinc-900/50 transition">
                <UploadCloud size={32} className="text-zinc-500 mb-2" />
                <span className="text-xs font-semibold text-zinc-300">Click to upload photo</span>
                <span className="text-[11px] text-zinc-500 mt-1">JPEG, PNG, or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Pose Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Pose Angle
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['front', 'side', 'back'] as PoseType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPoseType(p)}
                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition ${
                    poseType === p
                      ? 'border-lime-400 bg-lime-400/10 text-lime-400 ring-1 ring-lime-400'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {p} View
                </button>
              ))}
            </div>
          </div>

          {/* Date & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Date Recorded
              </label>
              <Input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Weight at Time (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 72.5"
                value={weightAtTime}
                onChange={(e) => setWeightAtTime(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Notes (Optional)
            </label>
            <Input
              placeholder="e.g. Morning fasted lighting, relaxed pose"
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
              {saving ? 'Saving...' : 'Save Photo Checkpoint'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

