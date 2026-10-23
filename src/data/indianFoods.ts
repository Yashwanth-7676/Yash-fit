import type { FoodItem, MealPlanDay } from '@/types/nutrition'

export const INDIAN_FOOD_DATABASE: FoodItem[] = [
  // VEGETARIAN PROTEIN & STAPLES
  {
    id: 'food-paneer-100g',
    name: 'Low-Fat Paneer Bhurji / Cubes',
    servingSize: '100g',
    calories: 220,
    proteinGrams: 20,
    carbsGrams: 4,
    fatsGrams: 14,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: false,
    costPerServingInr: 45,
    recipeSteps: [
      'Crumble or cube 100g low-fat paneer.',
      'Sauté with cumin, turmeric, diced onions, tomatoes, and green chilies in 1 tsp olive oil or ghee.',
      'Garnish with fresh coriander.',
    ],
  },
  {
    id: 'food-soya-chunks-50g',
    name: 'Boiled Soya Chunks Curry',
    servingSize: '50g (Dry weight)',
    calories: 170,
    proteinGrams: 26,
    carbsGrams: 15,
    fatsGrams: 1,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 15,
    recipeSteps: [
      'Boil 50g soya chunks in hot salted water for 5 minutes.',
      'Squeeze out excess water thoroughly.',
      'Toss in a light onion-tomato gravy with garam masala.',
    ],
  },
  {
    id: 'food-curd-greek-200g',
    name: 'Hung Curd / Greek Yogurt',
    servingSize: '200g',
    calories: 130,
    proteinGrams: 14,
    carbsGrams: 8,
    fatsGrams: 4,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 25,
    recipeSteps: [
      'Whisk curd with a pinch of roasted cumin powder or mix with a scoop of whey protein and berries.',
    ],
  },
  {
    id: 'food-chana-dal-cooked-1cup',
    name: 'Thick Moong / Chana Dal',
    servingSize: '1 medium bowl (150g)',
    calories: 180,
    proteinGrams: 9,
    carbsGrams: 28,
    fatsGrams: 3,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 18,
    recipeSteps: [
      'Pressure cook yellow moong or chana dal with turmeric and salt for 3 whistles.',
      'Temper with minimal ghee, garlic, and cumin seeds.',
    ],
  },
  {
    id: 'food-besan-chilla-2',
    name: 'High-Protein Besan Chilla (2 pcs)',
    servingSize: '2 chillas (60g besan)',
    calories: 230,
    proteinGrams: 12,
    carbsGrams: 32,
    fatsGrams: 6,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 20,
    recipeSteps: [
      'Mix besan (gram flour) with water, chopped spinach, onion, and ajwain.',
      'Cook on a non-stick tawa using minimal oil spray until golden on both sides.',
    ],
  },
  {
    id: 'food-oats-khichdi-1bowl',
    name: 'Masala Oats & Moong Khichdi',
    servingSize: '1 large bowl (200g)',
    calories: 260,
    proteinGrams: 11,
    carbsGrams: 44,
    fatsGrams: 4,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 22,
    recipeSteps: [
      'Roast 40g rolled oats with 30g soaked moong dal.',
      'Simmer with vegetables (carrots, beans, peas) and mild spices until thick.',
    ],
  },

  // EGGETARIAN PROTEIN
  {
    id: 'food-boiled-eggs-3',
    name: 'Boiled Eggs (3 whole)',
    servingSize: '3 eggs',
    calories: 210,
    proteinGrams: 18,
    carbsGrams: 2,
    fatsGrams: 15,
    dietaryPreference: 'Eggetarian',
    isBudgetFriendly: true,
    costPerServingInr: 24,
    recipeSteps: [
      'Place eggs in boiling water for 8 minutes for medium-hard yolks.',
      'Cool under running water, peel, and sprinkle with black pepper and chaat masala.',
    ],
  },
  {
    id: 'food-egg-white-omelette-4',
    name: 'Egg White Omelette with 1 Whole Egg',
    servingSize: '4 whites + 1 yolk',
    calories: 140,
    proteinGrams: 20,
    carbsGrams: 2,
    fatsGrams: 5,
    dietaryPreference: 'Eggetarian',
    isBudgetFriendly: true,
    costPerServingInr: 30,
    recipeSteps: [
      'Separate 4 whites and 1 whole egg.',
      'Whisk with chopped green chilies, onions, coriander, and salt.',
      'Pour onto warm tawa and flip when set.',
    ],
  },
  {
    id: 'food-egg-bhurji-with-roti',
    name: 'Desi Egg Bhurji (3 Eggs) + 2 Whole Wheat Rotis',
    servingSize: '1 plate',
    calories: 380,
    proteinGrams: 24,
    carbsGrams: 36,
    fatsGrams: 14,
    dietaryPreference: 'Eggetarian',
    isBudgetFriendly: true,
    costPerServingInr: 38,
    recipeSteps: [
      'Scramble eggs with sautéed onions, ginger, tomatoes, and pav bhaji masala.',
      'Serve warm alongside 2 dry whole wheat rotis.',
    ],
  },

  // NON-VEGETARIAN PROTEIN
  {
    id: 'food-chicken-breast-grilled-150g',
    name: 'Tawa Grilled Chicken Breast',
    servingSize: '150g',
    calories: 220,
    proteinGrams: 38,
    carbsGrams: 2,
    fatsGrams: 5,
    dietaryPreference: 'Non-Vegetarian',
    isBudgetFriendly: false,
    costPerServingInr: 65,
    recipeSteps: [
      'Marinate chicken breast with yogurt, ginger-garlic paste, red chili, and lemon juice.',
      'Pan-sear on high heat for 5 minutes per side until charred and tender.',
    ],
  },
  {
    id: 'food-chicken-curry-homestyle',
    name: 'Homestyle Chicken Curry (Boneless) + Steamed Rice',
    servingSize: '150g chicken + 1 cup rice',
    calories: 460,
    proteinGrams: 36,
    carbsGrams: 52,
    fatsGrams: 9,
    dietaryPreference: 'Non-Vegetarian',
    isBudgetFriendly: false,
    costPerServingInr: 75,
    recipeSteps: [
      'Cook cubed chicken breast in aromatic onion-tomato curry base with whole spices.',
      'Serve with boiled basmati rice.',
    ],
  },
  {
    id: 'food-fish-curry-150g',
    name: 'Rohu / Tilapia Grilled Fish Fillet',
    servingSize: '150g',
    calories: 190,
    proteinGrams: 32,
    carbsGrams: 1,
    fatsGrams: 6,
    dietaryPreference: 'Non-Vegetarian',
    isBudgetFriendly: false,
    costPerServingInr: 70,
    recipeSteps: [
      'Marinate fish with mustard oil, turmeric, and carom seeds (ajwain).',
      'Grill or air-fry at 190°C for 12 minutes.',
    ],
  },

  // CARBS & FIBER STAPLES
  {
    id: 'food-roti-2',
    name: 'Whole Wheat Phulka / Roti (2 pcs)',
    servingSize: '2 rotis (60g flour)',
    calories: 160,
    proteinGrams: 5,
    carbsGrams: 32,
    fatsGrams: 1,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 10,
  },
  {
    id: 'food-rice-cooked-1cup',
    name: 'Steamed White / Brown Rice',
    servingSize: '1 medium cup (150g cooked)',
    calories: 195,
    proteinGrams: 4,
    carbsGrams: 42,
    fatsGrams: 1,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 10,
  },
  {
    id: 'food-mixed-salad-cucumber-carrot',
    name: 'Kachumber Salad (Cucumber, Carrot, Tomato)',
    servingSize: '1 plate (150g)',
    calories: 45,
    proteinGrams: 2,
    carbsGrams: 9,
    fatsGrams: 0,
    dietaryPreference: 'Vegetarian',
    isBudgetFriendly: true,
    costPerServingInr: 15,
  },
]

