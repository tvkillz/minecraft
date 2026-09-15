import type { MetadataRoute } from 'next'

import { appConfig } from '@/config'
import { buildRobotsConfig } from '@/lib/seo/buildSitemap'

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig(appConfig)
}
