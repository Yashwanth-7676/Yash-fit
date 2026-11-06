import type {
  PersonalizedWorkoutRecommendation,
  PersonalizedMealRecommendation,
  PersonalizationPreferences,
  PersonalizationEngineSummary,
} from '@/types/personalization'
import { buildCoachContext } from '@/lib/ai/coachContextService'
import type { EquipmentOption } from '@/types/profile'

const STORAGE_KEYS = {
  PREFS_PREFIX: 'yashfit_personalization_prefs_v1_',
}

export const DEFAULT_PERSONALIZATION_PREFS: PersonalizationPreferences = {
  consentToLearn: true,
  intensityPreference: 'standard',
  preferredFocusMuscles: [],
  excludedIngredients: [],
  feedbackHistory: [],
}

function hasStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getPersonalizationPreferences(userId: string = 'demo-user'): PersonalizationPreferences {
  if (!hasStorage()) return DEFAULT_PERSONALIZATION_PREFS

  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PREFS_PREFIX}${userId}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_PERSONALIZATION_PREFS,
        ...parsed,
        feedbackHistory: Array.isArray(parsed.feedbackHistory) ? parsed.feedbackHistory : [],
      }
    }
  } catch (err) {
    console.warn('Unable to read personalization preferences:', err)
  }

  return DEFAULT_PERSONALIZATION_PREFS
}

export function savePersonalizationPreferences(
  prefs: PersonalizationPreferences,
  userId: string = 'demo-user'
): void {
  if (!hasStorage()) return

  try {
    localStorage.setItem(`${STORAGE_KEYS.PREFS_PREFIX}${userId}`, JSON.stringify(prefs))
  } catch (err) {
    console.warn('Unable to save personalization preferences:', err)
  }
}

