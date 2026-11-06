export type FontScale = 'normal' | 'large' | 'xl'
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'

export interface AccessibilityPreferences {
  highContrast: boolean
  reducedMotion: boolean
  fontScale: FontScale
  screenReaderAnnouncements: boolean
  showBeginnerCues: boolean
  colorBlindMode: ColorBlindMode
}

export const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  fontScale: 'normal',
  screenReaderAnnouncements: true,
  showBeginnerCues: true,
  colorBlindMode: 'none',
}

export const ACCESSIBILITY_STORAGE_KEY = 'yashfit_accessibility_preferences'

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getAccessibilityPreferences(): AccessibilityPreferences {
  if (!hasLocalStorage()) return { ...DEFAULT_ACCESSIBILITY_PREFS }
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ACCESSIBILITY_PREFS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_ACCESSIBILITY_PREFS,
      ...parsed,
    }
  } catch {
    return { ...DEFAULT_ACCESSIBILITY_PREFS }
  }
}

export function saveAccessibilityPreferences(prefs: AccessibilityPreferences): void {
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(prefs))
  } catch (err) {
    console.warn('Failed to persist accessibility preferences', err)
  }
}
