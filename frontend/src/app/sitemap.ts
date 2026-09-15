import type { MetadataRoute } from 'next'

import { appConfig } from '@/config'
import { buildSitemapEntries } from '@/lib/seo/buildSitemap'

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries(appConfig)
}
