import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { AppShell } from '@/components/AppShell'
import { PageLoadingFallback } from '@/components/ui'

const SmartGroceryContent = dynamic(
  () => import('./SmartGroceryContent').then((mod) => mod.SmartGroceryContent),
  {
    loading: () => <PageLoadingFallback label="Loading smart grocery & budget optimizer..." />,
  }
)

export const metadata: Metadata = {
  title: 'Smart Grocery & Budget Intelligence | YashFit',
  description:
    'Automated grocery list synthesis from weekly Indian meal plans, ingredient deduplication, regional price estimations, and affordable macro substitutions.',
}

export default function SmartGroceryPage() {
  return (
    <AppShell>
      <SmartGroceryContent />
    </AppShell>
  )
}
