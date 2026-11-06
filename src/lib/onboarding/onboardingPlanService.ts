import type {
  PrimaryGoal,
  ExperienceLevel,
  TrainingEnvironment,
  EquipmentOption,
  DietaryPreference,
} from '@/types/profile'

export type IndianCuisinePreference =
  | 'North Indian'
  | 'South Indian'
  | 'Maharashtrian'
  | 'East Indian'
  | 'Mixed Regional'

export type FitnessLimitation =
  | 'None'
  | 'Lower Back Sensitivity'
  | 'Knee Joint Discomfort'
  | 'Shoulder Impingement'
  | 'Wrist or Elbow Strain'

export interface OnboardingDraftData {
  first_name: string
  age: string | number
  gender?: 'male' | 'female' | 'other'
  height_cm: string | number
  weight_kg: string | number
  target_weight_kg?: string | number
  primary_goal: PrimaryGoal | ''
  experience_level: ExperienceLevel | ''
  training_environment: TrainingEnvironment | ''
  available_equipment: EquipmentOption[]
  training_days_per_week: number
  scheduled_days: string[] // e.g. ['Mon', 'Tue', 'Thu', 'Sat']
  preferred_workout_duration: number // 30, 45, 60, 75 min
  dietary_preference: DietaryPreference | ''
  indian_cuisine_preference: IndianCuisinePreference
  fitness_limitations: FitnessLimitation[]
  onboarding_step: number
  saved_at?: string
}

export interface SynthesizedWorkoutPlan {
  splitTitle: string
  weeklyFrequency: number
  sessionDurationMin: number
  preferredDays: string[]
  primaryFocus: string
  routines: Array<{
    dayName: string
    routineTitle: string
    targetMuscles: string
    keyExercises: string[]
  }>
  limitationCues: string[]
}

export interface SynthesizedNutritionTargets {
  bmr: number
  tdee: number
  targetCalories: number
  targetProteinGrams: number
  targetCarbsGrams: number
  targetFatsGrams: number
  hydrationLiters: number
  dietaryStyle: string
  cuisineFocus: IndianCuisinePreference
  recommendedStaples: Array<{ name: string; proteinPer100g: string; notes: string }>
}

export interface SynthesizedOnboardingResult {
  workoutPlan: SynthesizedWorkoutPlan
  nutritionTargets: SynthesizedNutritionTargets
}

