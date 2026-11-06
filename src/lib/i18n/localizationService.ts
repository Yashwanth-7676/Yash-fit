import {
  SupportedLanguage,
  UnitSystem,
  I18nPreferences,
  RegionalFoodTranslation,
  TranslationDictionary,
} from '@/types/i18n'

export const DEFAULT_I18N_PREFS: I18nPreferences = {
  language: 'en',
  unitSystem: 'metric',
}

export const I18N_STORAGE_KEY = 'yashfit_i18n_preferences'

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getI18nPreferences(): I18nPreferences {
  if (!hasLocalStorage()) return { ...DEFAULT_I18N_PREFS }
  try {
    const raw = localStorage.getItem(I18N_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_I18N_PREFS }
    const parsed = JSON.parse(raw)
    return {
      language: parsed.language || 'en',
      unitSystem: parsed.unitSystem || 'metric',
    }
  } catch {
    return { ...DEFAULT_I18N_PREFS }
  }
}

export function saveI18nPreferences(prefs: I18nPreferences): void {
  if (!hasLocalStorage()) return
  try {
    localStorage.setItem(I18N_STORAGE_KEY, JSON.stringify(prefs))
  } catch (err) {
    console.warn('Failed to save i18n preferences', err)
  }
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      workouts: 'Workouts',
      nutrition: 'Nutrition',
      recovery: 'Recovery',
      analytics: 'Analytics',
      coach: 'AI Coach',
      community: 'Community',
      settings: 'Settings',
      studio: 'Workout Studio',
      foodScanner: 'Food Scanner',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      today: 'Today',
      yesterday: 'Yesterday',
      streak: 'Day Streak',
      progress: 'Progress',
      target: 'Target',
      completed: 'Completed',
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fats: 'Fats',
      water: 'Water',
      weight: 'Weight',
      height: 'Height',
      syncing: 'Syncing...',
      offline: 'Offline Mode',
      online: 'Connected',
      demoMode: 'Demo Mode',
    },
    units: {
      kg: 'kg',
      lbs: 'lbs',
      cm: 'cm',
      ft: 'ft/in',
      liters: 'L',
      oz: 'fl oz',
      kcal: 'kcal',
    },
  },
  kn: {
    nav: {
      dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
      workouts: 'ವ್ಯಾಯಾಮಗಳು',
      nutrition: 'ಪೋಷಕಾಂಶ',
      recovery: 'ಚೇತರಿಕೆ (ರಿಕವರಿ)',
      analytics: 'ವಿಶ್ಲೇಷಣೆ',
      coach: 'ಎಐ ತರಬೇತುದಾರ',
      community: 'ಸಮುದಾಯ',
      settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
      studio: 'ವರ್ಕೌಟ್ ಸ್ಟುಡಿಯೋ',
      foodScanner: 'ಆಹಾರ ಸ್ಕ್ಯಾನರ್',
    },
    common: {
      save: 'ಉಳಿಸಿ',
      cancel: 'ರದ್ದುಮಾಡಿ',
      close: 'ಮುಚ್ಚಿ',
      delete: 'ಅಳಿಸಿ',
      edit: 'ತಿದ್ದಿ',
      loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
      today: 'ಇಂದು',
      yesterday: 'ನಿನ್ನೆ',
      streak: 'ದಿನಗಳ ಸತತ ಸಾಧನೆ',
      progress: 'ಪ್ರಗತಿ',
      target: 'ಗುರಿ',
      completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
      calories: 'ಕ್ಯಾಲೋರಿಗಳು',
      protein: 'ಪ್ರೋಟೀನ್',
      carbs: 'ಕಾರ್ಬೋಹೈಡ್ರೇಟ್ಸ್',
      fats: 'ಕೊಬ್ಬು',
      water: 'ನೀರು',
      weight: 'ತೂಕ',
      height: 'ಎತ್ತರ',
      syncing: 'ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...',
      offline: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್',
      online: 'ಸಂಪರ್ಕಗೊಂಡಿದೆ',
      demoMode: 'ಡೆಮೋ ಮೋಡ್',
    },
    units: {
      kg: 'ಕಿ.ಗ್ರಾಂ',
      lbs: 'ಪೌಂಡ್ಸ್',
      cm: 'ಸೆಂ.ಮೀ',
      ft: 'ಅಡಿ/ಇಂಚು',
      liters: 'ಲೀಟರ್',
      oz: 'ಔನ್ಸ್',
      kcal: 'ಕಿ.ಕ್ಯಾಲೋರಿ',
    },
  },
  hi: {
    nav: {
      dashboard: 'डैशबोर्ड',
      workouts: 'व्यायाम',
      nutrition: 'पोषण',
      recovery: 'रिकवरी',
      analytics: 'एनालिटिक्स',
      coach: 'एआई कोच',
      community: 'कम्युनिटी',
      settings: 'सेटिंग्स',
      studio: 'वर्कआउट स्टूडियो',
      foodScanner: 'फूड स्कैनर',
    },
    common: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      close: 'बंद करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      loading: 'लोड हो रहा है...',
      today: 'आज',
      yesterday: 'कल',
      streak: 'लगातार दिन',
      progress: 'प्रगति',
      target: 'लक्ष्य',
      completed: 'पूर्ण',
      calories: 'कैलोरी',
      protein: 'प्रोटीन',
      carbs: 'कार्ब्स',
      fats: 'फैट्स',
      water: 'पानी',
      weight: 'वजन',
      height: 'ऊंचाई',
      syncing: 'सिंक हो रहा है...',
      offline: 'ऑफलाइन मोड',
      online: 'कनेक्टेड',
      demoMode: 'डेमो मोड',
    },
    units: {
      kg: 'कि.ग्रा.',
      lbs: 'पाउंड',
      cm: 'सेमी',
      ft: 'फीट/इंच',
      liters: 'लीटर',
      oz: 'औंस',
      kcal: 'किलो कैलोरी',
    },
  },
}

