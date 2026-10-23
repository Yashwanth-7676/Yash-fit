import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'YashFit — Your Fitness. Smarter Every Day.',
    template: '%s | YashFit',
  },
  description:
    'YashFit is a premium AI-powered personal fitness operating system. Plan workouts, track nutrition, manage recovery, and make smarter fitness decisions every day.',
  keywords: ['fitness', 'workout', 'nutrition', 'AI fitness', 'personal trainer', 'gym tracking'],
  authors: [{ name: 'YashFit' }],
  creator: 'YashFit',
  metadataBase: new URL('https://yashfit.app'),
  openGraph: {
    title: 'YashFit — Your Fitness. Smarter Every Day.',
    description: 'Premium AI-powered personal fitness operating system.',
    type: 'website',
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