export const DEFAULT_SCHEDULED_DAYS: Record<number, string[]> = {
  3: ['Mon', 'Wed', 'Fri'],
  4: ['Mon', 'Tue', 'Thu', 'Sat'],
  5: ['Mon', 'Tue', 'Wed', 'Fri', 'Sat'],
  6: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

/**
 * Deterministically computes tailored workout plan & macro targets from user profile inputs.
 */
export function synthesizePersonalizedPlan(data: OnboardingDraftData): SynthesizedOnboardingResult {
  const age = Number(data.age) || 25
  const height = Number(data.height_cm) || 175
  const weight = Number(data.weight_kg) || 70
  const days = Number(data.training_days_per_week) || 4
  const goal = data.primary_goal || 'Build Muscle'
  const exp = data.experience_level || 'Beginner'
  const duration = data.preferred_workout_duration || 45
  const scheduledDays =
    data.scheduled_days && data.scheduled_days.length === days
      ? data.scheduled_days
      : DEFAULT_SCHEDULED_DAYS[days] || ['Mon', 'Tue', 'Thu', 'Sat']
  const env = data.training_environment || 'Commercial Gym'
  const limitations = data.fitness_limitations || ['None']
  const diet = data.dietary_preference || 'Vegetarian'
  const cuisine = data.indian_cuisine_preference || 'North Indian'

  // 1. Compute BMR & TDEE (Mifflin-St Jeor formula)
  // Default to standard coefficient (approx 50% split assumption)
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
  const activityMultiplier = days <= 3 ? 1.375 : days <= 4 ? 1.45 : days <= 5 ? 1.55 : 1.65
  const tdee = Math.round(bmr * activityMultiplier)

  let targetCalories = tdee
  if (goal === 'Build Muscle') targetCalories = tdee + 300
  else if (goal === 'Lose Fat') targetCalories = tdee - 450
  else if (goal === 'Increase Strength') targetCalories = tdee + 150
  else if (goal === 'Improve Fitness') targetCalories = tdee - 150

  // Protein: 1.8g to 2.2g per kg bodyweight
  const proteinMultiplier = goal === 'Build Muscle' || goal === 'Increase Strength' ? 2.0 : 1.8
  const targetProteinGrams = Math.round(weight * proteinMultiplier)

  // Fats: 25% of total caloric intake (9 kcal / gram)
  const targetFatsGrams = Math.round((targetCalories * 0.25) / 9)

  // Carbs: Remaining calories (4 kcal / gram)
  const remainingCarbCalories = Math.max(0, targetCalories - targetProteinGrams * 4 - targetFatsGrams * 9)
  const targetCarbsGrams = Math.round(remainingCarbCalories / 4)

  // Hydration: 35ml per kg bodyweight + training replenishment
  const hydrationLiters = Number((Math.min(4.5, Math.max(2.5, (weight * 35) / 1000 + 0.5))).toFixed(1))

  // 2. Synthesize Workout Plan
  let splitTitle = '4-Day Upper / Lower Periodization Split'
  let primaryFocus = 'Hypertrophy & Progressive Compound Strength'
  let routines: SynthesizedWorkoutPlan['routines'] = []

  if (env === 'Bodyweight Only' || data.available_equipment.includes('No Equipment')) {
    splitTitle = `${days}-Day Calisthenics & Movement Flow`
    primaryFocus = 'Relative Strength, Core Stability & Movement Control'
    routines = [
      {
        dayName: scheduledDays[0] || 'Day 1',
        routineTitle: 'Upper Body Calisthenics Mastery',
        targetMuscles: 'Chest, Triceps, Shoulders, Core',
        keyExercises: ['Push-Ups', 'Pike Push-Ups', 'Plank Hold', 'Dips (Chair/Parallel)'],
      },
      {
        dayName: scheduledDays[1] || 'Day 2',
        routineTitle: 'Lower Body Unilateral Power',
        targetMuscles: 'Quads, Hamstrings, Glutes, Calves',
        keyExercises: ['Bodyweight Squats', 'Walking Lunges', 'Single-Leg Glute Bridges', 'Calf Raises'],
      },
      {
        dayName: scheduledDays[2] || 'Day 3',
        routineTitle: 'Back, Pull & Core Conditioning',
        targetMuscles: 'Lats, Rhomboids, Biceps, Obliques',
        keyExercises: ['Doorframe/Inverted Rows', 'Superman Extensions', 'Bicycle Crunches', 'Hollow Body'],
      },
      ...(days >= 4
        ? [
            {
              dayName: scheduledDays[3] || 'Day 4',
              routineTitle: 'Full Body High-Intensity Mobility',
              targetMuscles: 'Full Body Cardiovascular Stamina',
              keyExercises: ['Burpees', 'Mountain Climbers', 'Jump Squats', 'Bear Crawl'],
            },
          ]
        : []),
    ]
  } else if (days === 3) {
    splitTitle = '3-Day Full Body Power & Hypertrophy Foundation'
    primaryFocus = 'Compound Movement Efficiency & High-Frequency Recovery'
    routines = [
      {
        dayName: scheduledDays[0],
        routineTitle: 'Full Body A — Squat & Horizontal Press',
        targetMuscles: 'Quads, Chest, Back, Triceps',
        keyExercises: ['Barbell/Dumbbell Squats', 'Flat Bench Press', 'Barbell Row', 'Tricep Pushdown'],
      },
      {
        dayName: scheduledDays[1],
        routineTitle: 'Full Body B — Hinge & Vertical Press',
        targetMuscles: 'Hamstrings, Glutes, Shoulders, Lats',
        keyExercises: ['Romanian Deadlifts', 'Overhead Shoulder Press', 'Lat Pulldowns', 'Bicep Curls'],
      },
      {
        dayName: scheduledDays[2],
        routineTitle: 'Full Body C — Unilateral & Core Integration',
        targetMuscles: 'Full Body Density & Core',
        keyExercises: ['Bulgarian Split Squats', 'Incline Dumbbell Press', 'Seated Cable Row', 'Hanging Leg Raises'],
      },
    ]
  } else if (days >= 5) {
    splitTitle = '5-Day Push / Pull / Legs / Upper / Lower'
    primaryFocus = 'Maximum Hypertrophy Volume with Dedicated Muscle Specialization'
    routines = [
      {
        dayName: scheduledDays[0],
        routineTitle: 'Push Hypertrophy',
        targetMuscles: 'Chest, Anterior Delts, Triceps',
        keyExercises: ['Incline Dumbbell Bench', 'Overhead Press', 'Cable Flyes', 'Skull Crushers'],
      },
      {
        dayName: scheduledDays[1],
        routineTitle: 'Pull Hypertrophy',
        targetMuscles: 'Lats, Upper Back, Biceps, Rear Delts',
        keyExercises: ['Lat Pulldowns', 'Barbell Rows', 'Face Pulls', 'Incline Dumbbell Curls'],
      },
      {
        dayName: scheduledDays[2],
        routineTitle: 'Legs & Calves',
        targetMuscles: 'Quads, Hamstrings, Glutes, Calves',
        keyExercises: ['Barbell Squats', 'Romanian Deadlifts', 'Leg Extensions', 'Standing Calf Raises'],
      },
      {
        dayName: scheduledDays[3] || 'Day 4',
        routineTitle: 'Upper Body Power',
        targetMuscles: 'Chest, Back, Shoulders, Arms',
        keyExercises: ['Flat Bench Press', 'Weighted Pull-Ups / Lat Pulldown', 'Lateral Raises', 'Hammer Curls'],
      },
      {
        dayName: scheduledDays[4] || 'Day 5',
        routineTitle: 'Lower Body & Core Stability',
        targetMuscles: 'Hamstrings, Glutes, Abs',
        keyExercises: ['Leg Press', 'Hamstring Curls', 'Ab Wheel Rollouts', 'Farmer Walks'],
      },
    ]
  } else {
    // 4 Days Default (Upper / Lower)
    routines = [
      {
        dayName: scheduledDays[0],
        routineTitle: 'Upper Body A — Chest & Back Dominance',
        targetMuscles: 'Chest, Lats, Shoulders, Arms',
        keyExercises: ['Flat Dumbbell Press', 'Chest-Supported Row', 'Dumbbell Lateral Raises', 'Tricep Rope Pressdown'],
      },
      {
        dayName: scheduledDays[1],
        routineTitle: 'Lower Body A — Quad & Core Dominance',
        targetMuscles: 'Quads, Glutes, Abs',
        keyExercises: ['Goblet / Barbell Squats', 'Walking Lunges', 'Leg Extensions', 'Cable Woodchoppers'],
      },
      {
        dayName: scheduledDays[2],
        routineTitle: 'Upper Body B — Shoulder & Arm Hypertrophy',
        targetMuscles: 'Delts, Upper Back, Biceps, Triceps',
        keyExercises: ['Seated Overhead Press', 'Lat Pulldowns', 'Incline Dumbbell Curls', 'Dips / Pushdowns'],
      },
      {
        dayName: scheduledDays[3],
        routineTitle: 'Lower Body B — Posterior Chain Focus',
        targetMuscles: 'Hamstrings, Glutes, Calves',
        keyExercises: ['Romanian Deadlifts', 'Leg Curls', 'Bulgarian Split Squats', 'Calf Raises'],
      },
    ]
  }

  // Limitation cues
  const limitationCues: string[] = []
  if (limitations.includes('Lower Back Sensitivity')) {
    limitationCues.push(
      'Spinal-Spared Kinematics: Chest-supported rows and split squats replace heavy axial spinal loading.'
    )
  }
  if (limitations.includes('Knee Joint Discomfort')) {
    limitationCues.push(
      'Knee-Friendly Geometry: Box squats, hamstring curls, and glute bridges emphasize posterior chain over patellar shear.'
    )
  }
  if (limitations.includes('Shoulder Impingement')) {
    limitationCues.push(
      'Subacromial Protection: Neutral-grip dumbbell presses and high cable face-pulls prioritized to avoid impingement.'
    )
  }
  if (limitations.includes('Wrist or Elbow Strain')) {
    limitationCues.push(
      'Joint Neutrality: Cable attachments and dumbbell grips with neutral wrist position recommended over straight barbells.'
    )
  }

  // 3. Nutrition Staples tailored to Indian Cuisine & Diet
  let recommendedStaples: Array<{ name: string; proteinPer100g: string; notes: string }> = []

  if (diet === 'Vegetarian') {
    recommendedStaples = [
      { name: 'Low-Fat Paneer', proteinPer100g: '18g – 20g', notes: 'Excellent casein source for prolonged muscle recovery' },
      { name: 'Soya Chunks / Mealmaker', proteinPer100g: '52g', notes: 'Highest density plant protein per rupee' },
      { name: 'Yellow Moong Dal / Sprouts', proteinPer100g: '24g (dry)', notes: 'Easily digestible with complete amino acid profile with rice/roti' },
      { name: 'Greek Yogurt / Thick Curd', proteinPer100g: '8g – 10g', notes: 'Gut microbiome health and whey/casein blend' },
      { name: 'Besan (Chickpea Flour) Chilla', proteinPer100g: '22g (dry)', notes: 'Savory Indian high-protein breakfast staple' },
    ]
  } else if (diet === 'Eggetarian') {
    recommendedStaples = [
      { name: 'Whole Eggs & Egg Whites', proteinPer100g: '13g (6g/egg)', notes: 'Gold standard biological value 100 for muscle protein synthesis' },
      { name: 'Paneer / Cottage Cheese', proteinPer100g: '18g', notes: 'Rich in leucine and calcium for bone density' },
      { name: 'Egg Bhurji with Roti', proteinPer100g: '14g per serving', notes: 'Rapid post-workout meal with turmeric and spices' },
      { name: 'Sprouted Moong Salad with Eggs', proteinPer100g: '16g per bowl', notes: 'Micronutrient-dense lunch addition' },
      { name: 'Curd / Dahi', proteinPer100g: '8g', notes: 'Digestive enzyme support and sustained satiety' },
    ]
  } else if (diet === 'Non-Vegetarian') {
    recommendedStaples = [
      { name: 'Chicken Breast Curry / Tikka', proteinPer100g: '31g', notes: 'Leanest complete protein source with zero carbohydrates' },
      { name: 'Whole Eggs & Omelettes', proteinPer100g: '13g', notes: 'Essential choline and muscle building micronutrients' },
      { name: 'Rohu / Katla / Fish Curry', proteinPer100g: '20g', notes: 'Omega-3 fatty acids for joint and recovery support' },
      { name: 'Dal with Boiled Eggs', proteinPer100g: '18g per bowl', notes: 'Traditional comfort meal with dual protein sources' },
      { name: 'Paneer / Dahi', proteinPer100g: '18g', notes: 'Flexible vegetarian dinner substitution' },
    ]
  } else {
    // Vegan
    recommendedStaples = [
      { name: 'Tofu (Soy Paneer)', proteinPer100g: '16g – 18g', notes: '100% plant based complete protein ideal in curries' },
      { name: 'Soya Chunks', proteinPer100g: '52g', notes: 'Budget-friendly, high fiber, zero lactose' },
      { name: 'Rajma / Chana Masala', proteinPer100g: '22g (dry)', notes: 'Complex carbohydrate and protein combo for steady glycogen' },
      { name: 'Sprouted Green Moong', proteinPer100g: '24g (dry)', notes: 'Bioavailable vitamins and gut-friendly enzymes' },
      { name: 'Roasted Peanuts & Chana', proteinPer100g: '26g', notes: 'High-density snack for healthy fats and energy' },
    ]
  }

  return {
    workoutPlan: {
      splitTitle,
      weeklyFrequency: days,
      sessionDurationMin: duration,
      preferredDays: scheduledDays,
      primaryFocus,
      routines,
      limitationCues,
    },
    nutritionTargets: {
      bmr,
      tdee,
      targetCalories,
      targetProteinGrams,
      targetCarbsGrams,
      targetFatsGrams,
      hydrationLiters,
      dietaryStyle: diet,
      cuisineFocus: cuisine,
      recommendedStaples,
    },
  }
}
