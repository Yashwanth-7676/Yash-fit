import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isValidUrl = rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) && rawUrl !== 'your_supabase_project_url'
  const url = isValidUrl ? rawUrl : 'https://placeholder.supabase.co'
  const key = rawKey && rawKey !== 'your_supabase_anon_key' ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

  return createBrowserClient(url, key)
}

