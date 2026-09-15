import { appConfig } from './app.config'

/** Vite / standalone play bundle — call before first paint. */
export function loadFonts(): void {
  const { fonts } = appConfig.theme
  const root = document.documentElement
  root.style.setProperty('--font-fantasy', fonts.fantasy)
  root.style.setProperty('--font-ui', fonts.ui)

  const href = fonts.googleFontsUrl
  const existing = document.querySelector<HTMLLinkElement>('link[data-vb-fonts]')
  if (existing) {
    if (existing.href === href || existing.getAttribute('href') === href) return
    existing.href = href
    return
  }

  const preconnectGoogle = document.createElement('link')
  preconnectGoogle.rel = 'preconnect'
  preconnectGoogle.href = 'https://fonts.googleapis.com'
  document.head.appendChild(preconnectGoogle)

  const preconnectGstatic = document.createElement('link')
  preconnectGstatic.rel = 'preconnect'
  preconnectGstatic.href = 'https://fonts.gstatic.com'
  preconnectGstatic.crossOrigin = ''
  document.head.appendChild(preconnectGstatic)

  const fontLink = document.createElement('link')
  fontLink.rel = 'stylesheet'
  fontLink.href = href
  fontLink.setAttribute('data-vb-fonts', 'true')
  document.head.appendChild(fontLink)
}
