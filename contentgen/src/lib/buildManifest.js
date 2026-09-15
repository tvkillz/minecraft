import path from 'node:path'
import { buildPromptForAsset } from '../prompts/buildPrompt.js'

function stagingSlug(asset) {
  return asset.id.replace(/[/\\]/g, '__')
}

function sizeForKind(contentgen, kind) {
  const sizes = contentgen.outputSizes ?? {}
  return sizes[kind] ?? sizes.city
}

function sceneAssets(ctx) {
  const items = []
  for (const asset of ctx.scenesJson.assets ?? []) {
    if (!asset.path) continue
    if (asset.kind !== 'domain' && asset.kind !== 'city') continue
    const sizeKey = asset.kind
    const spec = sizeForKind(ctx.contentgen, sizeKey)
    items.push({
      id: asset.slug || path.basename(asset.path, path.extname(asset.path)),
      kind: asset.kind,
      path: asset.path,
      title: asset.title,
      domain: asset.domain || null,
      notes: asset.notes ?? '',
      slug: asset.slug,
      width: spec.width,
      height: spec.height,
      format: spec.format,
      quality: spec.quality,
      prompt: buildPromptForAsset(
        { ...asset, kind: asset.kind },
        ctx,
      ),
      stagingFile: `${stagingSlug({ id: asset.slug || asset.path })}.png`,
    })
  }
  return items
}

function ctaAssets(ctx) {
  const items = []
  const spec = sizeForKind(ctx.contentgen, 'cta')
  for (const feature of ctx.pathwaysJson.features ?? []) {
    const rel = feature.image
    if (!rel) continue
    items.push({
      id: feature.id,
      kind: 'cta',
      path: rel,
      title: feature.title,
      domain: null,
      source: feature,
      width: spec.width,
      height: spec.height,
      format: spec.format,
      quality: spec.quality,
      prompt: buildPromptForAsset({ kind: 'cta', source: feature, id: feature.id }, ctx),
      stagingFile: `cta__${feature.id}.png`,
    })
  }
  return items
}

function gamemodelAssets(ctx) {
  const items = []
  const spec = sizeForKind(ctx.contentgen, 'gamemodel')
  for (const pillar of ctx.gamemodelJson.pillars ?? []) {
    const rel = pillar.image
    if (!rel) continue
    items.push({
      id: pillar.id,
      kind: 'gamemodel',
      path: rel,
      title: pillar.title,
      domain: null,
      source: pillar,
      width: spec.width,
      height: spec.height,
      format: spec.format,
      quality: spec.quality,
      prompt: buildPromptForAsset({ kind: 'gamemodel', source: pillar, id: pillar.id }, ctx),
      stagingFile: `gamemodel__${pillar.id}.png`,
    })
  }
  return items
}

function cardTypeAssets(ctx) {
  const items = []
  const spec = sizeForKind(ctx.contentgen, 'card_type')
  const typeIds = Object.keys(ctx.contentgen.cardTypes ?? {})
  for (const typeId of typeIds) {
    items.push({
      id: typeId,
      kind: 'card_type',
      path: `card_types/${typeId}.webp`,
      title: ctx.contentgen.cardTypes[typeId]?.label ?? typeId,
      domain: null,
      width: spec.width,
      height: spec.height,
      format: spec.format,
      quality: spec.quality,
      prompt: buildPromptForAsset({ kind: 'card_type', id: typeId }, ctx),
      stagingFile: `card_type__${typeId}.png`,
    })
  }
  return items
}

function showcaseCardRefs(ctx) {
  const cardsBySlug = new Map((ctx.cardsJson.cards ?? []).map((c) => [c.slug, c]))
  return ctx.showcaseCardSlugs.map((slug) => {
    const card = cardsBySlug.get(slug)
    return {
      id: slug,
      kind: 'showcase_card',
      path: card?.path ?? `cards/{domain}/${slug}.png`,
      title: card?.title ?? slug,
      domain: card?.domain ?? null,
      managedBy: 'cardgen',
      note: 'Generated via cardgen; required for FRONTEND_SHOWCASE_ONLY compile (hero + collection).',
    }
  })
}

/**
 * Build the full landing asset manifest for a project.
 */
export function buildContentManifest(ctx) {
  const generated = [
    ...sceneAssets(ctx),
    ...ctaAssets(ctx),
    ...gamemodelAssets(ctx),
    ...cardTypeAssets(ctx),
  ]

  return {
    meta: {
      project: ctx.projectId,
      generatedAt: new Date().toISOString(),
      reference: 'voidborn asset sizes (domains/cities 1672×941 png, cta 1376×768 webp, gamemodel 1024×1024 webp, card_types 640×640 webp)',
      showcaseCompileEnv: 'FRONTEND_SHOWCASE_ONLY=1',
    },
    assets: generated,
    showcaseCards: showcaseCardRefs(ctx),
    manualAssets: [
      {
        kind: 'brand',
        paths: [
          'brand/gamelogo.png',
          'brand/header.png',
          'brand/play-lobby.png',
          'brand/favicon.ico',
          'brand/main.mp4',
        ],
        note: 'Brand logo/video are not auto-generated — supply manually or extend contentgen later.',
        referenceSizes: {
          'brand/gamelogo.png': '1344×768 png',
          'brand/header.png': '1344×768 png',
          'brand/play-lobby.png': '1672×941 png',
        },
      },
    ],
  }
}

export { stagingSlug }
