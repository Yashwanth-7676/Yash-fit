import type { Metadata, Viewport } from 'next'
import { AppProviders } from '@/components/providers/AppProviders'
import './globals.css'

const inter = {
  variable: 'font-sans',
  className: '',
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yashfit.app'

export const metadata: Metadata = {
  title: {
    default: 'YashFit — Your Fitness. Smarter Every Day.',
    template: '%s | YashFit',
  },
  description:
    'YashFit is a premium AI-powered personal fitness operating system. Plan workouts, track nutrition, manage recovery, and make smarter fitness decisions every day.',
  keywords: [
    'fitness',
    'workout',
    'nutrition',
    'AI fitness',
    'personal trainer',
    'gym tracking',
    'Indian nutrition',
    'biomechanics',
    'recovery intelligence',
  ],
  authors: [{ name: 'YashFit' }],
  creator: 'YashFit',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'YashFit — Your Fitness. Smarter Every Day.',
    description: 'Premium AI-powered personal fitness operating system.',
    url: siteUrl,
    siteName: 'YashFit',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YashFit — Personal Fitness Operating System',
    description: 'Premium AI-powered workouts, Indian nutrition, and recovery intelligence.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-white antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
