import { Cinzel, Inter } from 'next/font/google'

/** Loaded in root layout — avoids FOUT / font-size jump from client-side Google Fonts. */
export const fontFantasy = Cinzel({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-fantasy',
  display: 'swap',
  fallback: ['Times New Roman', 'serif'],
  adjustFontFallback: true,
})

export const fontUi = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  adjustFontFallback: true,
})

export const rootFontClassName = `${fontFantasy.variable} ${fontUi.variable}`
