'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  SupportedLanguage,
  UnitSystem,
  I18nPreferences,
  TranslationDictionary,
} from '@/types/i18n'
import {
  DEFAULT_I18N_PREFS,
  getI18nPreferences,
  saveI18nPreferences,
  TRANSLATIONS,
  REGIONAL_INDIAN_FOODS,
  formatWeight,
  formatHeight,
  formatVolume,
  formatNumberLocalized,
  formatDateLocalized,
  getRegionalFoodName,
} from './localizationService'

interface LocalizationContextValue {
  language: SupportedLanguage
  unitSystem: UnitSystem
  setLanguage: (lang: SupportedLanguage) => void
  setUnitSystem: (system: UnitSystem) => void
  t: TranslationDictionary
  formatWeightValue: (kg: number) => string
  formatHeightValue: (cm: number) => string
  formatVolumeValue: (liters: number) => string
  formatNumber: (value: number) => string
  formatDate: (date: string | Date) => string
  getFoodName: (foodId: string) => string
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null)

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<I18nPreferences>(DEFAULT_I18N_PREFS)

  useEffect(() => {
    const saved = getI18nPreferences()
    setPreferences(saved)
  }, [])

  const setLanguage = useCallback((language: SupportedLanguage) => {
    setPreferences((prev) => {
      const next = { ...prev, language }
      saveI18nPreferences(next)
      return next
    })
  }, [])

  const setUnitSystem = useCallback((unitSystem: UnitSystem) => {
    setPreferences((prev) => {
      const next = { ...prev, unitSystem }
      saveI18nPreferences(next)
      return next
    })
  }, [])

  const t = useMemo(() => {
    return TRANSLATIONS[preferences.language] || TRANSLATIONS.en
  }, [preferences.language])

  const formatWeightValue = useCallback(
    (kg: number) => formatWeight(kg, preferences.unitSystem, preferences.language),
    [preferences.unitSystem, preferences.language]
  )

  const formatHeightValue = useCallback(
    (cm: number) => formatHeight(cm, preferences.unitSystem, preferences.language),
    [preferences.unitSystem, preferences.language]
  )

  const formatVolumeValue = useCallback(
    (liters: number) => formatVolume(liters, preferences.unitSystem, preferences.language),
    [preferences.unitSystem, preferences.language]
  )

  const formatNumber = useCallback(
    (value: number) => formatNumberLocalized(value, preferences.language),
    [preferences.language]
  )

  const formatDate = useCallback(
    (date: string | Date) => formatDateLocalized(date, preferences.language),
    [preferences.language]
  )

  const getFoodName = useCallback(
    (foodId: string) => getRegionalFoodName(foodId, preferences.language),
    [preferences.language]
  )

  const value = useMemo(
    () => ({
      language: preferences.language,
      unitSystem: preferences.unitSystem,
      setLanguage,
      setUnitSystem,
      t,
      formatWeightValue,
      formatHeightValue,
      formatVolumeValue,
      formatNumber,
      formatDate,
      getFoodName,
    }),
    [
      preferences.language,
      preferences.unitSystem,
      setLanguage,
      setUnitSystem,
      t,
      formatWeightValue,
      formatHeightValue,
      formatVolumeValue,
      formatNumber,
      formatDate,
      getFoodName,
    ]
  )

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>
}

export function useLocalization(): LocalizationContextValue {
  const context = useContext(LocalizationContext)
  if (!context) {
    return {
      language: 'en',
      unitSystem: 'metric',
      setLanguage: () => {},
      setUnitSystem: () => {},
      t: TRANSLATIONS.en,
      formatWeightValue: (kg) => `${kg} kg`,
      formatHeightValue: (cm) => `${cm} cm`,
      formatVolumeValue: (l) => `${l} L`,
      formatNumber: (n) => String(n),
      formatDate: (d) => String(d),
      getFoodName: (id) => id,
    }
  }
  return context
}
