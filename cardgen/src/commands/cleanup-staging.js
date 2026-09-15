import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { cleanupAfterApply, pruneEmptyDirs, removeBatchArtifacts, removeStagedImages } from '../lib/stagingCleanup.js'
import { listJsonFiles, parseArgs, readJsonFile } from '../lib/io.js'
import { listRoundIds, loadRound } from '../lib/round.js'
import { rm } from 'node:fs/promises'

/**
 * Remove staging artifacts whose card slugs are already in cards.json (orphans after apply).
 * With --all, removes entire game/_staging tree.
 */
export async function runCleanupStaging(argv) {
  const { flags } = parseArgs(['node', 'cli', ...argv])
  const projectId = flags.project || resolveProjectId()
  const paths = projectPaths(projectId)
  const wipeAll = Boolean(flags.all)

  if (wipeAll) {
    await rm(path.join(paths.root, 'game/_staging'), { recursive: true, force: true })
    console.log(`Cleared ${path.join(paths.root, 'game/_staging')}`)
    return
  }

  const cardsDoc = JSON.parse(await readFile(paths.gameCards, 'utf8'))
  const catalogSlugs = new Set((cardsDoc.cards ?? []).map((c) => c.slug))

  let batchesRemoved = 0
  let imagesRemoved = 0

  const approved = await listJsonFiles(paths.stagingApproved)
  for (const file of approved) {
    const batch = await readJsonFile(file)
    const slugs = (batch.cards ?? []).map((c) => c.slug)
    const allInCatalog = slugs.length > 0 && slugs.every((s) => catalogSlugs.has(s))
    if (allInCatalog) {
      await removeBatchArtifacts(paths, file)
      imagesRemoved += await removeStagedImages(paths.stagingImages, slugs)
      batchesRemoved++
      console.log(`Removed orphan batch: ${path.basename(file)} (${slugs.length} cards)`)
    }
  }

  const draft = await listJsonFiles(paths.stagingCards)
  for (const file of draft) {
    if (file.includes('/approved/')) continue
    const batch = await readJsonFile(file)
    const slugs = (batch.cards ?? []).map((c) => c.slug)
    const allInCatalog = slugs.length > 0 && slugs.every((s) => catalogSlugs.has(s))
    if (allInCatalog) {
      await removeBatchArtifacts(paths, file)
      imagesRemoved += await removeStagedImages(paths.stagingImages, slugs)
      batchesRemoved++
      console.log(`Removed orphan draft: ${path.basename(file)}`)
    }
  }

  const rounds = await listRoundIds(paths)
  for (const roundId of rounds) {
    try {
      const { dir, manifest } = await loadRound(paths, roundId)
      const slugs = []
      for (const entry of manifest.meta?.batches ?? []) {
        const batch = await readJsonFile(path.join(dir, entry.file))
        slugs.push(...(batch.cards ?? []).map((c) => c.slug))
      }
      const allInCatalog = slugs.length > 0 && slugs.every((s) => catalogSlugs.has(s))
      if (allInCatalog || manifest.meta?.status === 'applied') {
        await cleanupAfterApply(paths, {
          appliedSlugs: slugs,
          batchFile: path.join(dir, 'round.json'),
          roundDir: dir,
        })
        imagesRemoved += slugs.length
        batchesRemoved++
        console.log(`Removed orphan round: ${roundId}`)
      }
    } catch {
      // skip invalid round
    }
  }

  await pruneEmptyDirs(paths.stagingImages)
  await pruneEmptyDirs(paths.stagingCards)
  await pruneEmptyDirs(paths.stagingManifests)
  await pruneEmptyDirs(paths.stagingRounds)
  await pruneEmptyDirs(path.join(paths.root, 'game/_staging'), { keepRoot: true })

  if (!batchesRemoved) {
    console.log('No orphan staging found (use --all to wipe entire _staging).')
  } else {
    console.log(`\nDone: ${batchesRemoved} batch/round(s), ${imagesRemoved} image(s) cleared.`)
  }
}
