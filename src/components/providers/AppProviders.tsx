'use client'

import React from 'react'
import { AccessibilityProvider } from '@/lib/accessibility/accessibilityContext'
import { LocalizationProvider } from '@/lib/i18n/localizationContext'
import { OfflineSyncProvider } from '@/lib/offline/offlineContext'
import { ToastProvider } from '@/components/ui'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <LocalizationProvider>
        <OfflineSyncProvider>
          <ToastProvider>{children}</ToastProvider>
        </OfflineSyncProvider>
      </LocalizationProvider>
    </AccessibilityProvider>
  )
}
