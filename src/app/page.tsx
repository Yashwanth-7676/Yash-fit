import Link from 'next/link'
import {
  Brain,
  Dumbbell,
  Salad,
  Heart,
  TrendingUp,
  Zap,
  ChevronRight,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Activity,
  Box,
  Cpu,
  Camera,
  Users,
} from 'lucide-react'
import HomeNavbar from './HomeNavbar'
import { YashFitLogo } from '@/components/YashFitLogo'
import { Button } from '@/components/ui'

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-lime-400/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold tracking-wide">
            <Zap size={12} aria-hidden="true" />
            AI-Powered Fitness
          </span>
        </div>

        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
            Your Fitness.
            <br />
            <span className="text-lime-400">Smarter</span> Every Day.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            YashFit is your personal fitness operating system. Plan adaptive workouts, manage
            nutrition, understand your recovery, and get smarter fitness insights — all in one place.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" icon={<ArrowRight size={18} />} iconPosition="right">
              Get Started — Free
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              Explore YashFit
            </Button>
          </a>
        </div>

        {/* Social proof hints */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-lime-400" aria-hidden="true" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-lime-400" aria-hidden="true" />
            Free to get started
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-lime-400" aria-hidden="true" />
            Built for Indian fitness goals
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 md:mt-20">
          <DashboardPreview />
        </div>
      </div>
    </section>
  )
}

