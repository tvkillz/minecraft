export type CookiePreferences = {
  necessary: true
  functional: boolean
  analytics: boolean
  decided: boolean
}

const STORAGE_KEY = 'vb-cookie-consent'

export const DEFAULT_COOKIE_PREFERENCES: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  decided: false,
}

export function readCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_COOKIE_PREFERENCES
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COOKIE_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>
    return {
      necessary: true,
      functional: Boolean(parsed.functional),
      analytics: Boolean(parsed.analytics),
      decided: Boolean(parsed.decided),
    }
  } catch {
    return DEFAULT_COOKIE_PREFERENCES
  }
}

export function writeCookiePreferences(prefs: CookiePreferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      necessary: true,
      functional: prefs.functional,
      analytics: prefs.analytics,
      decided: true,
    }),
  )
}
