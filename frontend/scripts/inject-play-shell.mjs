#!/usr/bin/env node
/**
 * Post-process .build/{PROJECT}/play/index.html with compiled brand shell so
 * /play does not flash voidborn title, fonts, or backgrounds before JS runs.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildPaths, resolveProjectId } from './project-paths.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function getLocationImage(config, id) {
  const locations = config.theme?.locations ?? []
  return locations.find((entry) => entry.id === id)?.image ?? locations[0]?.image ?? ''
}

function getLobbyBackground(config) {
  if (config.arts?.playLobbyBackground) return config.arts.playLobbyBackground
  return getLocationImage(config, config.arts?.defaultLobbyLocationId ?? '')
}

function getArenaBackground(config) {
  return getLocationImage(config, config.arts?.defaultArenaLocationId ?? '')
}

/** Mirrors src/config/applyTheme.ts — keep in sync when theme vars change. */
function buildThemeCssVars(config) {
  const { colors, landing } = config
  const lobbyBg = getLobbyBackground(config)
  const arenaBg = getArenaBackground(config)
  const playLogo = config.logo?.playLogo
  const variant = landing?.variant ?? 'voidborn'

  const vars = {
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
    '--font-fantasy': config.theme?.fonts?.fantasy ?? "'Cinzel', serif",
    '--font-ui': config.theme?.fonts?.ui ?? "'Inter', system-ui, sans-serif",
    '--headline-gradient': `linear-gradient(105deg, ${colors.accentPink} 0%, ${colors.ember} 22%, ${colors.accentPurple} 48%, ${colors.violetAccent} 72%, ${colors.purpleGlow} 100%)`,
    '--play-lobby-bg': `url(${lobbyBg})`,
    '--play-arena-bg': `url(${arenaBg})`,
    '--game-lobby-bg': `url(${lobbyBg})`,
    '--game-arena-bg': `url(${arenaBg})`,
  }

  if (playLogo && variant !== 'iyashikei' && variant !== 'helix') {
    vars['--card-back-logo'] = `url(${playLogo})`
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

  return vars
}

function styleAttrFromVars(vars) {
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

function buildFontLinks(googleFontsUrl) {
  if (!googleFontsUrl) return ''

  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `<link rel="stylesheet" href="${escapeHtml(googleFontsUrl)}" data-vb-fonts="true" />`,
  ].join('\n    ')
}

function injectPlayShell(projectId = resolveProjectId()) {
  const out = buildPaths(projectId)
  const bundlePath = path.join(out.generated, 'project-bundle.json')
  const indexPath = path.join(out.play, 'index.html')

  if (!fs.existsSync(bundlePath)) {
    throw new Error(`[inject-play-shell] Missing ${bundlePath} — run compile first`)
  }
  if (!fs.existsSync(indexPath)) {
    throw new Error(`[inject-play-shell] Missing ${indexPath} — run build:game first`)
  }

  const config = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))
  const variant = config.landing?.variant ?? 'voidborn'
  const lobbyBg = getLobbyBackground(config)
  const themeStyle = styleAttrFromVars(buildThemeCssVars(config))
  const bodyStyle = [
    `background:${config.colors.voidBlack} url(${lobbyBg}) center/cover no-repeat`,
    `color:${config.colors.textPrimary}`,
    'margin:0',
    'min-height:100svh',
  ].join(';')

  let html = fs.readFileSync(indexPath, 'utf8')

  html = html.replace(
    /<html lang="en"([^>]*)>/i,
    `<html lang="en" data-landing-variant="${escapeHtml(variant)}" style="${escapeHtml(themeStyle)}"$1>`,
  )

  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(config.seo.title)}</title>`,
  )

  if (!html.includes('name="description"')) {
    html = html.replace(
      /<title>[^<]*<\/title>/i,
      `$&\n    <meta name="description" content="${escapeHtml(config.seo.description)}" />`,
    )
  }

  html = html.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*/gi,
    '',
  )
  html = html.replace(
    /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>\s*/gi,
    '',
  )
  html = html.replace(/<link[^>]*data-vb-fonts="true"[^>]*>\s*/gi, '')

  const fontLinks = buildFontLinks(config.theme?.fonts?.googleFontsUrl)
  if (fontLinks) {
    html = html.replace(/<\/head>/i, `    ${fontLinks}\n  </head>`)
  }

  if (/<body[^>]*style="/i.test(html)) {
    html = html.replace(/<body([^>]*) style="[^"]*"/i, `<body$1 style="${escapeHtml(bodyStyle)}"`)
  } else {
    html = html.replace(/<body([^>]*)>/i, `<body$1 style="${escapeHtml(bodyStyle)}">`)
  }

  fs.writeFileSync(indexPath, html, 'utf8')
  console.log(`[inject-play-shell] Updated .build/${projectId}/play/index.html (${variant})`)
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  injectPlayShell()
}

export { injectPlayShell, buildThemeCssVars }