// ─── Dashboard Preview (Static UI Demo) ──────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative max-w-5xl mx-auto">
      {/* Glow */}
      <div
        className="absolute -inset-4 bg-lime-400/5 rounded-2xl blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <div className="w-3 h-3 rounded-full bg-red-500/70" aria-hidden="true" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" aria-hidden="true" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" aria-hidden="true" />
          <span className="ml-3 text-xs text-zinc-600">yashfit.app/dashboard</span>
          <span className="ml-auto text-xs text-zinc-700 bg-zinc-900 px-2 py-0.5 rounded">
            Demo Preview
          </span>
        </div>

        {/* Dashboard content */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden md:flex w-44 border-r border-zinc-800 flex-col p-3 gap-1 bg-zinc-950/50">
            {[
              { label: 'Dashboard', icon: <BarChart3 size={14} />, active: true },
              { label: 'Workout', icon: <Dumbbell size={14} /> },
              { label: 'Nutrition', icon: <Salad size={14} /> },
              { label: 'Recovery', icon: <Heart size={14} /> },
              { label: 'Progress', icon: <TrendingUp size={14} /> },
            ].map((item) => (
              <div
                key={item.label}
                className={[
                  'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium',
                  item.active
                    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                    : 'text-zinc-500',
                ].join(' ')}
                aria-hidden="true"
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 md:p-5 min-w-0">
            {/* Greeting */}
            <div className="mb-4" aria-hidden="true">
              <p className="text-xs text-zinc-500">Wednesday, October 7</p>
              <h2 className="text-base font-semibold text-white mt-0.5">Good evening 👋</h2>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4" aria-hidden="true">
              {[
                { label: 'Calories', value: '1,840', unit: 'kcal', color: 'text-amber-400' },
                { label: 'Protein', value: '142', unit: 'g', color: 'text-blue-400' },
                { label: 'Recovery', value: '78', unit: '%', color: 'text-lime-400' },
                { label: 'Workouts', value: '4', unit: 'this week', color: 'text-purple-400' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-800"
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-lg font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                    <span className="text-xs text-zinc-600 font-normal ml-1">{stat.unit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4 mb-3" aria-hidden="true">
              <p className="text-xs text-zinc-500 mb-3 font-medium">Weekly Activity</p>
              <div className="flex items-end gap-2 h-16">
                {[
                  { outer: 40, inner: 55 },
                  { outer: 70, inner: 75 },
                  { outer: 55, inner: 60 },
                  { outer: 90, inner: 100 },
                  { outer: 65, inner: 70 },
                  { outer: 80, inner: 85 },
                  { outer: 45, inner: 50 },
                ].map((bar, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-lime-400/20"
                    style={{ height: `${bar.outer}%` }}
                  >
                    <div
                      className="w-full rounded-sm bg-lime-400"
                      style={{ height: `${bar.inner}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d} className="text-[10px] text-zinc-600 flex-1 text-center">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* AI insight strip */}
            <div
              className="rounded-lg border border-lime-400/20 bg-lime-400/5 p-3 flex items-center gap-2"
              aria-hidden="true"
            >
              <Brain size={14} className="text-lime-400 shrink-0" />
              <p className="text-xs text-zinc-400">
                <span className="text-lime-400 font-medium">AI Insight: </span>
                Your training consistency improved 23% this week. Recovery score is optimal.
              </p>
            </div>
          </div>
        </div>

        {/* Demo watermark */}
        <div className="px-4 py-2 bg-zinc-950/70 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-700">
            ✦ This is a product preview with sample data. Not real user data.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Features Section ─────────────────────────────────────────────────────────

const features = [
  {
    icon: <Box size={22} />,
    title: '3D Virtual Gym & Anatomy',
    description:
      'Interactive 3D biomechanical mannequin and procedural kinematic engine with weekly muscle intelligence tracking.',
    badge: '3D Biomechanics',
  },
  {
    icon: <Cpu size={22} />,
    title: 'AI Command Center',
    description:
      'High-level readiness telemetry, explainable AI coaching, and adaptive progressive overload calibrations.',
    badge: 'AI HQ',
  },
  {
    icon: <Camera size={22} />,
    title: 'AI Pose & Form Analysis',
    description:
      'Private, in-browser MediaPipe pose landmark estimation providing real-time rep counting and angle alignment feedback.',
    badge: 'Vision AI',
  },
  {
    icon: <Dumbbell size={22} />,
    title: 'Adaptive Workouts & Planner',
    description:
      'Personalized strength routines that dynamically calibrate volume and intensity based on recovery check-ins.',
    badge: 'Training',
  },
  {
    icon: <Users size={22} />,
    title: 'Anime RPG & Community',
    description:
      'Anime-inspired avatars, XP progression, daily quests, friends, and friendly community fitness challenges.',
    badge: 'Social RPG',
  },
  {
    icon: <Salad size={22} />,
    title: 'Smart Indian Nutrition',
    description:
      'Macro calculations supporting vegetarian, eggetarian, and regional Indian whole food meal planning.',
    badge: 'Nutrition',
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-lime-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            A complete fitness system, not just an app
          </h2>
          <p className="mt-4 text-zinc-400 text-lg">
            YashFit brings together every aspect of your fitness journey into one intelligent platform.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-zinc-800 text-lime-400 group-hover:bg-zinc-700 transition-colors" aria-hidden="true">
                  {feature.icon}
                </div>
                <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wide bg-zinc-800 px-2 py-1 rounded">
                  {feature.badge}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    icon: <Target size={24} />,
    title: 'Tell YashFit About Your Goals',
    description:
      'Set your fitness goals, share your preferences, equipment access, dietary needs, and fitness level. YashFit uses this to personalize everything.',
  },
  {
    number: '02',
    icon: <Activity size={24} />,
    title: 'Track Your Fitness',
    description:
      'Log workouts, meals, and recovery. The more you track, the smarter YashFit gets at understanding your patterns and progress.',
  },
  {
    number: '03',
    icon: <Brain size={24} />,
    title: 'Get Smarter Recommendations',
    description:
      'YashFit adapts your workouts, adjusts your nutrition, and gives you intelligent insights based on your actual data — not generic advice.',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-lime-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">How YashFit Works</h2>
          <p className="mt-4 text-zinc-400 text-lg">
            Get started in minutes. YashFit learns and adapts to you over time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10 relative">
          {/* Connector lines */}
          <div
            className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-zinc-800 via-lime-400/30 to-zinc-800"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <div key={step.number} className="relative flex flex-col items-center text-center md:items-start md:text-left">
              {/* Step number + icon */}
              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-lime-400">
                    {step.icon}
                  </div>
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-lime-400 text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <span className="text-4xl font-black text-zinc-800">{step.number}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="py-20 md:py-28 border-t border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative p-10 md:p-14 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-lime-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold mb-6">
              <Zap size={12} aria-hidden="true" />
              Start Your Journey
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to train smarter?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
              Join YashFit and experience fitness that adapts to you — not the other way around.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" icon={<ChevronRight size={18} />} iconPosition="right">
                  Get Started for Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Already have an account?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <YashFitLogo />
            <p className="mt-3 text-sm text-zinc-500 max-w-xs leading-relaxed">
              Your Fitness. Smarter Every Day. A premium AI-powered personal fitness operating system
              built for real people.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-3">
              {[
                { label: 'Sign Up', href: '/signup' },
                { label: 'Log In', href: '/login' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} YashFit. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <HomeNavbar />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
