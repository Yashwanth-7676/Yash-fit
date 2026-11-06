import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YashFit — Personal Fitness Operating System',
    short_name: 'YashFit',
    description: 'Evidence-based personal fitness OS with AI workout programming, Indian nutrition, and recovery intelligence.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#a3e635',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
