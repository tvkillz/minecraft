import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseBrowserUrl, isSupabaseConfigured, supabaseAnonKey } from './env'

let browserClient: SupabaseClient | null = null

/** Browser Supabase client; null when env vars are not set. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null

  const url = getSupabaseBrowserUrl()
  browserClient ??= createClient(url, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
    },
  })

  return browserClient
}
