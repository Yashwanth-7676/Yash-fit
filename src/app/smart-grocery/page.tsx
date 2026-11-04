import type { Metadata } from 'next'
import { SmartGroceryContent } from './SmartGroceryContent'

export const metadata: Metadata = {
  title: 'Smart Grocery & Budget Intelligence | YashFit',
  description:
    'Automated grocery list synthesis from weekly Indian meal plans, ingredient deduplication, regional price estimations, and affordable macro substitutions.',
}

export default function SmartGroceryPage() {
  return <SmartGroceryContent />
}

