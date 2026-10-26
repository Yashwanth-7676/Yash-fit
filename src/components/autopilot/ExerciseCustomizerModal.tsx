'use client'

import React, { useState } from 'react'
import type { ExerciseAdaptation } from '@/types/autopilot'
import type { EquipmentOption } from '@/types/profile'
import { findBestSubstitutions, SubstitutionOption } from '@/lib/autopilot/substitutionEngine'
import { X, Check, Sliders, Shuffle, Dumbbell } from 'lucide-react'

interface ExerciseCustomizerModalProps {
  adaptation: ExerciseAdaptation | null
  availableEquipment?: EquipmentOption[]
  onClose: () => void
  onSave: (customized: ExerciseAdaptation) => void
}

export function ExerciseCustomizerModal({
  adaptation,
  availableEquipment,
  onClose,
  onSave,
}: ExerciseCustomizerModalProps) {
  if (!adaptation) return null

  const [sets, setSets] = useState<number>(adaptation.proposedItem.targetSets)
  const [reps, setReps] = useState<string>(adaptation.proposedItem.targetReps)
  const [selectedSub, setSelectedSub] = useState<SubstitutionOption | null>(null)

  // Find alternative substitution options
  const substitutions = findBestSubstitutions(
    adaptation.originalItem,
    availableEquipment
  )

  const handleApply = () => {
    let proposedItem = {
      ...adaptation.proposedItem,
      targetSets: sets,
      targetReps: reps,
    }

    let actionType = adaptation.actionType
    let reason = adaptation.reason

    if (selectedSub) {
      proposedItem = {
        ...proposedItem,
        exerciseId: selectedSub.exercise.id,
        exerciseName: selectedSub.exercise.name,
        equipment: selectedSub.exercise.equipment,
      }
      actionType = 'substitute'
      reason = `User customized substitution: ${selectedSub.reason}`
    }

    onSave({
      ...adaptation,
      proposedItem,
      actionType,
      reason,
      supportingData: 'User customized workout plan calibration.',
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders size={16} className="text-lime-400" />
              <span>Customize Movement Calibration</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {adaptation.exerciseName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Prescription Adjuster */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Target Sets
            </label>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSets(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    sets === s
                      ? 'bg-lime-400 text-zinc-950 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 block">
              Target Rep Range
            </label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="e.g. 8-12, 5, 12-15"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 font-mono"
            />
          </div>
        </div>

        {/* Exercise Substitutions */}
        {substitutions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Shuffle size={13} className="text-lime-400" />
              <span>Available Exercise Substitutions:</span>
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {substitutions.slice(0, 4).map((sub) => {
                const isChosen = selectedSub?.exercise.id === sub.exercise.id
                return (
                  <button
                    key={sub.exercise.id}
                    type="button"
                    onClick={() => setSelectedSub(isChosen ? null : sub)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                      isChosen
                        ? 'bg-lime-950/40 border-lime-400 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{sub.exercise.name}</span>
                        <span className="text-[10px] text-zinc-500">• {sub.exercise.equipment}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">
                        {sub.reason}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isChosen ? (
                        <span className="w-5 h-5 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center font-bold text-xs">
                          <Check size={12} />
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 hover:text-white">Choose</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-zinc-950 text-xs font-bold shadow-md shadow-lime-400/20 transition-all"
          >
            Save Customization
          </button>
        </div>
      </div>
    </div>
  )
}

