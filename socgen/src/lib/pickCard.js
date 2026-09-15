import { loadCardLog, loggedCardSlugs } from './cardLog.js'

/**
 * Pick a random card slug not yet approved or in staging.
 * @param {object} ctx — loadSocialContext
 * @param {object} opts
 * @param {string} [opts.domain] — filter by domain id
 * @param {Set<string>} [opts.excludeSlugs]
 */
export function pickRandomCard(ctx, { domain = null, excludeSlugs = new Set() } = {}) {
  let pool = ctx.cards.filter((c) => c.slug && c.path)
  if (domain) pool = pool.filter((c) => c.domain === domain)
  pool = pool.filter((c) => !excludeSlugs.has(c.slug))

  if (!pool.length) {
    const hint = domain ? ` for domain "${domain}"` : ''
    throw new Error(
      `No available cards${hint} — all are in card-log or staging. Reset card-log or publish staging posts.`,
    )
  }

  const card = pool[Math.floor(Math.random() * pool.length)]
  return card
}

export async function pickRandomCardWithLog(ctx, paths, { domain = null, stagingSlugs = [] } = {}) {
  const log = await loadCardLog(paths)
  const exclude = loggedCardSlugs(log, { includeStaging: true, stagingSlugs })
  return pickRandomCard(ctx, { domain, excludeSlugs: exclude })
}

export function defaultCardBrief(card, ctx) {
  const domainMeta = ctx.cardgen.domainById[card.domain]
  const label = domainMeta?.label ?? card.domain
  return `Spotlight ${card.title} — ${card.role ?? 'unit'} from the ${label} realm. Highlight ability: ${card.ability?.name ?? 'signature power'}.`
}
