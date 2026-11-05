import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'

export const metadata: Metadata = {
  title: 'Terms of Service | YashFit',
  description:
    'Terms of Service and Fitness Disclaimer governing the use of YashFit Personal Fitness Operating System.',
}

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold">
            <FileText size={14} />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-zinc-500">
            Last Updated: {lastUpdated} · Effective Date: {lastUpdated}
          </p>
        </div>

        {/* Medical & Health Notice Banner */}
        <div className="mb-10 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <AlertTriangle size={18} />
            <span>CRITICAL HEALTH & FITNESS DISCLAIMER</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            YashFit provides software-generated fitness tracking, nutritional estimates, and biomechanical feedback for informational and self-improvement purposes only. YashFit is NOT a licensed medical care provider. Always consult a physician before beginning any strenuous workout routine or restrictive dietary protocol. Never disregard professional medical advice.
          </p>
        </div>

        {/* Legal Text Content */}
        <article className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing, browsing, registering, or using YashFit (&quot;the Platform&quot;), you agree to be legally bound by these Terms of Service. If you do not agree to these terms, you must discontinue your use of the Platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Eligibility & Account Security</h2>
            <p>
              You must be at least 13 years of age to create an account on YashFit. When registering an account, you agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Provide accurate, truthful, and up-to-date biometric metrics.</li>
              <li>Maintain the confidentiality of your login credentials and authentication tokens.</li>
              <li>Notify us immediately at <a href="mailto:security@yashfit.app" className="text-lime-400">security@yashfit.app</a> of any unauthorized access or breach.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Exercise Safety & Assumption of Risk</h2>
            <p>
              Physical exercise inherently involves risks of muscle soreness, sprains, cardiac strain, and injury. By using YashFit&apos;s workout plans, exercise tutorials, and computer vision form tracking, you knowingly and voluntarily assume all such risks. YashFit is not liable for injuries resulting from improper exercise execution, overtraining, or lifting beyond your physical capacity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. AI Nutritional Calculations & Vision Scans</h2>
            <p>
              The AI Food Scanner provides approximate caloric, macronutrient, and micronutrient estimates based on computer vision models and nutritional databases. Serving sizes and recipes vary considerably. YashFit does not warrant that food estimations are 100% clinically precise or suitable for managing medical conditions such as diabetes, severe allergies, or metabolic disorders.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>Reverse engineer, decompile, or tamper with the application code or security boundaries.</li>
              <li>Upload malicious code, scripts, or offensive community media.</li>
              <li>Falsify competition leaderboards, arena records, or simulated workout metrics.</li>
              <li>Scrape or bulk harvest public exercise databases without written consent.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Intellectual Property</h2>
            <p>
              The YashFit name, logo, 3D anatomical models, algorithmic workout engine, and user interface designs are the intellectual property of YashFit and its creators. You are granted a revocable, non-exclusive, non-transferable license to access the Platform for personal, non-commercial fitness tracking.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, YashFit and its affiliates shall not be liable for any indirect, punitive, incidental, special, or consequential damages arising out of or in connection with your use of the application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">8. Termination & Inquiries</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms. For inquiries regarding our terms or legal policies, please contact:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <p>Legal Desk: <a href="mailto:legal@yashfit.app" className="text-lime-400">legal@yashfit.app</a></p>
              <p>Help Center: <Link href="/support" className="text-lime-400 underline">yashfit.app/support</Link></p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} YashFit. All rights reserved.</p>
      </footer>
    </div>
  )
}

