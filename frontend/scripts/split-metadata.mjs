#!/usr/bin/env node
/**
 * Split legacy assets_metadata.json into per-topic files under game/:
 *   keywords.json, scenes.json (domains + cities), cards.json
 *
 * Usage (from frontend/):
 *   npm run metadata:split
 *   PROJECT=voidborn node scripts/split-metadata.mjs
 *   node scripts/split-metadata.mjs --all
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadRegistry } from './project-ports.mjs'
import { projectPaths } from './project-paths.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'))
}

async function splitOne(projectId) {
  const paths = projectPaths(projectId)
  let metadata
  try {
    metadata = await readJson(paths.metadata)
  } catch {
    console.warn(`[split] Skip ${projectId}: no assets_metadata.json`)
    return false
  }

  const assets = metadata.assets ?? []
  const cards = assets.filter((a) => a.kind === 'card')
  const scenes = assets.filter((a) => a.kind === 'domain' || a.kind === 'city')

  await mkdir(path.dirname(paths.gameCards), { recursive: true })

  await writeFile(
    paths.gameKeywords,
    JSON.stringify({ keywords_glossary: metadata.keywords_glossary ?? {} }, null, 2) + '\n',
  )
  await writeFile(
    paths.gameScenes,
    JSON.stringify({ assets: scenes }, null, 2) + '\n',
  )
  await writeFile(
    paths.gameCards,
    JSON.stringify({ cards }, null, 2) + '\n',
  )

  console.log(
    `[split] ${projectId}: keywords + ${scenes.length} scenes + ${cards.length} cards → game/*.json`,
  )
  return true
}

async function main() {
  const all = process.argv.includes('--all')
  const projectId = process.env.PROJECT || process.argv.find((a) => a.startsWith('--project='))?.slice(10)

  if (all) {
    const registry = loadRegistry()
    let ok = 0
    for (const site of registry) {
      if (await splitOne(site.id)) ok++
    }
    console.log(`[split] Done (${ok} projects).`)
    return
  }

  if (!projectId) {
    console.error('Usage: PROJECT=id node scripts/split-metadata.mjs  OR  --all')
    process.exit(1)
  }

  await splitOne(projectId)
}

main().catch((err) => {
  console.error('[split]', err.message ?? err)
  process.exit(1)
})
