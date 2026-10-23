import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'YashFit — Personal Fitness Operating System',
    short_name: 'YashFit',
    description: 'Your Fitness. Smarter Every Day. Adaptive workouts, Indian nutrition, and recovery intelligence.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}

