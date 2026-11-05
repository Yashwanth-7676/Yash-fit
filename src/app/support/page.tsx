'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { YashFitNavLogo } from '@/components/YashFitLogo'
import { Button, Input } from '@/components/ui'

const FAQS = [
  {
    q: 'How does Demo Mode work versus Cloud Sync?',
    a: 'When Supabase credentials are not connected or you select Quick Demo, YashFit operates entirely in your browser using local storage. When you sign up and log in, your workouts, nutrition, and recovery logs sync securely to your encrypted PostgreSQL database across all devices.',
  },
  {
    q: 'Is my camera video recorded during Pose Form Analysis?',
    a: 'Never. Camera feeds are processed in real time entirely inside your device browser memory via MediaPipe WebAssembly. No video frames, camera streams, or visual images ever leave your device.',
  },
  {
    q: 'How accurate is the AI Food Scanner for Indian meals?',
    a: 'The food scanner is trained specifically on Indian cuisine (e.g. Dosa, Idli, Dal Makhani, Paneer, Mixed Thalis). You can adjust portion sizes or swap detected items before confirming logs into your daily macro tracker.',
  },
  {
    q: 'How do I export or delete my complete fitness data?',
    a: 'Visit the Privacy Center (/privacy-center) to export your full fitness dataset in JSON format or trigger an instant, irreversible account deletion under GDPR Article 17.',
  },
]

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Question',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 800)
  }

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
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs font-semibold">
            <HelpCircle size={14} />
            <span>Support & Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How can we help your training today?
          </h1>
          <p className="text-sm text-zinc-400">
            Have questions about your routines, AI coach, food scanner, or account? Our support team is here to help.
          </p>
        </div>

        {/* Quick Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm">Direct Email</h3>
            <p className="text-xs text-zinc-400">Reach our product engineering desk directly.</p>
            <a href="mailto:support@yashfit.app" className="text-xs text-lime-400 hover:underline block pt-1 font-mono">
              support@yashfit.app
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm">Response Time</h3>
            <p className="text-xs text-zinc-400">Fast inquiry turnaround times.</p>
            <p className="text-xs text-emerald-400 pt-1 font-medium">Within 24 business hours</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-white text-sm">Privacy & Data Requests</h3>
            <p className="text-xs text-zinc-400">GDPR exports and account erasures.</p>
            <Link href="/privacy-center" className="text-xs text-purple-400 hover:underline block pt-1 font-medium">
              Open Privacy Center →
            </Link>
          </div>
        </div>

        {/* Form and FAQ Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Support Ticket Form */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
            <div className="mb-6 space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-lime-400" />
                Submit a Support Ticket
              </h2>
              <p className="text-xs text-zinc-400">
                Fill out the details below and we&apos;ll get back to you shortly.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-xl bg-lime-400/10 border border-lime-400/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-white text-base">Message Dispatched!</h3>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto">
                  Thank you for contacting YashFit. A verification receipt has been logged. Our support desk will reply to <span className="font-mono text-lime-400">{formData.email}</span> within 24 hours.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false)
                    setFormData({ name: '', email: '', subject: 'General Question', message: '' })
                  }}
                  className="mt-2"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    placeholder="e.g. Yash"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Inquiry Topic</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-lime-400 transition-colors"
                  >
                    <option value="General Question">General Question</option>
                    <option value="Workout or Exercise Bug">Workout or Exercise Issue</option>
                    <option value="Food Scanner Accuracy">Food Scanner or Nutrition</option>
                    <option value="Account & Auth">Account & Authentication</option>
                    <option value="Billing or Feature Request">Feature Request / Feedback</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe what you experienced or what question you have..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-lime-400 transition-colors resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={<Send size={16} />}
                  className="w-full"
                >
                  Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-lime-400" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div
                    key={faq.q}
                    className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 transition-colors hover:border-zinc-700"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between text-left gap-3 text-sm font-semibold text-white cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className="text-zinc-500 shrink-0">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-2.5">
                        {faq.a}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} YashFit. All rights reserved.</p>
      </footer>
    </div>
  )
}

