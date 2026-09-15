#!/usr/bin/env node
/**
 * Compile a content pack (projects/{id}/) into engine artifacts:
 *   - .build/{PROJECT}/generated/project-bundle.json
 *   - .build/{PROJECT}/generated/game-config.json
 *   - .build/{PROJECT}/assets/** (brand, domains, cities — not card catalog PNGs)
 *   - .build/{PROJECT}/data/cards-catalog.json (showcase slugs only — hero + collection)
 *
 * Usage:
 *   node scripts/compile-project.mjs
 *   PROJECT=voidborn node scripts/compile-project.mjs
 *   node scripts/compile-project.mjs --project=voidborn --upload
 */
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'

import {
  formatAdminEnvHint,
  loadProjectEnv,
  resolveSupabaseAdminEnv,
} from './load-project-env.mjs'
import {
  ensureFullArtStorage,
  ensureStorageObject,
  legacyFullStoragePath,
  legacyThumbStoragePath,
  storageObjectExists,
  storageObjectsExist,
  upsertCardRow,
  upsertFeaturedCard,
} from './card-upload.mjs'
import { createAdminClient } from './supabase-admin.mjs'
import { loadEconomy, priceFromCard } from './card-economy.mjs'
import { loadProjectMetadata, siteStoragePaths } from './load-project-metadata.mjs'
import {
  buildPaths,
  FRONTEND_ROOT,
  PROJECTS_ROOT,
  projectPaths,
  resolveProjectId,
} from './project-paths.mjs'
import { registrySite, resolveCompileSiteUrl } from './registry-sites.mjs'

const THUMB_WIDTH = 320
const WEBP_QUALITY = 82
const BUCKET = 'cards'
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const FAVICON_SIZE = 32
const APPLE_TOUCH_SIZE = 180

async function readJson(filePath, label) {
  let raw
  try {
    raw = await readFile(filePath, 'utf8')
  } catch (err) {
    throw new Error(`Missing ${label}: ${filePath} (${err.message})`)
  }
  return JSON.parse(raw)
}

async function pathExists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

function assetUrl(publicBase, relativePath) {
  if (!relativePath) return ''
  if (relativePath.startsWith('/') || relativePath.startsWith('http')) return relativePath
  return `${publicBase.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`
}

const RASTER_EXT = /\.(png|jpe?g)$/i

function isConvertibleRaster(relativePath) {
  return Boolean(relativePath && RASTER_EXT.test(relativePath))
}

/** Published site path — raster PNG/JPEG are served as WebP from compile output. */
function toWebpRelativePath(relativePath) {
  if (!relativePath || !isConvertibleRaster(relativePath)) return relativePath
  return relativePath.replace(RASTER_EXT, '.webp')
}

async function writeCompiledAsset(sharp, sourcePath, rel, assetsRoot) {
  const destRel = toWebpRelativePath(rel)
  const dest = path.join(assetsRoot, destRel)
  await mkdir(path.dirname(dest), { recursive: true })

  if (isConvertibleRaster(rel) && sharp) {
    await sharp(sourcePath).webp({ quality: WEBP_QUALITY }).toFile(dest)
    return destRel
  }

  await copyFile(sourcePath, dest)
  return destRel
}

function rarityFromMana(mana, raritiesJson) {
  const tiers = raritiesJson?.tiers
  if (Array.isArray(tiers) && tiers.length) {
    const tier = tiers.find((t) => mana >= t.manaMin && mana <= t.manaMax)
    return tier?.id ?? 'common'
  }
  if (mana <= 2) return 'common'
  if (mana <= 4) return 'uncommon'
  if (mana <= 6) return 'rare'
  return 'epic'
}

function buildRaritiesConfig(raritiesJson) {
  const tiers = raritiesJson?.tiers ?? []
  const labels = Object.fromEntries(
    tiers.map((t) => [t.id, t.label ?? t.id.charAt(0).toUpperCase() + t.id.slice(1)]),
  )
  return { tiers, labels }
}

/** Shop price in cents — optional in game/cards.json (`priceCents` or `priceEur`). */
function resolvePriceCents(asset) {
  if (typeof asset.priceCents === 'number' && asset.priceCents >= 0) return asset.priceCents
  if (typeof asset.price_cents === 'number' && asset.price_cents >= 0) return asset.price_cents
  if (typeof asset.priceEur === 'number' && asset.priceEur >= 0) {
    return Math.round(asset.priceEur * 100)
  }
  return null
}

