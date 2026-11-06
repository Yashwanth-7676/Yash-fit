export type SupportedLanguage = 'en' | 'kn' | 'hi'
export type UnitSystem = 'metric' | 'imperial'

export interface I18nPreferences {
  language: SupportedLanguage
  unitSystem: UnitSystem
}

export interface RegionalFoodTranslation {
  id: string
  en: string
  kn: string
  hi: string
  proteinPer100g: number
  caloriesPer100g: number
  category: 'breakfast' | 'lunch_dinner' | 'snack' | 'dairy' | 'protein'
  transliterationEn?: string
}

export interface TranslationDictionary {
  nav: {
    dashboard: string
    workouts: string
    nutrition: string
    recovery: string
    analytics: string
    coach: string
    community: string
    settings: string
    studio: string
    foodScanner: string
  }
  common: {
    save: string
    cancel: string
    close: string
    delete: string
    edit: string
    loading: string
    today: string
    yesterday: string
    streak: string
    progress: string
    target: string
    completed: string
    calories: string
    protein: string
    carbs: string
    fats: string
    water: string
    weight: string
    height: string
    syncing: string
    offline: string
    online: string
    demoMode: string
  }
  units: {
    kg: string
    lbs: string
    cm: string
    ft: string
    liters: string
    oz: string
    kcal: string
  }
}
