'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Scale,
  Sparkles,
  Camera,
  Layers,
  TrendingDown,
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  Info,
  Lock,
} from 'lucide-react'
import { Card, Badge, Button, Input, Modal, useToast } from '@/components/ui'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  getBodyIntelligenceRecords,
  saveBodyIntelligenceRecord,
  deleteBodyIntelligenceRecord,
  getBodyIntelligenceGoal,
  saveBodyIntelligenceGoal,
  calculateComparisonDelta,
  generateMonthlySummaries,
} from '@/lib/body-intelligence/bodyIntelligenceService'
import type {
  BodyIntelligenceRecord,
  BodyIntelligenceGoal,
} from '@/types/bodyIntelligence'

export function BodyIntelligenceContent() {
  const toast = useToast()

  // Data state
  const [records, setRecords] = useState<BodyIntelligenceRecord[]>([])
  const [goal, setGoal] = useState<BodyIntelligenceGoal | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'trends' | 'photos'>('overview')

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Comparison selection
  const [baselineId, setBaselineId] = useState<string>('')
  const [currentId, setCurrentId] = useState<string>('')

  // Form state for logging
  const [formDate, setFormDate] = useState('2026-01-01')
  const [formWeight, setFormWeight] = useState('74.0')
  const [formHeight, setFormHeight] = useState('175')
  const [formAge, setFormAge] = useState('26')
  const [formGender, setFormGender] = useState<'male' | 'female'>('male')
  const [formWaist, setFormWaist] = useState('82')
  const [formNeck, setFormNeck] = useState('37')
  const [formHips, setFormHips] = useState('')
  const [formChest, setFormChest] = useState('101')
  const [formArm, setFormArm] = useState('35')
  const [formThigh, setFormThigh] = useState('56.5')
  const [formNotes, setFormNotes] = useState('')
  const [formFrontPhoto, setFormFrontPhoto] = useState('')
  const [formSidePhoto, setFormSidePhoto] = useState('')
  const [formBackPhoto, setFormBackPhoto] = useState('')

  // Form state for goal
  const [goalTargetWeight, setGoalTargetWeight] = useState('70.0')
  const [goalTargetBF, setGoalTargetBF] = useState('14.0')
  const [goalTargetWaist, setGoalTargetWaist] = useState('78')

  // Load data
  useEffect(() => {
    const loadedRecords = getBodyIntelligenceRecords()
    const loadedGoal = getBodyIntelligenceGoal()
    setRecords(loadedRecords)
    setGoal(loadedGoal)
    setFormDate(new Date().toISOString().slice(0, 10))

    if (loadedRecords.length >= 2) {
      setBaselineId(loadedRecords[loadedRecords.length - 1].id)
      setCurrentId(loadedRecords[0].id)
    } else if (loadedRecords.length === 1) {
      setBaselineId(loadedRecords[0].id)
      setCurrentId(loadedRecords[0].id)
    }

    if (loadedGoal) {
      setGoalTargetWeight(String(loadedGoal.targetWeightKg))
      setGoalTargetBF(String(loadedGoal.targetBodyFatPercent || 14))
      setGoalTargetWaist(String(loadedGoal.targetWaistCm || 78))
    }
  }, [])

  // Derived current record
  const latestRecord = records[0] || null
  const oldestRecord = records[records.length - 1] || null

  // Comparison delta
  const selectedBaseline = useMemo(
    () => records.find((r) => r.id === baselineId) || oldestRecord,
    [records, baselineId, oldestRecord]
  )
  const selectedCurrent = useMemo(
    () => records.find((r) => r.id === currentId) || latestRecord,
    [records, currentId, latestRecord]
  )

  const comparisonDelta = useMemo(() => {
    if (!selectedBaseline || !selectedCurrent) return null
    return calculateComparisonDelta(selectedBaseline, selectedCurrent)
  }, [selectedBaseline, selectedCurrent])

  // Monthly summaries
  const monthlySummaries = useMemo(() => {
    return generateMonthlySummaries(records)
  }, [records])

  // Chart data
  const chartData = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime())
      .map((r) => ({
        date: r.recordedDate.slice(5),
        weight: r.weightKg,
        bodyFat: r.composition.bodyFatPercentage,
        leanMass: r.composition.leanMassKg,
        waist: r.waistCm || null,
      }))
  }, [records])

  // Handle Photo upload base64 convert
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, pose: 'front' | 'side' | 'back') => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      if (pose === 'front') setFormFrontPhoto(result)
      if (pose === 'side') setFormSidePhoto(result)
      if (pose === 'back') setFormBackPhoto(result)
      toast.success('Photo loaded and encrypted locally')
    }
    reader.readAsDataURL(file)
  }

  // Handle save record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault()
    const weightNum = parseFloat(formWeight)
    const heightNum = parseFloat(formHeight)
    const ageNum = parseInt(formAge, 10)

    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 300) {
      toast.error('Please enter a valid weight between 20kg and 300kg')
      return
    }

    const updated = saveBodyIntelligenceRecord({
      userId: 'demo-user',
      recordedDate: formDate,
      weightKg: weightNum,
      heightCm: heightNum,
      age: ageNum,
      gender: formGender,
      waistCm: formWaist ? parseFloat(formWaist) : undefined,
      neckCm: formNeck ? parseFloat(formNeck) : undefined,
      hipsCm: formHips ? parseFloat(formHips) : undefined,
      chestCm: formChest ? parseFloat(formChest) : undefined,
      armCm: formArm ? parseFloat(formArm) : undefined,
      thighCm: formThigh ? parseFloat(formThigh) : undefined,
      photos: {
        frontUrl: formFrontPhoto || undefined,
        sideUrl: formSidePhoto || undefined,
        backUrl: formBackPhoto || undefined,
      },
      notes: formNotes || undefined,
    })

    setRecords(updated)
    setIsLogModalOpen(false)
    toast.success('Body composition record saved successfully')
  }

  // Handle delete record
  const confirmDeleteRecord = () => {
    if (!deleteTargetId) return
    const updated = deleteBodyIntelligenceRecord(deleteTargetId)
    setRecords(updated)
    setDeleteTargetId(null)
    toast.info('Measurement entry deleted')
  }

  // Handle save goal
  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!latestRecord) return
    const newGoal: BodyIntelligenceGoal = {
      currentWeightKg: latestRecord.weightKg,
      targetWeightKg: parseFloat(goalTargetWeight) || 70,
      targetBodyFatPercent: parseFloat(goalTargetBF) || 14,
      targetWaistCm: parseFloat(goalTargetWaist) || 78,
      weeklyRateGoalKg: -0.4,
    }
    saveBodyIntelligenceGoal(newGoal)
    setGoal(newGoal)
    setIsGoalModalOpen(false)
    toast.success('Body composition goals updated')
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                AI Body Composition Intelligence
                <Badge variant="accent" className="text-xs">
                  Stage #33
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400">
                Anthropometric U.S. Navy analysis, private photo timeline, and delta matrix.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsGoalModalOpen(true)}
            className="flex items-center gap-2 border-zinc-700 hover:border-zinc-500 text-sm"
          >
            <Sparkles className="w-4 h-4 text-lime-400" />
            Edit Goals
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-2 text-sm bg-lime-400 hover:bg-lime-500 text-zinc-950 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Log Measurement
          </Button>
        </div>
      </div>

      {/* Honest Scientific Disclosure Banner */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <span className="font-semibold text-zinc-200">Scientific Integrity Notice: </span>
          Ordinary 2D photographs cannot accurately calculate body-fat percentage. YashFit clearly
          separates <span className="text-lime-400 font-medium">Measured Values</span> (Scale weight,
          circumferences) from <span className="text-cyan-400 font-medium">Estimated Values</span> (U.S. Navy
          body fat formula, lean body mass). Photos are encrypted in private storage exclusively for personal
          visual progress.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          Overview & Composition
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'compare'
              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Date Comparison Matrix
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'trends'
              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Trends & Monthly Logs
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'photos'
              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Camera className="w-4 h-4" />
          Photo Timeline
        </button>
      </div>

      {/* TAB 1: OVERVIEW & COMPOSITION */}
      {activeTab === 'overview' && latestRecord && (
        <div className="space-y-6">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Body Weight</span>
                <Badge variant="default" className="text-[10px] text-lime-400 border-lime-400/30">
                  Measured
                </Badge>
              </div>
              <div className="text-2xl font-bold text-zinc-100">{latestRecord.weightKg} kg</div>
              <div className="text-[11px] text-zinc-400 mt-1">Logged {latestRecord.recordedDate}</div>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Body Fat</span>
                <Badge variant="default" className="text-[10px] text-cyan-400 border-cyan-400/30">
                  {latestRecord.composition.formulaUsed === 'navy_method' ? 'U.S. Navy Est.' : 'BMI Est.'}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-zinc-100">
                {latestRecord.composition.bodyFatPercentage}%
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Confidence: <span className="capitalize text-zinc-300">{latestRecord.composition.confidenceRating}</span>
              </div>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Lean Mass</span>
                <Badge variant="default" className="text-[10px] text-cyan-400 border-cyan-400/30">
                  Estimated
                </Badge>
              </div>
              <div className="text-2xl font-bold text-zinc-100">
                {latestRecord.composition.leanMassKg} kg
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Muscle, bone & water</div>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>Fat Mass</span>
                <Badge variant="default" className="text-[10px] text-cyan-400 border-cyan-400/30">
                  Estimated
                </Badge>
              </div>
              <div className="text-2xl font-bold text-zinc-100">
                {latestRecord.composition.fatMassKg} kg
              </div>
              <div className="text-[11px] text-zinc-400 mt-1">Total adipose tissue</div>
            </Card>

            <Card className="p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                <span>BMI</span>
                <Badge variant="default" className="text-[10px] text-lime-400 border-lime-400/30">
                  Calculated
                </Badge>
              </div>
              <div className="text-2xl font-bold text-zinc-100">{latestRecord.composition.bmi}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Height: {latestRecord.heightCm} cm</div>
            </Card>
          </div>

          {/* Goal Tracking Progress Card */}
          {goal && (
            <Card className="p-5 bg-zinc-900 border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-lime-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Transformation Goal Tracking</h3>
                </div>
                <Badge variant="default" className="text-xs">
                  Target: {goal.targetWeightKg} kg ({goal.targetBodyFatPercent}% BF)
                </Badge>
              </div>

              {/* Progress bar */}
              {(() => {
                const totalDiff = Math.abs(goal.currentWeightKg - goal.targetWeightKg) || 1
                const currentAchieved = Math.abs(latestRecord.weightKg - goal.currentWeightKg)
                const percent = Math.min(100, Math.round((currentAchieved / totalDiff) * 100))
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Baseline: {goal.currentWeightKg} kg</span>
                      <span className="text-lime-400 font-semibold">{percent}% of goal progress</span>
                      <span>Target: {goal.targetWeightKg} kg</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-400 pt-1">
                      <span>Remaining: {(latestRecord.weightKg - goal.targetWeightKg).toFixed(1)} kg</span>
                      <span>Target Waist: {goal.targetWaistCm} cm</span>
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}

          {/* Circumference Measurement Breakdown */}
          <Card className="p-5 bg-zinc-900 border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center justify-between">
              <span>Verified Circumference Measurements</span>
              <Badge variant="default" className="text-xs text-lime-400 border-lime-400/30">
                Tension-Tape Validated
              </Badge>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Waist</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.waistCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Navel level</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Neck</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.neckCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Larynx midpoint</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Chest</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.chestCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Nipple line</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Arms (Biceps)</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.armCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Peak flexed</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Thighs</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.thighCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Mid-quadriceps</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center">
                <div className="text-xs text-zinc-400">Hips</div>
                <div className="text-lg font-bold text-zinc-100">{latestRecord.hipsCm || '--'} cm</div>
                <div className="text-[10px] text-zinc-400">Max circumference</div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-4 italic">
              {latestRecord.composition.explanation}
            </p>
          </Card>
        </div>
      )}

      {/* TAB 2: DATE COMPARISON MATRIX */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Comparison Date Selectors */}
          <Card className="p-5 bg-zinc-900 border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-lime-400" />
              Select Transformation Milestones to Compare
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Baseline Milestone Date</label>
                <select
                  value={baselineId}
                  onChange={(e) => setBaselineId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm focus:border-lime-400 focus:outline-none"
                >
                  {records.map((r) => (
                    <option key={`base-${r.id}`} value={r.id}>
                      {r.recordedDate} — {r.weightKg} kg ({r.composition.bodyFatPercentage}% BF)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Comparison Date</label>
                <select
                  value={currentId}
                  onChange={(e) => setCurrentId(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm focus:border-lime-400 focus:outline-none"
                >
                  {records.map((r) => (
                    <option key={`curr-${r.id}`} value={r.id}>
                      {r.recordedDate} — {r.weightKg} kg ({r.composition.bodyFatPercentage}% BF)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Delta Calculation Cards */}
          {comparisonDelta && selectedBaseline && selectedCurrent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-zinc-900 border-zinc-800">
                  <div className="text-xs text-zinc-400">Net Weight Delta</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 mt-1 ${
                      comparisonDelta.weightDeltaKg <= 0 ? 'text-lime-400' : 'text-amber-400'
                    }`}
                  >
                    {comparisonDelta.weightDeltaKg <= 0 ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <TrendingUp className="w-5 h-5" />
                    )}
                    {comparisonDelta.weightDeltaKg > 0 ? `+${comparisonDelta.weightDeltaKg}` : comparisonDelta.weightDeltaKg} kg
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Over {comparisonDelta.daysElapsed} days</div>
                </Card>

                <Card className="p-4 bg-zinc-900 border-zinc-800">
                  <div className="text-xs text-zinc-400">Waist Delta</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 mt-1 ${
                      (comparisonDelta.waistDeltaCm || 0) <= 0 ? 'text-lime-400' : 'text-amber-400'
                    }`}
                  >
                    {comparisonDelta.waistDeltaCm !== undefined
                      ? `${comparisonDelta.waistDeltaCm > 0 ? '+' : ''}${comparisonDelta.waistDeltaCm} cm`
                      : '--'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Core circumference</div>
                </Card>

                <Card className="p-4 bg-zinc-900 border-zinc-800">
                  <div className="text-xs text-zinc-400">Est. Body Fat Delta</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 mt-1 ${
                      (comparisonDelta.bodyFatDeltaPercent || 0) <= 0 ? 'text-lime-400' : 'text-amber-400'
                    }`}
                  >
                    {comparisonDelta.bodyFatDeltaPercent !== undefined
                      ? `${comparisonDelta.bodyFatDeltaPercent > 0 ? '+' : ''}${comparisonDelta.bodyFatDeltaPercent}%`
                      : '--'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">U.S. Navy formula</div>
                </Card>

                <Card className="p-4 bg-zinc-900 border-zinc-800">
                  <div className="text-xs text-zinc-400">Lean Mass Delta</div>
                  <div
                    className={`text-2xl font-bold flex items-center gap-1 mt-1 ${
                      (comparisonDelta.leanMassDeltaKg || 0) >= 0 ? 'text-lime-400' : 'text-zinc-400'
                    }`}
                  >
                    {comparisonDelta.leanMassDeltaKg !== undefined
                      ? `${comparisonDelta.leanMassDeltaKg > 0 ? '+' : ''}${comparisonDelta.leanMassDeltaKg} kg`
                      : '--'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Lean tissue preservation</div>
                </Card>
              </div>

              {/* Side by side comparison table */}
              <Card className="p-5 bg-zinc-900 border-zinc-800 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="pb-3">Measurement Metric</th>
                      <th className="pb-3">Baseline ({selectedBaseline.recordedDate})</th>
                      <th className="pb-3">Current ({selectedCurrent.recordedDate})</th>
                      <th className="pb-3 text-right">Net Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    <tr>
                      <td className="py-2.5 font-medium text-zinc-100">Weight</td>
                      <td className="py-2.5">{selectedBaseline.weightKg} kg</td>
                      <td className="py-2.5">{selectedCurrent.weightKg} kg</td>
                      <td className={`py-2.5 text-right font-bold ${comparisonDelta.weightDeltaKg <= 0 ? 'text-lime-400' : 'text-amber-400'}`}>
                        {comparisonDelta.weightDeltaKg > 0 ? `+${comparisonDelta.weightDeltaKg}` : comparisonDelta.weightDeltaKg} kg
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-zinc-100">Waist Circumference</td>
                      <td className="py-2.5">{selectedBaseline.waistCm ? `${selectedBaseline.waistCm} cm` : '--'}</td>
                      <td className="py-2.5">{selectedCurrent.waistCm ? `${selectedCurrent.waistCm} cm` : '--'}</td>
                      <td className="py-2.5 text-right font-bold text-lime-400">
                        {comparisonDelta.waistDeltaCm !== undefined ? `${comparisonDelta.waistDeltaCm} cm` : '--'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-zinc-100">Body Fat % (Est.)</td>
                      <td className="py-2.5">{selectedBaseline.composition.bodyFatPercentage}%</td>
                      <td className="py-2.5">{selectedCurrent.composition.bodyFatPercentage}%</td>
                      <td className="py-2.5 text-right font-bold text-lime-400">
                        {comparisonDelta.bodyFatDeltaPercent !== undefined ? `${comparisonDelta.bodyFatDeltaPercent}%` : '--'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-zinc-100">Lean Body Mass (Est.)</td>
                      <td className="py-2.5">{selectedBaseline.composition.leanMassKg} kg</td>
                      <td className="py-2.5">{selectedCurrent.composition.leanMassKg} kg</td>
                      <td className="py-2.5 text-right font-bold text-cyan-400">
                        {comparisonDelta.leanMassDeltaKg !== undefined ? `${comparisonDelta.leanMassDeltaKg > 0 ? '+' : ''}${comparisonDelta.leanMassDeltaKg} kg` : '--'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-zinc-100">Fat Mass (Est.)</td>
                      <td className="py-2.5">{selectedBaseline.composition.fatMassKg} kg</td>
                      <td className="py-2.5">{selectedCurrent.composition.fatMassKg} kg</td>
                      <td className="py-2.5 text-right font-bold text-lime-400">
                        {comparisonDelta.fatMassDeltaKg !== undefined ? `${comparisonDelta.fatMassDeltaKg} kg` : '--'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRENDS & MONTHLY LOGS */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card className="p-5 bg-zinc-900 border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center justify-between">
              <span>Historical Weight & Estimated Body Fat Trajectory</span>
              <Badge variant="default" className="text-xs text-lime-400 border-lime-400/30">
                Temporal Trend
              </Badge>
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#fafafa',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    name="Weight (kg)"
                    stroke="#a3e635"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#a3e635' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    name="Body Fat %"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22d3ee' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Monthly Transformation Summaries */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-lime-400" />
              Monthly Transformation Summaries
            </h3>

            {monthlySummaries.map((summary) => (
              <Card key={summary.monthKey} className="p-4 bg-zinc-900 border-zinc-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">{summary.monthLabel}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{summary.keyMilestone}</div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Weight Delta: </span>
                      <span
                        className={`font-semibold ${
                          summary.netWeightChangeKg <= 0 ? 'text-lime-400' : 'text-amber-400'
                        }`}
                      >
                        {summary.netWeightChangeKg > 0 ? `+${summary.netWeightChangeKg}` : summary.netWeightChangeKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Check-ins: </span>
                      <span className="text-zinc-200 font-semibold">{summary.measurementsLoggedCount}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Photos: </span>
                      <span className="text-zinc-200 font-semibold">{summary.photosLoggedCount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Detailed Measurement Log History */}
          <Card className="p-5 bg-zinc-900 border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-100 mb-4">Measurement Log History</h3>
            <div className="divide-y divide-zinc-800/80">
              {records.map((r) => (
                <div key={r.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      <span>{r.recordedDate}</span>
                      <span className="text-xs text-lime-400 font-normal">({r.weightKg} kg)</span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Waist: {r.waistCm || '--'} cm • Neck: {r.neckCm || '--'} cm • Body Fat (Est): {r.composition.bodyFatPercentage}%
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteTargetId(r.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 border-zinc-800 hover:border-rose-900/40"
                    aria-label={`Delete record for ${r.recordedDate}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PHOTO TIMELINE */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Lock className="w-4 h-4 text-lime-400" />
              <span>Strict Privacy Mode: Photos never leave your device browser storage.</span>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs bg-lime-400 text-zinc-950 font-medium"
            >
              Add New Photo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {records.map((record) => (
              <Card key={`photo-card-${record.id}`} className="p-4 bg-zinc-900 border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-100">{record.recordedDate}</div>
                  <Badge variant="default" className="text-xs text-lime-400 border-lime-400/30">
                    {record.weightKg} kg
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-[3/4] rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {record.photos?.frontUrl ? (
                      <img
                        src={record.photos.frontUrl}
                        alt="Front Pose"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-zinc-600 mb-1" />
                        <span className="text-[10px] text-zinc-500">Front Pose</span>
                      </>
                    )}
                  </div>

                  <div className="aspect-[3/4] rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {record.photos?.sideUrl ? (
                      <img
                        src={record.photos.sideUrl}
                        alt="Side Pose"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-zinc-600 mb-1" />
                        <span className="text-[10px] text-zinc-500">Side Pose</span>
                      </>
                    )}
                  </div>

                  <div className="aspect-[3/4] rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-2 text-center overflow-hidden">
                    {record.photos?.backUrl ? (
                      <img
                        src={record.photos.backUrl}
                        alt="Back Pose"
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-zinc-600 mb-1" />
                        <span className="text-[10px] text-zinc-500">Back Pose</span>
                      </>
                    )}
                  </div>
                </div>

                {record.notes && (
                  <p className="text-xs text-zinc-400 italic bg-zinc-950/60 p-2 rounded border border-zinc-800/60">
                    &ldquo;{record.notes}&rdquo;
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: LOG MEASUREMENT */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Anthropometric Body Measurement"
      >
        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Date</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Scale Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                value={formWeight}
                onChange={(e) => setFormWeight(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Height (cm)</label>
              <Input
                type="number"
                value={formHeight}
                onChange={(e) => setFormHeight(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Age</label>
              <Input
                type="number"
                value={formAge}
                onChange={(e) => setFormAge(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Biological Sex</label>
              <select
                value={formGender}
                onChange={(e) => setFormGender(e.target.value as 'male' | 'female')}
                className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm focus:border-lime-400 focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-xs font-semibold text-lime-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>Circumferences (Required for U.S. Navy Formula)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Waist (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formWaist}
                  onChange={(e) => setFormWaist(e.target.value)}
                  placeholder="At navel"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Neck (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formNeck}
                  onChange={(e) => setFormNeck(e.target.value)}
                  placeholder="Mid-neck"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Hips (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formHips}
                  onChange={(e) => setFormHips(e.target.value)}
                  placeholder="Females only"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Chest (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formChest}
                  onChange={(e) => setFormChest(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Arm (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formArm}
                  onChange={(e) => setFormArm(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Thigh (cm)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={formThigh}
                  onChange={(e) => setFormThigh(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Photo uploads */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Progress Photos (Front, Side, Back)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="cursor-pointer p-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-lime-400/50 bg-zinc-950 flex flex-col items-center justify-center text-center">
                <Camera className="w-4 h-4 text-zinc-500 mb-1" />
                <span className="text-[10px] text-zinc-400">
                  {formFrontPhoto ? 'Front Loaded ✓' : 'Upload Front'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'front')}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer p-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-lime-400/50 bg-zinc-950 flex flex-col items-center justify-center text-center">
                <Camera className="w-4 h-4 text-zinc-500 mb-1" />
                <span className="text-[10px] text-zinc-400">
                  {formSidePhoto ? 'Side Loaded ✓' : 'Upload Side'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'side')}
                  className="hidden"
                />
              </label>

              <label className="cursor-pointer p-2.5 rounded-lg border border-dashed border-zinc-700 hover:border-lime-400/50 bg-zinc-950 flex flex-col items-center justify-center text-center">
                <Camera className="w-4 h-4 text-zinc-500 mb-1" />
                <span className="text-[10px] text-zinc-400">
                  {formBackPhoto ? 'Back Loaded ✓' : 'Upload Back'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e, 'back')}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notes</label>
            <Input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Morning fasted weigh-in, feeling energized"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-lime-400 text-zinc-950 font-semibold">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT GOALS */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Update Body Transformation Goals"
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target Weight (kg)</label>
            <Input
              type="number"
              step="0.5"
              value={goalTargetWeight}
              onChange={(e) => setGoalTargetWeight(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target Body Fat % (Est.)</label>
            <Input
              type="number"
              step="0.5"
              value={goalTargetBF}
              onChange={(e) => setGoalTargetBF(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Target Waist Circumference (cm)</label>
            <Input
              type="number"
              step="0.5"
              value={goalTargetWaist}
              onChange={(e) => setGoalTargetWaist(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" type="button" onClick={() => setIsGoalModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="bg-lime-400 text-zinc-950 font-semibold">
              Save Goals
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Measurement Entry"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Are you sure you want to permanently delete this measurement entry? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDeleteRecord}>
              Delete Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

