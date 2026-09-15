import { cityScenesForDomain } from './cityBackground.js'

/** @typedef {'lore'|'playstyle'} DomainAngle */

const DOMAIN_ASSET = {
  kronos: 'domains/terra_domain.png',
  thalassa: 'domains/aqua_domain.png',
  infernus: 'domains/ignis_domain.png',
  anemos: 'domains/zephyr_domain.png',
}

const DOMAIN_ORDER = ['kronos', 'thalassa', 'infernus', 'anemos']

const MARKET_FEATURE_IDS = [
  'buy-cards',
  'sell-cards',
  'expand-collection',
  'sealed-vaults',
  'discover-rare',
]

export function domainAssetPath(domainId) {
  return DOMAIN_ASSET[domainId] ?? null
}

export function cityForDomainAt(scenesJson, domainId, index = 0) {
  const cities = cityScenesForDomain(scenesJson, domainId)
  if (!cities.length) return null
  const pick = cities[index % cities.length]
  return { path: pick.path, title: pick.title, slug: pick.slug, domain: pick.domain }
}

export function buildDomainPostPlans(ctx) {
  const site = ctx.socialgen.siteUrl ?? 'https://voidborn.fun'
  const plans = []

  for (const domainId of DOMAIN_ORDER) {
    const meta = ctx.cardgen.domainById[domainId]
    const label = meta?.label ?? domainId
    const visual = meta?.visualIdentity ?? ''
    const flavor = meta?.flavorNotes ?? ''

    plans.push({
      kind: 'domain',
      domain: domainId,
      angle: 'lore',
      cityIndex: 0,
      headline: `${label.toUpperCase()} — REALM OF THE VOID`,
      brief:
        `Domain spotlight (lore intro) for the ${label} realm in VOIDBORN. ` +
        `Visual identity: ${visual}. Lore themes: ${flavor}. ` +
        `Describe the realm's culture, bastions, and role in the war against the Aether Bleed / Void corruption. ` +
        `Tease iconic units and the feeling of playing ${label} decks. City backdrop sets the mood. ` +
        `Instagram punchy + hashtags including #${label}; Facebook epic lore story + community question; Discord markdown realm guide + play link ${site}.`,
    })

    plans.push({
      kind: 'domain',
      domain: domainId,
      angle: 'playstyle',
      cityIndex: 1,
      headline: `${label.toUpperCase()} — DECK IDENTITY`,
      brief:
        `Domain spotlight (playstyle / strategy) for the ${label} realm in VOIDBORN. ` +
        `Explain how ${label} decks win: unit roles (${flavor}), curve tips, synergies, and when to pick this realm for ranked. ` +
        `Visual identity: ${visual}. Practical TCG advice without inventing fake card names — speak in archetypes (tanks, burn, flying, etc.). ` +
        `Instagram hooks players who main ${label}; Facebook longer strategy discussion; Discord bullet tips + [Play VOIDBORN](${site}).`,
    })
  }

  return plans
}

export function buildMarketPostPlans(ctx) {
  const site = ctx.socialgen.siteUrl ?? 'https://voidborn.fun'
  const pathways = ctx.pathways ?? {}
  const marketCta = pathways.marketCta?.description ?? 'Thousands of listings live right now.'
  const features = pathways.features ?? []

  const plans = []
  for (const id of MARKET_FEATURE_IDS) {
    const feature = features.find((f) => f.id === id)
    if (!feature) continue

    const angle = id.replace(/-cards$/, '').replace(/-/g, '_')
    const headline = (feature.title ?? id).toUpperCase()

    let briefExtra = ''
    if (id === 'buy-cards') {
      briefExtra =
        `${marketCta} Explain: log in → Portal → Market tab → browse player listings and catalog, filter by domain/rarity, buy with credits. `
    } else if (id === 'sell-cards') {
      briefExtra =
        `Explain: open Collection → pick a card → create listing at min price (based on market value), earn credits when another player buys, cancel anytime. `
    } else if (id === 'expand-collection') {
      briefExtra = `Explain growing your collection through packs, market buys, and seasonal drops to widen deck options. `
    } else if (id === 'sealed-vaults') {
      briefExtra = `Explain sealed products / vault pulls — rip packs, chase spikes, trade surplus on the market. `
    } else if (id === 'discover-rare') {
      briefExtra = `Explain hunting foils, epics, and chase prints that rewrite a deck overnight. `
    }

    plans.push({
      kind: 'market',
      angle,
      headline,
      refAsset: feature.image ?? `cta1/${id}.webp`,
      brief:
        `Market / Portal feature post for VOIDBORN — "${feature.title}". ` +
        `${feature.description ?? ''} ${briefExtra}` +
        `In-game credits economy (no real-money P2P). Instagram hype + link in bio; Facebook walkthrough; Discord steps + ${site}.`,
    })
  }

  return plans
}

export function allRealmMarketPlans(ctx) {
  return [...buildDomainPostPlans(ctx), ...buildMarketPostPlans(ctx)]
}

export const DEFAULT_CAMPAIGN_COUNTS = {
  welcome: 5,
  domain: 8,
  market: 5,
  cards: 12,
}
