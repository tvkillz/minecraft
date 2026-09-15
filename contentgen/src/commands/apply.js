import path from 'node:path'
import { writeFile, readFile } from 'node:fs/promises'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { loadProjectContext } from '../lib/loadProject.js'
import { buildContentManifest } from '../lib/buildManifest.js'
import { encodeAsset } from '../lib/resize.js'
import { ensureDir, fileExists, parseArgs, readJsonFile } from '../lib/io.js'

function parseKinds(flags) {
  const raw = flags.kind || flags.kinds
  if (!raw) return null
  return new Set(String(raw).split(',').map((k) => k.trim()).filter(Boolean))
}

export async function runApply(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const dryRun = Boolean(flags['dry-run'])
  const kinds = parseKinds(flags)

  let manifest
  if (await fileExists(paths.stagingManifest)) {
    manifest = await readJsonFile(paths.stagingManifest)
  } else {
    console.error('Missing manifest. Run: npm run manifest')
    process.exit(1)
  }

  let assets = manifest.assets ?? []
  if (kinds?.size) {
    assets = assets.filter((a) => kinds.has(a.kind))
  }
  if (flags.id) {
    assets = assets.filter((a) => a.id === flags.id)
  }

  let applied = 0
  let missing = 0
  let skipped = 0

  for (const asset of assets) {
    const staged = path.join(paths.stagingImages, asset.stagingFile)
    const dest = path.join(paths.assets, asset.path)

    if (!(await fileExists(staged))) {
      console.warn(`Missing staged image: ${asset.stagingFile}`)
      missing++
      continue
    }

    if (!dryRun && (await fileExists(dest)) && !flags.force) {
      console.log(`Skip (dest exists): ${asset.path} — use --force to overwrite`)
      skipped++
      continue
    }

    const buffer = await readFile(staged)

    if (dryRun) {
      console.log(`[dry-run] ${staged}`)
      console.log(`  → ${dest} (${asset.width}×${asset.height} ${asset.format})`)
      applied++
      continue
    }

    const encoded = await encodeAsset(buffer, {
      width: asset.width,
      height: asset.height,
      format: asset.format,
      quality: asset.quality,
    })

    await ensureDir(path.dirname(dest))
    await writeFile(dest, encoded)
    console.log(`✓ ${asset.path} (${encoded.length} bytes)`)
    applied++
  }

  console.log(`\nApply: ${applied} written, ${missing} missing staged, ${skipped} skipped (dest exists)`)

  if (missing > 0 && !dryRun) {
    console.error('\nGenerate missing images first: npm run generate-images')
    process.exit(1)
  }

  if (applied > 0 && !dryRun) {
    const ctx = await loadProjectContext(projectId, paths)
    const showcase = ctx.showcaseCardSlugs
    if (showcase.length) {
      console.log(`\nShowcase cards (${showcase.length}) — use cardgen, then compile with FRONTEND_SHOWCASE_ONLY=1:`)
      for (const slug of showcase) {
        const card = (ctx.cardsJson.cards ?? []).find((c) => c.slug === slug)
        const cardPath = card?.path
        const exists = cardPath ? await fileExists(path.join(paths.assets, cardPath)) : false
        console.log(`  ${exists ? '✓' : '○'} ${slug}${cardPath ? ` → ${cardPath}` : ' (not in cards.json yet)'}`)
      }
    }
    console.log(`\nNext: cd ../frontend && PROJECT=${projectId} npm run compile`)
  }
}
