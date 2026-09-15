import path from 'node:path'
import { writeFile } from 'node:fs/promises'
import { ensureDir, nextPostId, stagingCardSlugs } from './io.js'
import { postImagePath, postDir } from '../config/paths.js'
import { generatePostContent, assemblePostBundle } from './generatePostText.js'
import { validatePost, applyValidationMeta } from './validatePost.js'
import { savePostBundle, mergePostBundle, defaultMeta } from './postFiles.js'
import { writePostTextFile } from './writePostText.js'
import { renderPostImage } from './renderImage.js'
import { pickRandomCityAny } from './cityBackground.js'
import { pickRandomHook } from './brandAssets.js'
import { cityForDomainAt, domainAssetPath } from './campaignPlans.js'
import { pickRandomCardWithLog, defaultCardBrief } from './pickCard.js'
import { pickCityForCard } from './cityBackground.js'

function welcomeBrief(hook, city, ctx) {
  const site = ctx.socialgen.siteUrl ?? 'https://voidborn.fun'
  return (
    `Welcome post for VOIDBORN dark fantasy online TCG. Hook headline: "${hook}". ` +
    `Realm atmosphere: ${city.title} (${city.domain}). ` +
    `Introduce four elemental realms, deck building, tactical battles, ranked play. Free to start at ${site}. ` +
    `Instagram punchy + hashtags; Facebook longer story; Discord markdown feature list + play link.`
  )
}

function assemblePromoBundle({ postId, plan, cityPick, generated, ctx, refs }) {
  const { content, model } = generated
  const template =
    plan.kind === 'domain'
      ? 'domain-spotlight'
      : plan.kind === 'market'
        ? 'market-portal'
        : plan.kind === 'welcome'
          ? 'welcome'
          : 'general'

  const meta = defaultMeta({
    postId,
    brief: plan.brief,
    template,
    card: null,
    domain: plan.domain ?? cityPick?.domain ?? null,
    imageMode: 'gemini',
    imageDraft: {
      prompt: content.image?.prompt ?? '',
      reference_assets: refs,
      subject_line: plan.headline,
      background_asset: cityPick?.path ?? plan.refAsset ?? null,
      background_title: cityPick?.title ?? null,
      use_brand_reference: false,
    },
  })
  meta.model = model
  meta.status = 'approved'
  meta.approved_at = new Date().toISOString()
  if (plan.kind) {
    meta.campaign = { kind: plan.kind, angle: plan.angle ?? null, domain: plan.domain ?? null }
  }

  return {
    content: {
      instagram: content.instagram,
      facebook: content.facebook,
      discord: content.discord,
    },
    meta,
  }
}

function promoRefsForPlan(plan, cityPick) {
  const refs = []
  if (plan.kind === 'domain') {
    const domainArt = domainAssetPath(plan.domain)
    if (domainArt) refs.push(domainArt)
    if (cityPick) refs.push(cityPick.path)
  } else if (plan.kind === 'market' && plan.refAsset) {
    refs.push(plan.refAsset)
  } else if (plan.kind === 'welcome' && cityPick) {
    refs.push(cityPick.path)
  }
  return refs
}

async function saveAndMaybeRender({
  stagingRoot,
  postId,
  content,
  meta,
  ctx,
  card,
  skipImages,
  imageMode = 'gemini',
}) {
  const validation = validatePost(mergePostBundle({ content, meta }), ctx)
  applyValidationMeta(meta, validation)
  if (!validation.ok) {
    console.warn('  Validation issues:')
    for (const issue of validation.issues) console.warn(`    - ${issue}`)
  }

  await savePostBundle(stagingRoot, postId, { content, meta })
  await writePostTextFile(postDir(stagingRoot, postId), content, meta)
  console.log('  ✓ post.json, meta.json, post.txt')

  if (!skipImages) {
    console.log(`  Rendering image (mode=${imageMode})…`)
    const post = mergePostBundle({ content, meta })
    const { buffer, modeUsed } = await renderPostImage({ post, ctx, card, mode: imageMode })
    await writeFile(postImagePath(stagingRoot, postId), buffer)
    meta.image.rendered_at = new Date().toISOString()
    meta.image.render_mode_used = modeUsed
    meta.status = 'rendered'
    await savePostBundle(stagingRoot, postId, { content, meta })
    console.log(`  ✓ image.png (${modeUsed})`)
  }

  console.log('')
}

