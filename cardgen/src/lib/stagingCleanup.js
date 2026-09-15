import path from 'node:path'
import { rm, unlink } from 'node:fs/promises'
import { readdir } from 'node:fs/promises'

/**
 * Remove staged PNGs for applied card slugs.
 * @param {string} imagesDir
 * @param {string[]} slugs
 */
export async function removeStagedImages(imagesDir, slugs) {
  let removed = 0
  for (const slug of slugs) {
    const img = path.join(imagesDir, `${slug}.png`)
    try {
      await unlink(img)
      removed++
    } catch {
      // already gone
    }
  }
  return removed
}

/** Delete an approved batch JSON and any matching image manifest. */
export async function removeBatchArtifacts(paths, batchFilePath) {
  const abs = path.resolve(batchFilePath)
  try {
    await unlink(abs)
  } catch {
    // ignore
  }

  const base = path.basename(abs, '.json')
  const manifest = path.join(paths.stagingManifests, `${base}.image-manifest.json`)
  try {
    await unlink(manifest)
  } catch {
    // ignore
  }
}

/** Remove empty directories bottom-up under a root (keeps root if --keep-root). */
export async function pruneEmptyDirs(rootDir, { keepRoot = true } = {}) {
  let removed = 0
  try {
    const entries = await readdir(rootDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const child = path.join(rootDir, entry.name)
      removed += await pruneEmptyDirs(child, { keepRoot: false })
    }
    const remaining = await readdir(rootDir)
    if (!remaining.length && !keepRoot) {
      await rm(rootDir, { recursive: true, force: true })
      removed++
    }
  } catch {
    // missing dir
  }
  return removed
}

/**
 * After a successful apply: drop batch file, staged images, optional round dir.
 * @param {object} paths — from projectPaths()
 * @param {object} opts
 * @param {string[]} opts.appliedSlugs
 * @param {string} opts.batchFile
 * @param {string} [opts.roundDir]
 */
export async function cleanupAfterApply(paths, { appliedSlugs, batchFile, roundDir: roundDirectory }) {
  const imagesRemoved = await removeStagedImages(paths.stagingImages, appliedSlugs)
  await removeBatchArtifacts(paths, batchFile)

  if (roundDirectory) {
    try {
      await rm(roundDirectory, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }

  await pruneEmptyDirs(paths.stagingImages)
  await pruneEmptyDirs(paths.stagingCards)
  await pruneEmptyDirs(paths.stagingManifests)
  await pruneEmptyDirs(paths.stagingRounds)

  const stagingRoot = path.join(paths.root, 'game/_staging')
  await pruneEmptyDirs(stagingRoot, { keepRoot: true })

  return { imagesRemoved }
}
