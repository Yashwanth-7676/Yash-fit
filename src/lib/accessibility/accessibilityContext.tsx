'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  AccessibilityPreferences,
  DEFAULT_ACCESSIBILITY_PREFS,
  getAccessibilityPreferences,
  saveAccessibilityPreferences,
  FontScale,
  ColorBlindMode,
} from '@/types/accessibility'

interface AccessibilityContextValue {
  preferences: AccessibilityPreferences
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setFontScale: (scale: FontScale) => void
  setScreenReaderAnnouncements: (enabled: boolean) => void
  setShowBeginnerCues: (enabled: boolean) => void
  setColorBlindMode: (mode: ColorBlindMode) => void
  resetAccessibility: () => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_ACCESSIBILITY_PREFS)
  const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive' }>({
    message: '',
    priority: 'polite',
  })

  // Hydrate on mount
  useEffect(() => {
    const saved = getAccessibilityPreferences()

    // Also detect system defaults if not explicitly toggled
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const prefersHighContrast = typeof window !== 'undefined' && window.matchMedia?.('(prefers-contrast: more)').matches

    const initial: AccessibilityPreferences = {
      ...saved,
      reducedMotion: saved.reducedMotion || Boolean(prefersReducedMotion),
      highContrast: saved.highContrast || Boolean(prefersHighContrast),
    }

    setPreferences(initial)
  }, [])

  // Apply CSS classes to documentElement
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Font scaling
    root.classList.remove('font-scale-large', 'font-scale-xl')
    if (preferences.fontScale === 'large') {
      root.classList.add('font-scale-large')
    } else if (preferences.fontScale === 'xl') {
      root.classList.add('font-scale-xl')
    }

    // Color blind mode
    root.classList.remove('cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia')
    if (preferences.colorBlindMode !== 'none') {
      root.classList.add(`cb-${preferences.colorBlindMode}`)
    }
  }, [preferences])

  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value }
      saveAccessibilityPreferences(next)
      return next
    })
  }, [])

  const setHighContrast = useCallback((enabled: boolean) => updatePreference('highContrast', enabled), [updatePreference])
  const setReducedMotion = useCallback((enabled: boolean) => updatePreference('reducedMotion', enabled), [updatePreference])
  const setFontScale = useCallback((scale: FontScale) => updatePreference('fontScale', scale), [updatePreference])
  const setScreenReaderAnnouncements = useCallback((enabled: boolean) => updatePreference('screenReaderAnnouncements', enabled), [updatePreference])
  const setShowBeginnerCues = useCallback((enabled: boolean) => updatePreference('showBeginnerCues', enabled), [updatePreference])
  const setColorBlindMode = useCallback((mode: ColorBlindMode) => updatePreference('colorBlindMode', mode), [updatePreference])

  const resetAccessibility = useCallback(() => {
    setPreferences(DEFAULT_ACCESSIBILITY_PREFS)
    saveAccessibilityPreferences(DEFAULT_ACCESSIBILITY_PREFS)
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!preferences.screenReaderAnnouncements) return
    setAnnouncement({ message, priority })
  }, [preferences.screenReaderAnnouncements])

  const value = useMemo(
    () => ({
      preferences,
      setHighContrast,
      setReducedMotion,
      setFontScale,
      setScreenReaderAnnouncements,
      setShowBeginnerCues,
      setColorBlindMode,
      resetAccessibility,
      announce,
    }),
    [
      preferences,
      setHighContrast,
      setReducedMotion,
      setFontScale,
      setScreenReaderAnnouncements,
      setShowBeginnerCues,
      setColorBlindMode,
      resetAccessibility,
      announce,
    ]
  )

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Live Region for Screen Readers */}
      <div
        role="status"
        aria-live={announcement.priority}
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcer"
      >
        {announcement.message}
      </div>
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext)
  if (!context) {
    // Provide a safe fallback if used outside provider
    return {
      preferences: DEFAULT_ACCESSIBILITY_PREFS,
      setHighContrast: () => {},
      setReducedMotion: () => {},
      setFontScale: () => {},
      setScreenReaderAnnouncements: () => {},
      setShowBeginnerCues: () => {},
      setColorBlindMode: () => {},
      resetAccessibility: () => {},
      announce: () => {},
    }
  }
  return context
}
