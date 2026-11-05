import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yashfit.app'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/settings/',
        '/onboarding/',
        '/api/',
        '/admin/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
