import type { SupabaseClient } from '@supabase/supabase-js'
import { getAuthEmailSuffix } from '@/lib/site'
import { toSiteAuthEmail } from '@/lib/auth/site-email'

/** Single auth plus-suffix for this site (Komorebi → +iyashikei only). */
export function authEmailSuffixCandidates(): string[] {
  return [getAuthEmailSuffix()]
}

/** Sign in using display email + site auth suffix (e.g. user+iyashikei@…). */
export async function signInWithSiteCredentials(
  supabase: SupabaseClient,
  displayEmail: string,
  password: string,
) {
  const email = toSiteAuthEmail(getAuthEmailSuffix(), displayEmail)
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ?? null }
}

/** Password recovery for the site auth email only (one mail, one token). */
export async function resetPasswordWithSiteEmail(
  supabase: SupabaseClient,
  displayEmail: string,
  redirectTo: string,
) {
  const email = toSiteAuthEmail(getAuthEmailSuffix(), displayEmail)
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error: error ?? null }
}
