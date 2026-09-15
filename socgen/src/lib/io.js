import { mkdir, readFile, writeFile, readdir, access } from 'node:fs/promises'
import path from 'node:path'

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

export async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

export async function writeJsonFile(filePath, data) {
  await ensureDir(path.dirname(filePath))
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

export async function fileExists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

export function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq === -1) {
        flags[arg.slice(2)] = true
      } else {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1)
      }
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

export async function listPostIds(root) {
  try {
    const names = await readdir(root)
    return names
      .filter((n) => /^post\d+$/.test(n))
      .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
  } catch {
    return []
  }
}

export async function listPublishedIds(postsRoot) {
  try {
    const names = await readdir(postsRoot)
    return names.filter((n) => !n.startsWith('.')).sort()
  } catch {
    return []
  }
}

export function nextPostId(existingIds) {
  const nums = existingIds.map((id) => Number(id.slice(4)))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `post${next}`
}

/** WIP posts live directly under social/_staging/postN/ */
export async function resolveStagingRoot(paths, flags = {}) {
  if (flags['staging-dir']) return path.resolve(flags['staging-dir'])
  await ensureDir(paths.socialStaging)
  return paths.socialStaging
}

/** Published posts under social/posts/ */
export async function resolvePostsRoot(paths, flags = {}) {
  if (flags['posts-dir']) return path.resolve(flags['posts-dir'])
  await ensureDir(paths.socialPosts)
  return paths.socialPosts
}

/** @deprecated use resolveStagingRoot */
export async function resolveCampaignRoot(paths, flags) {
  return resolveStagingRoot(paths, flags)
}

export async function stagingCardSlugs(stagingRoot) {
  const ids = await listPostIds(stagingRoot)
  const slugs = []
  for (const id of ids) {
    try {
      const meta = await readJsonFile(path.join(stagingRoot, id, 'meta.json'))
      if (meta.subject?.card) slugs.push(meta.subject.card)
    } catch {
      /* skip */
    }
  }
  return slugs
}
