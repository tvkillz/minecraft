'use client'

import { useEffect } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

type GoogleAnalyticsProps = {
  measurementId: string
  enabled: boolean
}

/**
 * Loads GA4 only when analytics cookie consent is granted.
 * Uses next/script so the tag is injected once for the whole App Router tree.
 */
export default function GoogleAnalytics({ measurementId, enabled }: GoogleAnalyticsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const disableKey = `ga-disable-${measurementId}` as const
    if (!enabled) {
      ;(window as Window & Record<string, boolean>)[disableKey] = true
      return
    }
    ;(window as Window & Record<string, boolean>)[disableKey] = false
  }, [enabled, measurementId])

  useEffect(() => {
    if (!enabled || typeof window.gtag !== 'function') return
    const query = searchParams?.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname
    window.gtag('config', measurementId, { page_path: pagePath })
  }, [enabled, measurementId, pathname, searchParams])

  if (!enabled) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id={`ga4-${measurementId}`} strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${measurementId}');
      `}</Script>
    </>
  )
}
