'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Dumbbell,
  Salad,
  Activity,
  TrendingUp,
  ShoppingCart,
  Zap,
  Settings,
  ChevronRight,
  X,
  Menu,
  Lightbulb,
  HeartPulse,
  Camera,
} from 'lucide-react'
import { YashFitLogo } from '@/components/YashFitLogo'

export interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  comingSoon?: boolean
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Workout',
    href: '/workout',
    icon: <Dumbbell size={18} />,
  },
  {
    label: 'Exercises',
    href: '/exercises',
    icon: <Activity size={18} />,
  },
  {
    label: 'AI Form Check',
    href: '/form-analysis',
    icon: <Camera size={18} />,
    badge: 'AI',
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: <TrendingUp size={18} />,
  },
  {
    label: 'Nutrition',
    href: '/nutrition',
    icon: <Salad size={18} />,
  },
  {
    label: 'Meals',
    href: '/meals',
    icon: <Zap size={18} />,
  },
  {
    label: 'Grocery',
    href: '/grocery',
    icon: <ShoppingCart size={18} />,
  },
  {
    label: 'Recovery',
    href: '/recovery',
    icon: <HeartPulse size={18} />,
  },
  {
    label: 'Insights',
    href: '/insights',
    icon: <Lightbulb size={18} />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings size={18} />,
  },
]

// ─── Sidebar Content ──────────────────────────────────────────────────────────

interface SidebarContentProps {
  onClose?: () => void
}

export function SidebarContent({ onClose }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-800">
        <Link href="/dashboard" onClick={onClose} aria-label="YashFit Dashboard">
          <YashFitLogo />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
                  ].join(' ')}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.comingSoon && (
                    <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wide hidden xl:block">
                      Soon
                    </span>
                  )}
                  {isActive && (
                    <ChevronRight size={14} className="text-lime-400 shrink-0" aria-hidden="true" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t border-zinc-800">
        <p className="text-xs text-lime-400 font-semibold tracking-wide">YashFit OS</p>
        <p className="text-xs text-zinc-500 mt-0.5">Your Fitness. Smarter Every Day.</p>
      </div>
    </div>
  )
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────

export function DesktopSidebar() {
  return (
    <aside
      className="hidden lg:flex w-60 xl:w-64 flex-col shrink-0 border-r border-zinc-800 bg-zinc-950 h-screen sticky top-0"
      aria-label="Sidebar"
    >
      <SidebarContent />
    </aside>
  )
}

// ─── Mobile Sidebar ───────────────────────────────────────────────────────────

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800',
          'transform transition-transform duration-200 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}

// ─── Mobile Top Bar ───────────────────────────────────────────────────────────

interface MobileTopBarProps {
  onMenuOpen: () => void
}

export function MobileTopBar({ onMenuOpen }: MobileTopBarProps) {
  return (
    <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-30">
      <button
        onClick={onMenuOpen}
        className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>
      <Link href="/dashboard" aria-label="YashFit Dashboard">
        <YashFitLogo compact />
      </Link>
      <div className="w-9" aria-hidden="true" />
    </header>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <DesktopSidebar />
      <MobileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <MobileTopBar onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

