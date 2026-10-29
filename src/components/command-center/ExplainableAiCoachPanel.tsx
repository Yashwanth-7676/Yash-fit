'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Card, Badge, Button } from '@/components/ui'
import {
  Send,
  Bot,
  User,
  ArrowRight,
  Info,
  Dumbbell,
  Lightbulb,
  Utensils,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { AiCoachMessage, StructuredCoachResponse } from '@/types/commandCenter'
import type { CoachUserContext } from '@/lib/ai/providers'

interface ExplainableAiCoachPanelProps {
  context: CoachUserContext
}

const PRESET_PROMPTS = [
  { label: 'Summarize my recent progress', icon: <TrendingUp size={12} /> },
  { label: 'What should my next workout be?', icon: <Dumbbell size={12} /> },
  { label: 'Why did my workout performance change?', icon: <AlertCircle size={12} /> },
  { label: 'Suggest high-protein Indian meals', icon: <Utensils size={12} /> },
  { label: 'Check for inconsistencies in my tracking', icon: <Lightbulb size={12} /> },
]

export function ExplainableAiCoachPanel({ context }: ExplainableAiCoachPanelProps) {
  const [messages, setMessages] = useState<AiCoachMessage[]>([
    {
      id: 'msg-initial',
      sender: 'coach',
      text: "I am your YashFit AI Coach. I analyze your verified workout history, recovery check-ins, hydration, and nutrition adherence to provide explainable recommendations.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      structured: {
        recommendation: 'Ask any question or tap a quick analysis prompt below to review your current training state.',
        supportingData: `${context.workouts.length} recorded workouts, ${context.recovery.length} recovery check-ins.`,
        explanation: 'All insights are synthesized deterministically from your actual logs or configured AI providers with zero fabricated metrics.',
        nextAction: 'Select a question prompt to get started.',
        actionHref: '/command-center',
        limitations: 'Fitness recommendations are educational and not a replacement for clinical sports medicine consultation.',
        provider: 'rule_based',
      },
    },
  ])

  const [inputQuery, setInputQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (queryToSend: string) => {
    const q = queryToSend.trim()
    if (!q || isLoading) return

    const userMessage: AiCoachMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputQuery('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, context }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success && data.response) {
          const structured: StructuredCoachResponse = data.response
          const coachMessage: AiCoachMessage = {
            id: `coach-${Date.now()}`,
            sender: 'coach',
            text: structured.recommendation,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            structured,
          }
          setMessages((prev) => [...prev, coachMessage])
        } else {
          throw new Error('Invalid response structure')
        }
      } else {
        throw new Error('API request failed')
      }
    } catch {
      // Graceful local fallback
      const fallbackStructured: StructuredCoachResponse = {
        recommendation: 'Continue following your scheduled routine while maintaining recovery hygiene.',
        supportingData: `${context.workouts.length} logged workouts. Active streak is ${context.activeStreak} days.`,
        explanation: 'Consistent mechanical tension and progressive overload drive predictable body composition progress.',
        nextAction: 'Review your next scheduled workout session.',
        actionHref: '/workout',
        limitations: 'Calculated using local rule-based fallback.',
        provider: 'rule_based',
      }

      const coachMessage: AiCoachMessage = {
        id: `coach-fallback-${Date.now()}`,
        sender: 'coach',
        text: fallbackStructured.recommendation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        structured: fallbackStructured,
      }
      setMessages((prev) => [...prev, coachMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={17} className="text-lime-400" />
            <h3 className="text-sm font-semibold text-white">Explainable AI Fitness Coach</h3>
            <Badge variant="accent">Configurable</Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Transparent explanations with real supporting data, limitations, and practical actions
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <Info size={12} className="text-zinc-400" />
          <span>No unverified predictions · Strict privacy</span>
        </div>
      </div>

      {/* Preset quick prompts */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESET_PROMPTS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(preset.label)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800/80 hover:bg-zinc-800 hover:text-lime-300 text-zinc-300 border border-zinc-700/60 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-lime-400">{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'

          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} className="text-lime-400" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-2.5 ${
                  isUser
                    ? 'bg-zinc-800 text-white rounded-tr-none'
                    : 'bg-zinc-950 border border-zinc-800/80 text-zinc-200 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] text-zinc-500">
                  <span className="font-semibold text-zinc-400">
                    {isUser ? 'You' : 'YashFit AI Coach'}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isUser && msg.structured?.provider && (
                      <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase font-mono text-[9px]">
                        {msg.structured.provider === 'rule_based' ? 'Rule-Based Engine' : `AI: ${msg.structured.provider}`}
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed font-medium text-white">
                  {msg.text}
                </p>

                {/* 5-Field Explainable Breakdown */}
                {!isUser && msg.structured && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2 text-[11px]">
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/70 space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block">
                        Supporting Recorded Data
                      </span>
                      <p className="text-zinc-300 font-mono text-[11px]">
                        {msg.structured.supportingData}
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/70 space-y-1">
                      <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] block">
                        Scientific Reason
                      </span>
                      <p className="text-zinc-300 leading-relaxed">
                        {msg.structured.explanation}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div>
                        <span className="font-bold text-lime-400 uppercase tracking-wider text-[10px] block">
                          Next Action
                        </span>
                        <p className="text-white font-medium">
                          {msg.structured.nextAction}
                        </p>
                      </div>

                      {msg.structured.actionHref && (
                        <Link
                          href={msg.structured.actionHref}
                          className="shrink-0 text-xs font-semibold text-lime-400 hover:text-lime-300 flex items-center gap-1 underline"
                        >
                          Take Action <ArrowRight size={12} />
                        </Link>
                      )}
                    </div>

                    <div className="text-[10px] text-zinc-500 pt-1 flex items-start gap-1">
                      <Info size={11} className="mt-0.5 shrink-0" />
                      <span>{msg.structured.limitations}</span>
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} className="text-zinc-300" />
                </div>
              )}
            </div>
          )
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs justify-start items-center text-zinc-400 py-2">
            <div className="w-7 h-7 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center shrink-0">
              <Bot size={15} className="text-lime-400 animate-pulse" />
            </div>
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-lime-400" />
              <span>Synthesizing logged data and evidence-based recommendations…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(inputQuery)
        }}
        className="flex items-center gap-2 pt-2 border-t border-zinc-800"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask about your workout consistency, recovery, protein target, or meal ideas…"
          disabled={isLoading}
          maxLength={500}
          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-lime-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors"
        />
        <Button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          icon={isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        >
          Ask Coach
        </Button>
      </form>
    </Card>
  )
}

