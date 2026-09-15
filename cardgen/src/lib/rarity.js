const DEFAULT_TIERS = [
  { id: 'common', manaMin: 1, manaMax: 2 },
  { id: 'uncommon', manaMin: 3, manaMax: 4 },
  { id: 'rare', manaMin: 5, manaMax: 6 },
  { id: 'epic', manaMin: 7, manaMax: 8 },
  { id: 'legendary', manaMin: 9, manaMax: 10 },
]

/** @param {number} mana @param {{ tiers?: { id: string, manaMin: number, manaMax: number }[] } | null} raritiesJson */
export function resolveRarityFromMana(mana, raritiesJson) {
  const tiers = raritiesJson?.tiers?.length ? raritiesJson.tiers : DEFAULT_TIERS
  const tier = tiers.find((t) => mana >= t.manaMin && mana <= t.manaMax)
  return tier?.id ?? 'common'
}

/** @param {{ tiers?: { id: string, label?: string }[] } | null} raritiesJson */
export function rarityLabelsById(raritiesJson) {
  const tiers = raritiesJson?.tiers?.length ? raritiesJson.tiers : DEFAULT_TIERS
  return Object.fromEntries(
    tiers.map((t) => [t.id, t.label ?? t.id.charAt(0).toUpperCase() + t.id.slice(1)]),
  )
}

/** @param {{ tiers?: { id: string, label?: string, description?: string }[] } | null} raritiesJson */
export function formatRarityGlossary(raritiesJson) {
  const tiers = raritiesJson?.tiers?.length ? raritiesJson.tiers : DEFAULT_TIERS
  const labels = rarityLabelsById(raritiesJson)
  return tiers
    .map((t) => {
      const label = labels[t.id] ?? t.id
      const desc = t.description ? ` — ${t.description}` : ''
      return `- ${t.id} (${label}): mana ${t.manaMin}–${t.manaMax}${desc}`
    })
    .join('\n')
}
