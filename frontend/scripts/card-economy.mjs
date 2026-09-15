import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ECONOMY_PATH = path.join(__dirname, 'card-economy.json')

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary']

let economyCache = null

export function loadEconomy() {
  if (!economyCache) {
    economyCache = JSON.parse(readFileSync(ECONOMY_PATH, 'utf8'))
  }
  return economyCache
}

/** @param {number} n @param {Record<string, number>} weights */
export function splitCountByWeights(n, weights = loadEconomy().rarityWeights) {
  const tiers = RARITY_ORDER
  const entries = tiers.map((tier) => ({
    tier,
    exact: n * (weights[tier] ?? 0),
  }))

  const floors = entries.map((e) => ({
    tier: e.tier,
    count: Math.floor(e.exact),
    rem: e.exact - Math.floor(e.exact),
  }))

  let assigned = floors.reduce((sum, f) => sum + f.count, 0)
  let remaining = n - assigned

  const byRemainder = [...floors].sort((a, b) => b.rem - a.rem)
  for (let i = 0; remaining > 0; i += 1, remaining -= 1) {
    byRemainder[i % byRemainder.length].count += 1
  }

  return Object.fromEntries(floors.map((f) => [f.tier, f.count]))
}

/**
 * @param {{ stats?: { mana?: number, attack?: number, health?: number }, keywords?: string[] }} card
 * @param {ReturnType<typeof loadEconomy>} [economy]
 */
export function computeRawValue(card, economy = loadEconomy()) {
  const { unitPrices, keywordWeights } = economy
  const stats = card.stats ?? {}
  const keywords = card.keywords ?? []

  let keywordCost = 0
  for (const kw of keywords) {
    const weight = keywordWeights[kw] ?? 1
    keywordCost += unitPrices.keyword * weight
  }

  return (
    (stats.mana ?? 0) * unitPrices.mana +
    (stats.attack ?? 0) * unitPrices.attack +
    (stats.health ?? 0) * unitPrices.health +
    keywordCost +
    unitPrices.abilityBase
  )
}

/**
 * @param {{ stats?: object, keywords?: string[] }} card
 * @param {string} rarity
 * @param {ReturnType<typeof loadEconomy>} [economy]
 */
export function priceFromCard(card, rarity, economy = loadEconomy()) {
  const raw = Math.round(computeRawValue(card, economy))
  if (!economy.clampPriceToRarityBand) return raw

  const band = economy.priceBands[rarity]
  if (!band || band.length < 2) return raw
  return Math.max(band[0], Math.min(band[1], raw))
}

/**
 * Assign rarity (by stat value rank) and priceCents on each card in place.
 * @param {object[]} cards
 * @param {ReturnType<typeof loadEconomy>} [economy]
 * @param {{ groupBy?: 'domain' | 'all' }} [options]
 */
export function assignRarityByQuota(cards, economy = loadEconomy(), options = {}) {
  const groupBy = options.groupBy ?? 'domain'
  const groups = new Map()

  for (const card of cards) {
    const key = groupBy === 'domain' ? (card.domain ?? '_unknown') : '_all'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(card)
  }

  for (const group of groups.values()) {
    const scored = group.map((card) => ({
      card,
      raw: computeRawValue(card, economy),
    }))
    scored.sort(
      (a, b) => a.raw - b.raw || String(a.card.slug ?? '').localeCompare(String(b.card.slug ?? '')),
    )

    const counts = splitCountByWeights(scored.length, economy.rarityWeights)
    let index = 0

    for (const tier of RARITY_ORDER) {
      const tierCount = counts[tier] ?? 0
      for (let i = 0; i < tierCount && index < scored.length; i += 1, index += 1) {
        const { card } = scored[index]
        card.rarity = tier
        card.priceCents = priceFromCard(card, tier, economy)
      }
    }

    while (index < scored.length) {
      const tier = RARITY_ORDER[RARITY_ORDER.length - 1]
      const { card } = scored[index]
      card.rarity = tier
      card.priceCents = priceFromCard(card, tier, economy)
      index += 1
    }
  }

  return cards
}

/** Roll rarities for a new batch (same proportions as site-wide weights). */
export function rollRarityBatch(count, economy = loadEconomy()) {
  const counts = splitCountByWeights(count, economy.rarityWeights)
  const rolled = []
  for (const tier of RARITY_ORDER) {
    for (let i = 0; i < (counts[tier] ?? 0); i += 1) rolled.push(tier)
  }
  while (rolled.length < count) rolled.push(RARITY_ORDER[RARITY_ORDER.length - 1])
  return rolled.slice(0, count)
}

/** Format economy bands for cardgen prompts. */
export function formatEconomyPromptSection(economy = loadEconomy()) {
  const { unitPrices, priceBands } = economy
  const bands = RARITY_ORDER.map(
    (tier) => `- ${tier}: ${priceBands[tier][0]}–${priceBands[tier][1]} credits`,
  ).join('\n')

  return `## Market economy (all projects)
Unit value: mana×${unitPrices.mana} + attack×${unitPrices.attack} + health×${unitPrices.health} + keyword×${unitPrices.keyword} (×weight) + ${unitPrices.abilityBase} ability base.
Target price bands by rarity:
${bands}
Pick stats so the card's computed value fits the assigned rarity band.`
}
