import path from 'node:path'
import { projectPaths, resolveProjectId } from '../config/paths.js'
import {
  ensureDir,
  writeJsonFile,
  readJsonFile,
  listPostIds,
  nextPostId,
  resolveStagingRoot,
  stagingCardSlugs,
  parseArgs,
} from '../lib/io.js'
import { loadSocialContext, resolveCard } from '../lib/loadSocialContext.js'
import { generatePostContent, assemblePostBundle } from '../lib/generatePostText.js'
import { validatePost, applyValidationMeta } from '../lib/validatePost.js'
import { savePostBundle, mergePostBundle } from '../lib/postFiles.js'
import { writePostTextFile } from '../lib/writePostText.js'
import { postDir } from '../config/paths.js'
import { pickRandomCardWithLog, defaultCardBrief } from '../lib/pickCard.js'
import { pickCityForCard } from '../lib/cityBackground.js'

export async function runAddPost(argv) {
  const { flags } = parseArgs(argv)
  const projectId = flags.project || resolveProjectId(['node', 'cli', ...argv])
  const paths = projectPaths(projectId)
  const stagingRoot = await resolveStagingRoot(paths, flags)
  const ctx = await loadSocialContext(projectId, paths)

  const randomCard =
    flags['random-card'] ||
    flags.card === 'random' ||
    flags.card === 'pick'

  let card = null
  let domain = flags.domain || null

  if (randomCard) {
    const stagingSlugs = await stagingCardSlugs(stagingRoot)
    card = await pickRandomCardWithLog(ctx, paths, { domain, stagingSlugs })
    domain = card.domain
    console.log(`Random card: ${card.title} (${card.slug})`)
  } else if (flags.card) {
    card = resolveCard(ctx, flags.card)
    domain = card.domain
  }

  let brief = flags.brief || flags.topic
  if (!brief?.trim()) {
    if (card) brief = defaultCardBrief(card, ctx)
    else {
      console.error(
        'Usage: npm run add-post -- --brief="..." [--random-card] [--card=slug] [--domain=kronos] [--template=...]',
      )
      process.exit(1)
    }
  }

  const template = flags.template || (card ? 'card-spotlight' : domain ? 'domain-spotlight' : 'general')
  const imageMode = flags['image-mode'] || (card ? 'composite' : ctx.socialgen.image.defaultMode)
  const cityPick = card ? pickCityForCard(ctx, card) : null
  if (cityPick) {
    console.log(`City background: ${cityPick.title} (${cityPick.path})`)
  }

  const existing = await listPostIds(stagingRoot)
  const postId = flags.post || nextPostId(existing)
  await ensureDir(path.join(stagingRoot, postId))

  console.log(`Generating copy for ${postId} (${template})…`)
  const generated = await generatePostContent({ brief, template, card, domain, ctx })
  let { content, meta } = assemblePostBundle({
    postId,
    brief,
    template,
    card,
    domain,
    generated,
    imageMode,
    ctx,
    cityPick,
  })

  const validation = validatePost(mergePostBundle({ content, meta }), ctx)
  applyValidationMeta(meta, validation)
  if (!validation.ok) {
    console.warn('Validation issues (edit post.json / meta.json or adjust brief):')
    for (const issue of validation.issues) console.warn(`  - ${issue}`)
  }

  await savePostBundle(stagingRoot, postId, { content, meta })
  await writePostTextFile(postDir(stagingRoot, postId), content, meta)

  console.log(`Wrote _staging/${postId}/post.json + meta.json + post.txt`)
  console.log(`Status: ${meta.status}`)
  if (meta.status === 'validated') {
    console.log(`Next: npm run approve -- --post=${postId}`)
  } else {
    console.log(`Next: npm run validate -- --post=${postId}`)
  }
}