function storagePublicUrl(baseUrl, bucket, objectPath) {
  const encoded = objectPath.split('/').map(encodeURIComponent).join('/')
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encoded}`
}

async function readJsonOptional(filePath) {
  try {
    return await readJson(filePath, 'seo')
  } catch {
    return {}
  }
}

function buildSeoConfig(seoJson, manifest, descriptions) {
  const image = seoJson.image
  const imagePath =
    image && (image.startsWith('http') || image.startsWith('/')) ? image : '/og-image.jpg'

  return {
    title: seoJson.title ?? manifest.name.documentTitle,
    description: seoJson.description ?? descriptions.hero.subheadline,
    siteName: seoJson.siteName ?? manifest.name.display,
    imageAlt: seoJson.imageAlt ?? manifest.brand?.logoAlt ?? manifest.name.short,
    image: imagePath,
  }
}

function buildSitemapConfig(sitemapJson, manifest) {
  if (sitemapJson?.entries?.length) {
    return {
      entries: sitemapJson.entries.map(({ comment: _c, ...entry }) => entry),
      robots: sitemapJson.robots
        ? { disallow: sitemapJson.robots.disallow ?? [] }
        : undefined,
    }
  }

  const { routes, legal } = manifest
  return {
    entries: [
      { path: routes.home, changeFrequency: 'weekly', priority: 1 },
      { path: routes.play, changeFrequency: 'weekly', priority: 0.9 },
      { path: legal.termsUrl, changeFrequency: 'yearly', priority: 0.3 },
      { path: legal.privacyUrl, changeFrequency: 'yearly', priority: 0.3 },
      { path: legal.refundPolicyUrl, changeFrequency: 'yearly', priority: 0.3 },
    ],
    robots: {
      disallow: ['/portal/', '/checkout', '/auth/', '/profile', '/market'],
    },
  }
}

async function generateOgFromLogo(sharp, logoPath, destPath) {
  const logoBuf = await sharp(logoPath)
    .resize(480, 480, { fit: 'inside', withoutEnlargement: false })
    .toBuffer()

  await sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: { r: 10, g: 10, b: 12 },
    },
  })
    .composite([{ input: logoBuf, gravity: 'centre' }])
    .jpeg({ quality: 86 })
    .toFile(destPath)
}

async function buildBrandSeoAssets({ sharp, paths, manifest, seoJson, out }) {
  const logoCandidates = [
    manifest.brand?.logo,
    manifest.brand?.headerLogo,
    manifest.brand?.playLogo,
  ].filter(Boolean)

  let logoPath = null
  for (const logoRel of logoCandidates) {
    if (logoRel.startsWith('http') || logoRel.startsWith('/')) continue
    logoPath = await resolveAssetFile(paths, logoRel)
    if (logoPath) break
  }

  const faviconRel = manifest.brand?.favicon
  const faviconPath =
    faviconRel && !faviconRel.startsWith('http') && !faviconRel.startsWith('/')
      ? await resolveAssetFile(paths, faviconRel)
      : null

  const customOgRel =
    seoJson.image &&
    !seoJson.image.startsWith('http') &&
    !seoJson.image.startsWith('/')
      ? seoJson.image
      : null
  const customOgPath = customOgRel ? await resolveAssetFile(paths, customOgRel) : null

  if (customOgPath) {
    const ext = path.extname(customOgPath).toLowerCase()
    if (ext === '.jpg' || ext === '.jpeg') {
      await copyFile(customOgPath, out.ogImage)
    } else if (sharp) {
      await sharp(customOgPath).resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' }).jpeg({ quality: 86 }).toFile(out.ogImage)
    } else {
      await copyFile(customOgPath, out.ogImage)
    }
    console.log('Brand: og-image from seo.json image')
  } else if (sharp && logoPath) {
    await generateOgFromLogo(sharp, logoPath, out.ogImage)
    console.log('Brand: og-image generated from brand logo')
  } else if (logoPath) {
    console.warn('Brand: skipped og-image (install sharp or add copy/seo.json image path)')
  } else {
    console.warn('Brand: skipped og-image (no logo/header asset found)')
  }

  const rasterSource = faviconPath ?? logoPath
  /** Sharp cannot decode .ico — use logo/header PNG for PNG / apple-touch derivatives. */
  const pngSource = faviconRel?.endsWith('.ico') ? logoPath : rasterSource

  if (faviconPath && faviconRel?.endsWith('.ico')) {
    await copyFile(faviconPath, out.faviconIco)
    console.log('Brand: favicon.ico copied from project assets')
    if (sharp && pngSource) {
      const png32 = await sharp(pngSource)
        .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      await writeFile(out.faviconPng, png32)
      console.log('Brand: favicon.png generated from brand logo (companion to favicon.ico)')
    } else if (!pngSource) {
      console.warn('Brand: skipped favicon.png (need brand/logo or header PNG alongside .ico)')
    }
  } else if (faviconPath && faviconRel?.endsWith('.svg')) {
    await copyFile(faviconPath, out.faviconSvg)
    console.log('Brand: favicon.svg copied from project assets')
    if (sharp) {
      const svgBuf = await readFile(faviconPath)
      const png32 = await sharp(svgBuf, { density: 192 })
        .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      await writeFile(out.faviconPng, png32)
      await writeFile(out.faviconIco, png32)
      console.log('Brand: favicon.png + favicon.ico rasterized from favicon.svg')
    }
  } else if (sharp && rasterSource) {
    const png32 = await sharp(rasterSource)
      .resize(FAVICON_SIZE, FAVICON_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    await writeFile(out.faviconPng, png32)
    await writeFile(out.faviconIco, png32)
    console.log('Brand: favicon.png + favicon.ico generated from brand asset')
  } else if (rasterSource) {
    console.warn('Brand: skipped favicon raster (install sharp to generate from logo/favicon)')
  }

  if (sharp && pngSource) {
    const appleInput =
      faviconPath && faviconRel?.endsWith('.svg') ? await readFile(faviconPath) : pngSource
    await sharp(appleInput, faviconRel?.endsWith('.svg') ? { density: 192 } : undefined)
      .resize(APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE, {
        fit: 'contain',
        background: { r: 12, g: 16, b: 22, alpha: 1 },
      })
      .png()
      .toFile(out.appleTouchIcon)
    console.log('Brand: apple-touch-icon generated')
  } else {
    console.warn('Brand: skipped apple-touch-icon (need sharp + logo/header PNG)')
  }
}

/** Vite game dev server (port 5173) serves from game/public/ — sync compiled favicons. */
async function syncGamePublicFavicons(out) {
  const gamePublic = path.join(FRONTEND_ROOT, 'game', 'public')
  await mkdir(gamePublic, { recursive: true })
  for (const name of ['favicon.ico', 'favicon.png', 'favicon.svg']) {
    const src = path.join(out.root, name)
    try {
      await copyFile(src, path.join(gamePublic, name))
    } catch {
      /* optional */
    }
  }
}

async function loadSharp() {
  try {
    return (await import('sharp')).default
  } catch {
    return null
  }
}

async function buildThumb(sharp, sourcePath, destPath) {
  await mkdir(path.dirname(destPath), { recursive: true })
  if (sharp) {
    await sharp(sourcePath)
      .resize(THUMB_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(destPath)
    return
  }
  const pngDest = destPath.replace(/\.webp$/, '.png')
  await copyFile(sourcePath, pngDest)
}

async function buildFullArt(sharp, sourcePath, destPath) {
  await mkdir(path.dirname(destPath), { recursive: true })
  if (!sharp) {
    throw new Error('sharp is required to compile card full art as WebP (npm install in frontend/)')
  }
  await sharp(sourcePath).webp({ quality: WEBP_QUALITY }).toFile(destPath)
}

/** Resolve asset file on disk: projects/{id}/assets first, then cursor_assets/{id}. */
async function resolveAssetFile(paths, relativePath) {
  const candidates = [
    path.join(paths.assets, relativePath),
    path.join(paths.legacyAssets, relativePath),
  ]
  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate
  }
  return null
}

async function copyProjectAssets(paths, manifest, out, sharp) {
  const publicBase = manifest.assets?.publicBase ?? '/assets'
  let copied = 0
  let converted = 0
  let skipped = 0

  const metadata = await loadProjectMetadata(paths)
  const assetEntries = metadata.assets ?? []

  for (const entry of assetEntries) {
    const rel = entry.path
    if (!rel) continue
    if (entry.kind === 'card') continue
    const source = await resolveAssetFile(paths, rel)
    if (!source) {
      skipped++
      continue
    }
    const destRel = await writeCompiledAsset(sharp, source, rel, out.assets)
    copied++
    if (destRel !== rel) converted++
  }

  const brandFiles = [
    manifest.brand?.logo,
    manifest.brand?.headerLogo,
    manifest.brand?.introVideo,
    manifest.brand?.playLogo,
    manifest.brand?.playLobby,
  ].filter(Boolean)

  for (const rel of brandFiles) {
    if (rel.startsWith('/') || rel.startsWith('http')) continue
    const source = await resolveAssetFile(paths, rel)
    if (!source) {
      skipped++
      continue
    }
    const destRel = await writeCompiledAsset(sharp, source, rel, out.assets)
    copied++
    if (destRel !== rel) converted++
  }

  const convertNote = converted > 0 ? `, ${converted} raster→webp` : ''
  const sharpNote = sharp ? '' : ' (sharp missing — rasters copied as-is)'
  console.log(`Assets: copied ${copied}, skipped ${skipped}${convertNote}${sharpNote}`)
  return { publicBase, metadata }
}

/** Shared footer icons from projects/shared/ → .build/{id}/assets/shared/ */
const SHARED_FOOTER_ASSETS = {
  'facebook-fill.svg': 'shared/facebook.svg',
  'discord-outline.svg': 'shared/discord.svg',
  'instagram-glyph-logo-png_seeklogo-286192.png': 'shared/instagram.png',
  'telegram.svg': 'shared/telegram.svg',
  'Visa_Inc.-Logo.wine.svg': 'shared/visa.svg',
  'mastercard-logo-vector-1.svg': 'shared/mastercard.svg',
  'Apple_Pay-White-Dark-Background-Logo.wine.svg': 'shared/apple-pay.svg',
  'google-pay.svg': 'shared/google-pay.svg',
  'bank-transfer-logo.svg': 'shared/bank-transfer.svg',
  'logo-google-playstore.svg': 'shared/google-play.svg',
  'apple-logo.svg': 'shared/app-store.svg',
}

async function copySharedFooterAssets(out, sharp) {
  let copied = 0
  let skipped = 0

  for (const [sourceName, destRel] of Object.entries(SHARED_FOOTER_ASSETS)) {
    const source = path.join(PROJECTS_ROOT, 'shared', sourceName)
    if (!(await pathExists(source))) {
      skipped++
      continue
    }
    await writeCompiledAsset(sharp, source, destRel, out.assets)
    copied++
  }

  if (copied || skipped) {
    console.log(`Shared footer assets: copied ${copied}, skipped ${skipped}`)
  }
}

function resolveFooterAssetUrl(publicBase, iconPath) {
  if (!iconPath) return ''
  if (iconPath.startsWith('http')) return iconPath
  const rel = isConvertibleRaster(iconPath) ? toWebpRelativePath(iconPath) : iconPath
  return assetUrl(publicBase, rel)
}

async function copyPathwaysAssets(paths, pathwaysJson, out, sharp) {
  let copied = 0
  let skipped = 0

  for (const feature of pathwaysJson?.features ?? []) {
    const rel = feature.image
    if (!rel || rel.startsWith('/') || rel.startsWith('http')) continue
    const source = await resolveAssetFile(paths, rel)
    if (!source) {
      skipped++
      continue
    }
    await writeCompiledAsset(sharp, source, rel, out.assets)
    copied++
  }

  if (copied > 0 || skipped > 0) {
    console.log(`Pathways: copied ${copied}, skipped ${skipped} (missing on disk)`)
  }
}

async function copyGamemodelAssets(paths, gamemodelJson, out, sharp) {
  let copied = 0
  let skipped = 0

  for (const pillar of gamemodelJson?.pillars ?? []) {
    const rel = pillar.image
    if (!rel || rel.startsWith('/') || rel.startsWith('http')) continue
    const source = await resolveAssetFile(paths, rel)
    if (!source) {
      skipped++
      continue
    }
    await writeCompiledAsset(sharp, source, rel, out.assets)
    copied++
  }

  if (copied > 0 || skipped > 0) {
    console.log(`Gamemodel: copied ${copied}, skipped ${skipped} (missing on disk)`)
  }
}

/** Baked frontend JSON — served from `.build/{id}/data/` via site-static (not Storage CDN). */
function showcaseLocalArtUrls(card) {
  const fullExt = card.storage_path.endsWith('.webp') ? 'webp' : 'png'
  const thumbExt = card.thumb_storage_path.endsWith('.webp') ? 'webp' : 'png'
  return {
    artUrl: `/data/card-full/${card.slug}.${fullExt}`,
    thumbUrl: `/data/card-thumbs/${card.slug}.${thumbExt}`,
  }
}

function applyShowcaseLocalArt(card) {
  Object.assign(card, showcaseLocalArtUrls(card))
}

function syncLandingCardsFromCatalog(landingCards, bySlug) {
  for (let i = 0; i < landingCards.length; i++) {
    const { locationId, fanIndex, slug } = landingCards[i]
    const fresh = bySlug.get(slug)
    if (!fresh) continue
    landingCards[i] = { ...fresh, locationId, fanIndex }
  }
}

function cardToCollectionDisplay(card, fanIndex) {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    domain: card.domain,
    rarity: card.rarity,
    stats: card.stats,
    keywords: card.keywords ?? [],
    ability: card.ability,
    glowColor: card.glowColor,
    thumbUrl: card.thumbUrl,
    artUrl: card.artUrl,
    fanIndex,
  }
}

function buildCollectionCopy(collectionJson, publicBase, bySlug) {
  const fallback = {
    title: 'Collection',
    description: '',
    backgroundImage: '',
    stats: [],
    cardSlugs: [],
    cards: [],
  }
  const source = collectionJson ?? fallback

  const cards = (source.cardSlugs ?? []).map((slug, fanIndex) => {
    const card = bySlug?.get?.(slug) ?? bySlug?.[slug]
    if (!card) {
      console.warn(`Collection: card slug not found: ${slug}`)
      return null
    }
    return cardToCollectionDisplay(card, fanIndex)
  }).filter(Boolean)

  const backgroundImage = source.backgroundImage
    ? source.backgroundImage.startsWith('http') || source.backgroundImage.startsWith('/')
      ? source.backgroundImage
      : assetUrl(publicBase, toWebpRelativePath(source.backgroundImage))
    : ''

  return {
    title: source.title ?? fallback.title,
    description: source.description ?? fallback.description,
    backgroundImage,
    stats: (source.stats ?? []).map((stat) => ({
      id: stat.id,
      value: stat.value,
      label: stat.label,
    })),
    cards,
  }
}

async function copyCollectionAssets(paths, collectionJson, out, sharp) {
  const rel = collectionJson?.backgroundImage
  if (!rel || rel.startsWith('/') || rel.startsWith('http')) return

  const source = await resolveAssetFile(paths, rel)
  if (!source) {
    console.warn(`Collection: missing background asset: ${rel}`)
    return
  }

  await writeCompiledAsset(sharp, source, rel, out.assets)
  console.log('Collection: background asset copied')
}

function buildFaqCopy(faqJson) {
  const fallback = { title: 'FAQ', items: [] }
  const source = faqJson ?? fallback
  return {
    title: source.title ?? fallback.title,
    items: (source.items ?? []).map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
    })),
  }
}

function buildTutorialCopy(tutorialJson) {
  const fallback = {
    title: 'Tutorial',
    lead: '',
    statLabels: { mana: 'Mana', attack: 'Attack', health: 'Health' },
    sections: [],
    cta: { primaryLabel: 'Play Now', primaryRoute: 'play' },
  }
  const source = tutorialJson ?? fallback

  return {
    title: source.title ?? fallback.title,
    eyebrow: source.eyebrow ?? '',
    lead: source.lead ?? fallback.lead,
    exampleCardSlug: source.exampleCardSlug ?? '',
    statLabels: {
      mana: source.statLabels?.mana ?? fallback.statLabels.mana,
      attack: source.statLabels?.attack ?? fallback.statLabels.attack,
      health: source.statLabels?.health ?? fallback.statLabels.health,
    },
    sections: (source.sections ?? []).map((section) => ({
      id: section.id,
      title: section.title,
      body: section.body ?? '',
      bullets: (section.bullets ?? []).map((bullet) => ({
        stat: bullet.stat,
        text: bullet.text,
      })),
      steps: section.steps ?? [],
      items: (section.items ?? []).map((item) => ({
        term: item.term,
        definition: item.definition,
      })),
    })),
    cta: {
      primaryLabel: source.cta?.primaryLabel ?? fallback.cta.primaryLabel,
      primaryRoute: source.cta?.primaryRoute ?? fallback.cta.primaryRoute,
      secondaryLabel: source.cta?.secondaryLabel ?? '',
      secondaryRoute: source.cta?.secondaryRoute ?? '',
      secondaryNote: source.cta?.secondaryNote ?? '',
    },
  }
}

function buildFinalCtaCopy(finalctaJson, publicBase) {
  const fallback = {
    title: '',
    subtitle: '',
    description: '',
    buttonLabel: 'Play Now',
    route: 'play',
    backgroundImage: '',
    siege: { title: '', stats: [] },
  }
  const source = finalctaJson ?? fallback

  const backgroundImage = source.backgroundImage
    ? source.backgroundImage.startsWith('http') || source.backgroundImage.startsWith('/')
      ? source.backgroundImage
      : assetUrl(publicBase, toWebpRelativePath(source.backgroundImage))
    : ''

  return {
    title: source.title ?? fallback.title,
    subtitle: source.subtitle ?? fallback.subtitle,
    description: source.description ?? fallback.description,
    buttonLabel: source.buttonLabel ?? fallback.buttonLabel,
    route: source.route ?? fallback.route,
    backgroundImage,
    siege: {
      title: source.siege?.title ?? '',
      stats: (source.siege?.stats ?? []).map((stat) => ({
        id: stat.id,
        value: stat.value,
        label: stat.label,
      })),
    },
  }
}

async function copyFinalCtaAssets(paths, finalctaJson, out, sharp) {
  const rel = finalctaJson?.backgroundImage
  if (!rel || rel.startsWith('/') || rel.startsWith('http')) return

  const source = await resolveAssetFile(paths, rel)
  if (!source) {
    console.warn(`Final CTA: missing background asset: ${rel}`)
    return
  }

  await writeCompiledAsset(sharp, source, rel, out.assets)
  console.log('Final CTA: background asset copied')
}

async function buildLegalCopy(legalDir) {
  const docs = {}
  for (const id of ['terms', 'privacy', 'refund', 'disclaimer', 'cookies']) {
    const filePath = path.join(legalDir, `${id}.json`)
    if (await pathExists(filePath)) {
      docs[id] = await readJson(filePath, `copy/legal/${id}`)
    }
  }
  return docs
}

function buildFooterCopy(footerJson, publicBase) {
  const fallback = {
    brand: { name: '', tagline: '' },
    legal: [],
    contact: { companyName: '', companyNumber: '', address: '', email: '' },
    copyright: '',
    subCopyright: '',
    crafted: '',
    cookieSettingsLabel: 'Cookie Settings',
    cookies: null,
    social: [],
    payments: [],
  }
  const source = footerJson ?? fallback

  return {
    brand: {
      name: source.brand?.name ?? fallback.brand.name,
      tagline: source.brand?.tagline ?? fallback.brand.tagline,
    },
    legal: (source.legal ?? []).map((link) => ({
      id: link.id,
      label: link.label,
      href: link.href,
    })),
    contact: {
      companyName: source.contact?.companyName ?? '',
      companyNumber: source.contact?.companyNumber ?? '',
      address: source.contact?.address ?? '',
      email: source.contact?.email ?? '',
    },
    copyright: source.copyright ?? fallback.copyright,
    subCopyright: source.subCopyright ?? fallback.subCopyright,
    crafted: source.crafted ?? fallback.crafted,
    cookieSettingsLabel: source.cookieSettingsLabel ?? fallback.cookieSettingsLabel,
    social: (source.social ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href ?? '',
      icon: resolveFooterAssetUrl(publicBase, item.icon),
    })),
    payments: (source.payments ?? []).map((item) => ({
      id: item.id,
      label: item.label,
      icon: resolveFooterAssetUrl(publicBase, item.icon),
    })),
    cookies: source.cookies
      ? {
          title: source.cookies.title,
          intro: source.cookies.intro,
          policyNote: source.cookies.policyNote,
          consentNote: source.cookies.consentNote,
          manageIntro: source.cookies.manageIntro,
          categories: (source.cookies.categories ?? []).map((cat) => ({
            id: cat.id,
            label: cat.label,
            description: cat.description,
            required: Boolean(cat.required),
          })),
          acceptAll: source.cookies.acceptAll,
          rejectNonEssential: source.cookies.rejectNonEssential,
          managePreferences: source.cookies.managePreferences,
          savePreferences: source.cookies.savePreferences,
          closeLabel: source.cookies.closeLabel,
        }
      : null,
  }
}

function buildPathwaysCopy(pathwaysJson, publicBase) {
  const fallback = {
    title: 'Collect. Trade. Conquer.',
    description: '',
    features: [],
    tiers: [],
    marketCta: null,
  }
  const source = pathwaysJson ?? fallback

  return {
    title: source.title ?? fallback.title,
    description: source.description ?? fallback.description,
    features: (source.features ?? []).map((feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      image: feature.image?.startsWith('http') || feature.image?.startsWith('/')
        ? feature.image
        : assetUrl(publicBase, feature.image),
      glowColor: feature.glowColor ?? '#a855f7',
    })),
    tiers: (source.tiers ?? []).map((tier) => ({
      id: tier.id,
      rarityLabel: tier.rarityLabel,
      title: tier.title,
      description: tier.description,
      glowColor: tier.glowColor ?? '#a855f7',
    })),
    marketCta: source.marketCta
      ? {
          description: source.marketCta.description ?? '',
          buttonLabel: source.marketCta.buttonLabel ?? 'Enter The Market',
          route: source.marketCta.route ?? 'portalMarket',
        }
      : null,
  }
}

function buildGameModelCopy(gamemodelJson, publicBase) {
  const fallback = {
    title: 'Game Model',
    description: '',
    pillars: [],
    tags: [],
  }
  const source = gamemodelJson ?? fallback

  return {
    title: source.title ?? fallback.title,
    description: source.description ?? fallback.description,
    pillars: (source.pillars ?? []).map((pillar) => ({
      id: pillar.id,
      title: pillar.title,
      description: pillar.description,
      image: pillar.image?.startsWith('http') || pillar.image?.startsWith('/')
        ? pillar.image
        : assetUrl(publicBase, pillar.image),
      glowColor: pillar.glowColor ?? '#4ec8ff',
    })),
    tags: (source.tags ?? []).map((tag) => ({
      id: tag.id,
      label: tag.label,
    })),
  }
}

function buildDomainMaps(domainsJson) {
  const domainToCategory = {}
  const domainGlow = {}
  const domainLabels = {}

  for (const d of domainsJson.domains) {
    domainToCategory[d.id] = d.categoryId
    domainGlow[d.id] = d.glowColor
    domainLabels[d.id] = d.label
  }

  return { domainToCategory, domainGlow, domainLabels }
}

/** Realm ids + featured slugs from game/locations.json (source of truth). */
function buildFeaturedByLocation(locationsJson) {
  const featuredByLocation = {}
  for (const loc of locationsJson.locations) {
    featuredByLocation[loc.id] = loc.featuredCardSlug
  }
  return featuredByLocation
}

/** Slugs baked into the frontend bundle (hero + collection section). Full catalog lives in DB. */
function buildFrontendShowcaseSlugs(featuredByLocation, collectionJson, heroCardSlugs) {
  const slugs = new Set()
  for (const slug of Object.values(featuredByLocation)) {
    if (slug) slugs.add(slug)
  }
  for (const slug of collectionJson?.cardSlugs ?? []) {
    if (slug) slugs.add(slug)
  }
  for (const slug of heroCardSlugs ?? []) {
    if (slug) slugs.add(slug)
  }
  return slugs
}

function buildLandingCards(featuredByLocation, heroCardSlugs, bySlug) {
  if (heroCardSlugs?.length) {
    return heroCardSlugs.map((slug, fanIndex) => {
      const card = bySlug.get(slug)
      if (!card) throw new Error(`Hero card slug not found: ${slug}`)
      let locationId = card.domain
      for (const [locId, featSlug] of Object.entries(featuredByLocation)) {
        if (featSlug === slug) {
          locationId = locId
          break
        }
      }
      return { ...card, locationId, fanIndex }
    })
  }

  return Object.entries(featuredByLocation).map(([locationId, slug], fanIndex) => {
    const card = bySlug.get(slug)
    if (!card) throw new Error(`Featured slug not found: ${slug} (location ${locationId})`)
    return { ...card, locationId, fanIndex }
  })
}

function writeCardsCatalogJson(out, payload) {
  return writeFile(path.join(out.data, 'cards-catalog.json'), JSON.stringify(payload, null, 2))
}

function writeLandingCardsJson(out, payload) {
  return writeFile(path.join(out.data, 'landing-cards.json'), JSON.stringify(payload, null, 2))
}

function buildCityDescriptionIndex(citiesJson) {
  const byPath = {}
  const bySlug = {}
  for (const city of citiesJson?.cities ?? []) {
    if (city.path) byPath[city.path] = city
    if (city.slug) bySlug[city.slug] = city
  }
  return { byPath, bySlug }
}

function buildCitySlidesByDomain(scenesJson, citiesJson, publicBase) {
  const { byPath, bySlug } = buildCityDescriptionIndex(citiesJson)
  const byDomain = {}

  for (const asset of scenesJson.assets ?? []) {
    if (asset.kind !== 'city' || !asset.domain || !asset.path) continue
    const override = byPath[asset.path] ?? bySlug[asset.slug] ?? {}

    const slide = {
      image: assetUrl(publicBase, toWebpRelativePath(asset.path)),
      name: override.name ?? asset.title ?? 'Unknown City',
      description: override.description ?? asset.notes ?? '',
    }

    if (!byDomain[asset.domain]) byDomain[asset.domain] = []
    byDomain[asset.domain].push(slide)
  }

  for (const domainId of Object.keys(byDomain)) {
    byDomain[domainId].sort((a, b) => a.image.localeCompare(b.image))
  }

  return byDomain
}

function buildAppConfig({
  manifest,
  colors,
  ui,
  descriptions,
  dominionsJson,
  gamemodelJson,
  pathwaysJson,
  faqJson,
  tutorialJson,
  finalctaJson,
  footerJson,
  legalJson,
  seoJson,
  sitemapJson,
  portal,
  credits,
  auth,
  categories,
  locationsJson,
  scenesJson,
  citiesJson,
  domainGlow,
  publicBase,
  cdnBase,
  landing,
  raritiesJson,
}) {
  const loreLocations = {}
  for (const loc of locationsJson.locations) {
    loreLocations[loc.id] = { epithet: loc.epithet, short: loc.short.split(' — ')[0] ?? loc.short }
  }

  const categoryById = Object.fromEntries(
    categories.categories.map((cat) => [cat.id, cat.label]),
  )
  const citySlidesByDomain = buildCitySlidesByDomain(scenesJson, citiesJson, publicBase)

  const themeLocations = locationsJson.locations.map((loc) => {
    const cities =
      citySlidesByDomain[loc.domainId]?.length > 0
        ? citySlidesByDomain[loc.domainId]
        : [
            {
              image: assetUrl(publicBase, toWebpRelativePath(loc.imageAsset)),
              name: loc.name,
              description: loc.short,
            },
          ]

    const primaryImage = loc.imageAsset
      ? assetUrl(publicBase, toWebpRelativePath(loc.imageAsset))
      : cities[0]?.image ?? ''

    const backgroundImage = loc.backgroundImageAsset
      ? assetUrl(publicBase, toWebpRelativePath(loc.backgroundImageAsset))
      : cities.find((city) => city.image !== primaryImage)?.image ??
        cities[1]?.image ??
        primaryImage

    return {
      id: loc.id,
      name: loc.name,
      categoryId: loc.categoryId,
      categoryLabel: categoryById[loc.categoryId] ?? loc.categoryId,
      domainId: loc.domainId,
      glowColor: loc.glowColor ?? domainGlow[loc.domainId] ?? '#a855f7',
      epithet: loc.epithet,
      short: loc.short,
      image: primaryImage,
      backgroundImage,
      images: cities.map((city) => city.image),
      cities,
    }
  })

  const dominionsCopy = {
    title: dominionsJson.title ?? 'The Dominions',
    description: dominionsJson.description ?? descriptions.hero.subheadline,
  }

  const gameModelCopy = buildGameModelCopy(gamemodelJson, publicBase)
  const pathwaysCopy = buildPathwaysCopy(pathwaysJson, publicBase)
  const faqCopy = buildFaqCopy(faqJson)
  const tutorialCopy = buildTutorialCopy(tutorialJson)
  const finalCtaCopy = buildFinalCtaCopy(finalctaJson, publicBase)
  const footerCopy = buildFooterCopy(footerJson, publicBase)

  return {
    siteId: manifest.id,
    ...(manifest.authEmailSuffix ? { authEmailSuffix: manifest.authEmailSuffix } : {}),
    name: manifest.name,
    domain: {
      siteUrl: manifest.siteUrl,
      routes: {
        ...manifest.routes,
        tutorial: manifest.routes.tutorial ?? '/tutorial',
      },
      legal: manifest.legal,
      anchors: manifest.anchors,
    },
    logo: {
      src: assetUrl(publicBase, toWebpRelativePath(manifest.brand.logo)),
      alt: manifest.brand.logoAlt ?? manifest.name.short,
      favicon: '/favicon.ico',
      ...(manifest.brand?.favicon?.endsWith('.svg')
        ? { faviconSvg: '/favicon.svg' }
        : {}),
      ...(manifest.brand?.headerLogo
        ? {
            headerLogo: assetUrl(publicBase, toWebpRelativePath(manifest.brand.headerLogo)),
            headerLogoAlt:
              manifest.brand.headerLogoAlt ??
              manifest.brand.logoAlt ??
              manifest.name.short,
          }
        : {}),
      ...(manifest.brand?.playLogo
        ? {
            playLogo: assetUrl(publicBase, toWebpRelativePath(manifest.brand.playLogo)),
            playLogoAlt:
              manifest.brand.playLogoAlt ??
              descriptions.play?.titleLine ??
              manifest.name.short,
          }
        : {}),
    },
    seo: buildSeoConfig(seoJson, manifest, descriptions),
    sitemap: buildSitemapConfig(sitemapJson, manifest),
    landing: {
      variant: landing.variant ?? 'voidborn',
      introVideo: landing.introVideo !== false,
      heroMedia: landing.heroMedia ?? (landing.introVideo === false ? 'slides' : 'video-then-slides'),
      ...(landing.heroCardSlugs?.length ? { heroCardSlugs: landing.heroCardSlugs } : {}),
    },
    colors,
    arts: {
      introVideo:
        landing.introVideo !== false && manifest.brand?.introVideo
          ? assetUrl(publicBase, manifest.brand.introVideo)
          : '',
      defaultArenaLocationId: locationsJson.defaults.arenaLocationId,
      defaultLobbyLocationId: locationsJson.defaults.lobbyLocationId,
      ...(manifest.brand?.playLobby
        ? {
            playLobbyBackground: assetUrl(
              publicBase,
              toWebpRelativePath(manifest.brand.playLobby),
            ),
          }
        : {}),
      cardsDir: `${publicBase}/cards`,
      locationsDir: `${publicBase}/locations`,
      cdnBase: cdnBase ?? null,
    },
    descriptions: {
      ...descriptions,
      dominions: dominionsCopy,
      gameModel: gameModelCopy,
      pathways: pathwaysCopy,
      faq: faqCopy,
      tutorial: tutorialCopy,
      finalCta: finalCtaCopy,
      footer: footerCopy,
    },
    portal,
    credits,
    auth: {
      requireSignInForPlay: auth.requireSignInForPlay ?? manifest.features?.requireSignInForPlay ?? true,
      passwordMinLength: auth.passwordMinLength ?? 8,
      usernameMinLength: auth.usernameMinLength ?? 3,
      usernameMaxLength: auth.usernameMaxLength ?? 24,
    },
    categories: categories.categories,
    rarities: buildRaritiesConfig(raritiesJson),
    theme: {
      fonts: ui.fonts,
      lore: {
        locations: loreLocations,
        global: locationsJson.lore?.global ?? {},
      },
      navigation: ui.navigation,
      accountMenu: ui.accountMenu,
      heroCtas: ui.heroCtas,
      playModes: ui.playModes,
      player: ui.player,
      particles: {
        colors: ui.particles.colors.length >= 2
          ? [ui.particles.colors[0], ui.particles.colors[1]]
          : ['#a855f7', '#ff3366'],
      },
      locations: themeLocations,
    },
    legal: legalJson ?? {},
  }
}

/** Map game/domains.json id → game/locations.json location id (via location.domainId). */
function buildLocationByDomain(locationsJson) {
  const locationByDomain = {}
  for (const loc of locationsJson.locations) {
    locationByDomain[loc.domainId] = loc.id
  }
  return locationByDomain
}

async function ensureCardThumb(sharp, fullPath, thumbDest) {
  if (await pathExists(thumbDest)) return
  await mkdir(path.dirname(thumbDest), { recursive: true })
  await buildThumb(sharp, fullPath, thumbDest)
}

async function ensureFullArtLocal(sharp, fullPath, fullArtPath, fullArtExt) {
  if (await pathExists(fullArtPath)) return
  await mkdir(path.dirname(fullArtPath), { recursive: true })
  if (fullArtExt === 'webp') {
    await buildFullArt(sharp, fullPath, fullArtPath)
  } else {
    await copyFile(fullPath, fullArtPath)
  }
}

async function ensureShowcaseLocalArt(sharp, fullPath, thumbPath, fullArtPath, fullArtExt) {
  if (!fullPath) return
  await ensureCardThumb(sharp, fullPath, thumbPath)
  await ensureFullArtLocal(sharp, fullPath, fullArtPath, fullArtExt)
}

async function writeFrontendCardCatalog(out, generatedAt, totalCards, frontendCards) {
  await writeCardsCatalogJson(out, {
    generatedAt,
    scope: 'frontend_showcase',
    totalCards,
    cards: frontendCards,
  })
}

/** Drop stale local card art — only showcase slugs ship to the frontend VPS. */
async function pruneLocalCardArt(out, showcaseSlugs) {
  for (const dir of [out.dataThumbs, out.dataFull]) {
    let entries = []
    try {
      entries = await readdir(dir)
    } catch {
      continue
    }
    for (const name of entries) {
      const slug = name.replace(/\.(webp|png)$/i, '')
      if (!showcaseSlugs.has(slug)) {
        await unlink(path.join(dir, name)).catch(() => {})
        continue
      }
      if (dir === out.dataFull && /\.png$/i.test(name)) {
        await unlink(path.join(dir, name)).catch(() => {})
      }
    }
  }
}

async function compileCards({
  metadata,
  paths,
  out,
  projectId,
  manifest,
  locationsJson,
  featuredByLocation,
  collectionJson,
  domainIds,
  domainGlow,
  domainToCategory,
  supabaseUrl,
  shouldUpload,
  forceUpload,
  heroCardSlugs,
  raritiesJson,
}) {
  const cardSlugMigration = manifest?.cardSlugMigration ?? null
  const locationByDomain = buildLocationByDomain(locationsJson)
  const showcaseSlugs = buildFrontendShowcaseSlugs(featuredByLocation, collectionJson, heroCardSlugs)
  const allCardAssets = (metadata.assets ?? []).filter(
    (a) => a.kind === 'card' && a.stats && a.ability,
  )
  const skipLocalCardArt = process.env.SKIP_LOCAL_CARD_ART === '1'
  /** Slim deploy: only hero + collection cards in the bundle; full catalog stays in Supabase. */
  const frontendShowcaseOnly =
    !shouldUpload &&
    process.env.FRONTEND_SHOWCASE_ONLY === '1'
  const cardAssets = frontendShowcaseOnly
    ? allCardAssets.filter((a) => showcaseSlugs.has(a.slug))
    : allCardAssets

  if (frontendShowcaseOnly) {
    for (const slug of showcaseSlugs) {
      if (!cardAssets.some((a) => a.slug === slug)) {
        throw new Error(
          `Showcase card "${slug}" missing from card metadata — check locations.json featuredCardSlug and copy/collection.json cardSlugs`,
        )
      }
    }
    console.log(
      `Cards: frontend showcase only (${cardAssets.length} slugs — hero + landing collection; full catalog in Supabase)`,
    )
  }

  const sharp = await loadSharp()
  if (!skipLocalCardArt) {
    await mkdir(out.dataThumbs, { recursive: true })
    await mkdir(out.dataFull, { recursive: true })
  }
  await mkdir(out.data, { recursive: true })

  const catalog = []
  const bySlug = new Map()

  for (const asset of cardAssets) {
    const slug = asset.slug
    const domain = asset.domain
    if (!domain) {
      throw new Error(`cards.json: "${slug}" missing domain (must match game/domains.json id)`)
    }
    if (!domainIds.has(domain)) {
      throw new Error(
        `cards.json: "${slug}" domain "${domain}" not in game/domains.json — registered: ${[...domainIds].join(', ')}`,
      )
    }

    const localPath = await resolveAssetFile(paths, asset.path)
    const isShowcase = showcaseSlugs.has(slug)
    const cardRarity = asset.rarity ?? rarityFromMana(asset.stats.mana, raritiesJson)
    const priceCents =
      resolvePriceCents(asset) ??
      priceFromCard(
        { stats: asset.stats, keywords: asset.keywords ?? [] },
        cardRarity,
        loadEconomy(),
      )

    const useWebp = Boolean(sharp)
    const thumbExt = useWebp ? 'webp' : 'png'
    const artStorageRel = useWebp ? toWebpRelativePath(asset.path) : asset.path
    const { storagePath, thumbStoragePath } = siteStoragePaths(
      projectId,
      artStorageRel,
      domain,
      slug,
      thumbExt,
    )
    const thumbLocalRel = `/data/card-thumbs/${slug}.${thumbExt}`
    const thumbDest = path.join(out.dataThumbs, `${slug}.${thumbExt}`)
    const fullExt = useWebp ? 'webp' : 'png'
    const fullDest = path.join(out.dataFull, `${slug}.${fullExt}`)

    if (localPath && isShowcase && !skipLocalCardArt) {
      await buildThumb(sharp, localPath, thumbDest)
      if (useWebp) {
        await buildFullArt(sharp, localPath, fullDest)
      } else {
        await copyFile(localPath, fullDest)
      }
    }

    const fullLocalRel = `/data/card-full/${slug}.${fullExt}`

    const record = {
      id: slug,
      slug,
      title: asset.title,
      domain,
      categoryId: domainToCategory[domain],
      role: asset.role ?? null,
      rarity: cardRarity,
      stats: asset.stats,
      keywords: asset.keywords ?? [],
      ability: {
        name: asset.ability.name,
        text: asset.ability.text,
      },
      glowColor: domainGlow[domain],
      priceCents,
      sourceAssetPath: asset.path,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      thumb_storage_path: thumbStoragePath,
      thumbUrl: isShowcase && !skipLocalCardArt ? thumbLocalRel : '',
      artUrl: isShowcase && !skipLocalCardArt ? fullLocalRel : '',
    }

    catalog.push(record)
    bySlug.set(slug, record)
  }

  const landingCards = buildLandingCards(featuredByLocation, heroCardSlugs, bySlug)

  const generatedAt = new Date().toISOString()
  const frontendCatalog = frontendShowcaseOnly
    ? catalog
    : catalog.filter((card) => showcaseSlugs.has(card.slug))

  await writeFrontendCardCatalog(out, generatedAt, catalog.length, frontendCatalog)
  await writeLandingCardsJson(out, { generatedAt, cards: landingCards })
  if (!skipLocalCardArt) {
    await pruneLocalCardArt(out, showcaseSlugs)
  }

  console.log(
    `Cards: ${catalog.length} total, ${frontendCatalog.length} frontend showcase, ${landingCards.length} landing featured`,
  )

  if (!shouldUpload) return { catalog, bySlug, generatedAt, landingCards, frontendCatalog }

  const { supabaseUrl: url, serviceKey } = resolveSupabaseAdminEnv()
  if (!url || !serviceKey) {
    throw new Error(formatAdminEnvHint())
  }

  const supabase = createAdminClient(url, serviceKey)
  const uploadStats = { skip: 0, move: 0, upload: 0, removedRaster: 0, dbOnly: 0 }
  let dbMigrated = 0
  const catalogTotal = catalog.length

  console.log(`[upload] Syncing ${catalogTotal} card(s) to storage + Postgres…`)

  for (let index = 0; index < catalog.length; index += 1) {
    const card = catalog[index]
    const progress = `[upload ${index + 1}/${catalogTotal}]`
    const isShowcase = showcaseSlugs.has(card.slug)

    const thumbExt = card.thumb_storage_path.endsWith('.webp') ? 'webp' : 'png'
    const thumbPath = path.join(out.dataThumbs, `${card.slug}.${thumbExt}`)
    const fullArtExt = card.storage_path.endsWith('.webp') ? 'webp' : 'png'
    const fullArtPath = path.join(out.dataFull, `${card.slug}.${fullArtExt}`)

    const storageAlreadyUploaded =
      !forceUpload &&
      (await storageObjectsExist(supabase, BUCKET, [card.storage_path, card.thumb_storage_path]))

    let storageLabel = ''

    if (storageAlreadyUploaded) {
      uploadStats.dbOnly += 1
      uploadStats.skip += 2
      storageLabel = 'storage skip (already uploaded)'

      if (isShowcase) {
        const sourcePath = await resolveAssetFile(paths, card.sourceAssetPath)
        await ensureShowcaseLocalArt(sharp, sourcePath, thumbPath, fullArtPath, fullArtExt)
        applyShowcaseLocalArt(card)
      } else {
        card.artUrl = storagePublicUrl(url, BUCKET, card.storage_path)
        card.thumbUrl = storagePublicUrl(url, BUCKET, card.thumb_storage_path)
      }
    } else {
      const fullPath = await resolveAssetFile(paths, card.sourceAssetPath)
      if (!fullPath) {
        console.warn(`${progress} ${card.slug} — skip (source file missing)`)
        continue
      }

      const needFull = forceUpload || !(await storageObjectExists(supabase, BUCKET, card.storage_path))
      const needThumb =
        forceUpload || !(await storageObjectExists(supabase, BUCKET, card.thumb_storage_path))

      if (needThumb) {
        await ensureCardThumb(sharp, fullPath, thumbPath)
      }
      if (needFull) {
        await ensureFullArtLocal(sharp, fullPath, fullArtPath, fullArtExt)
      }

      const legacyFull = legacyFullStoragePath(projectId, card.slug, cardSlugMigration)
      const legacyRasterPaths = legacyFull ? [legacyFull] : []
      const fullResult =
        fullArtExt === 'webp'
          ? await ensureFullArtStorage(supabase, {
              bucket: BUCKET,
              targetWebpPath: card.storage_path,
              legacyRasterPaths,
              webpLocalPath: fullArtPath,
              force: forceUpload,
            })
          : await ensureStorageObject(supabase, {
              bucket: BUCKET,
              targetPath: card.storage_path,
              legacyPath: legacyFull,
              localPath: fullArtPath,
              contentType: 'image/png',
              force: forceUpload,
            })
      card.storage_path = fullResult.storagePath
      uploadStats[fullResult.action] += 1
      uploadStats.removedRaster += fullResult.removedRaster ?? 0

      const legacyThumb = legacyThumbStoragePath(
        projectId,
        card.slug,
        card.domain,
        thumbExt,
        cardSlugMigration,
      )
      const thumbResult = await ensureStorageObject(supabase, {
        bucket: BUCKET,
        targetPath: card.thumb_storage_path,
        legacyPath: legacyThumb,
        localPath: thumbPath,
        contentType: thumbExt === 'webp' ? 'image/webp' : 'image/png',
        force: forceUpload,
      })
      card.thumb_storage_path = thumbResult.storagePath
      uploadStats[thumbResult.action] += 1

      if (isShowcase) {
        applyShowcaseLocalArt(card)
      } else {
        card.artUrl = storagePublicUrl(url, BUCKET, card.storage_path)
        card.thumbUrl = storagePublicUrl(url, BUCKET, card.thumb_storage_path)
      }

      storageLabel = `storage full:${fullResult.action} thumb:${thumbResult.action}`
    }

    const row = {
      site_id: projectId,
      slug: card.slug,
      title: card.title,
      domain: card.domain,
      location_id: locationByDomain[card.domain] ?? null,
      role: card.role,
      rarity: card.rarity,
      mana: card.stats.mana,
      attack: card.stats.attack,
      health: card.stats.health,
      keywords: card.keywords,
      ability_name: card.ability.name,
      ability_text: card.ability.text,
      storage_bucket: BUCKET,
      storage_path: card.storage_path,
      thumb_storage_path: card.thumb_storage_path,
      glow_color: card.glowColor,
      price_cents: card.priceCents,
      published: true,
      updated_at: new Date().toISOString(),
    }

    const { id, migrated } = await upsertCardRow(supabase, projectId, row, cardSlugMigration)
    if (migrated) dbMigrated += 1
    card.dbId = id
    bySlug.set(card.slug, { ...card, dbId: id })

    const dbLabel = migrated ? 'db migrate' : 'db upsert'
    console.log(`${progress} ${card.slug} — ${storageLabel}, ${dbLabel}`)
  }

  syncLandingCardsFromCatalog(landingCards, bySlug)

  const frontendAfterUpload = catalog.filter((card) => showcaseSlugs.has(card.slug))
  await writeFrontendCardCatalog(out, generatedAt, catalog.length, frontendAfterUpload)
  await writeLandingCardsJson(out, { generatedAt, cards: landingCards })

  for (const [locationId, slug] of Object.entries(featuredByLocation)) {
    const card = bySlug.get(slug)
    if (!card?.dbId) continue
    await upsertFeaturedCard(supabase, projectId, locationId, card.dbId)
  }

  console.log(
    `Storage: ${uploadStats.upload} uploaded, ${uploadStats.skip} skipped (${uploadStats.dbOnly} cards already in storage), ${uploadStats.move} moved, ${uploadStats.removedRaster} legacy raster removed. DB: ${dbMigrated} slug migrations.`,
  )
  console.log('Synced Postgres (cards, location_featured_cards).')
  return { catalog, bySlug, generatedAt, landingCards, frontendCatalog: frontendAfterUpload }
}

function validateProject(manifest, domainsJson, locationsJson, categories, portal) {
  if (!manifest.id) throw new Error('manifest.json: missing id')
  if (!manifest.name?.display) throw new Error('manifest.json: missing name.display')
  if (!manifest.routes?.home) throw new Error('manifest.json: missing routes')

  const requiredPortalSections = [
    'market',
    'collection',
    'transactions',
    'profile',
  ]
  const portalIds = new Set((portal.sections ?? []).map((s) => s.id))
  for (const id of requiredPortalSections) {
    if (!portalIds.has(id)) {
      throw new Error(`portal/sections.json: missing required section "${id}"`)
    }
  }

  const domainIds = new Set(domainsJson.domains.map((d) => d.id))
  const legacyElementalDomainIds = new Set(['terra', 'aqua', 'ignis', 'zephyr'])
  const realmDomainIds = new Set(['kronos', 'thalassa', 'infernus', 'anemos'])
  const usesRealmDomains = domainsJson.domains.some((d) => realmDomainIds.has(d.id))
  const locationIds = new Set()

  for (const loc of locationsJson.locations) {
    if (!loc.id || !loc.name) {
      throw new Error(`locations.json: each location needs id and name`)
    }
    if (usesRealmDomains) {
      if (legacyElementalDomainIds.has(loc.id)) {
        throw new Error(
          `locations.json: location id "${loc.id}" is a legacy elemental id — use realm ids (kronos, thalassa, infernus, anemos)`,
        )
      }
      if (legacyElementalDomainIds.has(loc.domainId)) {
        throw new Error(
          `locations.json: location "${loc.id}" references legacy elemental domain "${loc.domainId}" — use realm domain ids (kronos, thalassa, infernus, anemos)`,
        )
      }
    }
    if (!domainIds.has(loc.domainId)) {
      throw new Error(
        `locations.json: location "${loc.id}" references unknown domain "${loc.domainId}"`,
      )
    }
    if (!loc.featuredCardSlug) {
      throw new Error(`locations.json: location "${loc.id}" missing featuredCardSlug`)
    }
    locationIds.add(loc.id)
  }

  for (const cat of categories?.categories ?? []) {
    for (const locId of cat.locationIds ?? []) {
      if (!locationIds.has(locId)) {
        throw new Error(
          `categories.json: category "${cat.id}" references unknown location "${locId}"`,
        )
      }
      if (usesRealmDomains && legacyElementalDomainIds.has(locId)) {
        throw new Error(
          `categories.json: locationIds must use realm ids (kronos, thalassa, infernus, anemos), not legacy elemental ids (terra, aqua, ignis, zephyr)`,
        )
      }
    }
  }
}

async function main() {
  const projectId = resolveProjectId()
  const shouldUpload = process.argv.includes('--upload')
  const forceUpload = process.argv.includes('--force-upload')
  const paths = projectPaths(projectId)

  console.log(`[compile] Project: ${projectId}`)
  console.log(`[compile] Source: ${paths.root}`)

  if (shouldUpload) {
    await loadProjectEnv()
  }

  const manifest = await readJson(paths.manifest, 'manifest')
  const siteEntry = registrySite(projectId)
  const compileSiteUrl = resolveCompileSiteUrl(manifest, siteEntry)
  const manifestForBundle = { ...manifest, siteUrl: compileSiteUrl }
  if (compileSiteUrl !== manifest.siteUrl) {
    console.log(`[compile] siteUrl override: ${compileSiteUrl}`)
  }
  const colors = await readJson(paths.colors, 'theme/colors')
  const ui = await readJson(paths.ui, 'theme/ui')
  const landingJson = (await readJsonOptional(paths.landing)) ?? {}
  const landing = {
    variant: landingJson.variant ?? 'voidborn',
    introVideo: landingJson.introVideo ?? true,
    heroMedia:
      landingJson.heroMedia ??
      (landingJson.introVideo === false ? 'slides' : 'video-then-slides'),
    heroCardSlugs: landingJson.heroCardSlugs ?? null,
  }
  const descriptions = await readJson(paths.descriptions, 'copy/descriptions')
  const dominionsJson = await readJsonOptional(paths.dominions)
  const gamemodelJson = await readJsonOptional(paths.gamemodel)
  const collectionJson = await readJsonOptional(paths.collection)
  const pathwaysJson = await readJsonOptional(paths.pathways)
  const faqJson = await readJsonOptional(paths.faq)
  const tutorialJson = await readJsonOptional(paths.tutorial)
  const finalctaJson = await readJsonOptional(paths.finalcta)
  const footerJson = await readJsonOptional(paths.footer)
  const legalJson = await buildLegalCopy(paths.legal)
  const seoJson = await readJsonOptional(paths.seo)
  const sitemapJson = await readJsonOptional(paths.sitemap)
  const portal = await readJson(paths.portal, 'portal/sections')
  const credits = await readJson(paths.credits, 'credits')
  const auth = await readJson(paths.auth, 'auth')
  const domainsJson = await readJson(paths.domains, 'game/domains')
  const categories = await readJson(paths.categories, 'game/categories')
  const locationsJson = await readJson(paths.locations, 'game/locations')
  const scenesJson = await readJson(paths.gameScenes, 'game/scenes')
  const citiesJson = await readJsonOptional(paths.gameCities)
  const botNicknamesJson = await readJsonOptional(path.join(paths.root, 'game/bot-nicknames.json'))
  const raritiesJson = await readJsonOptional(paths.gameRarities)

  const out = buildPaths(projectId)

  validateProject(manifestForBundle, domainsJson, locationsJson, categories, portal)

  const featuredByLocation = buildFeaturedByLocation(locationsJson)

  const { domainToCategory, domainGlow, domainLabels } = buildDomainMaps(domainsJson)
  const domainIds = new Set(domainsJson.domains.map((d) => d.id))
  const sharp = await loadSharp()
  const { publicBase, metadata } = await copyProjectAssets(paths, manifestForBundle, out, sharp)
  await copySharedFooterAssets(out, sharp)
  await copyGamemodelAssets(paths, gamemodelJson, out, sharp)
  await copyCollectionAssets(paths, collectionJson, out, sharp)
  await copyPathwaysAssets(paths, pathwaysJson, out, sharp)
  await copyFinalCtaAssets(paths, finalctaJson, out, sharp)
  await buildBrandSeoAssets({ sharp, paths, manifest: manifestForBundle, seoJson, out })
  await syncGamePublicFavicons(out)
  if (metadata.source === 'split') {
    console.log('Metadata: split (game/cards.json + game/scenes.json + game/keywords.json)')
  } else {
    console.log('Metadata: legacy assets_metadata.json (run npm run metadata:split to split)')
  }

  const cdnBase = manifest.assets?.cdnBase ?? null
  const { supabaseUrl } = shouldUpload ? resolveSupabaseAdminEnv() : { supabaseUrl: '' }

  const appConfig = buildAppConfig({
    manifest: manifestForBundle,
    colors,
    ui,
    descriptions,
    dominionsJson,
    gamemodelJson,
    pathwaysJson,
    faqJson,
    tutorialJson,
    finalctaJson,
    footerJson,
    legalJson,
    seoJson,
    sitemapJson,
    portal,
    credits,
    auth,
    categories,
    locationsJson,
    scenesJson,
    citiesJson,
    domainGlow,
    publicBase,
    cdnBase,
    landing,
    raritiesJson,
  })

  const { bySlug } = await compileCards({
    metadata,
    paths,
    out,
    projectId,
    manifest: manifestForBundle,
    locationsJson,
    featuredByLocation,
    collectionJson,
    domainIds,
    domainGlow,
    domainToCategory,
    supabaseUrl,
    shouldUpload,
    forceUpload,
    heroCardSlugs: landing.heroCardSlugs,
    raritiesJson,
  })

  appConfig.descriptions.collection = buildCollectionCopy(collectionJson, publicBase, bySlug)

  const gameConfig = {
    projectId,
    domains: domainsJson.domains,
    domainToCategory,
    domainGlow,
    domainLabels,
    featuredByLocation,
    keywords: metadata.keywords_glossary ?? {},
    locationOrder: locationsJson.locations.map((l) => l.id),
    botNicknames: Array.isArray(botNicknamesJson) ? botNicknamesJson : [],
  }

  await mkdir(out.generated, { recursive: true })

  const meta = {
    projectId,
    compiledAt: new Date().toISOString(),
    sourceRoot: path.relative(FRONTEND_ROOT, paths.root),
    buildRoot: path.relative(FRONTEND_ROOT, out.root),
  }

  await writeFile(
    path.join(out.generated, 'project-bundle.json'),
    JSON.stringify(appConfig, null, 2),
  )
  await writeFile(
    path.join(out.generated, 'game-config.json'),
    JSON.stringify(gameConfig, null, 2),
  )
  await writeFile(
    path.join(out.generated, 'project-meta.json'),
    JSON.stringify(meta, null, 2),
  )

  console.log(`[compile] Wrote .build/${projectId}/generated/project-bundle.json`)
  console.log(`[compile] Wrote .build/${projectId}/generated/game-config.json`)
  console.log(`[compile] Done.`)
}

main().catch((err) => {
  console.error('[compile]', err.message ?? err)
  process.exit(1)
})
