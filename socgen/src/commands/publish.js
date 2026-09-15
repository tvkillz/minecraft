import path from 'node:path'
import { rm, cp, readdir } from 'node:fs/promises'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import {
  fileExists,
  resolveStagingRoot,
  resolvePostsRoot,
  listPostIds,
  parseArgs,
} from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import { loadPostBundle } from '../lib/postFiles.js'
import { loadCardLog, saveCardLog, markCardPublished } from '../lib/cardLog.js'

async function copyDir(src, dest) {
  await cp(src, dest, { recursive: true })
}

export async function runPublish(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const postsRoot = await resolvePostsRoot(paths, flags)

  const postIds = flags.post ? [flags.post] : await listPostIds(stagingRoot)
  if (!postIds.length) {
    console.error('Nothing to publish in _staging')
    process.exit(1)
  }

  await loadSocialContext(projectId, paths)
  let log = await loadCardLog(paths)

  for (const postId of postIds) {
    const bundle = await loadPostBundle(stagingRoot, postId)
    const { meta } = bundle

    if (meta.status !== 'rendered' && !flags.force) {
      console.error(`${postId}: status "${meta.status}" — generate-images first (or --force)`)
      process.exit(1)
    }

    const imagePath = path.join(stagingRoot, postId, 'image.png')
    if (!flags.force && !(await fileExists(imagePath))) {
      console.error(`${postId}: missing image.png — run generate-images first`)
      process.exit(1)
    }

    const slug = meta.subject?.card
    const publishedId = slug ?? postId
    const dest = path.join(postsRoot, publishedId)

    if (await fileExists(dest)) {
      console.error(`posts/${publishedId} already exists — remove it or use --force`)
      process.exit(1)
    }

    await copyDir(path.join(stagingRoot, postId), dest)
    await rm(path.join(stagingRoot, postId), { recursive: true, force: true })

    if (slug) {
      log = markCardPublished(log, slug, publishedId)
    }

    console.log(`Published ${postId} → posts/${publishedId}/`)
  }

  await saveCardLog(paths, log)
  console.log('\nDone. Staging folder updated; card-log saved.')
}