export const REGIONAL_INDIAN_FOODS: RegionalFoodTranslation[] = [
  {
    id: 'masala-dosa',
    en: 'Masala Dosa with Chutney',
    kn: 'ಮಸಾಲೆ ದೋಸೆ (ಚಟ್ನಿ ಸಹಿತ)',
    hi: 'मसाला डोसा (चटनी के साथ)',
    proteinPer100g: 4.8,
    caloriesPer100g: 175,
    category: 'breakfast',
    transliterationEn: 'Masale Dose',
  },
  {
    id: 'idli-sambar',
    en: 'Steamed Idli with Sambar',
    kn: 'ಇಡ್ಲಿ ಸಾಂಬಾರ್',
    hi: 'इडली सांभर',
    proteinPer100g: 4.2,
    caloriesPer100g: 130,
    category: 'breakfast',
    transliterationEn: 'Idli Sambar',
  },
  {
    id: 'paneer-bhurji',
    en: 'Paneer Bhurji (Scrambled Cottage Cheese)',
    kn: 'ಪನ್ನೀರ್ ಭುರ್ಜಿ',
    hi: 'पनीर भुर्जी',
    proteinPer100g: 14.5,
    caloriesPer100g: 210,
    category: 'protein',
    transliterationEn: 'Paneer Bhurji',
  },
  {
    id: 'tadka-dal',
    en: 'Yellow Moong / Toor Dal Tadka',
    kn: 'ಬೇಳೆ ಸಾರು / ದಾಲ್ ತಡ್ಕಾ',
    hi: 'पीली तड़का दाल',
    proteinPer100g: 7.2,
    caloriesPer100g: 115,
    category: 'lunch_dinner',
    transliterationEn: 'Bele Saaru',
  },
  {
    id: 'phulka-roti',
    en: 'Whole Wheat Phulka Roti',
    kn: 'ಗೋಧಿ ಚಪಾತಿ / ರೊಟ್ಟಿ',
    hi: 'गेहूं की फुल्का रोटी',
    proteinPer100g: 7.5,
    caloriesPer100g: 240,
    category: 'lunch_dinner',
    transliterationEn: 'Chapati / Rotti',
  },
  {
    id: 'fresh-curd',
    en: 'Fresh Curd / Greek Yogurt (Dahi)',
    kn: 'ತಾಜಾ ಮೊಸರು (ದಹಿ)',
    hi: 'ताजा दही',
    proteinPer100g: 6.5,
    caloriesPer100g: 85,
    category: 'dairy',
    transliterationEn: 'Taaja Mosaru',
  },
  {
    id: 'kala-chana',
    en: 'Boiled Kala Chana Sundal',
    kn: 'ಕಪ್ಪು ಕಡಲೆ ಕಾಳು ಉಸಲಿ',
    hi: 'उबला काला चना चाट',
    proteinPer100g: 8.9,
    caloriesPer100g: 160,
    category: 'snack',
    transliterationEn: 'Kadle Kalu Usli',
  },
  {
    id: 'kanda-poha',
    en: 'Flattened Rice Poha with Peanuts',
    kn: 'ಅವಲಕ್ಕಿ ಒಗ್ಗರಣೆ (ಕಡಲೆಕಾಯಿ ಸಹಿತ)',
    hi: 'कांदा पोहा मूंगफली सहित',
    proteinPer100g: 4.5,
    caloriesPer100g: 155,
    category: 'breakfast',
    transliterationEn: 'Avalakki Oggarane',
  },
  {
    id: 'buttermilk-chaas',
    en: 'Spiced Buttermilk (Chaas / Majjige)',
    kn: 'ಮಸಾಲೆ ಮಜ್ಜಿಗೆ',
    hi: 'मसाला छाछ',
    proteinPer100g: 2.1,
    caloriesPer100g: 32,
    category: 'dairy',
    transliterationEn: 'Masale Majjige',
  },
  {
    id: 'moong-khichdi',
    en: 'Moong Dal & Brown Rice Khichdi',
    kn: 'ಹೆಸರುಬೇಳೆ ಕಿಚಡಿ',
    hi: 'मूंग दाल खिचड़ी',
    proteinPer100g: 5.6,
    caloriesPer100g: 120,
    category: 'lunch_dinner',
    transliterationEn: 'Hesaru Bele Khichdi',
  },
]