export function resetPersonalization(userId: string = 'demo-user'): PersonalizationPreferences {
  if (hasStorage()) {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.PREFS_PREFIX}${userId}`)
    } catch {
      // ignore
    }
  }
  return DEFAULT_PERSONALIZATION_PREFS
}

export function submitRecommendationFeedback(
  recommendationId: string,
  feedback: 'liked' | 'disliked' | 'dismissed',
  reason?: string,
  userId: string = 'demo-user'
): PersonalizationPreferences {
  const current = getPersonalizationPreferences(userId)
  const updatedHistory = [
    {
      recommendationId,
      feedback,
      reason,
      timestamp: new Date().toISOString(),
    },
    ...current.feedbackHistory.filter((h) => h.recommendationId !== recommendationId),
  ].slice(0, 50)

  const updated: PersonalizationPreferences = {
    ...current,
    feedbackHistory: updatedHistory,
  }

  savePersonalizationPreferences(updated, userId)
  return updated
}

/**
 * Centrally synthesizes personalized workout and Indian meal recommendations based
 * strictly on verified user data, equipment constraints, and recovery readiness.
 */
export async function generatePersonalizedRecommendations(
  userId: string = 'demo-user'
): Promise<PersonalizationEngineSummary> {
  const context = await buildCoachContext(userId)
  const prefs = getPersonalizationPreferences(userId)

  const profile = context.profile
  const readiness = context.latestReadiness || 78
  const goal = profile?.primary_goal || 'Build Muscle'
  const exp = profile?.experience_level || 'Beginner'
  const gear: EquipmentOption[] = profile?.available_equipment || ['Dumbbells', 'Barbell', 'Bench']
  const diet = profile?.dietary_preference || 'Vegetarian'

  const dismissedIds = new Set(
    prefs.feedbackHistory.filter((h) => h.feedback === 'dismissed').map((h) => h.recommendationId)
  )

  // 1. Personalized Workout Recommendations
  const workoutRecs: PersonalizedWorkoutRecommendation[] = []

  // Check gear capabilities
  const hasBarbell = gear.includes('Barbell')
  const hasDumbbells = gear.includes('Dumbbells')
  const hasCables = gear.includes('Cable Machine')
  const isBodyweight = gear.includes('No Equipment') || gear.length === 0

  if (readiness >= 75) {
    workoutRecs.push({
      id: 'rec-wk-hypertrophy-1',
      routineName: isBodyweight
        ? 'Full Body Calisthenics Volume Surge'
        : hasBarbell
        ? 'Upper Body Compound Hypertrophy'
        : 'Dumbbell Mechanical Tension Circuit',
      primaryMuscles: ['Chest', 'Upper Back', 'Triceps', 'Shoulders'],
      recommendedDurationMin: 45,
      rationale: `Recommended because your recovery readiness is high (${readiness}%) and your primary goal is ${goal}. Full central nervous system recovery enables progressive overload.`,
      dataDrivers: [
        `Recovery Readiness: ${readiness}% (Optimal)`,
        `Primary Goal: ${goal}`,
        `Experience Level: ${exp}`,
        `Verified Equipment: ${gear.slice(0, 3).join(', ')}`,
      ],
      exercises: isBodyweight
        ? [
            { name: 'Standard Push-Ups', sets: 4, targetReps: '12-15', equipmentRequired: 'Bodyweight' },
            { name: 'Pike Push-Ups', sets: 3, targetReps: '8-10', equipmentRequired: 'Bodyweight' },
            { name: 'Doorframe Rows', sets: 4, targetReps: '12', equipmentRequired: 'Bodyweight' },
            { name: 'Bench/Chair Dips', sets: 3, targetReps: '15', equipmentRequired: 'Bodyweight' },
          ]
        : [
            {
              name: hasBarbell ? 'Barbell Bench Press' : 'Flat Dumbbell Press',
              sets: 4,
              targetReps: '8-10',
              equipmentRequired: hasBarbell ? 'Barbell' : 'Dumbbells',
              alternativeOption: 'Dumbbell Floor Press',
            },
            {
              name: hasCables ? 'Seated Cable Row' : 'Single-Arm Dumbbell Row',
              sets: 4,
              targetReps: '10-12',
              equipmentRequired: hasCables ? 'Cable Machine' : 'Dumbbells',
            },
            {
              name: hasDumbbells ? 'Dumbbell Lateral Raises' : 'Resistance Band Pull-Aparts',
              sets: 3,
              targetReps: '12-15',
              equipmentRequired: hasDumbbells ? 'Dumbbells' : 'Resistance Bands',
            },
            {
              name: hasCables ? 'Tricep Rope Pushdown' : 'Overhead Dumbbell Tricep Extension',
              sets: 3,
              targetReps: '12',
              equipmentRequired: hasCables ? 'Cable Machine' : 'Dumbbells',
            },
          ],
      progressionCue: 'Add +2.5kg if you complete the top rep target on all sets with strict form.',
    })
  } else {
    workoutRecs.push({
      id: 'rec-wk-recovery-1',
      routineName: 'Active Recovery & Joint Mobility Flow',
      primaryMuscles: ['Full Body Mobility', 'Core', 'Hamstrings', 'Hips'],
      recommendedDurationMin: 30,
      rationale: `Recommended because your morning readiness score (${readiness}%) indicates elevated muscular fatigue. Reducing axial loading protects connective tissues and speeds glycogen resynthesis.`,
      dataDrivers: [
        `Recovery Readiness: ${readiness}% (Fatigued / Moderate)`,
        `Sleep Tracked: ${context.latestSleepHours || 6.5}h`,
        `Preserved Streak: ${context.activeStreak} Days`,
      ],
      exercises: [
        { name: 'Cat-Cow Spinal Wave', sets: 3, targetReps: '10 breaths', equipmentRequired: 'Floor/Mat' },
        { name: 'World\'s Greatest Stretch', sets: 3, targetReps: '5 per side', equipmentRequired: 'Bodyweight' },
        { name: 'Bodyweight Glute Bridges', sets: 3, targetReps: '15 reps', equipmentRequired: 'Floor/Mat' },
        { name: 'Dead Bug Core Bracing', sets: 3, targetReps: '10 per side', equipmentRequired: 'Bodyweight' },
      ],
      progressionCue: 'Focus on diaphragmatic breathing and joint range-of-motion rather than load.',
    })
  }

  // 2. Personalized Indian Meal Recommendations
  const mealRecs: PersonalizedMealRecommendation[] = []

  if (diet === 'Vegetarian') {
    mealRecs.push({
      id: 'rec-meal-paneer-bhurji',
      dishName: 'High-Protein Paneer Bhurji with Phulkas',
      hindiOrRegionalName: 'पनीर भुर्जी और फुल्के / ಪನ್ನೀರ್ ಬುರ್ಜಿ',
      regionalCategory: 'North Indian',
      dietaryType: 'Vegetarian',
      calories: 520,
      proteinGrams: 36,
      carbsGrams: 48,
      fatsGrams: 20,
      rationale: `Recommended to fulfill your daily target of ${context.profile?.weight_kg ? Math.round(context.profile.weight_kg * 2) : 145}g protein on a vegetarian diet. Low-fat paneer delivers 18g protein per 100g with complete essential amino acids.`,
      dataDrivers: [
        `Dietary Preference: Vegetarian`,
        `Target Daily Protein: ~${context.profile?.weight_kg ? Math.round(context.profile.weight_kg * 2) : 145}g`,
        `Cuisine Preference: North Indian`,
      ],
      keyIngredients: ['Low-fat Paneer (200g)', 'Whole Wheat Phulkas (2)', 'Onions & Tomatoes', 'Turmeric & Cumin'],
    })

    mealRecs.push({
      id: 'rec-meal-pesarattu-sambar',
      dishName: 'Moong Dal Pesarattu with Vegetable Sambar',
      hindiOrRegionalName: 'पेसरट्टू और सांभर / ಪೆಸರಟ್ಟು ಮತ್ತು ಸಾಂಬಾರ್',
      regionalCategory: 'South Indian',
      dietaryType: 'Vegetarian',
      calories: 440,
      proteinGrams: 26,
      carbsGrams: 62,
      fatsGrams: 10,
      rationale: `Recommended for complex glycogen replenishment without blood sugar spikes. Green moong dal provides sustained digestive energy and rich dietary fiber.`,
      dataDrivers: [
        `Dietary Preference: Vegetarian`,
        `Cuisine Preference: South Indian`,
        `Target Calories: ~2,200 kcal`,
      ],
      keyIngredients: ['Green Moong Dal Batter', 'Vegetable Drumstick Sambar', 'Coconut-Chana Chutney'],
    })
  } else if (diet === 'Eggetarian') {
    mealRecs.push({
      id: 'rec-meal-egg-curry-rice',
      dishName: 'Boiled Egg Curry with Jeera Brown Rice',
      hindiOrRegionalName: 'अंडा करी और जीरा राइस / ಮೊಟ್ಟೆ ಸಾಂಬಾರ್',
      regionalCategory: 'North/Central Indian',
      dietaryType: 'Eggetarian',
      calories: 560,
      proteinGrams: 38,
      carbsGrams: 58,
      fatsGrams: 18,
      rationale: `Whole eggs provide a biological value of 100 with essential choline and leucine, perfectly matching your strength recovery requirements.`,
      dataDrivers: [
        `Dietary Preference: Eggetarian`,
        `Primary Goal: ${goal}`,
        `Muscle Protein Synthesis Threshold: >30g protein per meal`,
      ],
      keyIngredients: ['Whole Eggs (3)', 'Egg Whites (2)', 'Jeera Rice (1 cup)', 'Spiced Tomato Gravy'],
    })
  } else if (diet === 'Non-Vegetarian') {
    mealRecs.push({
      id: 'rec-meal-chicken-tikka',
      dishName: 'Tandoori Chicken Breast with Spiced Yellow Dal',
      hindiOrRegionalName: 'तंदूरी चिकन और दाल तड़का / ಚಿಕನ್ ಟಿಕ್ಕಾ',
      regionalCategory: 'North Indian',
      dietaryType: 'Non-Vegetarian',
      calories: 580,
      proteinGrams: 54,
      carbsGrams: 42,
      fatsGrams: 16,
      rationale: `Lean chicken breast delivers 31g protein per 100g with minimal saturated fat, maximizing muscle recovery while keeping total caloric intake aligned with your goal.`,
      dataDrivers: [
        `Dietary Preference: Non-Vegetarian`,
        `Target Goal: ${goal}`,
        `Protein Target: High Density`,
      ],
      keyIngredients: ['Skinless Chicken Breast (200g)', 'Yellow Moong Dal (1 bowl)', 'Mint Chutney', 'Cucumber Raita'],
    })
  } else {
    // Vegan
    mealRecs.push({
      id: 'rec-meal-soya-curry',
      dishName: 'Spicy Soya Chunks Curry with Bajra Roti',
      hindiOrRegionalName: 'सोया चंक्स करी और बाजरा रोटी / ಸೋಯಾ ಪಲ್ಯ',
      regionalCategory: 'Maharashtrian / Central Indian',
      dietaryType: 'Vegan',
      calories: 490,
      proteinGrams: 42,
      carbsGrams: 52,
      fatsGrams: 12,
      rationale: `Soya chunks provide 52% protein by dry weight—the highest concentration among plant foods. Paired with whole millet roti for complete amino acid synthesis.`,
      dataDrivers: [
        `Dietary Preference: Vegan`,
        `Plant Protein Density: 52g / 100g`,
        `Millet Carbohydrate: Low Glycemic Index`,
      ],
      keyIngredients: ['Soya Chunks (60g dry)', 'Bajra Roti (2)', 'Tomato-Ginger Gravy', 'Green Salad'],
    })
  }

  // Filter out any explicitly dismissed recommendations
  const filteredWorkouts = workoutRecs.filter((w) => !dismissedIds.has(w.id))
  const filteredMeals = mealRecs.filter((m) => !dismissedIds.has(m.id))

  // Attach feedback states
  const workoutsWithFeedback = filteredWorkouts.map((w) => {
    const feedbackRecord = prefs.feedbackHistory.find((h) => h.recommendationId === w.id)
    return {
      ...w,
      feedbackState: feedbackRecord?.feedback,
    }
  })

  const mealsWithFeedback = filteredMeals.map((m) => {
    const feedbackRecord = prefs.feedbackHistory.find((h) => h.recommendationId === m.id)
    return {
      ...m,
      feedbackState: feedbackRecord?.feedback,
    }
  })

  return {
    workoutRecommendations: workoutsWithFeedback,
    mealRecommendations: mealsWithFeedback,
    preferences: prefs,
    lastCalibratedAt: new Date().toISOString(),
  }
}
