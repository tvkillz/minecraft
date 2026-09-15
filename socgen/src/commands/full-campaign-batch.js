import { rm, readdir } from 'node:fs/promises'
import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import { listPostIds, resolveStagingRoot, parseArgs } from '../lib/io.js'
import { loadSocialContext } from '../lib/loadSocialContext.js'
import {
  buildDomainPostPlans,
  buildMarketPostPlans,
  DEFAULT_CAMPAIGN_COUNTS,
} from '../lib/campaignPlans.js'
import { WELCOME_HOOKS } from '../lib/brandAssets.js'
import { createCampaignPost, createWelcomePost, createCardPost } from '../lib/batchPost.js'
import { writeContentPlan } from '../lib/contentPlan.js'

function pickUniqueHooks(count) {
  const pool = [...WELCOME_HOOKS]
  const picks = []
  while (picks.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length)
    picks.push(pool.splice(i, 1)[0])
  }
  while (picks.length < count) picks.push(picks[picks.length % WELCOME_HOOKS.length])
  return picks
}

async function cleanStaging(stagingRoot) {
  const entries = await readdir(stagingRoot, { withFileTypes: true })
  for (const ent of entries) {
    if (ent.isDirectory() && /^post\d+$/.test(ent.name)) {
      await rm(path.join(stagingRoot, ent.name), { recursive: true, force: true })
    }
  }
}

export async function runFullCampaignBatch(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const ctx = await loadSocialContext(projectId, paths)

  const skipImages = Boolean(flags['skip-images'] || flags['copy-only'])
  const clean = Boolean(flags.clean || flags['clean-staging'])

  const welcomeCount = Number(flags.welcome ?? DEFAULT_CAMPAIGN_COUNTS.welcome)
  const domainCount = flags.domain != null ? Number(flags.domain) : DEFAULT_CAMPAIGN_COUNTS.domain
  const marketCount = flags.market != null ? Number(flags.market) : DEFAULT_CAMPAIGN_COUNTS.market
  const cardCount = Number(flags.cards ?? flags.card ?? DEFAULT_CAMPAIGN_COUNTS.cards)

  const sections = {
    welcome: !flags['no-welcome'] && welcomeCount > 0,
    domain: !flags['no-domain'] && domainCount > 0,
    market: !flags['no-market'] && marketCount > 0,
    cards: !flags['no-cards'] && cardCount > 0,
  }

  if (flags['test-card']) {
    sections.welcome = false
    sections.domain = false
    sections.market = false
    sections.cards = true
  }

  if (clean) {
    console.log('Cleaning _staging (post* folders)…')
    await cleanStaging(stagingRoot)
  }

  let existing = await listPostIds(stagingRoot)
  const created = { welcome: [], domain: [], market: [], cards: [] }

  const effectiveCards = flags['test-card'] ? 1 : cardCount

  console.log(
    `Full campaign: ${sections.welcome ? welcomeCount : 0} welcome + ` +
      `${sections.domain ? domainCount : 0} domain + ` +
      `${sections.market ? marketCount : 0} market + ` +
      `${sections.cards ? effectiveCards : 0} card posts` +
      `${skipImages ? ' (copy only)' : ''}\n`,
  )

  if (sections.welcome) {
    console.log('--- Welcome posts (AI, no logo) ---\n')
    for (const hook of pickUniqueHooks(welcomeCount)) {
      const postId = await createWelcomePost({ stagingRoot, existing, ctx, hook, skipImages })
      existing = [...existing, postId]
      created.welcome.push(postId)
    }
  }

  if (sections.domain) {
    console.log('--- Domain posts (AI, no logo) ---\n')
    const plans = buildDomainPostPlans(ctx).slice(0, domainCount)
    for (const plan of plans) {
      const postId = await createCampaignPost({ stagingRoot, existing, ctx, plan, skipImages })
      existing = [...existing, postId]
      created.domain.push(postId)
    }
  }

  if (sections.market) {
    console.log('--- Market posts (AI, no logo) ---\n')
    const plans = buildMarketPostPlans(ctx).slice(0, marketCount)
    for (const plan of plans) {
      const postId = await createCampaignPost({ stagingRoot, existing, ctx, plan, skipImages })
      existing = [...existing, postId]
      created.market.push(postId)
    }
  }

  if (sections.cards) {
    console.log('--- Card posts (composite: gamelogo top-left + city + card art) ---\n')
    for (let i = 0; i < effectiveCards; i++) {
      const { postId, card } = await createCardPost({
        stagingRoot,
        existing,
        ctx,
        paths,
        skipImages,
      })
      existing = [...existing, postId]
      created.cards.push({ postId, slug: card.slug, title: card.title })
    }
  }

  const total =
    created.welcome.length +
    created.domain.length +
    created.market.length +
    created.cards.length

  console.log(`Done — ${total} posts in _staging/`)
  if (created.welcome.length) console.log(`  welcome: ${created.welcome.join(', ')}`)
  if (created.domain.length) console.log(`  domain:  ${created.domain.join(', ')}`)
  if (created.market.length) console.log(`  market:  ${created.market.join(', ')}`)
  if (created.cards.length) {
    for (const c of created.cards) {
      console.log(`  card:    ${c.postId} → ${c.title} (${c.slug})`)
    }
  }

  if (skipImages) {
    console.log('\nNext: npm run generate-images')
  } else if (flags['test-card']) {
    console.log('\nReview the test card image, then run:')
    console.log('  npm run full-campaign -- --clean --no-cards --cards=12')
    console.log('  (or npm run full-campaign -- --clean  for everything including 12 cards)')
  } else {
    console.log('\nNext: npm run publish -- --post=postN')
  }

  const planPath = await writeContentPlan(stagingRoot, { siteUrl: ctx.socialgen.siteUrl })
  console.log(`\nContent plan: ${planPath}`)
}

export async function runTestCard(argv) {
  const args = [...argv]
  if (!args.some((a) => a.startsWith('--test-card'))) args.unshift('--test-card')
  return runFullCampaignBatch(args)
}
