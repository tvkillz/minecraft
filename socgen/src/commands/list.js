import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import {
  readJsonFile,
  fileExists,
  resolveStagingRoot,
  resolvePostsRoot,
  listPostIds,
  listPublishedIds,
  parseArgs,
} from '../lib/io.js'
import { metaJsonPath } from '../lib/postFiles.js'
import { loadCardLog } from '../lib/cardLog.js'

export async function runList(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)

  const stagingRoot = await resolveStagingRoot(paths, flags)
  const postsRoot = await resolvePostsRoot(paths, flags)
  const log = await loadCardLog(paths)

  console.log(`\n_staging/ (${stagingRoot})`)
  const stagingIds = await listPostIds(stagingRoot)
  if (!stagingIds.length) console.log('  (empty)')
  for (const postId of stagingIds) {
    let meta = {}
    try {
      meta = await readJsonFile(metaJsonPath(stagingRoot, postId))
    } catch {
      meta = { status: '?' }
    }
    const hasImg = await fileExists(path.join(stagingRoot, postId, 'image.png'))
    const card = meta.subject?.card ? ` card=${meta.subject.card}` : ''
    console.log(
      `  ${postId}  status=${meta.status ?? '?'}  template=${meta.template ?? '?'}  image=${hasImg ? 'yes' : 'no'}${card}`,
    )
  }

  console.log(`\nposts/ (${postsRoot})`)
  const publishedIds = await listPublishedIds(postsRoot)
  if (!publishedIds.length) console.log('  (empty)')
  for (const id of publishedIds) {
    if (id === 'export') continue
    const hasImg = await fileExists(path.join(postsRoot, id, 'image.png'))
    console.log(`  ${id}  image=${hasImg ? 'yes' : 'no'}`)
  }

  console.log(`\ncard-log: ${log.approved.length} approved card(s)`)
  for (const row of log.approved.slice(-8)) {
    const pub = row.published_id ? ` → posts/${row.published_id}` : ' (staging)'
    console.log(`  ${row.slug}${pub}`)
  }
}
