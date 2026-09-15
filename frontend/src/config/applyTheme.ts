import { appConfig } from './app.config'
import { getArenaBackground, getLobbyBackground } from './selectors'

/** CSS custom properties for :root — safe for SSR inline styles and client applyTheme(). */
export function buildThemeCssVars(): Record<string, string> {
  const { colors, landing } = appConfig
  const lobbyBg = getLobbyBackground()
  const arenaBg = getArenaBackground()
  const playLogo = appConfig.logo.playLogo
  const headerLogo = appConfig.logo.headerLogo
  const brandLogo = appConfig.logo.src
  const variant = landing?.variant ?? 'voidborn'
  /** Helix build ships header wordmark; gamelogo may be absent — prefer a real asset for card backs. */
  const helixCardBackLogo = playLogo || headerLogo || brandLogo

  const vars: Record<string, string> = {
    '--void-black': colors.voidBlack,
    '--gold': colors.gold,
    '--purple-glow': colors.purpleGlow,
    '--cyan-glow': colors.cyanGlow,
    '--ember': colors.ember,
    '--violet-accent': colors.violetAccent,
    '--text-primary': colors.textPrimary,
    '--text-muted': colors.textMuted,
    '--accent-pink': colors.accentPink,
    '--accent-purple': colors.accentPurple,
    '--play-cyan': colors.playCyan,
    '--play-gold': colors.playGold,
    '--trigger-orange': colors.triggerOrange,
    '--trigger-green': colors.triggerGreen,
    '--trigger-blue': colors.triggerBlue,
    '--font-fantasy': appConfig.theme.fonts.fantasy,
    '--font-ui': appConfig.theme.fonts.ui,
    '--headline-gradient': `linear-gradient(105deg, ${colors.accentPink} 0%, ${colors.ember} 22%, ${colors.accentPurple} 48%, ${colors.violetAccent} 72%, ${colors.purpleGlow} 100%)`,
    '--play-lobby-bg': `url(${lobbyBg})`,
    '--play-arena-bg': `url(${arenaBg})`,
    '--game-lobby-bg': `url(${lobbyBg})`,
    '--game-arena-bg': `url(${arenaBg})`,
    ...(playLogo &&
    variant !== 'iyashikei' &&
    variant !== 'helix' &&
    variant !== 'final_whistle' &&
    variant !== 'wildreach'
      ? { '--card-back-logo': `url(${playLogo})` }
      : {}),
    ...(variant === 'helix' && helixCardBackLogo
      ? { '--card-back-logo': `url(${helixCardBackLogo})` }
      : {}),
    ...(variant === 'final_whistle' && helixCardBackLogo
      ? { '--card-back-logo': `url(${helixCardBackLogo})` }
      : {}),
    ...(variant === 'wildreach' && helixCardBackLogo
      ? { '--card-back-logo': `url(${helixCardBackLogo})` }
      : {}),
  }

  if (variant === 'iyashikei') {
    vars['--surface-paper'] = colors.voidBlack
    vars['--surface-ink'] = colors.textPrimary
    vars['--hero-vignette-top'] = 'rgba(245, 240, 230, 0.72)'
    vars['--hero-vignette-mid'] = 'rgba(245, 240, 230, 0.2)'
    vars['--hero-vignette-bottom'] = 'rgba(245, 240, 230, 0.92)'
    vars['--iyashikei-heading-gradient'] =
      'linear-gradient(105deg, #4a6a4a 0%, #5a7a5a 35%, #6a9ec4 70%, #c9a87c 100%)'
    vars['--font-heading'] = "'Hiro Misake', 'Shippori Mincho', serif"
  }

  if (variant === 'helix') {
    vars['--surface-paper'] = colors.voidBlack
    vars['--surface-ink'] = colors.textPrimary
    vars['--hero-vignette-top'] = 'rgba(12, 16, 22, 0.82)'
    vars['--hero-vignette-mid'] = 'rgba(12, 16, 22, 0.2)'
    vars['--hero-vignette-bottom'] = 'rgba(12, 16, 22, 0.92)'
    vars['--helix-heading-gradient'] =
      'linear-gradient(105deg, #e8eef4 0%, #3db8d4 42%, #8b7ec8 72%, #c4a35a 100%)'
    vars['--font-heading'] = "'Orbitron', 'Rajdhani', system-ui, sans-serif"
  }

  if (variant === 'final_whistle') {
    vars['--surface-paper'] = colors.voidBlack
    vars['--surface-ink'] = colors.textPrimary
    vars['--hero-vignette-top'] = 'rgba(10, 18, 16, 0.82)'
    vars['--hero-vignette-mid'] = 'rgba(10, 18, 16, 0.2)'
    vars['--hero-vignette-bottom'] = 'rgba(10, 18, 16, 0.92)'
    vars['--fw-heading-gradient'] =
      'linear-gradient(105deg, #f2f0e8 0%, #e8c96a 35%, #7aab78 68%, #c4785a 100%)'
    vars['--font-heading'] = "'Bebas Neue', 'DM Sans', system-ui, sans-serif"
  }

  if (variant === 'wildreach') {
    vars['--surface-paper'] = colors.voidBlack
    vars['--surface-ink'] = colors.textPrimary
    vars['--hero-vignette-top'] = 'rgba(10, 16, 14, 0.78)'
    vars['--hero-vignette-mid'] = 'rgba(10, 16, 14, 0.18)'
    vars['--hero-vignette-bottom'] = 'rgba(10, 16, 14, 0.94)'
    vars['--wr-heading-gradient'] =
      'linear-gradient(105deg, #f0ebe4 0%, #c49a3a 38%, #2a7a6a 72%, #b85a3a 100%)'
    vars['--font-heading'] = "'Barlow Condensed', 'Source Sans 3', system-ui, sans-serif"
  }

  return vars
}

/** Injects brand palette and fonts as CSS custom properties on :root. */
export function applyTheme(): void {
  const root = document.documentElement
  const variant = appConfig.landing?.variant ?? 'voidborn'

  root.dataset.landingVariant = variant

  for (const [key, value] of Object.entries(buildThemeCssVars())) {
    root.style.setProperty(key, value)
  }

  document.title = appConfig.seo.title
}
