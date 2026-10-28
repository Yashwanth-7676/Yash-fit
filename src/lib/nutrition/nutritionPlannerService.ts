import type {
  NutritionPlanV2,
  RegionalPreference,
  BudgetTier,
  PlannedMealCourse,
  GroceryItem,
  IngredientSubstitution,
  MealPrepNote,
} from '../../types/nutritionPlanner'
import type { UserProfile, DietaryPreference } from '../../types/profile'
import { calculateMacroTargets } from '../nutritionCalculator'
import { createClient } from '../supabase/client'

const STORAGE_KEY_PREFIX = 'yashfit_nutrition_plan_v2_'

/**
 * Standard substitution database for Indian fitness nutrition.
 */
export const STANDARD_SUBSTITUTIONS: IngredientSubstitution[] = [
  {
    originalId: 'sub-paneer',
    originalName: '100g Low-Fat Paneer',
    substituteId: 'food-soya-chunks-50g',
    substituteName: '50g Dry Soya Chunks',
    macroDelta: '+6g Protein, -13g Fats, -50 kcal',
    costDelta: 'Saves ~₹30 per serving (65% cheaper)',
    reason: 'Ultra-high protein density at fractional budget; optimal for lean cutting phases.',
  },
  {
    originalId: 'sub-chicken',
    originalName: '150g Chicken Breast',
    substituteId: 'sub-paneer-soya-mix',
    substituteName: '100g Paneer + 25g Soya Chunks',
    macroDelta: 'Equivalent 33g Protein, +10g healthy fats',
    costDelta: 'Comparable ~₹60 per serving',
    reason: 'Complete amino acid profile for vegetarian recovery with zero animal flesh.',
  },
  {
    originalId: 'sub-rice',
    originalName: '150g White Rice',
    substituteId: 'sub-foxtail-millet',
    substituteName: '120g Foxtail / Barnyard Millet',
    macroDelta: '+4g Fiber, lower glycemic index (GI 54 vs 73)',
    costDelta: '+₹5 per serving',
    reason: 'Stabilizes postprandial insulin spike and sustains prolonged workout energy.',
  },
  {
    originalId: 'sub-whey',
    originalName: '1 Scoop Whey Protein (24g P)',
    substituteId: 'sub-sattu-curd-shake',
    substituteName: '40g Chana Sattu + 150g Curd',
    macroDelta: '18g Protein, +18g complex carbs, +6g fiber',
    costDelta: 'Saves ~₹50 per serving vs imported whey',
    reason: 'Traditional desi protein superfood with natural electrolytes and gut-friendly probiotics.',
  },
  {
    originalId: 'sub-whole-egg',
    originalName: '3 Whole Eggs',
    substituteId: 'sub-egg-whites-paneer',
    substituteName: '4 Egg Whites + 30g Light Paneer',
    macroDelta: '22g Protein, -9g Saturated Fats',
    costDelta: 'Similar cost ~₹35',
    reason: 'Reduces dietary saturated fats while sustaining high leucine for muscle synthesis.',
  },
]

/**
 * Generates an evidence-based, regionalized meal schedule tailored to user macros and budget.
 */