// ============ UNIT CONVERSIONS ============

export function kgToLbs(kg: number): number {
  return Number((kg * 2.20462).toFixed(1))
}

export function lbsToKg(lbs: number): number {
  return Number((lbs / 2.20462).toFixed(1))
}

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { feet, inches }
}

export function ftInToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54)
}

export function litersToFlOz(liters: number): number {
  return Number((liters * 33.814).toFixed(0))
}

export function flOzToLiters(flOz: number): number {
  return Number((flOz / 33.814).toFixed(2))
}

// ============ FORMATTERS ============

export function formatWeight(kg: number, unitSystem: UnitSystem, lang: SupportedLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en
  if (unitSystem === 'imperial') {
    const lbs = kgToLbs(kg)
    return `${lbs} ${dictionary.units.lbs}`
  }
  return `${kg} ${dictionary.units.kg}`
}

export function formatHeight(cm: number, unitSystem: UnitSystem, lang: SupportedLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFtIn(cm)
    return `${feet}′ ${inches}″`
  }
  return `${cm} ${dictionary.units.cm}`
}

export function formatVolume(liters: number, unitSystem: UnitSystem, lang: SupportedLanguage = 'en'): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en
  if (unitSystem === 'imperial') {
    const flOz = litersToFlOz(liters)
    return `${flOz} ${dictionary.units.oz}`
  }
  return `${liters} ${dictionary.units.liters}`
}

export function formatNumberLocalized(value: number, lang: SupportedLanguage = 'en'): string {
  const locale = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDateLocalized(dateString: string | Date, lang: SupportedLanguage = 'en'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return String(dateString)
  const locale = lang === 'kn' ? 'kn-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getRegionalFoodName(foodId: string, lang: SupportedLanguage = 'en'): string {
  const item = REGIONAL_INDIAN_FOODS.find((f) => f.id === foodId)
  if (!item) return foodId
  return item[lang] || item.en
}
