'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Share2,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import {
  buildFitnessIntelligenceSnapshot,
  type IntelligenceInputData,
} from '@/lib/fitness-intelligence/intelligenceGraphService'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import { getSavedPerformanceLogs } from '@/lib/performance-lab/performanceLabService'
import type {
  IntelligenceSnapshot,
  IntelligenceNodeId,
} from '@/types/fitnessIntelligence'

// Node positions on a 600x400 normalized SVG plane
const NODE_COORDINATES: Record<IntelligenceNodeId, { x: number; y: number }> = {
  volume: { x: 150, y: 110 },
  strength: { x: 90, y: 220 },
  consistency: { x: 190, y: 310 },
  nutrition: { x: 440, y: 100 },
  protein: { x: 520, y: 190 },
  hydration: { x: 460, y: 300 },
  sleep: { x: 300, y: 70 },
  recovery: { x: 300, y: 200 },
  body_composition: { x: 350, y: 320 },
  performance_lab: { x: 110, y: 340 },
}

export function FitnessIntelligenceContent() {
  const [selectedNodeId, setSelectedNodeId] = useState<IntelligenceNodeId | null>('recovery')
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>('edge-sleep-recovery')
  const [snapshot, setSnapshot] = useState<IntelligenceSnapshot | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const ctx = await buildCoachContext('demo-user')
        const performanceLogs = getSavedPerformanceLogs()

        const inputData: IntelligenceInputData = {
          profile: ctx.profile,
          workouts: ctx.workouts,
          recovery: ctx.recovery,
          measurements: ctx.recentMeasurements || [],
          performanceLogs,
          nutritionPlan: ctx.nutritionPlan || null,
          waterLoggedLiters: ctx.waterLoggedLiters || 2.6,
          waterTargetLiters: ctx.waterTargetLiters || 3.5,
          activeStreak: ctx.activeStreak || 5,
        }

        const built = buildFitnessIntelligenceSnapshot(inputData)
        setSnapshot(built)
      } catch {
        // fallback
      }
    }
    loadData()
  }, [])

  const activeNode = useMemo(() => {
    if (!snapshot || !selectedNodeId) return null
    return snapshot.nodes.find((n) => n.id === selectedNodeId) || snapshot.nodes[0]
  }, [snapshot, selectedNodeId])

  const activeEdge = useMemo(() => {
    if (!snapshot || !selectedEdgeId) return null
    return snapshot.edges.find((e) => e.id === selectedEdgeId) || snapshot.edges[0]
  }, [snapshot, selectedEdgeId])

  if (!snapshot) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-zinc-500 font-mono text-sm animate-pulse">
        Synthesizing Fitness Intelligence Graph...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">Fitness Knowledge Graph</Badge>
            <span className="text-xs text-zinc-400 font-mono">Multivariate Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Personal Fitness Intelligence Graph
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Connected multi-dimensional mapping of workout volume, recovery, nutrition, and performance tests with scientific correlation vs causation distinction.
          </p>
        </div>

        {/* Data Completeness Pill */}
        <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Ecosystem Completeness</span>
            <span className="text-base font-extrabold text-lime-400 font-mono leading-none">
              {snapshot.overallDataCompletenessPct}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 text-lime-400">
            <Share2 size={18} />
          </div>
        </div>
      </div>

      {/* Interactive Visual Network Graph & Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: SVG Network Graph */}
        <div className="lg:col-span-2">
          <Card className="p-4 sm:p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 size={16} className="text-lime-400" />
                <h3 className="text-sm font-bold text-white">Interactive Telemetry Graph</h3>
              </div>
              <span className="text-[11px] text-zinc-400">Click any node or relationship link</span>
            </div>

            {/* SVG Visualizer Canvas */}
            <div className="relative w-full aspect-[4/3] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 600 400" className="w-full h-full">
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.4" />
                  </pattern>
                </defs>
                <rect width="600" height="400" fill="url(#grid)" />

                {/* Edges */}
                {snapshot.edges.map((edge) => {
                  const src = NODE_COORDINATES[edge.source]
                  const tgt = NODE_COORDINATES[edge.target]
                  const isSelected = selectedEdgeId === edge.id
                  const isConnected = selectedNodeId === edge.source || selectedNodeId === edge.target

                  return (
                    <g key={edge.id} onClick={() => setSelectedEdgeId(edge.id)} className="cursor-pointer">
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={tgt.x}
                        y2={tgt.y}
                        stroke={isSelected ? '#a3e635' : isConnected ? '#ffffff' : '#3f3f46'}
                        strokeWidth={isSelected ? 3 : isConnected ? 2 : 1.2}
                        strokeDasharray={edge.relationshipStrength === 'insufficient_data' ? '4 4' : undefined}
                        strokeOpacity={isSelected ? 0.95 : isConnected ? 0.7 : 0.35}
                      />
                      {/* Edge correlation pill */}
                      <circle
                        cx={(src.x + tgt.x) / 2}
                        cy={(src.y + tgt.y) / 2}
                        r={12}
                        fill="#09090b"
                        stroke={isSelected ? '#a3e635' : '#27272a'}
                        strokeWidth={1.5}
                      />
                      <text
                        x={(src.x + tgt.x) / 2}
                        y={(src.y + tgt.y) / 2 + 3}
                        textAnchor="middle"
                        fontSize={8}
                        fontFamily="monospace"
                        fill={isSelected ? '#a3e635' : '#a1a1aa'}
                      >
                        {edge.correlationCoeff >= 0 ? `+${edge.correlationCoeff}` : edge.correlationCoeff}
                      </text>
                    </g>
                  )
                })}

                {/* Nodes */}
                {snapshot.nodes.map((node) => {
                  const coord = NODE_COORDINATES[node.id]
                  const isSelected = selectedNodeId === node.id

                  let nodeColor = '#3f3f46'
                  if (node.category === 'training') nodeColor = '#38bdf8' // Sky
                  if (node.category === 'recovery') nodeColor = '#a3e635' // Lime
                  if (node.category === 'nutrition') nodeColor = '#f59e0b' // Amber
                  if (node.category === 'physiology') nodeColor = '#c084fc' // Purple

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className="cursor-pointer transition-transform duration-200"
                    >
                      {/* Halo ring when selected */}
                      {isSelected && (
                        <circle cx={coord.x} cy={coord.y} r={28} fill="none" stroke={nodeColor} strokeWidth={2} opacity={0.5} className="animate-pulse" />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r={20}
                        fill="#18181b"
                        stroke={nodeColor}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                      />

                      {/* Node Label */}
                      <text
                        x={coord.x}
                        y={coord.y + 4}
                        textAnchor="middle"
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        fill="#ffffff"
                      >
                        {node.label.slice(0, 4).toUpperCase()}
                      </text>

                      {/* Full label below */}
                      <text
                        x={coord.x}
                        y={coord.y + 32}
                        textAnchor="middle"
                        fontSize={9}
                        fontFamily="sans-serif"
                        fill={isSelected ? '#ffffff' : '#71717a'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                      >
                        {node.label}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Legend strip */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 flex-wrap gap-2 pt-1 border-t border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Training</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-400" />
                  <span>Recovery</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Nutrition</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Physiology</span>
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Numbers on links indicate Pearson correlation (r)</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Node / Edge Inspector Card */}
        <div className="space-y-4">
          {activeNode && (
            <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    {activeNode.category} Domain
                  </span>
                  <h3 className="text-base font-bold text-white">{activeNode.label}</h3>
                </div>
                <Badge
                  variant={
                    activeNode.status === 'optimal'
                      ? 'accent'
                      : activeNode.status === 'needs_attention'
                      ? 'danger'
                      : 'default'
                  }
                >
                  {activeNode.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Current Value */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Current Verified Metric</span>
                <p className="text-lg font-extrabold text-lime-400 font-mono">{activeNode.currentValueFormatted}</p>
              </div>

              {/* Data Attribution */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-zinc-300 block">Data Sources & Attribution:</span>
                <div className="space-y-1">
                  {activeNode.dataSources.map((src, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-zinc-400">
                      <CheckCircle2 size={13} className="text-lime-400 shrink-0" />
                      <span>{src}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-zinc-500 font-mono block pt-1">
                  {activeNode.dataPointsCount} data points examined
                </span>
              </div>
            </Card>
          )}

          {activeEdge && (
            <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Relationship Link
                </span>
                <span className="text-xs font-mono font-bold text-lime-400">
                  r = {activeEdge.correlationCoeff >= 0 ? `+${activeEdge.correlationCoeff}` : activeEdge.correlationCoeff}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {activeEdge.description}
              </p>

              {/* Scientific Distinction Banner */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <span className="font-semibold text-amber-300 block">Correlation vs Causation Boundary:</span>
                <p className="leading-normal">{activeEdge.distinctionNote}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Causal Distinction Insights Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Empirical Causal Insights & Discoveries</h2>
            <p className="text-xs text-zinc-400">Scientifically bounded patterns discovered across your fitness telemetry.</p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{snapshot.insights.length} active insights</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.insights.map((insight) => (
            <Card
              key={insight.id}
              className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{insight.category.replace('_', ' ').toUpperCase()}</Badge>
                  <span className="text-[11px] font-mono font-semibold text-lime-400">
                    {insight.correlationMagnitude}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">{insight.title}</h3>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {insight.observedPattern}
                </p>

                {/* Data Examined */}
                <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-0.5">
                  <span className="font-semibold text-zinc-300 block">Examined Records:</span>
                  <p>{insight.examinedRecordsDescription}</p>
                </div>

                {/* What CANNOT be concluded (Crucial scientific honesty) */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 space-y-0.5">
                  <span className="font-semibold text-amber-400 block flex items-center gap-1">
                    <AlertTriangle size={12} />
                    What Cannot Be Concluded:
                  </span>
                  <p>{insight.whatCannotBeConcluded}</p>
                </div>
              </div>

              {/* Actionable Next Step with Link */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px] truncate max-w-[240px]">
                  {insight.actionableNextStep}
                </span>
                <Link href={insight.relatedHref}>
                  <button
                    type="button"
                    className="text-xs text-lime-400 hover:text-white font-medium flex items-center gap-1 transition-colors shrink-0"
                  >
                    <span>Execute</span>
                    <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Missing Data & Statistical Confidence Checklist */}
      {snapshot.missingDataSummaries.length > 0 && (
        <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Info size={16} />
            <h3 className="text-sm font-bold">Recommended Tracking Gaps for Statistical Confidence</h3>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            YashFit Intelligence strictly requires at least 3 to 5 real records before inferring statistical correlation. Logging the following items will unlock deeper personal insights:
          </p>

          <ul className="space-y-1.5 text-xs text-zinc-300">
            {snapshot.missingDataSummaries.map((gap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
