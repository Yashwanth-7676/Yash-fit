'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Send,
  Bot,
  User,
  HeartPulse,
  Dumbbell,
  Salad,
  Flame,
  Info,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'
import { Card, Badge, Button, Input, useToast } from '@/components/ui'
import {
  getCompanionConversationHistory,
  saveCompanionConversationHistory,
  sendCompanionMessage,
  getCompanionContext,
  getDailyCheckInStatus,
  INITIAL_COMPANION_MESSAGE,
} from '@/lib/companion/companionService'
import type {
  CompanionMessage,
  CompanionPersonaStyle,
  CompanionUserContext,
  DailyCheckInStatus,
} from '@/types/aiCompanion'

export function CompanionContent() {
  const toast = useToast()

  // State
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [persona, setPersona] = useState<CompanionPersonaStyle>('encouraging')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<CompanionUserContext | null>(null)
  const [checkInStatus, setCheckInStatus] = useState<DailyCheckInStatus | null>(null)

  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Initialize
  useEffect(() => {
    const history = getCompanionConversationHistory()
    const ctx = getCompanionContext()
    const status = getDailyCheckInStatus()
    setMessages(history)
    setContext(ctx)
    setCheckInStatus(status)
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim()
    if (!text || isLoading) return

    const userMessage: CompanionMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    const nextHistory = [...messages, userMessage]
    setMessages(nextHistory)
    setInputText('')
    setIsLoading(true)

    try {
      const response = await sendCompanionMessage(text, persona, nextHistory)
      const assistantMessage: CompanionMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        groundedFacts: response.groundedFacts,
      }

      const finalMessages = [...nextHistory, assistantMessage]
      setMessages(finalMessages)
      saveCompanionConversationHistory(finalMessages)
    } catch {
      toast.error('Failed to deliver message to companion')
    } finally {
      setIsLoading(false)
    }
  }

  // Clear chat history
  const handleClearHistory = () => {
    if (confirm('Clear companion conversation history?')) {
      const reset = [INITIAL_COMPANION_MESSAGE]
      setMessages(reset)
      saveCompanionConversationHistory(reset)
      toast.info('Conversation history reset')
    }
  }

  const quickPromptChips = [
    'Recommend high-protein Indian snacks under 300 kcal',
    'How should I train today with my 78/100 readiness score?',
    'Review my progress toward my 70 kg goal',
    'Tips to optimize deep sleep and CNS recovery',
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-lime-400/10 text-lime-400 border border-lime-400/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                YashFit Personal AI Companion
                <Badge variant="accent" className="text-xs">
                  Stage #36
                </Badge>
              </h1>
              <p className="text-sm text-zinc-400">
                Astra — Context-aware personal fitness partner grounded in your actual records.
              </p>
            </div>
          </div>
        </div>

        {/* Persona Style Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
          <button
            onClick={() => setPersona('encouraging')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              persona === 'encouraging'
                ? 'bg-lime-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🌟 Encouraging
          </button>
          <button
            onClick={() => setPersona('disciplined')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              persona === 'disciplined'
                ? 'bg-lime-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🎯 Disciplined
          </button>
          <button
            onClick={() => setPersona('scientific')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              persona === 'scientific'
                ? 'bg-lime-400 text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔬 Scientific
          </button>
        </div>
      </div>

      {/* Daily Check-In & Sync Bar */}
      {checkInStatus && context && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 bg-zinc-900 border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-lime-400/10 text-lime-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Today&apos;s Training</div>
              <div className="text-xs font-semibold text-zinc-200">
                {checkInStatus.todayTrained ? 'Completed ✓' : 'Scheduled Today'}
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-zinc-900 border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400">
              <Salad className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Target Nutrition</div>
              <div className="text-xs font-semibold text-zinc-200">
                {context.targetCalories} kcal • {context.targetProtein}g Protein
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-zinc-900 border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Readiness Score</div>
              <div className="text-xs font-semibold text-zinc-200">
                {context.readinessScore}/100 (Optimal)
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-zinc-900 border-zinc-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 uppercase">Habit Streak</div>
              <div className="text-xs font-semibold text-amber-400">
                {checkInStatus.streakDays} Consecutive Days 🔥
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CHAT CONTAINER */}
      <Card className="p-4 md:p-6 bg-zinc-900 border-zinc-800 flex flex-col h-[560px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 space-y-2 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                      : 'bg-zinc-950 border border-zinc-800/80 text-zinc-200 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Grounded facts badge pills for AI transparency */}
                  {!isUser && msg.groundedFacts && msg.groundedFacts.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 mt-2 space-y-1">
                      <div className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-lime-400" />
                        <span>Grounded in your authenticated data:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundedFacts.map((fact, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300"
                          >
                            {fact}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            )
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-lime-400/20 text-lime-400 border border-lime-400/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-sm bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
                <span>Astra is analyzing your workout and recovery context...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto border-t border-zinc-800/80">
          <span className="text-[11px] text-zinc-400 uppercase font-mono shrink-0">Prompts:</span>
          {quickPromptChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="px-2.5 py-1 rounded-full text-xs bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2 pt-2"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Astra about workouts, Indian nutrition, recovery, or goals..."
            className="flex-1 bg-zinc-950 border-zinc-800 text-zinc-100 text-sm focus:border-lime-400"
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            disabled={!inputText.trim() || isLoading}
            className="bg-lime-400 text-zinc-950 font-semibold px-4 flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleClearHistory}
            className="p-2 border-zinc-800 text-zinc-500 hover:text-zinc-300 shrink-0"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      {/* Safety & Medical Disclaimer */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-zinc-300">Medical & Safety Notice: </span>
          Astra is an artificial intelligence companion designed to support consistent fitness habits and
          nutrition planning. Astra does not diagnose medical conditions, prescribe treatment for musculoskeletal injuries,
          or replace licensed clinical healthcare advice.
        </div>
      </div>
    </div>
  )
}

