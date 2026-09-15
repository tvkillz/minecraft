import type { MetadataRoute } from 'next'

import type { AppConfig, SitemapEntryConfig } from '@/config/schema'

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

function normalizePath(path: string): string {
  if (!path) return '/'
  return path.startsWith('/') ? path : `/${path}`
}

function defaultEntries(config: AppConfig): SitemapEntryConfig[] {
  const { routes, legal } = config.domain
  const entries: SitemapEntryConfig[] = [
    { path: routes.home, changeFrequency: 'weekly', priority: 1 },
    { path: routes.play, changeFrequency: 'weekly', priority: 0.9 },
    { path: legal.termsUrl, changeFrequency: 'yearly', priority: 0.3 },
    { path: legal.privacyUrl, changeFrequency: 'yearly', priority: 0.3 },
    { path: legal.refundPolicyUrl, changeFrequency: 'yearly', priority: 0.3 },
  ]
  return entries
}

/** Build Next.js sitemap entries from compiled project config. */
export function buildSitemapEntries(config: AppConfig): MetadataRoute.Sitemap {
  const base = config.domain.siteUrl.replace(/\/$/, '')
  const entries = config.sitemap?.entries?.length
    ? config.sitemap.entries
    : defaultEntries(config)

  return entries.map((entry) => ({
    url: `${base}${normalizePath(entry.path)}`,
    lastModified: entry.lastModified ? new Date(entry.lastModified) : new Date(),
    changeFrequency: (entry.changeFrequency ?? 'monthly') as ChangeFrequency,
    priority: entry.priority ?? 0.5,
  }))
}

/** Build robots.txt rules from compiled project config. */
export function buildRobotsConfig(config: AppConfig): MetadataRoute.Robots {
  const base = config.domain.siteUrl.replace(/\/$/, '')
  const disallow =
    config.sitemap?.robots?.disallow ?? [
      '/portal/',
      '/checkout',
      '/auth/',
      '/profile',
      '/market',
    ]

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
