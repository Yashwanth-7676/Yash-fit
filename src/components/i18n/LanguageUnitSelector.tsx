'use client'

import React, { useState } from 'react'
import { useLocalization } from '@/lib/i18n/localizationContext'
import { Modal, Button } from '@/components/ui'
import { Globe, Scale, Check } from 'lucide-react'
import { SupportedLanguage, UnitSystem } from '@/types/i18n'

export function LanguageUnitSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, unitSystem, setLanguage, setUnitSystem } = useLocalization()

  const languages: { id: SupportedLanguage; label: string; script: string; region: string }[] = [
    { id: 'en', label: 'English', script: 'English', region: 'India / Global' },
    { id: 'kn', label: 'ಕನ್ನಡ', script: 'Kannada', region: 'Karnataka' },
    { id: 'hi', label: 'हिंदी', script: 'Hindi', region: 'India' },
  ]

  const unitSystems: { id: UnitSystem; label: string; details: string }[] = [
    { id: 'metric', label: 'Metric', details: 'Kilograms (kg), Centimeters (cm), Liters (L)' },
    { id: 'imperial', label: 'Imperial', details: 'Pounds (lbs), Feet & Inches (ft/in), Ounces (fl oz)' },
  ]

  const currentLangLabel = languages.find((l) => l.id === language)?.label || 'EN'

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Change language and measurement units"
        title={`Language: ${currentLangLabel} | Units: ${unitSystem}`}
        className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition flex items-center gap-1.5 text-xs font-semibold"
      >
        <Globe size={14} className="text-lime-400" />
        <span>{currentLangLabel}</span>
        <span className="text-[10px] text-zinc-500 uppercase">({unitSystem === 'metric' ? 'kg' : 'lbs'})</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Language & Unit Preferences"
        maxWidth="md"
      >
        <div className="space-y-6 pt-2">
          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-lime-400" />
              <h4 className="text-sm font-semibold text-white">Select Language</h4>
            </div>
            <p className="text-xs text-zinc-400">
              YashFit provides native support for English, Kannada, and Hindi. Regional Indian foods are rendered in authentic scripts with macro breakdowns.
            </p>

            <div className="space-y-2">
              {languages.map((item) => {
                const isSelected = language === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400/50 text-white shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.id !== 'en' && (
                          <span className="text-xs text-zinc-400 font-normal">({item.script})</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">{item.region}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center shrink-0">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Unit System Selection */}
          <div className="space-y-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-lime-400" />
              <h4 className="text-sm font-semibold text-white">Measurement Units</h4>
            </div>
            <p className="text-xs text-zinc-400">
              Choose your preferred units for body weight, height, hydration, and exercise loads.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {unitSystems.map((item) => {
                const isSelected = unitSystem === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUnitSystem(item.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-lime-400/10 border-lime-400/50 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{item.label}</span>
                      {isSelected && <Check size={14} className="text-lime-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{item.details}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="bg-lime-400 hover:bg-lime-500 text-black font-bold text-xs px-5"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
