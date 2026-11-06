'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Dumbbell,
  Utensils,
  ThumbsUp,
  ThumbsDown,
  X,
  Info,
  RotateCcw,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  generatePersonalizedRecommendations,
  submitRecommendationFeedback,
  getPersonalizationPreferences,
  savePersonalizationPreferences,
  resetPersonalization,
} from '@/lib/personalization/personalizationEngine'
import type {
  PersonalizationEngineSummary,
  PersonalizedWorkoutRecommendation,
  PersonalizedMealRecommendation,
  PersonalizationPreferences,
} from '@/types/personalization'
import { Card, Badge, Button, Modal, Toggle, Select, useToast } from '@/components/ui'

export function PersonalizationHub({ userId = 'demo-user' }: { userId?: string }) {
  const toast = useToast()
  const [data, setData] = useState<PersonalizationEngineSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [prefs, setPrefs] = useState<PersonalizationPreferences>(getPersonalizationPreferences(userId))

  const loadData = async () => {
    setIsLoading(true)
    try {
      const summary = await generatePersonalizedRecommendations(userId)
      setData(summary)
      setPrefs(summary.preferences)
    } catch (e) {
      console.warn('Personalization engine error:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const handleFeedback = (
    recommendationId: string,
    feedback: 'liked' | 'disliked' | 'dismissed',
    reason?: string
  ) => {
    submitRecommendationFeedback(recommendationId, feedback, reason, userId)
    loadData()
    if (feedback === 'liked') {
      toast.success('Feedback Saved', 'YashFit will prioritize similar routines and nutritional targets.')
    } else if (feedback === 'dismissed') {
      toast.info('Recommendation Dismissed', 'This suggestion will no longer appear.')
    } else {
      toast.info('Feedback Recorded', 'We will calibrate future volume and ingredient suggestions.')
    }
  }

  const handleReset = () => {
    resetPersonalization(userId)
    setPrefs(getPersonalizationPreferences(userId))
    setShowSettingsModal(false)
    loadData()
    toast.success('Personalization Reset', 'All learned weights and dismissed items have been restored to defaults.')
  }

  const handleSaveSettings = () => {
    savePersonalizationPreferences(prefs, userId)
    setShowSettingsModal(false)
    loadData()
    toast.success('Settings Updated', 'Personalization learning preferences have been updated.')
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-3 text-zinc-400">
        <div className="w-6 h-6 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Calibrating personalized AI recommendations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-lime-950/20 border border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Sparkles size={18} />
            </span>
            <h2 className="text-xl font-bold text-white">Central AI Personalization Engine</h2>
            <Badge variant="accent" className="text-[10px]">
              Stage #45
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Deterministic recommendations driven strictly by verified user telemetry, available gear, and regional Indian nutrition.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSettingsModal(true)}
          icon={<Sliders size={14} />}
        >
          Engine Settings
        </Button>
      </div>

      {/* 1. Personalized Workout Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-lime-400" />
            <h3 className="text-base font-bold text-white">Tailored Training Sessions</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {data.workoutRecommendations.length} Programmed
          </span>
        </div>

        {data.workoutRecommendations.length === 0 ? (
          <Card className="p-8 text-center space-y-2">
            <p className="text-sm text-zinc-400 font-medium">No workout recommendations currently active.</p>
            <p className="text-xs text-zinc-600">You may have dismissed existing routines. You can reset personalization anytime.</p>
          </Card>
        ) : (
          data.workoutRecommendations.map((w) => {
            const isWhyExpanded = expandedWhyId === w.id
            return (
              <Card key={w.id} className="p-5 border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                        {w.recommendedDurationMin} min session
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        Target: {w.primaryMuscles.join(', ')}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mt-1.5">{w.routineName}</h4>
                  </div>

                  {/* Feedback Controls */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleFeedback(w.id, 'liked')}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        w.feedbackState === 'liked'
                          ? 'bg-lime-400 text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-lime-400'
                      }`}
                      title="Helpful & matches goals"
                      aria-label="Thumbs up"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(w.id, 'disliked')}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        w.feedbackState === 'disliked'
                          ? 'bg-red-500 text-white font-bold'
                          : 'text-zinc-400 hover:text-red-400'
                      }`}
                      title="Not suitable right now"
                      aria-label="Thumbs down"
                    >
                      <ThumbsDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(w.id, 'dismissed')}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                      title="Dismiss routine"
                      aria-label="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Exercises Table */}
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold">
                      <tr>
                        <th className="p-3">Exercise</th>
                        <th className="p-3">Sets &amp; Reps</th>
                        <th className="p-3">Equipment</th>
                        <th className="p-3">Alternative</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {w.exercises.map((ex, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/40">
                          <td className="p-3 font-semibold text-white">{ex.name}</td>
                          <td className="p-3 font-mono text-lime-400">{ex.sets} sets × {ex.targetReps}</td>
                          <td className="p-3 text-zinc-400">{ex.equipmentRequired}</td>
                          <td className="p-3 text-zinc-500">{ex.alternativeOption || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Progression Cue */}
                {w.progressionCue && (
                  <div className="p-3 rounded-xl bg-lime-950/20 border border-lime-400/20 text-xs text-lime-300 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0 text-lime-400" />
                    <span><strong>Progression Criterion:</strong> {w.progressionCue}</span>
                  </div>
                )}

                {/* Explainability Accordion */}
                <div className="pt-2 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setExpandedWhyId(isWhyExpanded ? null : w.id)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    <Info size={14} className="text-lime-400" />
                    <span>Why did YashFit recommend this workout?</span>
                    {isWhyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isWhyExpanded && (
                    <div className="mt-3 p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs animate-in fade-in duration-150">
                      <p className="text-zinc-300 leading-relaxed">{w.rationale}</p>
                      <div>
                        <span className="font-semibold text-zinc-400 block mb-1">Authenticated Data Drivers:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-zinc-400 font-mono text-[11px]">
                          {w.dataDrivers.map((driver, dIdx) => (
                            <li key={dIdx}>{driver}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* 2. Personalized Indian Meal Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Targeted Indian Nutrition Suggestions</h3>
          </div>
          <Link href="/nutrition-planner" className="text-xs text-lime-400 hover:underline">
            Open Nutrition Planner
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.mealRecommendations.map((m) => (
            <Card key={m.id} className="p-5 border-zinc-800 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{m.regionalCategory}</Badge>
                      <Badge variant="info">{m.dietaryType}</Badge>
                    </div>
                    <h4 className="text-base font-bold text-white mt-1.5">{m.dishName}</h4>
                    {m.hindiOrRegionalName && (
                      <p className="text-xs text-zinc-400 font-serif">{m.hindiOrRegionalName}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => handleFeedback(m.id, 'liked')}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        m.feedbackState === 'liked'
                          ? 'bg-lime-400 text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-lime-400'
                      }`}
                      title="Like dish"
                    >
                      <ThumbsUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(m.id, 'dismissed')}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                      title="Dismiss dish"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Macro Pills */}
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Calories</span>
                    <span className="text-xs font-bold text-white">{m.calories}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Protein</span>
                    <span className="text-xs font-bold text-lime-400">{m.proteinGrams}g</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Carbs</span>
                    <span className="text-xs font-bold text-amber-400">{m.carbsGrams}g</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Fats</span>
                    <span className="text-xs font-bold text-rose-400">{m.fatsGrams}g</span>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="pt-2 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Key Staples: </span>
                  <span>{m.keyIngredients.join(', ')}</span>
                </div>
              </div>

              {/* Rationale */}
              <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
                <span className="text-lime-400 font-semibold">Why this meal: </span>
                <span>{m.rationale}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Settings & Reset Modal */}
      {showSettingsModal && (
        <Modal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          title="Personalization Engine Settings"
          maxWidth="md"
        >
          <div className="space-y-5 pt-2">
            <p className="text-xs text-zinc-400">
              Control how the AI Personalization Engine learns from your activity and feedback. All data remains private on your profile.
            </p>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
              <Toggle
                label="Preference Learning with Consent"
                description="Allow the engine to adjust recommendation weightings based on liked and dismissed items."
                checked={prefs.consentToLearn}
                onChange={(val) => setPrefs((p) => ({ ...p, consentToLearn: val }))}
              />

              <div className="border-t border-zinc-800/60 pt-3">
                <Select
                  label="Training Intensity Calibration"
                  value={prefs.intensityPreference}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      intensityPreference: e.target.value as 'conservative' | 'standard' | 'aggressive',
                    }))
                  }
                  options={[
                    { value: 'conservative', label: 'Conservative (Higher Recovery Margin)' },
                    { value: 'standard', label: 'Standard Periodization (Default)' },
                    { value: 'aggressive', label: 'Aggressive Progressive Overload' },
                  ]}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Reset Personalization</p>
                <p className="text-xs text-zinc-400">Restore all recommendation weights and feedback to fresh defaults.</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleReset} icon={<RotateCcw size={14} />}>
                Reset All
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button size="sm" variant="ghost" onClick={() => setShowSettingsModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveSettings}>
                Save Preferences
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
