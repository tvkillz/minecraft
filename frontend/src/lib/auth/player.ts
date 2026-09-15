import type { User } from '@supabase/supabase-js'
import { appConfig } from '@/config'
import { parseSiteAuthEmail } from '@/lib/auth/site-email'

/** Registered username from Supabase user_metadata. */
export function getUsernameFromUser(user: User | null): string | null {
  if (!user) return null
  const meta = user.user_metadata as { username?: string } | undefined
  const username = meta?.username
  if (typeof username === 'string' && username.trim()) {
    return username.trim()
  }
  return null
}

/** Human-facing email (never the site-prefixed auth email). */
export function getDisplayEmailFromUser(user: User | null): string | null {
  if (!user) return null
  const meta = user.user_metadata as { display_email?: string } | undefined
  if (typeof meta?.display_email === 'string' && meta.display_email.trim()) {
    return meta.display_email.trim()
  }
  if (user.email) {
    return parseSiteAuthEmail(user.email).displayEmail
  }
  return null
}

/** Display name for the signed-in player (username → email local-part → config fallback). */
export function resolvePlayerName(user: User | null): string {
  const username = getUsernameFromUser(user)
  if (username) return username

  const displayEmail = getDisplayEmailFromUser(user)
  const emailLocal = displayEmail?.split('@')[0]?.trim()
  if (emailLocal) return emailLocal

  return appConfig.theme.player.fallbackName
}
