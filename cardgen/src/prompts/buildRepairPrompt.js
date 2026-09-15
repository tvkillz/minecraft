const TITLE_SLUG_ISSUE_RE =
  /title .*already in cards\.json|duplicate title in batch|slug .*already in cards\.json|duplicate slug in batch/

/** @param {string} issue */
export function isTitleOrSlugConflict(issue) {
  return TITLE_SLUG_ISSUE_RE.test(issue)
}

/**
 * @param {object} validation — from validateCardBatch
 * @returns {Set<string>} slugs that need title/slug repair
 */
export function slugsNeedingTitleRepair(validation) {
  const slugs = new Set()
  for (const r of validation.results) {
    if (r.ok) continue
    if (r.issues.some(isTitleOrSlugConflict)) {
      slugs.add(r.slug)
    }
  }
  return slugs
}

/**
 * @param {object[]} cards
 * @param {Set<string>} slugSet
 * @param {object} ctx
 */
export function buildTitleRepairPrompt(cards, slugSet, ctx) {
  const { cardgen } = ctx
  const targets = cards.filter((c) => slugSet.has(c.slug))
  const reservedTitles = [...ctx.existingTitles].slice(0, 80)
  const reservedSlugs = [...ctx.existingSlugs].slice(0, 80)
  const batchTitles = cards.map((c) => c.title).filter(Boolean)

  const cardBlocks = targets
    .map(
      (c) =>
        `- slug: ${c.slug}
  domain: ${c.domain}
  current_title: ${c.title}
  role: ${c.role}
  ability: ${c.ability?.name} — ${c.ability?.text}
  stats: mana ${c.stats?.mana} / atk ${c.stats?.attack} / hp ${c.stats?.health}`,
    )
    .join('\n')

  return `You are fixing validation conflicts for ${cardgen.gameTitle} TCG card drafts.

Some titles or slugs collide with the existing catalog or with other cards in the same batch.
Generate fresh, unique replacement titles for ONLY the cards listed below.

Rules:
- Each new title must be unique vs the catalog and vs other cards in this batch.
- Keep the same domain, stats, keywords, and ability effect text — only rename identity (title, ability name if it echoes the old title, image subject if needed).
- Titles should fit ${cardgen.gamePitch}
- Do NOT reuse these existing titles: ${reservedTitles.join(', ') || '(none)'}
- Do NOT reuse these slugs: ${reservedSlugs.join(', ') || '(none)'}
- Other titles in this batch (avoid duplicates): ${batchTitles.join(', ')}

Cards to fix:
${cardBlocks}

Return JSON: { "repairs": [ { "slug": "<original slug>", "title": "<new title>", "ability_name": "<optional>", "image_prompt": "<optional if visual subject renamed>" } ] }`
}
