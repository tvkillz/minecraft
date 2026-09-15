import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { IMAGE_SIZE } from '../config/paths.js'
import { cinzelFontBase64 } from './fonts.js'
import {
  cardArtPath,
  domainGlowColor,
  logoAssetPath,
  resolveAssetPath,
} from './loadSocialContext.js'
import { pickCityForCard } from './cityBackground.js'

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function cardTitleSvg(title, glow, width, height, yCenter) {
  const safe = escapeXml(title.toUpperCase().slice(0, 48))
  const fontB64 = await cinzelFontBase64()
  const y = yCenter
  return Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Cinzel';
        src: url('data:font/woff;base64,${fontB64}') format('woff');
        font-weight: 600;
        font-style: normal;
      }
    </style>
  </defs>
  <text x="50%" y="${y}" text-anchor="middle"
    font-family="Cinzel, 'Times New Roman', serif"
    font-size="40" font-weight="600" letter-spacing="3"
    fill="#f0e8d8">${safe}</text>
  <text x="50%" y="${y + 2}" text-anchor="middle"
    font-family="Cinzel, 'Times New Roman', serif"
    font-size="40" font-weight="600" letter-spacing="3"
    fill="${glow}" opacity="0.22">${safe}</text>
</svg>`)
}

async function generalTitleSvg(title, glow, width, height) {
  const safe = escapeXml(title.slice(0, 48))
  const fontB64 = await cinzelFontBase64()
  const y = height - 56
  return Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
    </linearGradient>
    <style>
      @font-face {
        font-family: 'Cinzel';
        src: url('data:font/woff;base64,${fontB64}') format('woff');
        font-weight: 600;
        font-style: normal;
      }
    </style>
  </defs>
  <rect x="0" y="${height * 0.55}" width="${width}" height="${height * 0.45}" fill="url(#fade)"/>
  <text x="36" y="${y}" font-family="Cinzel, serif" font-size="40" font-weight="600" letter-spacing="2" fill="#f0e8d8">${safe}</text>
  <text x="36" y="${y + 2}" font-family="Cinzel, serif" font-size="40" font-weight="600" letter-spacing="2" fill="${glow}" opacity="0.28">${safe}</text>
</svg>`)
}

async function loadImageBuffer(assetPath) {
  if (!assetPath) return null
  try {
    return await readFile(assetPath)
  } catch {
    return null
  }
}

async function gradientBackground(size, glowHex, opacity = 0.22) {
  const svg = Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="${glowHex}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="#0a0a0c" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#0a0a0c"/>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`)
  return sharp(svg).png().toBuffer()
}

