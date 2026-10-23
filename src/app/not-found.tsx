import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <YashFitLogo />
      </div>

      <div className="max-w-md w-full space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">
          404 Error
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The fitness page, routine, or module you are looking for doesn&apos;t exist or has moved.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button icon={<Home size={16} />}>Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" icon={<ArrowLeft size={16} />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <p className="mt-16 text-xs text-zinc-600">
        YashFit OS · Your Fitness. Smarter Every Day.
      </p>
    </div>
  )
}

