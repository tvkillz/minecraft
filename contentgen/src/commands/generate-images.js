import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { buildContentManifest } from '../lib/buildManifest.js'
import { generateImage } from '../lib/geminiImage.js'
import { ensureDir, fileExists, parseArgs, readJsonFile } from '../lib/io.js'
import { getGeminiImageModelId } from '../config/gemini.js'

function parseKinds(flags) {
  const raw = flags.kind || flags.kinds
  if (!raw) return null
  return new Set(String(raw).split(',').map((k) => k.trim()).filter(Boolean))
}

function filterAssets(assets, { kinds, slug, id }) {
  let list = assets
  if (kinds?.size) {
    list = list.filter((a) => kinds.has(a.kind))
  }
  if (slug || id) {
    const needle = slug || id
    list = list.filter((a) => a.id === needle || a.slug === needle)
  }
  return list
}

export async function runGenerateImages(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const force = Boolean(flags.force)
  const dryRun = Boolean(flags['dry-run'])
  const kinds = parseKinds(flags)

  let manifest
  if (await fileExists(paths.stagingManifest)) {
    manifest = await readJsonFile(paths.stagingManifest)
  } else {
    const ctx = await loadProjectContext(projectId, paths)
    manifest = buildContentManifest(ctx)
    await ensureDir(paths.stagingRoot)
    const { writeJsonFile } = await import('../lib/io.js')
    await writeJsonFile(paths.stagingManifest, manifest)
    console.log(`[contentgen] Auto-built manifest (${manifest.assets.length} assets)`)
  }

  const assets = filterAssets(manifest.assets ?? [], {
    kinds,
    slug: flags.slug,
    id: flags.id,
  })

  if (!assets.length) {
    console.error('No assets matched filters. Run: npm run manifest')
    process.exit(1)
  }

  await ensureDir(paths.stagingImages)

  const model = getGeminiImageModelId()
  console.log(`Image model: ${model}`)
  console.log(`Staging: ${paths.stagingImages}/`)
  console.log(`Assets: ${assets.length}\n`)

  const results = []

  for (const asset of assets) {
    const outPath = path.join(paths.stagingImages, asset.stagingFile)
    if (!force && (await fileExists(outPath))) {
      console.log(`Skip (exists): ${asset.id}`)
      results.push({ id: asset.id, status: 'skipped' })
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] ${asset.kind}/${asset.id}`)
      console.log(`  → ${asset.path}`)
      console.log(`  ${asset.prompt.slice(0, 140)}…`)
      results.push({ id: asset.id, status: 'dry-run' })
      continue
    }

    console.log(`Generating: ${asset.kind}/${asset.title ?? asset.id}…`)
    try {
      const jpegBuffer = await generateImage(asset.prompt)
      const pngBuffer = await sharp(jpegBuffer).png().toBuffer()
      await writeFile(outPath, pngBuffer)
      console.log(`  ✓ ${outPath} (${pngBuffer.length} bytes)`)
      results.push({ id: asset.id, status: 'ok', bytes: pngBuffer.length })
    } catch (err) {
      console.error(`  ✗ ${asset.id}: ${err.message}`)
      results.push({ id: asset.id, status: 'error', error: err.message })
    }
  }

  const ok = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length
  console.log(`\nImages: ${ok} generated, ${failed} failed, ${results.length - ok - failed} skipped`)

  if (ok > 0) {
    console.log(`\nNext: npm run apply -- --project=${projectId}`)
  }
  if (failed > 0) process.exit(1)
}
