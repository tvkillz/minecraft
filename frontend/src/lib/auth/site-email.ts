/** Site-scoped Supabase auth email: jane+voidborn@example.com (GoTrue-safe plus addressing) */
const SEP = '+'

export function toSiteAuthEmail(siteId: string, displayEmail: string): string {
  const normalized = displayEmail.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0) return normalized
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  if (!siteId || !local || !domain) return normalized
  if (parseSiteAuthEmail(normalized).siteId) return normalized
  return `${local}${SEP}${siteId}@${domain}`
}

export function parseSiteAuthEmail(internalEmail: string): {
  displayEmail: string
  siteId: string | null
} {
  const normalized = internalEmail.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0) return { displayEmail: normalized, siteId: null }
  const local = normalized.slice(0, at)
  const domain = normalized.slice(at + 1)
  const sepIdx = local.lastIndexOf(SEP)
  if (sepIdx <= 0) return { displayEmail: normalized, siteId: null }
  const displayLocal = local.slice(0, sepIdx)
  const siteId = local.slice(sepIdx + SEP.length)
  if (!siteId) return { displayEmail: normalized, siteId: null }
  return {
    displayEmail: `${displayLocal}@${domain}`,
    siteId,
  }
}

export function resolveAuthSuffixToSiteId(suffix: string): string {
  if (suffix === 'komorebi') return 'iyashikei'
  return suffix
}

export function isSiteAuthEmailForSite(internalEmail: string, siteId: string): boolean {
  const parsed = parseSiteAuthEmail(internalEmail)
  if (!parsed.siteId) return false
  return resolveAuthSuffixToSiteId(parsed.siteId) === siteId
}
