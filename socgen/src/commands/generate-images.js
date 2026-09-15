import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { projectPaths, resolveProjectId, postImagePath, postDir } from '../config/paths.js'
import {
  fileExists,
  resolveStagingRoot,
  listPostIds,
  parseArgs,
} from '../lib/io.js'
import { loadSocialContext, resolveCard } from '../lib/loadSocialContext.js'
import { renderPostImage } from '../lib/renderImage.js'
import { loadPostBundle, savePostBundle, mergePostBundle } from '../lib/postFiles.js'
import { writePostTextFile } from '../lib/writePostText.js'

function canRender(meta, force) {
  if (force) return true
  return meta.status === 'approved' || meta.status === 'validated' || meta.status === 'rendered'
}

export async function runGenerateImages(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const force = Boolean(flags.force)
  const dryRun = Boolean(flags['dry-run'])
  const mode = flags.mode || flags['image-mode'] || null

  const postIds = flags.post ? [flags.post] : await listPostIds(stagingRoot)
  if (!postIds.length) {
    console.error('No posts in _staging')
    process.exit(1)
  }

  const ctx = await loadSocialContext(projectId, paths)
  let rendered = 0
  let skipped = 0

  for (const postId of postIds) {
    const bundle = await loadPostBundle(stagingRoot, postId)
    const post = mergePostBundle(bundle)
    const outPath = postImagePath(stagingRoot, postId)

    const hasImage = await fileExists(outPath)
    if (hasImage && bundle.meta.status === 'rendered' && !force) {
      console.log(`Skip (already rendered): ${postId}`)
      skipped++
      continue
    }

    if (!canRender(bundle.meta, force)) {
      console.error(`${postId}: status "${bundle.meta.status}" — approve first (or --force)`)
      process.exit(1)
    }

    if (hasImage && !force) {
      console.log(`Skip (exists): _staging/${postId}/image.png — use --force to regenerate`)
      skipped++
      continue
    }

    let card = null
    if (bundle.meta.subject?.card) {
      try {
        card = resolveCard(ctx, bundle.meta.subject.card)
      } catch (err) {
        console.error(`${postId}: card not found — ${bundle.meta.subject.card}`)
        process.exit(1)
      }
    }

    const imageMode = mode || bundle.meta.image.mode || (card ? 'composite' : 'auto')

    if (dryRun) {
      console.log(`[dry-run] ${postId} mode=${imageMode}${card ? ' (card composite)' : ''}`)
      console.log(`  bg: ${bundle.meta.image.background_asset ?? '(auto)'}`)
      continue
    }

    console.log(`Rendering ${postId} (mode=${imageMode})…`)
    const { buffer, modeUsed } = await renderPostImage({ post, ctx, card, mode: imageMode })

    await writeFile(outPath, buffer)
    bundle.meta.image.rendered_at = new Date().toISOString()
    bundle.meta.image.render_mode_used = modeUsed
    bundle.meta.status = 'rendered'
    await savePostBundle(stagingRoot, postId, bundle)
    await writePostTextFile(postDir(stagingRoot, postId), bundle.content, bundle.meta)

    console.log(`  ✓ _staging/${postId}/image.png (${buffer.length} bytes, ${modeUsed})`)
    console.log(`  ✓ _staging/${postId}/post.txt`)
    if (bundle.meta.image.background_asset) {
      console.log(`  bg: ${bundle.meta.image.background_asset}`)
    }
    rendered++
  }

  if (rendered === 0 && skipped > 0 && !dryRun) {
    console.log(`\nNo new images (${skipped} skipped). Use --post=postN or --force`)
  } else if (rendered > 0) {
    console.log('\nNext: npm run publish -- --post=postN')
  }
}
