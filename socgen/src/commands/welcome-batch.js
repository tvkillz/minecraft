import { projectPaths, resolveProjectId } from '../config/paths.js'
import { listPostIds, resolveStagingRoot, parseArgs } from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import { WELCOME_HOOKS } from '../lib/brandAssets.js'
import { createWelcomePost } from '../lib/batchPost.js'

function pickUniqueHooks(count, rng = Math.random) {
  const pool = [...WELCOME_HOOKS]
  const picks = []
  while (picks.length < count && pool.length) {
    const i = Math.floor(rng() * pool.length)
    picks.push(pool.splice(i, 1)[0])
  }
  while (picks.length < count) {
    picks.push(WELCOME_HOOKS[Math.floor(rng() * WELCOME_HOOKS.length)])
  }
  return picks
}

export async function runWelcomeBatch(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const ctx = await loadSocialContext(projectId, paths)

  const count = Math.max(1, Number(flags.count ?? 5))
  const skipImages = Boolean(flags['skip-images'] || flags['copy-only'])
  const hooks = pickUniqueHooks(count)

  let existing = await listPostIds(stagingRoot)
  const created = []

  console.log(`Creating ${count} welcome posts (AI art, no logo)…\n`)

  for (const hook of hooks) {
    const postId = await createWelcomePost({ stagingRoot, existing, ctx, hook, skipImages })
    existing = [...existing, postId]
    created.push(postId)
  }

  console.log(`Done — ${created.length} welcome posts in _staging/`)
  console.log(`  ${created.join(', ')}`)
  if (skipImages) {
    console.log('\nNext: npm run generate-images')
  } else {
    console.log('\nNext: npm run publish -- --post=postN')
  }
}
