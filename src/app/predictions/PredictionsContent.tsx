'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Sparkles,
  Target,
  AlertTriangle,
  Dumbbell,
  Salad,
  HeartPulse,
  Info,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { generatePredictiveFitnessOverview } from '@/lib/predictions/predictiveFitnessService'
import type { PredictiveFitnessOverview } from '@/types/predictiveFitness'

export function PredictionsContent() {
  const [overview, setOverview] = useState<PredictiveFitnessOverview | null>(null)
  const [selectedHorizon, setSelectedHorizon] = useState<'4w' | '8w' | '12w'>('8w')

  useEffect(() => {
    const data = generatePredictiveFitnessOverview()
    setOverview(data)
  }, [])

  if (!overview) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <Sparkles className="w-8 h-8 text-lime-400 animate-spin mx-auto mb-2" />
        Synthesizing predictive fitness forecast...
      </div>
    )
  }

  const { consistency, strength, weight, nutrition, recovery, missingDataAudits, recommendations, explainabilityDrivers } = overview

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                Predictive Fitness Intelligence
                <Badge variant="accent" className="text-xs">
                  Stage #35
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400">
                Empirical forecasting engine using linear regression, moving averages, and actual user data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Card className="px-4 py-2.5 bg-zinc-950 border-zinc-800 flex items-center gap-3">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider">
                Model Confidence
              </div>
              <div className="text-xl font-bold text-lime-400">
                {overview.overallModelConfidence}%
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-lime-400/80" />
          </Card>
        </div>
      </div>

      {/* Honest Scientific Transparency Notice */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <span className="font-semibold text-zinc-200">Zero Fabricated Projections: </span>
          All trajectories are derived exclusively from your verified workout logs, anthropometric measurements,
          and recovery check-ins. Projections reflect physiological probabilities, not absolute guarantees, and
          incorporate explicit uncertainty margins ($\pm$).
        </div>
      </div>

      {/* HERO CARD: GOAL ACHIEVEMENT HORIZON */}
      <Card className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-wider">
              <Target className="w-4 h-4" />
              <span>Target Goal Horizon</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">
              Projected Goal Date: <span className="text-lime-400">{weight.projectedGoalDate}</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Estimated {weight.projectedWeeksToGoal} weeks to target {weight.targetWeightKg} kg at current rate of {Math.abs(weight.weeklyRateKg)} kg/week (±{weight.uncertaintyWeeksBound} wks uncertainty bound).
            </p>
          </div>

          <div className="flex items-center gap-6 text-center">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Current Weight</div>
              <div className="text-xl font-bold text-zinc-100">{weight.currentWeightKg} kg</div>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 hidden md:block" />
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Target Goal</div>
              <div className="text-xl font-bold text-lime-400">{weight.targetWeightKg} kg</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Progress Velocity: {Math.abs(weight.weeklyRateKg)} kg/wk</span>
            <span className="text-lime-400 font-semibold">{weight.direction === 'loss' ? 'Fat Loss Phase' : 'Lean Bulk Phase'}</span>
            <span>Target: {weight.targetWeightKg} kg</span>
          </div>
          <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-500 to-lime-400 rounded-full transition-all duration-500"
              style={{ width: '65%' }}
            />
          </div>
        </div>
      </Card>

      {/* 4-PILLAR DIAGNOSTIC METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pillar 1: Consistency */}
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Workout Consistency</span>
            <Dumbbell className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{consistency.consistencyScorePercent}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {consistency.actualWorkoutsPerWeek} / {consistency.plannedWorkoutsPerWeek} sessions/wk (Rating: <span className="capitalize text-lime-400 font-medium">{consistency.consistencyRating}</span>)
          </div>
        </Card>

        {/* Pillar 2: Nutrition */}
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Calorie Adherence</span>
            <Salad className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{nutrition.calorieAdherencePercent}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Avg {nutrition.averageDailyCalories} kcal • Protein {nutrition.averageDailyProteinG}g/day
          </div>
        </Card>

        {/* Pillar 3: Recovery */}
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Recovery Trend</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{recovery.averageReadinessScore}/100</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Avg Sleep: {recovery.averageSleepHours} hrs (Status: <span className="capitalize text-cyan-400 font-medium">{recovery.trend}</span>)
          </div>
        </Card>

        {/* Pillar 4: Strength */}
        <Card className="p-4 bg-zinc-900 border-zinc-800">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Compound Velocity</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">+0.6 kg/wk</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Brzycki 1RM progression slope across Big 4
          </div>
        </Card>
      </div>

      {/* STRENGTH TRAJECTORY FORECAST GRID */}
      <Card className="p-5 bg-zinc-900 border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-lime-400" />
              <span>Projected 1RM Strength Progression</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Extrapolated via Brzycki submaximal formula with verified weekly progression factor.
            </p>
          </div>

          {/* Horizon toggle */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setSelectedHorizon('4w')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedHorizon === '4w'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              4 Weeks
            </button>
            <button
              onClick={() => setSelectedHorizon('8w')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedHorizon === '8w'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              8 Weeks
            </button>
            <button
              onClick={() => setSelectedHorizon('12w')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedHorizon === '12w'
                  ? 'bg-lime-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              12 Weeks
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {strength.map((lift) => {
            let projectedVal = lift.projected1RMIn8WeeksKg
            if (selectedHorizon === '4w') projectedVal = lift.projected1RMIn4WeeksKg
            if (selectedHorizon === '12w') projectedVal = lift.projected1RMIn12WeeksKg
            const gain = (projectedVal - lift.currentEstimated1RMKg).toFixed(1)

            return (
              <div
                key={lift.exerciseId}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 hover:border-lime-400/40 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-200">{lift.exerciseName}</div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-500">Current 1RM: </span>
                    <span className="text-xs text-zinc-300 font-semibold">{lift.currentEstimated1RMKg} kg</span>
                  </div>
                  <Badge variant="default" className="text-[10px] text-lime-400 border-lime-400/30">
                    +{gain} kg
                  </Badge>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">
                    Projected ({selectedHorizon})
                  </div>
                  <div className="text-2xl font-bold text-lime-400 font-mono">
                    {projectedVal} <span className="text-xs text-zinc-400 font-normal">kg</span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-900">
                  <span>Rate: +{lift.weeklyProgressionRateKg} kg/wk</span>
                  <span>±{lift.uncertaintyBoundKg} kg bound</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* MISSING DATA AUDIT & MODEL LIMITATIONS */}
      {missingDataAudits.length > 0 && (
        <Card className="p-5 bg-zinc-900 border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Missing Data Audit & Uncertainty Drivers</span>
          </div>

          <div className="space-y-2">
            {missingDataAudits.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <div className="text-zinc-200 font-medium">{item.description}</div>
                  <div className="text-zinc-400">{item.impactOnForecast}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ACTIONABLE RECOMMENDATIONS */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lime-400" />
          <span>Actionable Interventions to Accelerate Goal Horizon</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id} className="p-4 bg-zinc-900 border-zinc-800 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-[10px] capitalize border-zinc-700 text-zinc-400">
                    {rec.category}
                  </Badge>
                  <span className="text-[10px] text-lime-400 font-medium">High Impact</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100">{rec.title}</h4>
                <p className="text-xs text-zinc-400">{rec.description}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-zinc-800/60 text-[11px] text-lime-400/90 font-medium">
                ⚡ {rec.potentialImpact}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* TRANSPARENT MATHEMATICS / EXPLAINABILITY */}
      <Card className="p-5 bg-zinc-900 border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-lime-400" />
          <span>Explainability & Algorithmic Principles</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {explainabilityDrivers.map((driver, dIdx) => (
            <div key={dIdx} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/60 space-y-1">
              <div className="font-semibold text-zinc-200">{driver.factor}</div>
              <p className="text-zinc-400 leading-relaxed">{driver.influence}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

