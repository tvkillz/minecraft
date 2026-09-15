import { appConfig } from '@/config'

import type { CardRarity } from './types'

const DEFAULT_LABELS: Record<CardRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
}

/** Project-specific display label for a card rarity id (DB enum value). */
export function formatRarityLabel(rarity: string): string {
  const labels = appConfig.rarities?.labels
  if (labels && rarity in labels) {
    return labels[rarity as CardRarity]
  }
  if (rarity in DEFAULT_LABELS) {
    return DEFAULT_LABELS[rarity as CardRarity]
  }
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}

/** Ordered rarity ids for filters and sorting (falls back to voidborn default). */
export function rarityTierOrder(): CardRarity[] {
  const tiers = appConfig.rarities?.tiers
  if (tiers?.length) {
    return tiers.map((t) => t.id as CardRarity)
  }
  return ['common', 'uncommon', 'rare', 'epic', 'legendary']
}
