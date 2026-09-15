/** Public Supabase project URL (e.g. https://api.voidborn.fun). */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

/** Prefer opaque publishable key; fall back to legacy anon JWT. */
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

export function isLocalBrowserHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

/**
 * URL for browser Supabase calls. On localhost, use same-origin so Next rewrites
 * can proxy to the platform API without CORS.
 */
export function getSupabaseBrowserUrl(): string {
  if (typeof window !== 'undefined' && isLocalBrowserHost(window.location.hostname)) {
    return window.location.origin
  }
  return supabaseUrl
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
