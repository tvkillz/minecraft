import { readFile } from 'node:fs/promises'
import path from 'node:path'

async function pathExists(p) {
  try {
    await readFile(p)
    return true
  } catch {
    return false
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

/**
 * Load project metadata from split files (preferred) or legacy assets_metadata.json.
 *
 * Split layout under projects/{id}/game/:
 *   keywords.json  — { keywords_glossary }
 *   scenes.json    — { assets: [...] }  domains + city backgrounds
 *   cards.json     — { cards: [...] }   card stats, abilities, art paths
 */
export async function loadProjectMetadata(paths) {
  const splitCards = paths.gameCards
  const hasSplit = await pathExists(splitCards)

  if (hasSplit) {
    const cardsJson = await readJson(splitCards)
    const scenesJson = (await pathExists(paths.gameScenes))
      ? await readJson(paths.gameScenes)
      : { assets: [] }
    const keywordsJson = (await pathExists(paths.gameKeywords))
      ? await readJson(paths.gameKeywords)
      : { keywords_glossary: {} }

    const sceneAssets = (scenesJson.assets ?? scenesJson.scenes ?? []).map((entry) => ({
      ...entry,
      kind: entry.kind ?? (entry.category === 'domains' ? 'domain' : 'city'),
    }))

    const cardAssets = (cardsJson.cards ?? []).map((entry) => ({
      ...entry,
      kind: 'card',
      category: entry.category ?? 'cards',
    }))

    return {
      keywords_glossary: keywordsJson.keywords_glossary ?? {},
      assets: [...sceneAssets, ...cardAssets],
      source: 'split',
    }
  }

  const metadata = await readJson(paths.metadata)
  return {
    keywords_glossary: metadata.keywords_glossary ?? {},
    assets: metadata.assets ?? [],
    source: 'monolith',
    project: metadata.project,
    generated_at: metadata.generated_at,
  }
}

/** Supabase storage paths scoped per site to avoid cross-site collisions. */
export function siteStoragePaths(projectId, assetPath, domain, slug, thumbExt) {
  const rel = assetPath.replace(/^\//, '')
  const prefixed = rel.startsWith(`${projectId}/`) ? rel : `${projectId}/${rel}`
  return {
    storagePath: prefixed,
    thumbStoragePath: `${projectId}/thumbs/${domain}/${slug}.${thumbExt}`,
  }
}
