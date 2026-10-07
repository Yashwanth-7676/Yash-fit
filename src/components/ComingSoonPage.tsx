import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui'

interface ComingSoonPageProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {icon && (
        <div className="mb-5 p-4 rounded-xl bg-zinc-800 border border-zinc-700 text-lime-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="mb-3 flex items-center gap-2 text-zinc-500">
        <Clock size={14} aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-wide">Coming Soon</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h1>
      <p className="text-zinc-400 max-w-md leading-relaxed mb-8">{description}</p>
      <Link href="/dashboard">
        <Button variant="outline" icon={<ArrowLeft size={16} />}>
          Back to Dashboard
        </Button>
      </Link>
    </div>
  )
}

