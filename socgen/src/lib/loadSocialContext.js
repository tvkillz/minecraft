import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

function buildDomainConfig(cardgen, domains) {
  const fromFile = cardgen?.domains ?? {}
  return Object.fromEntries(
    (domains.domains ?? []).map((d) => {
      const entry = fromFile[d.id] ?? {}
      return [
        d.id,
        {
          label: entry.label ?? d.label ?? d.id,
          visualIdentity: entry.visualIdentity ?? '',
          flavorNotes: entry.flavorNotes ?? '',
        },
      ]
    }),
  )
}

export function defaultSocialgenConfig(raw = {}, manifest = {}) {
  return {
    brandVoice:
      raw.brandVoice ??
      'Epic, cinematic, confident. Short punchy sentences. Dark fantasy tone without grimdark edgelord vibes.',
    audience: raw.audience ?? 'TCG players, fantasy fans, collectors',
    siteUrl: raw.siteUrl ?? manifest.siteUrl ?? '',
    platforms: {
      instagram: {
        minHashtags: raw.platforms?.instagram?.minHashtags ?? 5,
        maxHashtags: raw.platforms?.instagram?.maxHashtags ?? 15,
        defaultHashtags: raw.platforms?.instagram?.defaultHashtags ?? [],
        linkInBioTemplate:
          raw.platforms?.instagram?.linkInBioTemplate ??
          '🔗 Link in bio → {siteUrl}',
      },
      facebook: {
        minBodyLength: raw.platforms?.facebook?.minBodyLength ?? 180,
      },
      discord: {
        allowMentionEveryone: raw.platforms?.discord?.allowMentionEveryone ?? false,
      },
    },
    image: {
      defaultMode: raw.image?.defaultMode ?? 'auto',
      size: raw.image?.size ?? 1080,
      promptSuffix:
        raw.image?.promptSuffix ??
        'Square 1:1 social promo art, dark cinematic fantasy, high contrast, no text, no watermark, leave space for logo overlay.',
      composite: {
        logoAsset: raw.image?.composite?.logoAsset ?? 'brand/gamelogo.png',
        logoScale: raw.image?.composite?.logoScale ?? 0.18,
        cardLogoScale: raw.image?.composite?.cardLogoScale ?? 0.14,
        cardLogoLeft: raw.image?.composite?.cardLogoLeft ?? 24,
        cardLogoTop: raw.image?.composite?.cardLogoTop ?? 24,
        vignetteStrength: raw.image?.composite?.vignetteStrength ?? 0.28,
        cardFrameGlow: raw.image?.composite?.cardFrameGlow ?? 0.32,
        cityOverlay: raw.image?.composite?.cityOverlay ?? 0.52,
      },
    },
  }
}

export async function loadSocialgenConfig(paths, manifest) {
  let raw = {}
  try {
    raw = await readJson(paths.socialgen)
  } catch {
    console.warn(`No socialgen.json at ${paths.socialgen} — using defaults`)
  }
  return defaultSocialgenConfig(raw, manifest)
}

export async function loadCardgenSlice(paths, domainsJson, dominionsJson, manifest = {}) {
  let raw = {}
  try {
    raw = await readJson(paths.cardgen)
  } catch {
    return {
      gameTitle: manifest?.name?.display ?? 'Game',
      gamePitch: '',
      world: { title: dominionsJson?.title ?? '', description: dominionsJson?.description ?? '' },
      domainById: buildDomainConfig({}, domainsJson),
    }
  }
  return {
    gameTitle: raw.gameTitle ?? 'Game',
    gamePitch: raw.gamePitch ?? '',
    world: {
      title: raw.world?.title ?? dominionsJson?.title ?? '',
      description: raw.world?.description ?? dominionsJson?.description ?? '',
    },
    domainById: buildDomainConfig(raw, domainsJson),
    imageSuffix: raw.image?.promptSuffix ?? '',
  }
}

export async function loadSocialContext(projectId, paths) {
  const [manifest, cardsJson, domainsJson, scenesJson, dominionsJson, pathwaysJson, descriptionsJson, seoJson, colorsJson] =
    await Promise.all([
      readJson(paths.manifest),
      readJson(paths.gameCards),
      readJson(paths.domains),
      readJson(paths.scenes).catch(() => ({ assets: [] })),
      readJson(paths.dominions).catch(() => ({})),
      readJson(paths.pathways).catch(() => ({})),
      readJson(paths.descriptions).catch(() => ({})),
      readJson(paths.seo).catch(() => ({})),
      readJson(paths.colors).catch(() => ({})),
    ])

  const socialgen = await loadSocialgenConfig(paths, manifest)
  const cardgen = await loadCardgenSlice(paths, domainsJson, dominionsJson, manifest)

  const cards = cardsJson.cards ?? []
  const cardsBySlug = Object.fromEntries(cards.map((c) => [c.slug, c]))

  return {
    projectId,
    manifest,
    socialgen,
    cardgen,
    cards,
    cardsBySlug,
    scenes: scenesJson,
    domains: domainsJson.domains ?? [],
    pathways: pathwaysJson,
    descriptions: descriptionsJson,
    seo: seoJson,
    colors: colorsJson,
    paths,
  }
}

export function resolveCard(ctx, slug) {
  const card = ctx.cardsBySlug[slug]
  if (!card) {
    const known = ctx.cards.slice(0, 5).map((c) => c.slug)
    throw new Error(`Unknown card slug "${slug}". Examples: ${known.join(', ')}`)
  }
  return card
}

export function resolveAssetPath(paths, relPath) {
  if (!relPath) return null
  return path.join(paths.assets, relPath.replace(/^\//, ''))
}

export function cardArtPath(ctx, card) {
  return resolveAssetPath(ctx.paths, card.path)
}

export function logoAssetPath(ctx) {
  const rel = ctx.manifest.brand?.logo ?? ctx.socialgen.image.composite.logoAsset
  return resolveAssetPath(ctx.paths, rel)
}

export function domainGlowColor(ctx, domainId) {
  const map = {
    kronos: ctx.colors.gold ?? '#c9a227',
    thalassa: ctx.colors.cyanGlow ?? '#4ec8ff',
    infernus: ctx.colors.ember ?? '#e85d5d',
    anemos: ctx.colors.purpleGlow ?? '#7b4dff',
    terra: ctx.colors.gold,
    aqua: ctx.colors.cyanGlow,
    ignis: ctx.colors.ember,
    zephyr: ctx.colors.purpleGlow,
  }
  return map[domainId] ?? ctx.colors.gold ?? '#c9a227'
}
