import { projectPaths, resolveProjectId } from '../config/paths.js'
import {
  resolveStagingRoot,
  listPostIds,
  parseArgs,
} from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import { validatePost, applyValidationMeta } from '../lib/validatePost.js'
import { loadPostBundle, savePostBundle, mergePostBundle } from '../lib/postFiles.js'
import { loadCardLog, saveCardLog, appendApprovedCard } from '../lib/cardLog.js'

export async function runValidate(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)

  const postIds = flags.post ? [flags.post] : await listPostIds(stagingRoot)
  if (!postIds.length) {
    console.error('No posts in _staging')
    process.exit(1)
  }

  const ctx = await loadSocialContext(projectId, paths)
  let allOk = true

  for (const postId of postIds) {
    const bundle = await loadPostBundle(stagingRoot, postId)
    const validation = validatePost(mergePostBundle(bundle), ctx)
    applyValidationMeta(bundle.meta, validation)
    await savePostBundle(stagingRoot, postId, bundle)

    if (validation.ok) {
      console.log(`✓ ${postId} validated`)
    } else {
      allOk = false
      console.log(`✗ ${postId}:`)
      for (const issue of validation.issues) console.log(`    - ${issue}`)
    }
  }

  if (!allOk) process.exit(1)
  console.log('\nNext: npm run approve')
}

export async function runApprove(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)

  const postIds = flags.post ? [flags.post] : await listPostIds(stagingRoot)
  if (!postIds.length) {
    console.error('No posts in _staging')
    process.exit(1)
  }

  const ctx = await loadSocialContext(projectId, paths)
  let log = await loadCardLog(paths)

  for (const postId of postIds) {
    const bundle = await loadPostBundle(stagingRoot, postId)
    const validation = validatePost(mergePostBundle(bundle), ctx)
    if (!validation.ok) {
      console.error(`${postId} not valid — run validate and fix issues first`)
      process.exit(1)
    }
    bundle.meta.status = 'approved'
    bundle.meta.approved_at = new Date().toISOString()
    await savePostBundle(stagingRoot, postId, bundle)
    console.log(`Approved ${postId}`)

    if (bundle.meta.subject?.card) {
      const card = ctx.cardsBySlug[bundle.meta.subject.card]
      log = appendApprovedCard(log, {
        slug: bundle.meta.subject.card,
        title: card?.title ?? bundle.meta.subject.card,
        domain: bundle.meta.subject?.domain ?? card?.domain,
        staging_id: postId,
        background_asset: bundle.meta.image?.background_asset,
        approved_at: bundle.meta.approved_at,
      })
      console.log(`  → card-log: ${bundle.meta.subject.card}`)
    }
  }

  await saveCardLog(paths, log)
  console.log('\nNext: npm run generate-images')
}
