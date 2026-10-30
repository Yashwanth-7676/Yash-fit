'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button } from '@/components/ui'

export default function HomeNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <YashFitLogo />

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
              How It Works
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-800 py-4 space-y-4">
            <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
              <a
                href="#features"
                className="px-2 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
                onClick={() => setMobileOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="px-2 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" fullWidth>
                  Log In
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                <Button fullWidth>Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
