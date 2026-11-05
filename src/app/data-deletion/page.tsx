import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Trash2, ShieldAlert, CheckCircle, ArrowRight, Mail } from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'
import { Button } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | YashFit',
  description:
    'Step-by-step instructions for permanent account and user data deletion in compliance with GDPR Article 17 and mobile platform guidelines.',
}

export default function DataDeletionPage() {
  const lastUpdated = 'November 5, 2026'

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <YashFitNavLogo />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <div className="mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <Trash2 size={14} />
            <span>GDPR Article 17 Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            User Data & Account Deletion
          </h1>
          <p className="text-xs text-zinc-500">
            Last Updated: {lastUpdated} · Permanent Data Erasure Protocol
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-400 text-sm">
            <ShieldAlert size={18} />
            <span>IRREVERSIBLE ACTION</span>
          </div>
          <p className="text-xs text-red-200/90 leading-relaxed">
            Deleting your YashFit account will permanently and immediately purge all workout histories, nutrition records, custom routines, body composition photos, and personal telemetry. This action cannot be undone.
          </p>
        </div>

        {/* Deletion Methods */}
        <div className="space-y-10 text-sm text-zinc-300">
          {/* Method 1: In-App Instant Deletion */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-xs font-bold text-lime-400 uppercase tracking-wider">Method 1 (Instant)</span>
                <h2 className="text-xl font-bold text-white mt-1">Self-Service In-App Deletion</h2>
              </div>
              <Link href="/privacy-center">
                <Button size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                  Open Privacy Center
                </Button>
              </Link>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              If you have access to your YashFit account, you can perform an instantaneous, zero-latency deletion:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-300 text-xs">
              <li>Log in to your account at <Link href="/login" className="text-lime-400 underline">yashfit.app/login</Link>.</li>
              <li>Navigate to the <Link href="/privacy-center" className="text-lime-400 underline">Privacy & Security Command Center</Link> (or go to Settings &gt; Privacy).</li>
              <li>Scroll to the <strong className="text-white">Account Deletion & Data Erasure</strong> section.</li>
              <li>Type <code className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-red-400 font-mono">DELETE MY DATA</code> to confirm.</li>
              <li>Click <strong className="text-red-400">Permanently Erase Account</strong>. All database records and local storage keys are instantly purged.</li>
            </ol>
          </section>

          {/* Method 2: Manual Email Request */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Method 2 (Assisted)</span>
              <h2 className="text-xl font-bold text-white mt-1">Email Erasure Request</h2>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              If you have lost access to your account or wish for our Data Protection Officer to manually process your erasure:
            </p>
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs space-y-2">
              <p className="text-zinc-300 font-mono">
                Send an email from your registered account address to:
              </p>
              <a href="mailto:privacy@yashfit.app?subject=Account%20and%20Data%20Deletion%20Request" className="text-lime-400 font-mono text-sm underline block">
                privacy@yashfit.app
              </a>
              <p className="text-zinc-500">
                Subject: <span className="text-zinc-300">Account and Data Deletion Request</span>
              </p>
              <p className="text-zinc-500">
                Please include your registered email address. Requests are processed within 48 business hours with written email confirmation.
              </p>
            </div>
          </section>

          {/* What Data is Erased */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">What data is permanently erased?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                'Profile metrics (age, height, weight, goals)',
                'Workout history, sets, reps, and PR logs',
                'Custom routines, exercises, and split plans',
                'Food logs, AI meal scans, and daily macros',
                'Recovery scores and sleep check-in history',
                'Body measurements and progress photographs',
                'Wearable tokens and integration credentials',
                'Community activity, quests, and arena ranks',
              ].map((item) => (
                <div key={item} className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5">
                  <CheckCircle size={14} className="text-red-400 shrink-0" />
                  <span className="text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Retention Period */}
          <section className="space-y-2 text-xs text-zinc-400 leading-relaxed">
            <h2 className="text-base font-bold text-white">Data Retention Policy</h2>
            <p>
              Once initiated, all active database records are deleted immediately via PostgreSQL foreign key cascading. Cold-storage backup snapshots are purged automatically during standard 30-day backup rotation cycles.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} YashFit. All rights reserved.</p>
      </footer>
    </div>
  )
}

