import type { Metadata } from 'next'
import { ShoppingCart } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ComingSoonPage } from '@/components/ComingSoonPage'

export const metadata: Metadata = { title: 'Grocery' }

export default function GroceryPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Grocery Planner"
        description="Auto-generate shopping lists from your meal plans. Budget-friendly options included. Coming in Phase 2."
        icon={<ShoppingCart size={28} />}
      />
    </AppShell>
  )
}

