export type GroceryCategory =
  | 'Proteins'
  | 'Carbs & Grains'
  | 'Produce & Vegetables'
  | 'Dairy & Pantry'
  | 'Supplements'

export interface GroceryItem {
  id: string
  name: string
  quantity: string
  category: GroceryCategory
  estimatedCostInr: number
  checked: boolean
  isEssentialProtein?: boolean
}

export interface GroceryList {
  id: string
  title: string
  dietType: string
  items: GroceryItem[]
}

