'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Send,
  Trash2,
  Download,
  Bot,
  User,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
  CheckCircle2,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, Badge, Button, Input, useToast } from '@/components/ui'
import type { CoachChatMessage } from '@/types/coach'
import type { StructuredCoachResponse } from '@/types/commandCenter'

const PRESET_QUERIES = [
  'Analyze my recent performance trend',
  'What should my next workout be and why?',
  'How is my recovery tracking and should I deload?',
  'Recommend high-protein Indian meals fitting my budget',
  'Explain recent training adaptations made by Autopilot',
  'Review my body measurement changes',
  'Check for inconsistencies in my tracking habits',
]

const LOCAL_STORAGE_KEY = 'yashfit_coach_chat_history'

export function CoachContent() {
  const toast = useToast()
  const [messages, setMessages] = useState<CoachChatMessage[]>([])
  const [inputQuery, setInputQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setMessages(JSON.parse(stored))
      } else {
        // Welcome default message
        const welcome: CoachChatMessage = {
          id: 'msg-welcome',
          role: 'assistant',
          content:
            'Welcome to YashFit Personal AI Coach 2.0. I reason across your verified workout logs, recovery check-ins, Indian nutrition planner, and body transformation measurements. How can I guide your training today?',
          timestamp: Date.now(),
          metadata: {
            provider: 'rule_based',
            suggestions: [
              'Ask for recovery evaluation and deload advice.',
              'Request affordable regional Indian meal alternatives.',
              'Review recent strength trajectories.',
            ],
            limitations:
              'Synthesized from your logged YashFit records. Recommendations are for athletic guidance and do not replace professional medical advice.',
          },
        }
        setMessages([welcome])
      }
    } catch {
      // ignore
    }
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const saveHistory = (updated: CoachChatMessage[]) => {
    setMessages(updated)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim()
    if (!text || loading) return

    setInputQuery('')
    const userMsg: CoachChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    const nextMessages = [...messages, userMsg]
    saveHistory(nextMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, userId: 'demo-user' }),
      })

      if (!res.ok) {
        throw new Error('Coach API request failed')
      }

      const data = await res.json()
      const structured: StructuredCoachResponse = data.response

      const coachMsg: CoachChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: structured.recommendation,
        timestamp: Date.now(),
        metadata: {
          provider: structured.provider,
          facts: structured.facts,
          calculations: structured.calculations,
          estimates: structured.estimates,
          suggestions: structured.suggestions,
          missingData: structured.missingData,
          actionHref: structured.actionHref,
          actionLabel: structured.nextAction,
          limitations: structured.limitations,
        },
      }

      saveHistory([...nextMessages, coachMsg])
    } catch (err) {
      toast.showToast({
        title: 'Error contacting AI Coach',
        message: 'Could not fetch response. Please try again.',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setMessages([])
    toast.showToast({
      title: 'Chat History Cleared',
      message: 'Conversation transcript has been reset.',
      type: 'info',
    })
  }

  const handleExportTranscript = () => {
    const transcript = messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role === 'user' ? 'YOU' : 'COACH'}: ${m.content}\n` +
          (m.metadata?.actionLabel ? `Action: ${m.metadata.actionLabel} (${m.metadata.actionHref})\n` : '')
      )
      .join('\n---\n\n')

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-coach-transcript-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400 flex items-center justify-center shadow-lg shadow-lime-400/10">
            <Bot size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">YashFit AI Coach 2.0</h1>
              <Badge variant="accent" className="text-[10px]">
                Multi-Turn Intelligence
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Evidence-based athletic reasoning with distinct facts, calculations, estimates, and Indian meal science.
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportTranscript}
            title="Export Transcript"
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition text-xs flex items-center gap-1.5"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-zinc-800 transition text-xs flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
          Key Coach Consultations
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PRESET_QUERIES.map((query, i) => (
            <button
              key={i}
              onClick={() => handleSendQuery(query)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-lime-400/40 hover:bg-zinc-850 whitespace-nowrap transition cursor-pointer disabled:opacity-50"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Thread */}
      <Card className="p-4 sm:p-6 bg-zinc-950 border-zinc-800 min-h-[460px] max-h-[620px] overflow-y-auto space-y-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 space-y-3 ${
                msg.role === 'user'
                  ? 'bg-lime-400 text-black font-medium text-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-white'
              }`}
            >
              {/* Provider tag for Assistant */}
              {msg.role === 'assistant' && msg.metadata?.provider && (
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-1 border-b border-zinc-800/80">
                  <span className="font-mono uppercase">
                    Provider: {msg.metadata.provider === 'rule_based' ? 'Deterministic Engine' : msg.metadata.provider}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}

              {/* Main Text Content */}
              <p className="text-sm leading-relaxed">{msg.content}</p>

              {/* Structured Metadata Breakdown */}
              {msg.metadata && msg.role === 'assistant' && (
                <div className="space-y-2.5 pt-2 border-t border-zinc-800/60 text-xs">
                  {/* Facts */}
                  {msg.metadata.facts && msg.metadata.facts.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Verified Facts
                      </span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px] pl-1">
                        {msg.metadata.facts.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Calculations */}
                  {msg.metadata.calculations && msg.metadata.calculations.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                        <Layers size={11} /> Calculated Metrics
                      </span>
                      <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px] pl-1 font-mono">
                        {msg.metadata.calculations.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Estimates */}
                  {msg.metadata.estimates && msg.metadata.estimates.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <HelpCircle size={11} /> Estimates &amp; Projections
                      </span>
                      <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px] pl-1">
                        {msg.metadata.estimates.map((e, idx) => (
                          <li key={idx}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Suggestions */}
                  {msg.metadata.suggestions && msg.metadata.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400 flex items-center gap-1">
                        <Sparkles size={11} /> Prescribed Actions
                      </span>
                      <ul className="list-disc list-inside text-zinc-200 space-y-0.5 text-[11px] pl-1">
                        {msg.metadata.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Data */}
                  {msg.metadata.missingData && msg.metadata.missingData.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <AlertCircle size={11} /> Data Gaps
                      </span>
                      <ul className="list-disc list-inside text-zinc-500 space-y-0.5 text-[11px] pl-1">
                        {msg.metadata.missingData.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deep Link Action Button */}
                  {msg.metadata.actionHref && (
                    <div className="pt-2">
                      <Link
                        href={msg.metadata.actionHref}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-bold hover:bg-lime-400 hover:text-black transition"
                      >
                        <span>{msg.metadata.actionLabel || 'Proceed to App Module'}</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}

                  {/* Limitations Disclaimer */}
                  {msg.metadata.limitations && (
                    <div className="pt-1 text-[10px] text-zinc-500 italic">
                      Note: {msg.metadata.limitations}
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0 mt-1">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-zinc-400 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 flex items-center justify-center">
              <RefreshCw size={16} className="animate-spin" />
            </div>
            <span>Reasoning across workouts, recovery, and nutrition logs...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Card>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendQuery(inputQuery)
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask Coach: 'Analyze my performance trend' or 'Recommend high-protein dinner'..."
          disabled={loading}
          className="bg-zinc-900 border-zinc-800 text-sm placeholder:text-zinc-500 flex-1 py-3"
        />
        <Button
          type="submit"
          variant="primary"
          disabled={loading || !inputQuery.trim()}
          className="bg-lime-400 hover:bg-lime-500 text-black font-bold px-5 py-3 shrink-0"
        >
          <Send size={16} className="mr-1.5" /> Send
        </Button>
      </form>
    </div>
  )
}
