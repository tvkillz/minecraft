import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { projectPaths, resolveProjectId, postJsonPath, postDir } from '../config/paths.js'
import {
  readJsonFile,
  fileExists,
  resolveStagingRoot,
  resolvePostsRoot,
  listPostIds,
  listPublishedIds,
  parseArgs,
} from '../lib/io.js'
import { formatPostText } from '../lib/exportText.js'
import { loadPostBundle } from '../lib/postFiles.js'
import { metaJsonPath } from '../lib/postFiles.js'

export async function runExport(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)

  const fromPublished = Boolean(flags.published || flags.posts)
  const root = fromPublished
    ? await resolvePostsRoot(paths, flags)
    : await resolveStagingRoot(paths, flags)

  const postIds = flags.post
    ? [flags.post]
    : fromPublished
      ? await listPublishedIds(root)
      : await listPostIds(root)

  if (!postIds.length) {
    console.error('No posts to export')
    process.exit(1)
  }

  const exportRoot = path.join(root, 'export')
  await mkdir(exportRoot, { recursive: true })

  for (const postId of postIds) {
    let content
    let meta = { id: postId }
    try {
      const bundle = await loadPostBundle(root, postId)
      content = bundle.content
      meta = bundle.meta
    } catch {
      content = await readJsonFile(postJsonPath(root, postId))
      try {
        meta = await readJsonFile(metaJsonPath(root, postId))
      } catch {
        /* optional */
      }
    }

    const dir = path.join(exportRoot, postId)
    await mkdir(dir, { recursive: true })

    const title = meta.image?.subject_line || meta.template || postId
    const text = formatPostText(content, { postId, title })
    await writeFile(path.join(dir, 'post.txt'), text, 'utf8')
    await writeFile(path.join(postDir(root, postId), 'post.txt'), text, 'utf8')

    const imgSrc = path.join(root, postId, 'image.png')
    if (await fileExists(imgSrc)) {
      await copyFile(imgSrc, path.join(dir, 'image.png'))
    }

    console.log(`Exported ${postId} → ${dir}/post.txt`)
  }

  console.log(`\nExport: ${exportRoot}`)
}