/**
 * Promo post — AI art, NO logo in image (city/domain/CTA refs only).
 */
export async function createCampaignPost({ stagingRoot, existing, ctx, plan, skipImages = false }) {
  const postId = nextPostId(existing)
  await ensureDir(path.join(stagingRoot, postId))

  let cityPick = null
  if (plan.kind === 'domain') {
    cityPick = cityForDomainAt(ctx.scenes, plan.domain, plan.cityIndex)
  } else if (plan.kind === 'welcome') {
    cityPick = pickRandomCityAny(ctx.scenes)
  }

  const label =
    plan.kind === 'domain'
      ? `${ctx.cardgen.domainById[plan.domain]?.label ?? plan.domain} (${plan.angle})`
      : plan.kind === 'welcome'
        ? `Welcome — ${plan.headline}`
        : `Market — ${plan.angle}`

  console.log(`${postId}: ${label}${cityPick ? ` — ${cityPick.title}` : ''}`)

  const generated = await generatePostContent({
    brief: plan.brief,
    template:
      plan.kind === 'domain' ? 'domain-spotlight' : plan.kind === 'market' ? 'market-portal' : 'welcome',
    card: null,
    domain: plan.domain ?? cityPick?.domain ?? null,
    ctx,
  })

  const { content, meta } = assemblePromoBundle({
    postId,
    plan,
    cityPick,
    generated,
    ctx,
    refs: promoRefsForPlan(plan, cityPick),
  })

  await saveAndMaybeRender({
    stagingRoot,
    postId,
    content,
    meta,
    ctx,
    card: null,
    skipImages,
    imageMode: 'gemini',
  })

  return postId
}

export async function createWelcomePost({ stagingRoot, existing, ctx, hook, skipImages = false }) {
  const cityPick = pickRandomCityAny(ctx.scenes)
  if (!cityPick) throw new Error('No city scenes in game/scenes.json')

  const plan = {
    kind: 'welcome',
    headline: hook.toUpperCase(),
    brief: welcomeBrief(hook, cityPick, ctx),
  }
  return createCampaignPost({ stagingRoot, existing, ctx, plan, skipImages })
}

/**
 * Card post — sharp composite: gamelogo top-left + random realm city bg + full card art.
 */
export async function createCardPost({
  stagingRoot,
  existing,
  ctx,
  paths,
  skipImages = false,
  card = null,
}) {
  const postId = nextPostId(existing)
  await ensureDir(path.join(stagingRoot, postId))

  const stagingSlugs = await stagingCardSlugs(stagingRoot)
  if (!card) {
    card = await pickRandomCardWithLog(ctx, paths, { stagingSlugs })
  }

  const cityPick = pickCityForCard(ctx, card)
  const brief = defaultCardBrief(card, ctx)
  const domainLabel = ctx.cardgen.domainById[card.domain]?.label ?? card.domain

  console.log(`${postId}: ${card.title} (${card.slug})`)
  console.log(`  domain: ${domainLabel}`)
  if (cityPick) console.log(`  city bg: ${cityPick.title} (${cityPick.path})`)

  const generated = await generatePostContent({
    brief,
    template: 'card-spotlight',
    card,
    domain: card.domain,
    ctx,
  })

  let { content, meta } = assemblePostBundle({
    postId,
    brief,
    template: 'card-spotlight',
    card,
    domain: card.domain,
    generated,
    imageMode: 'composite',
    ctx,
    cityPick,
  })
  meta.status = 'approved'
  meta.approved_at = new Date().toISOString()
  meta.campaign = { kind: 'card', angle: null, domain: card.domain, card: card.slug }

  await saveAndMaybeRender({
    stagingRoot,
    postId,
    content,
    meta,
    ctx,
    card,
    skipImages,
    imageMode: 'composite',
  })

  return { postId, card }
}