export function generateMealPlanCourses(
  regional: RegionalPreference,
  dietary: DietaryPreference,
  budget: BudgetTier,
  targetCalories: number,
  targetProtein: number
): PlannedMealCourse[] {
  // Approximate macro split: 25% Breakfast, 35% Lunch, 15% Snack, 25% Dinner
  const isVeg = dietary === 'Vegetarian' || dietary === 'Vegan'

  switch (regional) {
    case 'South Indian': {
      return [
        {
          type: 'Breakfast',
          name: 'Protein Idli / Pesarattu with Vegetable Sambar',
          foods: [
            {
              id: 'si-pesarattu',
              name: 'Whole Green Moong Pesarattu (2 pieces)',
              servingSize: '2 dosas (140g)',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 34,
              fatsGrams: 5,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: budget === 'Budget-Friendly' ? 25 : 35,
            },
            {
              id: 'si-sambar',
              name: 'Dal Sambar with Drumstick & Bottle Gourd',
              servingSize: '1 medium cup (150ml)',
              calories: Math.round(targetCalories * 0.10),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 18,
              fatsGrams: 3,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 52,
          totalFats: 8,
          estimatedCostInr: budget === 'Budget-Friendly' ? 45 : 65,
          prepTip: 'Ferment green gram batter overnight; add grated ginger and cumin for digestability.',
        },
        {
          type: 'Lunch',
          name: isVeg ? 'Soya & Curd Rice Platter with Beetroot Poriyal' : 'Kozhi (Chicken) Curry with Brown Matta Rice',
          foods: [
            {
              id: 'si-lunch-main',
              name: isVeg ? 'Spiced Soya Chunk Pepper Roast (75g)' : 'South Indian Pepper Chicken (150g)',
              servingSize: '1 bowl',
              calories: Math.round(targetCalories * 0.20),
              proteinGrams: Math.round(targetProtein * 0.25),
              carbsGrams: isVeg ? 18 : 6,
              fatsGrams: 7,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
              costPerServingInr: isVeg ? 25 : 70,
            },
            {
              id: 'si-lunch-carb',
              name: 'Steamed Kerala Matta / Brown Rice with Rasam',
              servingSize: '1.5 cups (200g)',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 48,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 25,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.35),
          totalProtein: Math.round(targetProtein * 0.35),
          totalCarbs: 66,
          totalFats: 9,
          estimatedCostInr: isVeg ? 50 : 95,
          prepTip: 'Use freshly crushed black pepper and curry leaves for thermo-metabolic boost.',
        },
        {
          type: 'Snack',
          name: 'Chana Sundal & Filter Coffee / Green Tea',
          foods: [
            {
              id: 'si-snack-sundal',
              name: 'Boiled White / Kala Chana Sundal with Grated Coconut',
              servingSize: '1 cup (120g)',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 24,
              fatsGrams: 4,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.15),
          totalProtein: Math.round(targetProtein * 0.15),
          totalCarbs: 24,
          totalFats: 4,
          estimatedCostInr: 25,
          prepTip: 'Tempering with mustard seeds and curry leaves adds antioxidants with minimal oil.',
        },
        {
          type: 'Dinner',
          name: 'Egg Podimas / Paneer Ghee Roast with Millets Roti',
          foods: [
            {
              id: 'si-dinner-protein',
              name: isVeg ? 'Paneer Bhurji / Roast (100g)' : 'Egg Podimas (3 Whole Eggs + 2 Whites)',
              servingSize: '1 portion',
              calories: Math.round(targetCalories * 0.18),
              proteinGrams: Math.round(targetProtein * 0.20),
              carbsGrams: 8,
              fatsGrams: 11,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Eggetarian',
              costPerServingInr: 45,
            },
            {
              id: 'si-dinner-roti',
              name: 'Jowar / Ragi Rotis (2 pieces)',
              servingSize: '2 rotis',
              calories: Math.round(targetCalories * 0.07),
              proteinGrams: Math.round(targetProtein * 0.05),
              carbsGrams: 26,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 15,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 34,
          totalFats: 13,
          estimatedCostInr: 60,
          prepTip: 'Ragi and Jowar rotis are rich in calcium and magnesium to assist muscle relaxation before sleep.',
        },
      ]
    }

    case 'East Indian': {
      return [
        {
          type: 'Breakfast',
          name: 'Bihari Sattu Drink & Boiled Sprouts Chaat',
          foods: [
            {
              id: 'ei-sattu-drink',
              name: 'Spiced Roasted Chana Sattu Drink with Lemon & Kala Namak',
              servingSize: '40g Sattu in 350ml water',
              calories: Math.round(targetCalories * 0.14),
              proteinGrams: Math.round(targetProtein * 0.14),
              carbsGrams: 22,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 18,
            },
            {
              id: 'ei-sprouts-chaat',
              name: 'Kala Chana & Moong Sprouts Chaat',
              servingSize: '100g',
              calories: Math.round(targetCalories * 0.11),
              proteinGrams: Math.round(targetProtein * 0.11),
              carbsGrams: 19,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 15,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 41,
          totalFats: 4,
          estimatedCostInr: 35,
          prepTip: 'Sattu is gut-cooling and low glycemic; drink directly post-workout or at breakfast.',
        },
        {
          type: 'Lunch',
          name: isVeg ? 'Chholar Dal with Soya Curry & Brown Rice' : 'Traditional Rohu/Katla Fish Curry with Steamed Rice',
          foods: [
            {
              id: 'ei-lunch-protein',
              name: isVeg ? 'Bengali Style Soya Chunk Gravy (60g Dry)' : 'Shorshe Rohu Fish Curry (180g)',
              servingSize: '1 bowl',
              calories: Math.round(targetCalories * 0.20),
              proteinGrams: Math.round(targetProtein * 0.25),
              carbsGrams: isVeg ? 16 : 4,
              fatsGrams: 7,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
              costPerServingInr: isVeg ? 25 : 85,
            },
            {
              id: 'ei-lunch-dal-rice',
              name: 'Yellow Moong Dal with Steamed Rice & Greens (Shaak)',
              servingSize: '1 plate',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 50,
              fatsGrams: 3,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 30,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.35),
          totalProtein: Math.round(targetProtein * 0.35),
          totalCarbs: 66,
          totalFats: 10,
          estimatedCostInr: isVeg ? 55 : 115,
          prepTip: 'Freshwater fish provides valuable Omega-3 fatty acids for joint and tendon resilience.',
        },
        {
          type: 'Snack',
          name: 'Roasted Makhana & Low-Fat Sandesh',
          foods: [
            {
              id: 'ei-makhana',
              name: 'Puffed Foxnuts (Makhana) dry roasted with rock salt',
              servingSize: '35g',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 25,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 35,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.15),
          totalProtein: Math.round(targetProtein * 0.15),
          totalCarbs: 25,
          totalFats: 2,
          estimatedCostInr: 35,
          prepTip: 'Dry roast in batches on low flame to maintain crispiness without oil.',
        },
        {
          type: 'Dinner',
          name: 'Paneer / Egg Dal Tadka with Phulkas',
          foods: [
            {
              id: 'ei-dinner-protein',
              name: isVeg ? 'Paneer Bhurji / Chenna Stir-fry (100g)' : 'Egg Curry with 3 Eggs',
              servingSize: '1 portion',
              calories: Math.round(targetCalories * 0.18),
              proteinGrams: Math.round(targetProtein * 0.20),
              carbsGrams: 8,
              fatsGrams: 10,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Eggetarian',
              costPerServingInr: 45,
            },
            {
              id: 'ei-dinner-rotis',
              name: 'Whole Wheat Phulkas with Masoor Dal',
              servingSize: '2 rotis + 1 small bowl dal',
              calories: Math.round(targetCalories * 0.07),
              proteinGrams: Math.round(targetProtein * 0.05),
              carbsGrams: 30,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 38,
          totalFats: 12,
          estimatedCostInr: 65,
          prepTip: 'Light red lentil (Masoor) dal is high in folate and easy to digest before bedtime.',
        },
      ]
    }

    case 'West Indian': {
      return [
        {
          type: 'Breakfast',
          name: 'Sprouted Moong Usal & Multigrain Methi Thepla',
          foods: [
            {
              id: 'wi-sprouts-usal',
              name: 'Maharashtrian Sprouted Moong Usal',
              servingSize: '150g',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 28,
              fatsGrams: 4,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 22,
            },
            {
              id: 'wi-thepla',
              name: 'High-Protein Besan Methi Thepla (2 pieces)',
              servingSize: '2 theplas',
              calories: Math.round(targetCalories * 0.10),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 24,
              fatsGrams: 4,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 52,
          totalFats: 8,
          estimatedCostInr: 42,
          prepTip: 'Mix 50% chickpea flour (besan) with wheat flour to double the protein of traditional theplas.',
        },
        {
          type: 'Lunch',
          name: isVeg ? 'Soya & Kala Chana Gravy with Bhakri & Kachumber' : 'Konkani Fish/Chicken Curry with Jowar Bhakri',
          foods: [
            {
              id: 'wi-lunch-protein',
              name: isVeg ? 'Spiced Soya & Green Pea Curry' : 'Malvani Style Chicken/Fish (160g)',
              servingSize: '1 portion',
              calories: Math.round(targetCalories * 0.20),
              proteinGrams: Math.round(targetProtein * 0.25),
              carbsGrams: isVeg ? 18 : 5,
              fatsGrams: 8,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
              costPerServingInr: isVeg ? 25 : 80,
            },
            {
              id: 'wi-bhakri',
              name: 'Jowar / Bajra Bhakri (2 small) with Mint Chaas',
              servingSize: '2 bhakris + 200ml chaas',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 46,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 25,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.35),
          totalProtein: Math.round(targetProtein * 0.35),
          totalCarbs: 64,
          totalFats: 10,
          estimatedCostInr: isVeg ? 50 : 105,
          prepTip: 'Chaas with roasted cumin restores electrolytes lost in heavy training.',
        },
        {
          type: 'Snack',
          name: 'Roasted Chana Peanut Chaat & Fresh Lime Juice',
          foods: [
            {
              id: 'wi-snack-chaat',
              name: 'Roasted Chana & Peanuts with Onion, Tomato & Lemon',
              servingSize: '60g',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 22,
              fatsGrams: 6,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.15),
          totalProtein: Math.round(targetProtein * 0.15),
          totalCarbs: 22,
          totalFats: 6,
          estimatedCostInr: 20,
          prepTip: 'Raw onions provide quercetin to reduce exercise-induced inflammation.',
        },
        {
          type: 'Dinner',
          name: 'Paneer / Tofu Bhurji with Dal Tadka & Phulkas',
          foods: [
            {
              id: 'wi-dinner-protein',
              name: isVeg ? 'Low-Fat Paneer Bhurji with Bell Peppers (100g)' : 'Egg Bhurji (3 eggs) with Veggies',
              servingSize: '1 portion',
              calories: Math.round(targetCalories * 0.18),
              proteinGrams: Math.round(targetProtein * 0.20),
              carbsGrams: 8,
              fatsGrams: 10,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Eggetarian',
              costPerServingInr: 45,
            },
            {
              id: 'wi-dinner-dal-roti',
              name: 'Gujarati Dal (No Sugar) with 2 Whole Wheat Rotis',
              servingSize: '1 serving',
              calories: Math.round(targetCalories * 0.07),
              proteinGrams: Math.round(targetProtein * 0.05),
              carbsGrams: 30,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 38,
          totalFats: 12,
          estimatedCostInr: 65,
          prepTip: 'Skip added jaggery in dal to prevent evening blood sugar peaks.',
        },
      ]
    }

    case 'High-Protein Modern': {
      return [
        {
          type: 'Breakfast',
          name: 'Pro-Oats Bowl with Whey/Sattu & Chia Seeds',
          foods: [
            {
              id: 'hp-pro-oats',
              name: 'Rolled Oats with 1 Scoop Whey/Sattu & Cinnamon',
              servingSize: '60g Oats + 25g Protein',
              calories: Math.round(targetCalories * 0.25),
              proteinGrams: Math.round(targetProtein * 0.25),
              carbsGrams: 42,
              fatsGrams: 6,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: budget === 'Budget-Friendly' ? 35 : 75,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 42,
          totalFats: 6,
          estimatedCostInr: budget === 'Budget-Friendly' ? 35 : 75,
          prepTip: 'Beta-glucan fiber in oats stabilizes blood glucose and blunts midday hunger cravings.',
        },
        {
          type: 'Lunch',
          name: isVeg ? 'Crispy Air-Fried Soya & Paneer Power Bowl' : 'Grilled Chicken Breast with Quinoa & Steamed Broccoli',
          foods: [
            {
              id: 'hp-lunch-protein',
              name: isVeg ? 'Seasoned Soya Chunks (50g dry) + Low Fat Paneer (80g)' : 'Herb Marinated Chicken Breast (180g)',
              servingSize: '1 power plate',
              calories: Math.round(targetCalories * 0.22),
              proteinGrams: Math.round(targetProtein * 0.28),
              carbsGrams: isVeg ? 16 : 0,
              fatsGrams: 8,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
              costPerServingInr: isVeg ? 45 : 85,
            },
            {
              id: 'hp-lunch-carb',
              name: 'Quinoa / Brown Basmati Rice with Sautéed Veggies',
              servingSize: '150g',
              calories: Math.round(targetCalories * 0.13),
              proteinGrams: Math.round(targetProtein * 0.07),
              carbsGrams: 40,
              fatsGrams: 3,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 30,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.35),
          totalProtein: Math.round(targetProtein * 0.35),
          totalCarbs: 56,
          totalFats: 11,
          estimatedCostInr: isVeg ? 75 : 115,
          prepTip: 'Air-fry or dry-pan sauté soya with turmeric, smoked paprika and garam masala.',
        },
        {
          type: 'Snack',
          name: 'Greek Yogurt / Hung Curd Parfait with Roasted Almonds',
          foods: [
            {
              id: 'hp-snack-curd',
              name: 'High Protein Hung Curd (180g) with 10g Almonds',
              servingSize: '1 cup',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 14,
              fatsGrams: 6,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 35,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.15),
          totalProtein: Math.round(targetProtein * 0.15),
          totalCarbs: 14,
          totalFats: 6,
          estimatedCostInr: 35,
          prepTip: 'Natural casein in hung curd digests slowly, maintaining steady amino acid elevation.',
        },
        {
          type: 'Dinner',
          name: 'Egg White Scramble / Soya Curry with High-Fiber Rotis',
          foods: [
            {
              id: 'hp-dinner-protein',
              name: isVeg ? 'Low-Fat Paneer & Tofu Stir Fry (140g)' : '5 Egg Whites + 1 Whole Egg Scramble',
              servingSize: '1 plate',
              calories: Math.round(targetCalories * 0.18),
              proteinGrams: Math.round(targetProtein * 0.20),
              carbsGrams: 6,
              fatsGrams: 7,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Eggetarian',
              costPerServingInr: 50,
            },
            {
              id: 'hp-dinner-rotis',
              name: 'Multigrain Rotis (2) with Cucumber Tomato Salad',
              servingSize: '2 rotis + bowl of salad',
              calories: Math.round(targetCalories * 0.07),
              proteinGrams: Math.round(targetProtein * 0.05),
              carbsGrams: 28,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 20,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 34,
          totalFats: 9,
          estimatedCostInr: 70,
          prepTip: 'Low carb evening profile ensures peak growth hormone release during deep stage-3 sleep.',
        },
      ]
    }

    case 'North Indian':
    default: {
      return [
        {
          type: 'Breakfast',
          name: 'Paneer / Soya Stuffed Paratha or Besan Chilla with Curd',
          foods: [
            {
              id: 'ni-chilla',
              name: 'High-Protein Besan & Paneer Chilla (2 pieces)',
              servingSize: '2 chillas (150g)',
              calories: Math.round(targetCalories * 0.16),
              proteinGrams: Math.round(targetProtein * 0.16),
              carbsGrams: 32,
              fatsGrams: 7,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: budget === 'Budget-Friendly' ? 25 : 40,
            },
            {
              id: 'ni-curd',
              name: 'Fresh Homemade Cow Milk Curd (Dahi)',
              servingSize: '150g',
              calories: Math.round(targetCalories * 0.09),
              proteinGrams: Math.round(targetProtein * 0.09),
              carbsGrams: 8,
              fatsGrams: 4,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 15,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 40,
          totalFats: 11,
          estimatedCostInr: budget === 'Budget-Friendly' ? 40 : 55,
          prepTip: 'Grate paneer into besan batter with crushed ajwain (carom seeds) for smooth digestion.',
        },
        {
          type: 'Lunch',
          name: isVeg ? 'Dal Tadka with Paneer Bhurji & Brown Rice' : 'Dhaba Style Murgh (Chicken) Curry with Roti & Salad',
          foods: [
            {
              id: 'ni-lunch-protein',
              name: isVeg ? 'Low-Fat Paneer Bhurji (100g)' : 'Lean Chicken Curry (160g)',
              servingSize: '1 bowl',
              calories: Math.round(targetCalories * 0.20),
              proteinGrams: Math.round(targetProtein * 0.25),
              carbsGrams: isVeg ? 6 : 4,
              fatsGrams: 9,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Non-Vegetarian',
              costPerServingInr: isVeg ? 45 : 80,
            },
            {
              id: 'ni-lunch-dal-rice',
              name: 'Yellow Moong / Arhar Dal with Steamed Rice',
              servingSize: '1 bowl dal + 1 cup rice',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.10),
              carbsGrams: 52,
              fatsGrams: 3,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 25,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.35),
          totalProtein: Math.round(targetProtein * 0.35),
          totalCarbs: 58,
          totalFats: 12,
          estimatedCostInr: isVeg ? 70 : 105,
          prepTip: 'Cook dal with a light hing (asafoetida) tadka to eliminate bloat.',
        },
        {
          type: 'Snack',
          name: 'Roasted Chana with Jaggery or Sattu Shake',
          foods: [
            {
              id: 'ni-snack-chana',
              name: 'Roasted Bengal Gram (Bhuna Chana)',
              servingSize: '50g',
              calories: Math.round(targetCalories * 0.15),
              proteinGrams: Math.round(targetProtein * 0.15),
              carbsGrams: 28,
              fatsGrams: 3,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 15,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.15),
          totalProtein: Math.round(targetProtein * 0.15),
          totalCarbs: 28,
          totalFats: 3,
          estimatedCostInr: 15,
          prepTip: 'Affordable, non-perishable snack rich in plant iron and magnesium.',
        },
        {
          type: 'Dinner',
          name: 'Soya Chunks Curry / Egg Curry with Whole Wheat Phulkas',
          foods: [
            {
              id: 'ni-dinner-protein',
              name: isVeg ? 'Boiled Soya Chunks Masala (50g dry)' : 'Egg Curry (3 Eggs)',
              servingSize: '1 plate',
              calories: Math.round(targetCalories * 0.18),
              proteinGrams: Math.round(targetProtein * 0.20),
              carbsGrams: isVeg ? 15 : 6,
              fatsGrams: isVeg ? 2 : 12,
              dietaryPreference: isVeg ? 'Vegetarian' : 'Eggetarian',
              costPerServingInr: isVeg ? 20 : 45,
            },
            {
              id: 'ni-dinner-rotis',
              name: 'Whole Wheat Phulkas (2) with Green Salad',
              servingSize: '2 phulkas',
              calories: Math.round(targetCalories * 0.07),
              proteinGrams: Math.round(targetProtein * 0.05),
              carbsGrams: 28,
              fatsGrams: 2,
              dietaryPreference: 'Vegetarian',
              costPerServingInr: 15,
            },
          ],
          totalCalories: Math.round(targetCalories * 0.25),
          totalProtein: Math.round(targetProtein * 0.25),
          totalCarbs: 43,
          totalFats: isVeg ? 4 : 14,
          estimatedCostInr: isVeg ? 35 : 60,
          prepTip: 'Squeeze soya chunks thoroughly after boiling to absorb savory spices without excess moisture.',
        },
      ]
    }
  }
}

/**
 * Builds a weekly consolidated grocery list from planned courses.
 */
export function generateWeeklyGroceryList(
  meals: PlannedMealCourse[],
  regional: RegionalPreference,
  budget: BudgetTier,
  dietary: DietaryPreference
): GroceryItem[] {
  const isVeg = dietary === 'Vegetarian' || dietary === 'Vegan'

  const items: GroceryItem[] = [
    {
      id: 'g-pulses',
      name: regional === 'South Indian' ? 'Green Moong & Toor Dal' : 'Yellow Moong & Chana Dal',
      quantityText: '1.5 kg',
      category: 'Grains & Pulses',
      estimatedCostInr: 220,
      isEssential: true,
    },
    {
      id: 'g-grains',
      name: regional === 'West Indian' ? 'Jowar & Bajra Flour' : 'Whole Wheat Atta & Brown Rice',
      quantityText: '2.5 kg',
      category: 'Grains & Pulses',
      estimatedCostInr: 180,
      isEssential: true,
    },
    {
      id: 'g-dairy',
      name: isVeg ? 'Low-Fat Fresh Paneer & Curd' : 'Fresh Cow Milk Curd (Dahi)',
      quantityText: isVeg ? '800g Paneer + 1.5kg Dahi' : '1.5 kg Dahi',
      category: 'Dairy & Alternatives',
      estimatedCostInr: isVeg ? 420 : 160,
      isEssential: true,
    },
    {
      id: 'g-soya',
      name: 'High-Protein Soya Chunks (Mini/Regular)',
      quantityText: '500g Pack',
      category: 'Grains & Pulses',
      estimatedCostInr: 75,
      isEssential: true,
    },
    {
      id: 'g-produce-staples',
      name: 'Onions, Tomatoes, Ginger, Green Chillies, Garlic',
      quantityText: '3.0 kg Assorted',
      category: 'Produce & Veggies',
      estimatedCostInr: 140,
      isEssential: true,
    },
    {
      id: 'g-greens',
      name: regional === 'East Indian' ? 'Fresh Spinach, Coriander & Shaak' : 'Palak, Methi, Cucumber & Lemon',
      quantityText: '1.5 kg Fresh Greens',
      category: 'Produce & Veggies',
      estimatedCostInr: 90,
      isEssential: true,
    },
    {
      id: 'g-chana-snack',
      name: regional === 'East Indian' ? 'Pure Chana Sattu' : 'Roasted Bhuna Chana & Peanuts',
      quantityText: '500g',
      category: 'Grains & Pulses',
      estimatedCostInr: 85,
      isEssential: true,
    },
  ]

  if (!isVeg) {
    items.push({
      id: 'g-protein-nonveg',
      name: regional === 'East Indian' ? 'Fresh Rohu / Katla Fish & Eggs' : 'Lean Skinless Chicken Breast & Large Eggs',
      quantityText: '1.2 kg Poultry/Fish + 24 Eggs',
      category: 'Meat & Eggs',
      estimatedCostInr: 580,
      isEssential: true,
    })
  }

  return items
}

/**
 * Generates actionable meal prep strategies to prevent nutritional derailment.
 */
export function generateMealPrepNotes(_regional: RegionalPreference): MealPrepNote[] {
  return [
    {
      dayWindow: 'Sunday Prep',
      title: 'Batch Boil Lentils & Legumes',
      timeMinutes: 45,
      instruction:
        'Pressure-cook 400g of chickpeas/kala chana and yellow dal. Store in airtight glass containers in the refrigerator to save 30 minutes on weekdays.',
    },
    {
      dayWindow: 'Sunday Prep',
      title: 'Universal Masala Base (Bhuna Masala)',
      timeMinutes: 30,
      instruction:
        'Sauté 500g onions, 350g tomatoes, ginger, and garlic in 2 tbsp oil until oil separates. Freeze half in ice cube trays for instant 5-minute weekday curries.',
    },
    {
      dayWindow: 'Mid-Week Batch',
      title: 'Restock High-Protein Snacks & Sprouts',
      timeMinutes: 20,
      instruction:
        'Rinse and soak green moong in a wet muslin cloth for 24 hours. Pre-portion roasted chana into 50g snack bags.',
    },
    {
      dayWindow: 'Daily Night Prep',
      title: 'Overnight Hydration & Protein Setup',
      timeMinutes: 10,
      instruction:
        'Pre-fill three 1-liter water bottles for tomorrow. If having pro-oats or overnight sattu, set measured portions on the counter.',
    },
  ]
}

/**
 * Creates or updates a full NutritionPlanV2 for a user.
 */
export async function createOrUpdateNutritionPlan(
  userId: string,
  profile: UserProfile | null,
  regional: RegionalPreference,
  budget: BudgetTier
): Promise<NutritionPlanV2> {
  const macros = calculateMacroTargets(profile)
  const dietaryPref = profile?.dietary_preference || 'Vegetarian'

  const meals = generateMealPlanCourses(
    regional,
    dietaryPref,
    budget,
    macros.calories,
    macros.protein
  )

  const groceryList = generateWeeklyGroceryList(meals, regional, budget, dietaryPref)
  const mealPrepNotes = generateMealPrepNotes(regional)
  const substitutions = STANDARD_SUBSTITUTIONS

  const plan: NutritionPlanV2 = {
    id: `plan-v2-${Date.now()}`,
    userId,
    regionalPreference: regional,
    dietaryPreference: dietaryPref,
    budgetTier: budget,
    dailyCalories: macros.calories,
    dailyProtein: macros.protein,
    dailyCarbs: macros.carbs,
    dailyFats: macros.fats,
    dailyWaterLiters: macros.waterLiters,
    meals,
    groceryList,
    mealPrepNotes,
    substitutions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // 1. LocalStorage Fallback
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(plan))
    } catch {
      // ignore
    }
  }

  // 2. Supabase Persistence
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        await supabase.from('nutrition_plans_v2').upsert({
          user_id: authData.user.id,
          regional_preference: regional,
          dietary_preference: dietaryPref,
          budget_tier: budget,
          daily_calories: macros.calories,
          daily_protein: macros.protein,
          daily_carbs: macros.carbs,
          daily_fats: macros.fats,
          daily_water_liters: macros.waterLiters,
          meals: meals as unknown as Record<string, unknown>[],
          grocery_list: groceryList as unknown as Record<string, unknown>[],
          meal_prep_notes: mealPrepNotes as unknown as Record<string, unknown>[],
          updated_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      console.warn('Could not persist nutrition plan to Supabase:', err)
    }
  }

  return plan
}

/**
 * Retrieves the user's active nutrition plan v2.
 */
export async function getActiveNutritionPlan(
  userId: string,
  profile: UserProfile | null
): Promise<NutritionPlanV2> {
  // 1. Try Supabase
  if (typeof window !== 'undefined') {
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data, error } = await supabase
          .from('nutrition_plans_v2')
          .select('*')
          .eq('user_id', authData.user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data) {
          return {
            id: data.id,
            userId: data.user_id,
            regionalPreference: data.regional_preference as RegionalPreference,
            dietaryPreference: data.dietary_preference as DietaryPreference,
            budgetTier: data.budget_tier as BudgetTier,
            dailyCalories: data.daily_calories,
            dailyProtein: data.daily_protein,
            dailyCarbs: data.daily_carbs,
            dailyFats: data.daily_fats,
            dailyWaterLiters: Number(data.daily_water_liters) || 3.0,
            meals: (data.meals as PlannedMealCourse[]) || [],
            groceryList: (data.grocery_list as GroceryItem[]) || [],
            mealPrepNotes: (data.meal_prep_notes as MealPrepNote[]) || [],
            substitutions: STANDARD_SUBSTITUTIONS,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
        }
      }
    } catch {
      // fallback
    }
  }

  // 2. Try LocalStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`)
      if (local) {
        return JSON.parse(local)
      }
    } catch {
      // fallback
    }
  }

  // 3. Fallback: Generate Default Plan
  return createOrUpdateNutritionPlan(userId, profile, 'North Indian', 'Moderate')
}
