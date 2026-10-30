'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  Download,
  ArrowRight,
  Salad,
  Activity,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import { Card, Badge, Button, Input, useToast } from '@/components/ui'
import {
  buildDailyTrainingGuidance,
  buildPeriodicReview,
  getSavedCoachMessages,
  saveCoachMessages,
  clearCoachMessages,
  getVoiceConfig,
  saveVoiceConfig,
} from '@/lib/virtual-trainer/virtualTrainerService'
import { generateDeterministicCoachResponse, type CoachUserContext } from '@/lib/ai/providers'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import type {
  VirtualCoachMessage,
  VirtualCoachDailyGuidance,
  VoiceInstructionConfig,
  VoiceState,
} from '@/types/virtualTrainer'

const PRESET_QUERIES = [
  'Analyze my recent performance trend',
  'What should my next workout be and why?',
  'How is my recovery tracking and should I deload?',
  'Recommend high-protein Indian meals fitting my budget',
  'Explain recent training adaptations made by Autopilot',
  'Review my body measurement changes',
  'What tests should I run in the Performance Lab?',
]

export function VirtualCoachContent() {
  const toast = useToast()

  // State
  const [messages, setMessages] = useState<VirtualCoachMessage[]>([])
  const [inputQuery, setInputQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [reviewPeriod, setReviewPeriod] = useState<'week' | 'month'>('week')
  const [voiceConfig, setVoiceConfig] = useState<VoiceInstructionConfig>(getVoiceConfig())
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    recognitionSupported: false,
    synthesisSupported: false,
    permissionState: 'prompt',
  })

  // User context
  const [context, setContext] = useState<CoachUserContext>({
    profile: null,
    workouts: [],
    recovery: [],
    waterLoggedLiters: 2.2,
    waterTargetLiters: 3.5,
    activeStreak: 5,
    rpgLevel: 1,
    rpgRank: 'Rookie',
    measurements: [],
    adaptations: [],
    nutritionPlan: null,
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Load verified context and saved messages
  useEffect(() => {
    async function loadInitialData() {
      try {
        const ctx = await buildCoachContext('demo-user')
        const coachCtx: CoachUserContext = {
          profile: ctx.profile,
          workouts: ctx.workouts,
          recovery: ctx.recovery,
          waterLoggedLiters: ctx.waterLoggedLiters || 2.4,
          waterTargetLiters: ctx.waterTargetLiters || 3.5,
          activeStreak: ctx.activeStreak || 5,
          rpgLevel: ctx.rpgLevel || 1,
          rpgRank: ctx.rpgRank || 'Rookie',
          measurements: ctx.recentMeasurements || [],
          adaptations: ctx.recentAdaptations || [],
          nutritionPlan: ctx.nutritionPlan || null,
        }
        setContext(coachCtx)

        const saved = getSavedCoachMessages()
        if (saved.length > 0) {
          setMessages(saved)
        } else {
          const welcome: VirtualCoachMessage = {
            id: 'welcome-1',
          role: 'assistant',
          content:
            'Hello! I am your YashFit AI Virtual Personal Trainer. I reason across your verified workout telemetry, recovery readiness, Indian nutrition macros, and performance benchmarks. How can I guide your fitness progression today?',
          timestamp: Date.now(),
          metadata: {
            provider: 'rule_based',
            quickActions: [
              { label: 'Start Workout', href: '/workout' },
              { label: 'Check Biomechanics', href: '/biomechanics' },
              { label: 'Performance Lab', href: '/performance-lab' },
              { label: 'Intelligence Graph', href: '/fitness-intelligence' },
            ],
            suggestions: [
              'Ask for daily workout recommendations matching your readiness.',
              'Request affordable vegetarian Indian protein meal planning.',
              'Evaluate whether an Autopilot deload week is warranted.',
            ],
          },
        }
        setMessages([welcome])
      }
    } catch {
      // fallback
    }
  }
  loadInitialData()
}, [])

  // Check Web Speech API capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return

    const synthesisSupported = 'speechSynthesis' in window
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognitionSupported = !!SpeechRecognition

    setVoiceState((prev) => ({
      ...prev,
      synthesisSupported,
      recognitionSupported,
    }))

    if (recognitionSupported) {
      try {
        const recognizer = new SpeechRecognition()
        recognizer.continuous = false
        recognizer.interimResults = false
        recognizer.lang = voiceConfig.recognitionLanguage

        recognizer.onstart = () => {
          setVoiceState((prev) => ({ ...prev, isListening: true, errorMessage: null }))
        }

        recognizer.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputQuery(transcript)
          setVoiceState((prev) => ({ ...prev, isListening: false }))
        }

        recognizer.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error)
          let errorMsg = 'Microphone error.'
          if (event.error === 'not-allowed') {
            errorMsg = 'Microphone permission denied in browser.'
          } else if (event.error === 'no-speech') {
            errorMsg = 'No speech detected. Please speak closer to microphone.'
          }
          setVoiceState((prev) => ({
            ...prev,
            isListening: false,
            errorMessage: errorMsg,
          }))
          toast.error('Voice Input Notice', errorMsg)
        }

        recognizer.onend = () => {
          setVoiceState((prev) => ({ ...prev, isListening: false }))
        }

        recognitionRef.current = recognizer
      } catch (err) {
        console.warn('Speech recognition init error:', err)
      }
    }
  }, [voiceConfig.recognitionLanguage, toast])

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Derived Daily Guidance and Periodic Review
  const dailyGuidance: VirtualCoachDailyGuidance = useMemo(() => {
    return buildDailyTrainingGuidance(context)
  }, [context])

  const periodicReview = useMemo(() => {
    return buildPeriodicReview(reviewPeriod, context)
  }, [reviewPeriod, context])

  // Speak coach message with SpeechSynthesis
  const speakText = (text: string) => {
    if (voiceConfig.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    try {
      window.speechSynthesis.cancel() // Stop any current speech
      const cleanText = text.replace(/[*_#`[\]()]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.rate = voiceConfig.speechRate
      utterance.pitch = voiceConfig.pitch
      utterance.lang = voiceConfig.recognitionLanguage

      utterance.onstart = () => {
        setVoiceState((prev) => ({ ...prev, isSpeaking: true }))
      }
      utterance.onend = () => {
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
      }
      utterance.onerror = () => {
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
      }

      window.speechSynthesis.speak(utterance)
    } catch {
      // Audio playback blocked
    }
  }

  // Handle Voice Input Toggle
  const toggleListening = () => {
    if (!voiceState.recognitionSupported) {
      toast.info('Voice Input Unavailable', 'Speech recognition is not supported in this browser. Please type your query.')
      return
    }

    if (voiceState.isListening) {
      recognitionRef.current?.stop()
    } else {
      try {
        recognitionRef.current?.start()
      } catch {
        // Recognition already active
      }
    }
  }

  // Handle Query Submission
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim()
    if (!query || isLoading) return

    setInputQuery('')

    const userMsg: VirtualCoachMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    saveCoachMessages(nextMessages)
    setIsLoading(true)

    try {
      // 1. Try server-side API
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (res.ok) {
        const data = await res.json()
        const structured = data.response
        const assistantMsg: VirtualCoachMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: structured.recommendation,
          timestamp: Date.now(),
          metadata: {
            ...structured,
            provider: structured.provider || 'gemini',
            quickActions: [
              { label: 'View Workout', href: '/workout' },
              { label: 'Biomechanics Lab', href: '/biomechanics' },
              { label: 'Performance Benchmarks', href: '/performance-lab' },
            ],
          },
        }

        const finalMessages = [...nextMessages, assistantMsg]
        setMessages(finalMessages)
        saveCoachMessages(finalMessages)

        if (voiceConfig.autoSpeak) {
          speakText(assistantMsg.content)
        }
        return
      }
    } catch {
      // fallback to deterministic rule engine
    }

    // 2. Deterministic Rule-Based Fallback
    const deterministic = generateDeterministicCoachResponse(query, context)
    const fallbackMsg: VirtualCoachMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      content: deterministic.recommendation,
      timestamp: Date.now(),
      metadata: {
        ...deterministic,
        provider: 'rule_based',
        quickActions: [
          { label: 'View Workout', href: '/workout' },
          { label: 'Biomechanics Lab', href: '/biomechanics' },
          { label: 'Performance Benchmarks', href: '/performance-lab' },
        ],
      },
    }

    const finalMessages = [...nextMessages, fallbackMsg]
    setMessages(finalMessages)
    saveCoachMessages(finalMessages)

    if (voiceConfig.autoSpeak) {
      speakText(fallbackMsg.content)
    }
    setIsLoading(false)
  }

  const handleClearHistory = () => {
    clearCoachMessages()
    setMessages([])
    toast.info('Chat Cleared', 'Conversation history has been reset.')
  }

  const handleExportHistory = () => {
    const text = JSON.stringify(messages, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yashfit-virtual-coach-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('History Exported', 'Downloaded conversation as JSON.')
  }

  const toggleMute = () => {
    const next = { ...voiceConfig, isMuted: !voiceConfig.isMuted }
    setVoiceConfig(next)
    saveVoiceConfig(next)
    if (next.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    toast.info(next.isMuted ? 'Voice Muted' : 'Voice Enabled')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="accent">YashFit AI Personal Trainer</Badge>
            <span className="text-xs text-zinc-400 font-mono">Telemetry Reasoning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            AI Virtual Personal Trainer
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Conversational fitness training reasoning across your verified workouts, Indian nutrition, recovery readiness, and performance lab benchmarks.
          </p>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            icon={voiceConfig.isMuted ? <VolumeX size={15} className="text-zinc-500" /> : <Volume2 size={15} className="text-lime-400" />}
          >
            {voiceConfig.isMuted ? 'Muted' : 'Voice Active'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportHistory}
            icon={<Download size={15} />}
          >
            Export
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            icon={<Trash2 size={15} className="text-red-400" />}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Daily Training Guidance & Periodic Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Daily Training Guidance */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-lime-400" />
                <h3 className="text-sm font-bold text-white">Today&apos;s Training Guidance</h3>
              </div>
              <span className="text-xs text-zinc-400 font-mono">{dailyGuidance.date}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Recommended Workout */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Recommended Session</span>
                <p className="text-sm font-bold text-white">{dailyGuidance.recommendedWorkoutName}</p>
                <p className="text-xs text-lime-400 font-medium">{dailyGuidance.recommendedSplit}</p>
              </div>

              {/* Readiness Summary */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Recovery Telemetry</span>
                <p className="text-xs text-zinc-300 leading-relaxed">{dailyGuidance.readinessSummary}</p>
              </div>
            </div>

            {/* Key Focus Cues */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-lime-400" />
                Technique Focus for Today:
              </span>
              <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc">
                {dailyGuidance.suggestedFocusCues.map((cue, idx) => (
                  <li key={idx}>{cue}</li>
                ))}
              </ul>
            </div>

            {/* Nutrition Advice */}
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs text-zinc-300 flex items-start gap-2.5">
              <Salad size={16} className="text-lime-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Target Nutrition: </span>
                <span>{dailyGuidance.nutritionAdvice}</span>
              </div>
            </div>

            {/* Recovery Alerts */}
            {dailyGuidance.recoveryAlerts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 space-y-1">
                {dailyGuidance.recoveryAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {dailyGuidance.suggestedQuickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <Button variant="outline" size="sm" icon={<ArrowRight size={13} />}>
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Periodic Review (Past 7 vs 30 Days) */}
        <div>
          <Card className="p-5 border-zinc-800 bg-zinc-900/90 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-lime-400" />
                  <h3 className="text-sm font-bold text-white">Fitness Review</h3>
                </div>

                <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReviewPeriod('week')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      reviewPeriod === 'week' ? 'bg-lime-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewPeriod('month')}
                    className={`px-2 py-1 rounded-md font-medium transition-colors ${
                      reviewPeriod === 'month' ? 'bg-lime-400 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    30D
                  </button>
                </div>
              </div>

              {/* Review Numbers */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Workouts</span>
                  <span className="text-xl font-extrabold text-lime-400 font-mono">{periodicReview.totalWorkouts}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Volume Lifted</span>
                  <span className="text-sm font-bold text-white font-mono mt-1 block">
                    {periodicReview.totalVolumeKg > 0 ? `${periodicReview.totalVolumeKg.toLocaleString()} kg` : '0 kg'}
                  </span>
                </div>
              </div>

              {/* Key Accomplishments */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">Observed Accomplishments</span>
                <ul className="text-xs text-zinc-400 space-y-1 pl-4 list-disc">
                  {periodicReview.keyAccomplishments.map((acc, idx) => (
                    <li key={idx}>{acc}</li>
                  ))}
                </ul>
              </div>

              {/* Recommended Adjustments */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">Coach Recommendations</span>
                <ul className="text-xs text-lime-300/90 space-y-1 pl-4 list-disc">
                  {periodicReview.recommendedAdjustments.map((adj, idx) => (
                    <li key={idx}>{adj}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-800">
              {periodicReview.dataCompletenessText}
            </p>
          </Card>
        </div>
      </div>

      {/* Interactive Coach Conversation */}
      <Card className="border-zinc-800 bg-zinc-900/90 overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Virtual Trainer Consultation</h2>
              <span className="text-[11px] text-zinc-400">Empirical, evidence-based recommendations</span>
            </div>
          </div>

          <Badge variant="accent">
            {context.rpgRank} · Lvl {context.rpgLevel}
          </Badge>
        </div>

        {/* Message Log */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[480px] overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                <span>{msg.role === 'user' ? 'You' : 'Coach'}</span>
                <span>·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.metadata?.provider && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-400 font-mono">
                    {msg.metadata.provider}
                  </span>
                )}
              </div>

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-lime-400 text-zinc-950 font-medium rounded-tr-none'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none space-y-3'
                }`}
              >
                <p>{msg.content}</p>

                {/* Structured Breakdown if available */}
                {msg.metadata && msg.role === 'assistant' && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800/80 text-xs">
                    {/* Supporting facts */}
                    {msg.metadata.facts && msg.metadata.facts.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-lime-400 block text-[11px] uppercase tracking-wider">
                          Verified Telemetry Facts
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-400 text-[11px]">
                          {msg.metadata.facts.map((fact, idx) => (
                            <li key={idx}>{fact}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Calculations */}
                    {msg.metadata.calculations && msg.metadata.calculations.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-sky-400 block text-[11px] uppercase tracking-wider">
                          Mathematical Analysis
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-400 text-[11px]">
                          {msg.metadata.calculations.map((calc, idx) => (
                            <li key={idx}>{calc}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {msg.metadata.suggestions && msg.metadata.suggestions.length > 0 && (
                      <div className="space-y-1">
                        <span className="font-semibold text-white block text-[11px] uppercase tracking-wider">
                          Recommended Action Steps
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-zinc-300 text-[11px]">
                          {msg.metadata.suggestions.map((sug, idx) => (
                            <li key={idx}>{sug}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Action Navigation Buttons */}
                    {msg.metadata.quickActions && msg.metadata.quickActions.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        {msg.metadata.quickActions.map((qa, idx) => (
                          <Link key={idx} href={qa.href}>
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-xs text-lime-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                            >
                              <span>{qa.label}</span>
                              <ArrowRight size={11} />
                            </button>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Honest Limitations */}
                    {msg.metadata.limitations && (
                      <div className="p-2 rounded-lg bg-zinc-900/60 text-[10px] text-zinc-400 italic">
                        <span className="font-semibold not-italic">Boundary: </span>
                        {msg.metadata.limitations}
                      </div>
                    )}

                    {/* Audio read-aloud button */}
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => speakText(msg.content)}
                        className="text-[11px] text-zinc-400 hover:text-lime-400 flex items-center gap-1 font-mono transition-colors"
                      >
                        <Volume2 size={13} />
                        <span>Listen to audio</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-lime-400 font-mono animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing telemetry and generating guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Prompt Chips */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle size={12} />
            Quick:
          </span>
          {PRESET_QUERIES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(preset)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white hover:border-lime-400/50 whitespace-nowrap transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <Input
                placeholder={
                  voiceState.isListening
                    ? 'Listening to your microphone... speak now'
                    : 'Ask your personal coach about workouts, Indian nutrition, recovery...'
                }
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Microphone Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${
                voiceState.isListening
                  ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              title={voiceState.isListening ? 'Stop listening' : 'Speak your question'}
            >
              {voiceState.isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              icon={<Send size={15} />}
            >
              Send
            </Button>
          </form>

          {voiceState.errorMessage && (
            <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{voiceState.errorMessage}</span>
            </p>
          )}

          <p className="text-[10px] text-zinc-400 mt-2 text-center">
            AI Virtual Trainer provides exercise, recovery, and nutritional guidance based on your records. It does not monitor continuous vitals or replace certified clinical healthcare.
          </p>
        </div>
      </Card>
    </div>
  )
}
