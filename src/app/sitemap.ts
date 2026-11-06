import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yashfit.app'
  const currentDate = new Date().toISOString().split('T')[0]

  const publicRoutes = [
    { url: '', priority: 1.0, changeFrequency: 'daily' as const },
    { url: '/login', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/signup', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/onboarding', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/support', priority: 0.4, changeFrequency: 'monthly' as const },
    { url: '/data-deletion', priority: 0.2, changeFrequency: 'yearly' as const },
    { url: '/changelog', priority: 0.7, changeFrequency: 'weekly' as const },
  ]

  const appRoutes = [
    '/dashboard',
    '/command-center',
    '/daily-plan',
    '/coach',
    '/virtual-coach',
    '/companion',
    '/trainer',
    '/workout',
    '/workout-studio',
    '/training-autopilot',
    '/exercises',
    '/virtual-gym',
    '/form-analysis',
    '/biomechanics',
    '/performance-lab',
    '/fitness-intelligence',
    '/community',
    '/arena',
    '/fitness-world',
    '/quests',
    '/achievements',
    '/progress',
    '/transformation',
    '/body-intelligence',
    '/digital-twin',
    '/reports',
    '/lifestyle',
    '/nutrition-planner',
    '/nutrition',
    '/meals',
    '/grocery',
    '/food-scanner',
    '/smart-grocery',
    '/recovery',
    '/integrations',
    '/insights',
    '/predictions',
    '/settings',
    '/notifications',
    '/profile/avatar',
    '/feedback',
  ]

  const sitemapEntries: MetadataRoute.Sitemap = [
    ...publicRoutes.map((route) => ({
      url: `${baseUrl}${route.url}`,
      lastModified: currentDate,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...appRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]

  return sitemapEntries
}
