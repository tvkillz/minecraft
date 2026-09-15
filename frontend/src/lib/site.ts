import { appConfig } from '@/config'

/** Content pack / registry id — scopes auth and API calls to this site. */
export function getSiteId(): string {
  return appConfig.siteId
}

/** Plus-address suffix for Supabase auth emails (defaults to siteId). */
export function getAuthEmailSuffix(): string {
  return appConfig.authEmailSuffix ?? appConfig.siteId
}

/** Public site URL from manifest (not the shared backend API URL). */
export function getSitePublicUrl(): string {
  return appConfig.domain.siteUrl
}

export function getShortSiteName(): string {
  return appConfig.name.short
}
