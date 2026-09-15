import { projectPaths, resolveProjectId } from '../config/paths.js'
import { listPostIds, resolveStagingRoot, parseArgs } from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import { allRealmMarketPlans } from '../lib/campaignPlans.js'
import { createCampaignPost } from '../lib/batchPost.js'

export async function runRealmMarketBatch(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const ctx = await loadSocialContext(projectId, paths)

  const skipImages = Boolean(flags['skip-images'] || flags['copy-only'])
  const domainsOnly = Boolean(flags.domains || flags['domains-only'])
  const marketOnly = Boolean(flags.market || flags['market-only'])

  let plans = allRealmMarketPlans(ctx)
  if (domainsOnly) plans = plans.filter((p) => p.kind === 'domain')
  if (marketOnly) plans = plans.filter((p) => p.kind === 'market')

  let existing = await listPostIds(stagingRoot)
  const created = []

  const domainCount = plans.filter((p) => p.kind === 'domain').length
  const marketCount = plans.filter((p) => p.kind === 'market').length

  console.log(
    `Creating ${plans.length} posts (${domainCount} domain + ${marketCount} market)…\n`,
  )

  for (const plan of plans) {
    const postId = await createCampaignPost({
      stagingRoot,
      existing,
      ctx,
      plan,
      skipImages,
    })
    existing = [...existing, postId]
    created.push(postId)
  }

  console.log(`Done — ${created.length} posts in _staging/`)
  console.log(`  ${created.join(', ')}`)
  if (skipImages) {
    console.log('\nNext: npm run generate-images')
  } else {
    console.log('\nNext: npm run publish -- --post=postN')
  }
}
