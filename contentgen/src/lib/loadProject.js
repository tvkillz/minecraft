import { readJsonFile } from './io.js'

async function readJsonOptional(filePath, fallback = {}) {
  try {
    return await readJsonFile(filePath)
  } catch {
    return fallback
  }
}

const DEFAULT_OUTPUT_SIZES = {
  domain: { width: 1672, height: 941, format: 'png' },
  city: { width: 1672, height: 941, format: 'png' },
  cta: { width: 1376, height: 768, format: 'webp', quality: 85 },
  gamemodel: { width: 1024, height: 1024, format: 'webp', quality: 85 },
  card_type: { width: 640, height: 640, format: 'webp', quality: 85 },
}

const DEFAULT_CONTENTGEN = {
  projectTitle: 'Project',
  visualPitch: 'trading card game landing assets',
  style: {
    aesthetic: 'cinematic fantasy environment art',
    avoid: 'text, watermarks, logos',
    palette: '',
  },
  image: {
    promptPrefix: 'Wide cinematic landscape,',
    promptSuffix: 'detailed environment art, no people, no text, no watermark.',
    ctaSuffix:
      'landscape feature illustration for a website tile, atmospheric depth, soft vignette, no text, no watermark, 16:9 composition.',
    gamemodelSuffix:
      'square pillar illustration for a website section, centered composition, soft lighting, no text, no watermark, 1:1 aspect ratio.',
    cardTypeSuffix:
      'square rarity emblem icon for a trading card game UI, centered, clean silhouette, no text, no watermark, 1:1 aspect ratio.',
  },
  outputSizes: DEFAULT_OUTPUT_SIZES,
  domains: {},
  cardTypes: {
    uncommon: { label: 'Uncommon', accent: '#8ec9a0' },
    rare: { label: 'Rare', accent: '#b8a9c9' },
    epic: { label: 'Epic', accent: '#e8a87c' },
  },
}

function mergeContentgenConfig(raw) {
  return {
    ...DEFAULT_CONTENTGEN,
    ...raw,
    style: { ...DEFAULT_CONTENTGEN.style, ...raw?.style },
    image: { ...DEFAULT_CONTENTGEN.image, ...raw?.image },
    outputSizes: { ...DEFAULT_OUTPUT_SIZES, ...raw?.outputSizes },
    domains: raw?.domains ?? {},
    cardTypes: { ...DEFAULT_CONTENTGEN.cardTypes, ...raw?.cardTypes },
  }
}

/** Slugs baked into frontend bundle (hero featured + collection section). */
export function buildShowcaseCardSlugs(locationsJson, collectionJson) {
  const slugs = new Set()
  for (const loc of locationsJson?.locations ?? []) {
    if (loc.featuredCardSlug) slugs.add(loc.featuredCardSlug)
  }
  for (const slug of collectionJson?.cardSlugs ?? []) {
    if (slug) slugs.add(slug)
  }
  return [...slugs]
}

export async function loadProjectContext(projectId, paths) {
  const [
    contentgenRaw,
    scenesJson,
    domainsJson,
    locationsJson,
    citiesJson,
    cardsJson,
    pathwaysJson,
    gamemodelJson,
    collectionJson,
    manifestJson,
  ] = await Promise.all([
    readJsonOptional(paths.contentgen, {}),
    readJsonOptional(paths.scenes, { assets: [] }),
    readJsonOptional(paths.domains, { domains: [] }),
    readJsonOptional(paths.locations, { locations: [] }),
    readJsonOptional(paths.cities, { cities: [] }),
    readJsonOptional(paths.cards, { cards: [] }),
    readJsonOptional(paths.pathways, { features: [] }),
    readJsonOptional(paths.gamemodel, { pillars: [] }),
    readJsonOptional(paths.collection, { cardSlugs: [] }),
    readJsonOptional(paths.manifest, {}),
  ])

  const contentgen = mergeContentgenConfig(contentgenRaw)
  const elementFolders = contentgen.elementFolders ?? {}
  const showcaseCardSlugs = buildShowcaseCardSlugs(locationsJson, collectionJson)

  return {
    projectId,
    contentgen,
    scenesJson,
    domainsJson,
    locationsJson,
    citiesJson,
    cardsJson,
    pathwaysJson,
    gamemodelJson,
    collectionJson,
    manifestJson,
    elementFolders,
    showcaseCardSlugs,
  }
}
