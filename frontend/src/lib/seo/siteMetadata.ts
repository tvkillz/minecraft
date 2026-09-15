import type { Metadata } from 'next'

import type { AppConfig } from '@/config/schema'

/** Next.js root metadata compiled from projects/{id}/copy/seo.json + manifest. */
export function buildSiteMetadata(config: AppConfig): Metadata {
  const { seo, domain, logo } = config
  const metadataBase = new URL(domain.siteUrl)

  return {
    metadataBase,
    title: seo.title,
    description: seo.description,
    applicationName: seo.siteName,
    icons: {
      icon: [
        { url: '/icon', type: 'image/png', sizes: '32x32' },
        { url: '/favicon.ico', sizes: 'any' },
        ...(logo.faviconSvg
          ? [{ url: logo.faviconSvg, type: 'image/svg+xml' }]
          : []),
      ],
      apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
      type: 'website',
      url: domain.siteUrl,
      siteName: seo.siteName,
      title: seo.title,
      description: seo.description,
      images: [
        {
          url: seo.image,
          alt: seo.imageAlt,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [seo.image],
    },
  }
}
