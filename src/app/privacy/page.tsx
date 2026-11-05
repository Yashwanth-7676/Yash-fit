import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Lock, EyeOff, Server, UserCheck, Trash2 } from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'

export const metadata: Metadata = {
  title: 'Privacy Policy | YashFit',
  description:
    'Comprehensive Privacy Policy for YashFit. Learn how we handle your fitness metrics, biomarkers, and nutrition data with strict confidentiality and zero-knowledge principles.',
}

export default function PrivacyPolicyPage() {
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
            <Shield size={14} />
            <span>Legal Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-500">
            Last Updated: {lastUpdated} · Effective Date: {lastUpdated}
          </p>
        </div>

        {/* Quick Highlights Card */}
        <div className="mb-12 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center">
              <EyeOff size={18} />
            </div>
            <h4 className="text-sm font-semibold text-white">We Never Sell Data</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your biometric numbers, body weights, workout logs, and meals are never sold to advertisers or third parties.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <h4 className="text-sm font-semibold text-white">In-Browser Computer Vision</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Camera pose tracking is calculated strictly in your browser. Video feeds never stream to external servers.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center">
              <UserCheck size={18} />
            </div>
            <h4 className="text-sm font-semibold text-white">Instant Data Portability</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export your complete fitness profile as JSON anytime or permanently erase your account in one click.
            </p>
          </div>
        </div>

        {/* Legal Text Content */}
        <article className="prose prose-invert max-w-none space-y-8 text-zinc-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server size={18} className="text-lime-400" />
              1. Information We Collect
            </h2>
            <p>
              When you use YashFit (&quot;the Service&quot;, &quot;we&quot;, &quot;our&quot;), we collect information necessary to deliver personalized training, nutrition recommendations, and recovery telemetry:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li><strong className="text-zinc-200">Account Credentials:</strong> Email address and hashed passwords managed securely via Supabase Authentication.</li>
              <li><strong className="text-zinc-200">Fitness Profile:</strong> Age, height, body weight, fitness experience level, primary training goals, and dietary preferences.</li>
              <li><strong className="text-zinc-200">Activity Telemetry:</strong> Logged workout sets, repetitions, resistance loads, resting intervals, perceived exertion (RPE), and recovery check-ins.</li>
              <li><strong className="text-zinc-200">Nutrition Records:</strong> Food logs, estimated macronutrient values, calorie counts, and photo scans processed through the AI Food Scanner.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. How We Use Your Information</h2>
            <p>We process your data strictly to deliver and optimize your fitness experience:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>To compute personalized recovery scores and daily workout volume targets.</li>
              <li>To provide explainable AI coaching suggestions and injury prevention warnings.</li>
              <li>To match dietary preferences with appropriate macronutrient breakdowns (including Indian cuisine options).</li>
              <li>To maintain your personal progress history and 3D digital twin telemetry.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. On-Device Computer Vision & Camera Privacy</h2>
            <p>
              YashFit features camera-guided biomechanical form analysis. Pose estimation (MediaPipe) runs locally within your client browser sandbox via WebAssembly and WebGL. Live camera video feeds are processed in memory frame-by-frame and are never recorded, streamed, or uploaded to any cloud server.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Data Security & Storage</h2>
            <p>
              All cloud data is hosted on ISO 27001, SOC 2 Type II certified cloud infrastructure with Supabase and PostgreSQL. Every table is guarded by Row Level Security (RLS) policies requiring cryptographic JWT verification. Unauthenticated users and offline testers are automatically isolated in local browser storage (localStorage) without sending data over the network.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Your GDPR & CCPA Rights</h2>
            <p>You have full legal ownership of your personal health and fitness data:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li><strong className="text-zinc-200">Right of Access & Portability:</strong> Export your full dataset in structured JSON format via our <Link href="/privacy-center" className="text-lime-400 underline">Privacy Center</Link>.</li>
              <li><strong className="text-zinc-200">Right to Erasure (Be Forgotten):</strong> Request irreversible deletion of all records via our <Link href="/data-deletion" className="text-lime-400 underline">Data Deletion Guide</Link>.</li>
              <li><strong className="text-zinc-200">Right to Rectification:</strong> Update incorrect body measurements directly within Profile Settings.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Third-Party Integrations</h2>
            <p>
              When AI coaching features are queried with external LLMs (such as Google Gemini or OpenAI), requests contain only anonymized fitness context (e.g. current target calories, recovery score, and routine name). No personally identifying data (such as your legal name or email address) is ever forwarded to AI providers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Contact & Privacy Officer</h2>
            <p>
              For privacy inquiries, GDPR data requests, or security disclosures, contact our privacy desk at:
            </p>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <p>Email: <a href="mailto:privacy@yashfit.app" className="text-lime-400">privacy@yashfit.app</a></p>
              <p>Support Portal: <Link href="/support" className="text-lime-400 underline">yashfit.app/support</Link></p>
              <p>Interactive Controls: <Link href="/privacy-center" className="text-lime-400 underline">yashfit.app/privacy-center</Link></p>
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

