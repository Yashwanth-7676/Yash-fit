import type { GroceryItem } from '@/types/grocery'

export const INITIAL_GROCERY_ITEMS: GroceryItem[] = [
  // Proteins
  {
    id: 'g-soya-chunks',
    name: 'Soya Chunks (Fortune / Nutrela)',
    quantity: '500g pack',
    category: 'Proteins',
    estimatedCostInr: 65,
    checked: false,
    isEssentialProtein: true,
  },
  {
    id: 'g-eggs-tray',
    name: 'Farm Fresh White/Brown Eggs',
    quantity: '30 pcs tray',
    category: 'Proteins',
    estimatedCostInr: 210,
    checked: false,
    isEssentialProtein: true,
  },
  {
    id: 'g-low-fat-paneer',
    name: 'Low Fat Fresh Paneer',
    quantity: '400g (2 x 200g)',
    category: 'Proteins',
    estimatedCostInr: 170,
    checked: false,
    isEssentialProtein: true,
  },
  {
    id: 'g-moong-dal',
    name: 'Yellow Moong Dal / Chana Dal',
    quantity: '1 kg',
    category: 'Proteins',
    estimatedCostInr: 120,
    checked: false,
    isEssentialProtein: true,
  },

  // Carbs & Grains
  {
    id: 'g-rolled-oats',
    name: 'Whole Rolled Oats',
    quantity: '1 kg pack',
    category: 'Carbs & Grains',
    estimatedCostInr: 180,
    checked: false,
  },
  {
    id: 'g-whole-wheat-atta',
    name: 'Chakki Fresh Whole Wheat Atta',
    quantity: '5 kg',
    category: 'Carbs & Grains',
    estimatedCostInr: 240,
    checked: false,
  },
  {
    id: 'g-brown-basmati-rice',
    name: 'Brown / White Basmati Rice',
    quantity: '2 kg',
    category: 'Carbs & Grains',
    estimatedCostInr: 190,
    checked: false,
  },
  {
    id: 'g-besan',
    name: 'Fine Chana Besan (Gram Flour)',
    quantity: '500g',
    category: 'Carbs & Grains',
    estimatedCostInr: 55,
    checked: false,
  },

  // Produce & Vegetables
  {
    id: 'g-spinach-palak',
    name: 'Fresh Spinach (Palak)',
    quantity: '2 bunches (500g)',
    category: 'Produce & Vegetables',
    estimatedCostInr: 40,
    checked: false,
  },
  {
    id: 'g-onions-tomatoes',
    name: 'Onions, Tomatoes & Green Chilies',
    quantity: '2 kg mix',
    category: 'Produce & Vegetables',
    estimatedCostInr: 95,
    checked: false,
  },
  {
    id: 'g-salad-cucumbers',
    name: 'Cucumbers & Carrots',
    quantity: '1 kg mix',
    category: 'Produce & Vegetables',
    estimatedCostInr: 60,
    checked: false,
  },

  // Dairy & Pantry
  {
    id: 'g-curd-dahi',
    name: 'Fresh Dahi / Curd',
    quantity: '1 kg',
    category: 'Dairy & Pantry',
    estimatedCostInr: 75,
    checked: false,
  },
  {
    id: 'g-olive-oil-ghee',
    name: 'Cold-Pressed Olive Oil or Pure Desi Ghee',
    quantity: '500 ml',
    category: 'Dairy & Pantry',
    estimatedCostInr: 320,
    checked: false,
  },

  // Supplements
  {
    id: 'g-creatine',
    name: 'Creatine Monohydrate (Unflavored)',
    quantity: '250g tub',
    category: 'Supplements',
    estimatedCostInr: 650,
    checked: false,
  },
]

