'use client'

import type { VoiceCoachConfig } from '@/types/aiTrainer'

export const DEFAULT_VOICE_CONFIG: VoiceCoachConfig = {
  enabled: true,
  voiceVolume: 0.9,
  voiceRate: 1.05,
  voicePitch: 1.0,
  soundEffects: true,
  announceMilestones: true,
  announceFormCues: true,
}

class VoiceCoachService {
  private config: VoiceCoachConfig = { ...DEFAULT_VOICE_CONFIG }
  private lastSpokenTime = 0
  private lastSpokenText = ''
  private speechQueue: string[] = []
  private isSpeaking = false
  private audioCtx: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('yashfit_voice_coach_config')
        if (stored) {
          this.config = { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(stored) }
        }
      } catch {
        // Storage unavailable
      }
    }
  }

  public getConfig(): VoiceCoachConfig {
    return { ...this.config }
  }

  public updateConfig(updates: Partial<VoiceCoachConfig>): void {
    this.config = { ...this.config, ...updates }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('yashfit_voice_coach_config', JSON.stringify(this.config))
      } catch {
        // Ignored
      }
    }
  }

  public toggleMute(): boolean {
    this.updateConfig({ enabled: !this.config.enabled })
    if (!this.config.enabled) {
      this.cancelSpeech()
    }
    return this.config.enabled
  }

  /**
   * Plays synthesized audio chime for rep confirmation or error warning.
   */
  public playChime(isSuccess = true): void {
    if (!this.config.soundEffects || typeof window === 'undefined') return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass()
      } else if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }

      const ctx = this.audioCtx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = isSuccess ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(isSuccess ? 587.33 : 329.63, ctx.currentTime) // D5 or E4

      if (isSuccess) {
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.14) // A5
      }

      const vol = this.config.voiceVolume * 0.15
      gain.gain.setValueAtTime(vol, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.23)
    } catch {
      // AudioContext unavailable
    }
  }

  /**
   * Speak a coaching message with debounce and duplicate protection.
   */
  public speak(
    text: string,
    options: {
      priority?: 'high' | 'normal' | 'low'
      force?: boolean
      minIntervalMs?: number
    } = {}
  ): void {
    if (!this.config.enabled || typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return

    const { priority = 'normal', force = false, minIntervalMs = 2800 } = options
    const now = Date.now()

    // Prevent immediate repeated phrases
    if (!force && this.lastSpokenText === text && now - this.lastSpokenTime < 6000) {
      return
    }

    // Cooldown check for non-high priority cues
    if (!force && priority !== 'high' && now - this.lastSpokenTime < minIntervalMs) {
      return
    }

    if (priority === 'high') {
      window.speechSynthesis.cancel()
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = this.config.voiceVolume
    utterance.rate = this.config.voiceRate
    utterance.pitch = this.config.voicePitch

    // Select natural sounding English voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      this.isSpeaking = true
      this.lastSpokenTime = Date.now()
      this.lastSpokenText = text
    }

    utterance.onend = () => {
      this.isSpeaking = false
    }

    utterance.onerror = () => {
      this.isSpeaking = false
    }

    window.speechSynthesis.speak(utterance)
  }

  /**
   * Announce milestone repetitions.
   */
  public announceRepMilestone(reps: number, target = 10): void {
    if (!this.config.announceMilestones) return

    if (reps === 1) {
      this.speak('One rep! Solid start.', { priority: 'normal' })
    } else if (reps === 5) {
      this.speak('Five reps down! Keep the form tight.', { priority: 'normal' })
    } else if (reps === Math.floor(target / 2) && target >= 8) {
      this.speak('Halfway there! Stay locked in.', { priority: 'normal' })
    } else if (reps === target - 1 && target > 3) {
      this.speak('Last rep, drive hard!', { priority: 'high', force: true })
    } else if (reps === target) {
      this.speak(`Set complete! Outstanding job hitting ${target} reps.`, {
        priority: 'high',
        force: true,
      })
    } else if (reps % 5 === 0 && reps > 5) {
      this.speak(`${reps} reps! Great endurance.`, { priority: 'normal' })
    }
  }

  /**
   * Cancel ongoing speech immediately.
   */
  public cancelSpeech(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    this.isSpeaking = false
  }
}

export const voiceCoach = new VoiceCoachService()
