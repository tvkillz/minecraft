import path from 'node:path'
import { access, copyFile, readFile, writeFile } from 'node:fs/promises'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { toCardsJsonEntry } from '../lib/validateCards.js'
import { cleanupAfterApply } from '../lib/stagingCleanup.js'
import { ensureDir, parseArgs, readJsonFile } from '../lib/io.js'

async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/**
 * Apply one approved batch to cards.json + assets.
 * @returns {Promise<{ projectId: string, batchPath: string, appliedSlugs: string[], added: number }>}
 */
export async function applyBatch(batchFile, { projectId, dryRun = false, keepStaging = false, roundDir = null, force = false } = {}) {
  const abs = path.resolve(batchFile)
  const batch = await readJsonFile(abs)
  const pid = batch.meta?.project || projectId || resolveProjectId()
  const paths = projectPaths(pid)

  const cardsJsonPath = paths.gameCards
  const cardsDoc = JSON.parse(await readFile(cardsJsonPath, 'utf8'))
  const existing = cardsDoc.cards ?? []
  const existingSlugs = new Set(existing.map((c) => c.slug))

  const toAdd = []
  const toReplace = []
  const missingImages = []

  let raritiesJson = null
  try {
    raritiesJson = JSON.parse(await readFile(paths.rarities, 'utf8'))
  } catch {
    /* optional */
  }

  for (const draft of batch.cards ?? []) {
    const entry = toCardsJsonEntry(draft, { raritiesJson })
    const exists = existingSlugs.has(entry.slug)
    if (exists && !force) {
      console.warn(`Skip (already in cards.json): ${entry.slug}`)
      continue
    }
    if (exists && force) {
      toReplace.push(entry)
    } else if (!exists) {
      // queued for toAdd after image copy
    } else {
      continue
    }

    const stagedImage = path.join(paths.stagingImages, `${entry.slug}.png`)
    const destImage = path.join(paths.assets, entry.path)

    if (!(await fileExists(stagedImage))) {
      missingImages.push(entry.slug)
      if (exists && force) toReplace.pop()
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] would copy ${stagedImage} → ${destImage}`)
      console.log(`[dry-run] would ${exists ? 'update' : 'add'} card ${entry.slug}`)
      if (!exists) toAdd.push(entry)
    } else {
      await ensureDir(path.dirname(destImage))
      await copyFile(stagedImage, destImage)
      const base = path.basename(stagedImage, '.png')
      entry.source_file = `${base.replace(/[^a-z0-9_]/gi, '_').slice(0, 48)}.png`
      if (exists && force) {
        const idx = toReplace.findIndex((c) => c.slug === entry.slug)
        if (idx >= 0) toReplace[idx] = entry
      } else {
        toAdd.push(entry)
      }
      console.log(`✓ ${entry.slug} → ${entry.path}`)
    }
  }

  const merged = [...existing]
  for (const entry of toReplace) {
    const idx = merged.findIndex((c) => c.slug === entry.slug)
    if (idx >= 0) merged[idx] = entry
  }

  if (dryRun) {
    return {
      projectId: pid,
      batchPath: abs,
      appliedSlugs: [...toReplace, ...toAdd].map((c) => c.slug),
      added: toReplace.length + toAdd.length,
      dryRun: true,
    }
  }

  if (missingImages.length) {
    console.error(`\nMissing staged images (${missingImages.length}):`)
    missingImages.forEach((s) => console.error(`  ${paths.stagingImages}/${s}.png`))
    console.error('\nGenerate images first, or apply partial batches after images exist.')
    if (!toAdd.length && !toReplace.length) {
      const err = new Error('No cards applied — missing images')
      err.code = 'MISSING_IMAGES'
      throw err
    }
  }

  if (!toAdd.length && !toReplace.length) {
    return { projectId: pid, batchPath: abs, appliedSlugs: [], added: 0 }
  }

  cardsDoc.cards = [...merged, ...toAdd]
  await writeFile(cardsJsonPath, `${JSON.stringify(cardsDoc, null, 2)}\n`, 'utf8')

  const appliedSlugs = [...toReplace, ...toAdd].map((c) => c.slug)

  if (!keepStaging) {
    const { imagesRemoved } = await cleanupAfterApply(paths, {
      appliedSlugs,
      batchFile: abs,
      roundDir: null,
    })
    console.log(`Staging cleared: batch file + ${imagesRemoved} staged image(s)`)
  } else {
    batch.meta = {
      ...batch.meta,
      status: 'applied',
      applied_at: new Date().toISOString(),
      applied_count: toAdd.length,
    }
    await writeFile(abs, `${JSON.stringify(batch, null, 2)}\n`, 'utf8')
  }

  console.log(`\nAdded/updated ${appliedSlugs.length} card(s) in ${cardsJsonPath}`)
  console.log('Upload to backend (local machine):')
  console.log(`  cd frontend && PROJECT=${pid} npm run upload:site`)

  return { projectId: pid, batchPath: abs, appliedSlugs, added: appliedSlugs.length }
}

export async function runApply(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const file = flags.file
  const dryRun = Boolean(flags['dry-run'])
  const keepStaging = Boolean(flags['keep-staging'])
  const force = Boolean(flags.force)

  if (!file) {
    console.error('Usage: npm run apply -- --file=.../approved/kronos_batch_06-15.json [--dry-run] [--keep-staging] [--force]')
    process.exit(1)
  }

  try {
    const result = await applyBatch(file, {
      projectId: flags.project || resolveProjectId(),
      dryRun,
      keepStaging,
      force,
    })
    if (dryRun) {
      console.log(`\nDry run complete. Would add ${result.added} card(s).`)
    } else if (!result.added) {
      console.log('Nothing to apply.')
    }
  } catch (err) {
    console.error(err.message || err)
    process.exit(1)
  }
}
