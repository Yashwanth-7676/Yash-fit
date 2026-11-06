'use client'

import React, { useState } from 'react'
import { useAccessibility } from '@/lib/accessibility/accessibilityContext'
import { Modal, Button, Toggle } from '@/components/ui'
import {
  Sparkles,
  Sliders,
  Eye,
  Type,
  Zap,
  RotateCcw,
  Volume2,
  BookOpen,
} from 'lucide-react'

export function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    preferences,
    setHighContrast,
    setReducedMotion,
    setFontScale,
    setScreenReaderAnnouncements,
    setShowBeginnerCues,
    setColorBlindMode,
    resetAccessibility,
    announce,
  } = useAccessibility()

  const handleTestAnnouncement = () => {
    announce('Accessibility screen reader announcement verified successfully on YashFit.', 'assertive')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Accessibility settings and display options"
        title="Accessibility Settings"
        className="p-2 rounded-xl text-zinc-400 hover:text-lime-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition flex items-center justify-center focus-visible:outline-2 focus-visible:outline-lime-400"
      >
        <Eye size={18} aria-hidden="true" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility & Inclusive Fitness"
        maxWidth="lg"
      >
        <div className="space-y-6 pt-2">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Customize display, motion, typography, and workout guidance to match your visual, sensory, and motor preferences. All settings persist on this device.
          </p>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-lime-400" />
                <span className="text-sm font-semibold text-white">High Contrast Mode</span>
              </div>
              <p className="text-xs text-zinc-400">
                Enhances text contrast, thickens borders, and sharpens visual boundaries.
              </p>
            </div>
            <Toggle
              checked={preferences.highContrast}
              onChange={(checked) => {
                setHighContrast(checked)
                announce(checked ? 'High contrast mode enabled' : 'High contrast mode disabled')
              }}
              label="Toggle high contrast"
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-lime-400" />
                <span className="text-sm font-semibold text-white">Reduced Motion</span>
              </div>
              <p className="text-xs text-zinc-400">
                Suppresses interface animations, live background pulses, and smooth scrolling for vestibular comfort.
              </p>
            </div>
            <Toggle
              checked={preferences.reducedMotion}
              onChange={(checked) => {
                setReducedMotion(checked)
                announce(checked ? 'Reduced motion enabled' : 'Reduced motion disabled')
              }}
              label="Toggle reduced motion"
            />
          </div>

          {/* Font Scaling */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <Type size={16} className="text-lime-400" />
              <span className="text-sm font-semibold text-white">Scalable Typography</span>
            </div>
            <p className="text-xs text-zinc-400">
              Adjust base text size for comfortable reading across all metrics and dashboards.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'normal', label: 'Default', scale: '100%' },
                  { id: 'large', label: 'Large', scale: '110%' },
                  { id: 'xl', label: 'Extra Large', scale: '120%' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setFontScale(option.id)
                    announce(`Font size set to ${option.label}`)
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-0.5 transition ${
                    preferences.fontScale === option.id
                      ? 'bg-lime-400 text-zinc-950 border-lime-400 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-[10px] opacity-75">{option.scale}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Beginner Cues */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-lime-400" />
                <span className="text-sm font-semibold text-white">Beginner Movement Cues</span>
              </div>
              <p className="text-xs text-zinc-400">
                Displays simplified exercise substitutions, joint safety cues, and breathing guidance.
              </p>
            </div>
            <Toggle
              checked={preferences.showBeginnerCues}
              onChange={(checked) => {
                setShowBeginnerCues(checked)
                announce(checked ? 'Beginner cues shown' : 'Beginner cues hidden')
              }}
              label="Toggle beginner cues"
            />
          </div>

          {/* Color Blind Mode */}
          <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-lime-400" />
              <span className="text-sm font-semibold text-white">Color Vision Filter</span>
            </div>
            <p className="text-xs text-zinc-400">
              Color-independent icons are active by default. Optional contrast profiles for specific color deficiencies:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'none', label: 'Standard' },
                  { id: 'protanopia', label: 'Protanopia' },
                  { id: 'deuteranopia', label: 'Deuteranopia' },
                  { id: 'tritanopia', label: 'Tritanopia' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setColorBlindMode(mode.id)
                    announce(`Color profile set to ${mode.label}`)
                  }}
                  className={`p-2 rounded-xl border text-xs font-semibold text-center transition ${
                    preferences.colorBlindMode === mode.id
                      ? 'bg-lime-400 text-zinc-950 border-lime-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Reader Test & Reset */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestAnnouncement}
              className="w-full sm:w-auto text-xs flex items-center justify-center gap-1.5 border-zinc-800 text-zinc-300"
            >
              <Volume2 size={14} /> Test Live Announcer
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetAccessibility()
                  announce('Accessibility preferences reset to default')
                }}
                className="w-full sm:w-auto text-xs text-zinc-400 hover:text-rose-400 flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Reset
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto bg-lime-400 hover:bg-lime-500 text-black font-bold text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
