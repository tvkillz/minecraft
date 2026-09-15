import { getSiteId } from '@/lib/site'

import { getSupabaseBrowserClient } from './client'
import { isSupabaseConfigured, supabaseAnonKey } from './env'

/** Refresh when missing or expiring within 60s. */
export async function getSupabaseAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  let session = (await supabase.auth.getSession()).data.session
  if (!session) return null

  const expiresAt = session.expires_at ?? 0
  const nowSec = Math.floor(Date.now() / 1000)
  const needsRefresh = !session.access_token || expiresAt - nowSec < 60

  if (needsRefresh && session.refresh_token) {
    const { data: refreshed, error } = await supabase.auth.refreshSession()
    if (!error && refreshed.session?.access_token) {
      session = refreshed.session
    }
  }

  return session.access_token ?? null
}

export async function buildSupabaseApiHeaders(options?: {
  requireUser?: boolean
}): Promise<Record<string, string> | null> {
  if (!isSupabaseConfigured()) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    'X-Site-Id': getSiteId(),
  }

  const token = await getSupabaseAccessToken()
  if (options?.requireUser && !token) return null

  headers.Authorization = `Bearer ${token ?? supabaseAnonKey}`
  return headers
}
