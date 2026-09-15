import type { CSSProperties } from 'react'
import { appConfig } from '@/config'
import { buildThemeCssVars } from '@/config/applyTheme'
import { buildSiteMetadata } from '@/lib/seo/siteMetadata'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { CookieConsentProvider } from '@/components/cookies/CookieConsentProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { rootFontClassName } from '@/lib/fonts'
import '@/index.css'
import '@/components/ui/Button/Button.css'

const { fonts } = appConfig.theme
const googleFontsUrl = fonts.googleFontsUrl
const landingVariant = appConfig.landing?.variant ?? 'voidborn'

export const metadata = buildSiteMetadata(appConfig)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={rootFontClassName}
      data-landing-variant={landingVariant}
      style={buildThemeCssVars() as CSSProperties}
      suppressHydrationWarning
    >
      <head>
        {googleFontsUrl ? (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
