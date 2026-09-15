import { appConfig } from '@/config'
import { isSupabaseConfigured } from '@/lib/supabase'

/** True when protected routes require a signed-in user. */
export function isAuthRequired(): boolean {
  return appConfig.auth.requireSignInForPlay && isSupabaseConfigured()
}

/** Route keys that require sign-in before navigation. */
export function routeRequiresAuth(
  route: keyof typeof appConfig.domain.routes | undefined,
): boolean {
  if (!route) return false
  if (route === 'play' || route === 'leaderboard') return true
  return route.startsWith('portal')
}
