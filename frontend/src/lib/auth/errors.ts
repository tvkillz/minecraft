import { appConfig } from '@/config'

/** Map Supabase Auth API errors to config copy for sign-in. */
export function mapSignInError(message: string | undefined): string {
  const copy = appConfig.descriptions.auth.errors
  if (!message) return copy.signInFailed

  const lower = message.toLowerCase()

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('user not found')
  ) {
    return copy.invalidCredentials
  }

  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return copy.emailNotConfirmed
  }

  return message
}
