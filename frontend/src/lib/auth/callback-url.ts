import { getSitePublicUrl } from '@/lib/site'

/** Where GoTrue redirects after email confirm / password recovery. */
export function getAuthCallbackUrl(): string {
  // Prefer the origin the user is actually on (www vs apex, staging vs prod).
  // Manifest siteUrl is the compile-time fallback for SSR / non-browser.
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/auth/callback`
  }
  const base = getSitePublicUrl().replace(/\/$/, '')
  return `${base}/auth/callback`
}