async function citySquareBackground(cityPath, size, overlayStrength) {
  const buf = await loadImageBuffer(cityPath)
  if (!buf) return null
  const base = await sharp(buf)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  const shade = Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a0a0c" stop-opacity="${overlayStrength * 0.65}"/>
      <stop offset="45%" stop-color="#0a0a0c" stop-opacity="${overlayStrength * 0.35}"/>
      <stop offset="100%" stop-color="#0a0a0c" stop-opacity="${Math.min(overlayStrength + 0.15, 0.85)}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#d)"/>
</svg>`)
  return sharp(base).composite([{ input: shade, top: 0, left: 0 }]).png().toBuffer()
}

async function resolveCardBackground({ card, ctx, meta, size, compositeCfg }) {
  const rel = meta.image?.background_asset
  const cityPath = rel ? resolveAssetPath(ctx.paths, rel) : null
  if (cityPath) {
    const bg = await citySquareBackground(cityPath, size, compositeCfg.cityOverlay)
    if (bg) return bg
  }
  const picked = pickCityForCard(ctx, card)
  if (picked?.path) {
    meta.image.background_asset = picked.path
    const bg = await citySquareBackground(resolveAssetPath(ctx.paths, picked.path), size, compositeCfg.cityOverlay)
    if (bg) return bg
  }
  return gradientBackground(size, domainGlowColor(ctx, card.domain))
}

async function renderCardComposite({ card, ctx, meta, size }) {
  const compositeCfg = ctx.socialgen.image.composite
  const glow = domainGlowColor(ctx, card.domain)
  const bg = await resolveCardBackground({ card, ctx, meta, size, compositeCfg })
  const artBuf = await loadImageBuffer(cardArtPath(ctx, card))

  const layers = []
  let logoBottom = Math.round(size * 0.04)

  const logoBuf = await loadImageBuffer(logoAssetPath(ctx))
  if (logoBuf) {
    const logoW = Math.round(size * compositeCfg.cardLogoScale)
    const logoPng = await sharp(logoBuf).resize(logoW).png().toBuffer()
    const logoLeft = compositeCfg.cardLogoLeft ?? 24
    const logoTop = compositeCfg.cardLogoTop ?? 24
    layers.push({ input: logoPng, top: logoTop, left: logoLeft })
    logoBottom = logoTop + Math.round(logoW * 0.55)
  }

  let cardBottom = logoBottom + 16

  if (artBuf) {
    const maxW = Math.round(size * 0.62)
    const maxH = Math.round(size * 0.58)
    const cardPng = await sharp(artBuf)
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer()
    const { width: cw, height: ch } = await sharp(cardPng).metadata()
    const left = Math.round((size - cw) / 2)
    const top = logoBottom + 8
    cardBottom = top + ch

    const frameGlow = compositeCfg.cardFrameGlow
    const frameSvg = Buffer.from(`
<svg width="${cw + 8}" height="${ch + 8}" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="${cw + 4}" height="${ch + 4}" rx="14" ry="14"
    fill="none" stroke="${glow}" stroke-width="2" opacity="${frameGlow}"/>
  <rect x="0" y="0" width="${cw + 8}" height="${ch + 8}" rx="16" ry="16"
    fill="none" stroke="#1a1a22" stroke-width="2"/>
</svg>`)

    layers.push({ input: frameSvg, top: top - 4, left: left - 4 })
    layers.push({ input: cardPng, top, left })
  }

  const vignetteSvg = Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="v" cx="50%" cy="50%" r="72%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="${compositeCfg.vignetteStrength}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`)
  layers.push({ input: vignetteSvg, top: 0, left: 0 })

  const title = meta.image?.subject_line || card.title
  const titleY = Math.min(cardBottom + 48, size - 32)
  layers.push({
    input: await cardTitleSvg(title, glow, size, size, titleY),
    top: 0,
    left: 0,
  })

  return sharp(bg).composite(layers).png().toBuffer()
}

async function renderGeneralComposite({ post, ctx, meta, card, size }) {
  const compositeCfg = ctx.socialgen.image.composite
  const domainId = meta.subject?.domain ?? card?.domain ?? 'kronos'
  const glow = domainGlowColor(ctx, domainId)

  let baseBuffer = null
  for (const rel of meta.image?.reference_assets ?? []) {
    if (/brand\//i.test(rel)) continue
    baseBuffer = await loadImageBuffer(resolveAssetPath(ctx.paths, rel))
    if (baseBuffer) break
  }

  if (baseBuffer) {
    baseBuffer = await sharp(baseBuffer)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer()
  } else {
    baseBuffer = await gradientBackground(size, glow)
  }

  const layers = []

  const vignetteSvg = Buffer.from(`
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="v" cx="50%" cy="50%" r="70%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="${compositeCfg.vignetteStrength}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#v)"/>
</svg>`)
  layers.push({ input: vignetteSvg, top: 0, left: 0 })

  const logoBuf = await loadImageBuffer(logoAssetPath(ctx))
  if (logoBuf) {
    const logoW = Math.round(size * compositeCfg.logoScale)
    const logoPng = await sharp(logoBuf).resize(logoW).png().toBuffer()
    layers.push({ input: logoPng, top: 28, left: 28 })
  }

  const title =
    meta.image?.subject_line ||
    card?.title ||
    meta.brief?.slice(0, 40) ||
    ctx.cardgen.gameTitle
  layers.push({ input: await generalTitleSvg(title, glow, size, size), top: 0, left: 0 })

  return sharp(baseBuffer).composite(layers).png().toBuffer()
}

export async function renderCompositeImage({ post, ctx, card }) {
  const meta = post.meta
  const size = meta?.image?.size ?? IMAGE_SIZE

  if (card) {
    return renderCardComposite({ card, ctx, meta, size })
  }
  return renderGeneralComposite({ post, ctx, meta, card, size })
}

export async function normalizeSquareImage(pngBuffer, size = IMAGE_SIZE) {
  return sharp(pngBuffer)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
}
