import { priceFromCard, loadEconomy } from './cardEconomy.js'
import { resolveRarityFromMana } from './rarity.js'

const SLUG_RE = /^[a-z][a-z0-9]*_card_\d{2}_[a-z0-9_]+$/

/**
 * @param {object} card
 * @param {object} ctx
 * @param {Set<string>} batchSlugs
 * @param {Set<string>} batchTitles
 */
function validateOneCard(card, ctx, batchSlugs, batchTitles) {
  const issues = []
  const { domainIds, keywordsGlossary, existingSlugs, existingTitles } = ctx
  const maxKw = ctx.cardgen?.generation?.maxKeywordsPerCard ?? 2

  if (!card.title?.trim()) issues.push('missing title')
  if (!card.slug?.trim()) issues.push('missing slug')
  if (!SLUG_RE.test(card.slug ?? '')) {
    issues.push(`slug "${card.slug}" must match {domain}_card_{NN}_{snake_case}`)
  }
  if (!card.domain || !domainIds.includes(card.domain)) {
    issues.push(`domain "${card.domain}" not in domains.json`)
  }
  if (card.slug && card.domain && !card.slug.startsWith(`${card.domain}_card_`)) {
    issues.push(`slug domain prefix does not match domain "${card.domain}"`)
  }

  const titleKey = card.title?.toLowerCase()
  if (existingTitles.has(titleKey)) issues.push(`title "${card.title}" already in cards.json`)
  if (batchTitles.has(titleKey)) issues.push(`duplicate title in batch: "${card.title}"`)
  if (existingSlugs.has(card.slug)) issues.push(`slug "${card.slug}" already in cards.json`)
  if (batchSlugs.has(card.slug)) issues.push(`duplicate slug in batch: "${card.slug}"`)

  const { mana, attack, health } = card.stats ?? {}
  for (const [k, v] of Object.entries({ mana, attack, health })) {
    if (!Number.isInteger(v) || v < 0) issues.push(`stats.${k} must be a non-negative integer`)
  }
  if (Number.isInteger(mana) && (mana < 1 || mana > 10)) {
    issues.push(`mana ${mana} outside recommended range 1–10`)
  }
  if (Number.isInteger(attack) && Number.isInteger(health) && Number.isInteger(mana)) {
    const total = attack + health
    const min = mana * 1.0
    const max = mana * 2.5
    if (total < min || total > max) {
      issues.push(`attack+health (${total}) unusual for mana ${mana} (expected ~${min}–${max})`)
    }
  }

  if (!Array.isArray(card.keywords)) {
    issues.push('keywords must be an array')
  } else {
    if (card.keywords.length > maxKw) issues.push(`more than ${maxKw} keywords`)
    for (const kw of card.keywords) {
      if (!keywordsGlossary[kw]) issues.push(`unknown keyword "${kw}"`)
    }
  }

  if (!card.ability?.name?.trim()) issues.push('ability.name missing')
  if (!card.ability?.text?.trim()) issues.push('ability.text missing')
  if (!card.image_prompt?.trim()) issues.push('image_prompt missing')
  if (!card.image_notes?.trim()) issues.push('image_notes missing')

  return issues
}

/** @param {object[]} cards @param {object} ctx */
export function validateCardBatch(cards, ctx) {
  const batchSlugs = new Set()
  const batchTitles = new Set()
  const results = []

  for (const card of cards) {
    const issues = validateOneCard(card, ctx, batchSlugs, batchTitles)
    batchSlugs.add(card.slug)
    batchTitles.add(card.title?.toLowerCase())
    results.push({ slug: card.slug, title: card.title, issues, ok: issues.length === 0 })
  }

  const ok = results.every((r) => r.ok)
  return { ok, results, errorCount: results.filter((r) => !r.ok).length }
}

/** Normalize a draft card into cards.json shape (without merging). */
export function toCardsJsonEntry(card, ctx) {
  const slug = card.slug
  const domain = card.domain
  const mana = card.stats?.mana
  const rarity =
    card.rarity ?? resolveRarityFromMana(mana, ctx?.raritiesJson)
  const economy = loadEconomy()
  return {
    title: card.title,
    slug,
    category: 'cards',
    domain,
    kind: 'card',
    role: card.role,
    rarity,
    stats: { ...card.stats },
    keywords: card.keywords ?? [],
    ability: { name: card.ability.name, text: card.ability.text },
    path: `cards/${domain}/${slug}.png`,
    priceCents: card.priceCents ?? priceFromCard(card, rarity, economy),
    source_file: '',
    format: '3:4',
    notes: card.image_notes ?? '',
    image_prompt: card.image_prompt ?? '',
  }
}