export const PRESET_MEAL_PLANS: MealPlanDay[] = [
  {
    id: 'plan-vegetarian-high-protein',
    title: 'Pure Vegetarian High-Protein Muscle Builder',
    dietaryPreference: 'Vegetarian',
    targetCalories: 2200,
    targetProtein: 125,
    meals: [
      {
        type: 'Breakfast',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-besan-chilla-2')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-curd-greek-200g')!,
        ],
      },
      {
        type: 'Lunch',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-paneer-100g')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-roti-2')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-mixed-salad-cucumber-carrot')!,
        ],
      },
      {
        type: 'Snack',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-soya-chunks-50g')!,
        ],
      },
      {
        type: 'Dinner',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-chana-dal-cooked-1cup')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-rice-cooked-1cup')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-paneer-100g')!,
        ],
      },
    ],
  },
  {
    id: 'plan-eggetarian-budget-lean',
    title: 'Eggetarian Student & Budget-Friendly High Protein',
    dietaryPreference: 'Eggetarian',
    targetCalories: 2100,
    targetProtein: 135,
    meals: [
      {
        type: 'Breakfast',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-egg-white-omelette-4')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-roti-2')!,
        ],
      },
      {
        type: 'Lunch',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-soya-chunks-50g')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-rice-cooked-1cup')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-curd-greek-200g')!,
        ],
      },
      {
        type: 'Snack',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-boiled-eggs-3')!,
        ],
      },
      {
        type: 'Dinner',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-egg-bhurji-with-roti')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-mixed-salad-cucumber-carrot')!,
        ],
      },
    ],
  },
  {
    id: 'plan-non-veg-peak-protein',
    title: 'Non-Vegetarian Lean Hypertrophy Protocol',
    dietaryPreference: 'Non-Vegetarian',
    targetCalories: 2350,
    targetProtein: 155,
    meals: [
      {
        type: 'Breakfast',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-boiled-eggs-3')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-oats-khichdi-1bowl')!,
        ],
      },
      {
        type: 'Lunch',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-chicken-curry-homestyle')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-mixed-salad-cucumber-carrot')!,
        ],
      },
      {
        type: 'Snack',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-curd-greek-200g')!,
        ],
      },
      {
        type: 'Dinner',
        foods: [
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-chicken-breast-grilled-150g')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-roti-2')!,
          INDIAN_FOOD_DATABASE.find((f) => f.id === 'food-chana-dal-cooked-1cup')!,
        ],
      },
    ],
  },
]

