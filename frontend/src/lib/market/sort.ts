import type { CardRecord, CardRarity } from '@/lib/cards/types'

export type MarketSort =
  | 'rarity'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'

export const MARKET_SORT_OPTIONS: { value: MarketSort; label: string }[] = [
  { value: 'rarity', label: 'Rarity' },
  { value: 'price-asc', label: 'Price: low → high' },
  { value: 'price-desc', label: 'Price: high → low' },
  { value: 'name-asc', label: 'Name: A–Z' },
]

const RARITY_RANK: Record<CardRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4,
}

export function sortMarketCards(cards: CardRecord[], sort: MarketSort): CardRecord[] {
  const list = [...cards]

  switch (sort) {
    case 'rarity':
      return list.sort(
        (a, b) =>
          RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      )
    case 'price-asc':
      return list.sort(
        (a, b) =>
          (a.priceCents ?? 0) - (b.priceCents ?? 0) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      )
    case 'price-desc':
      return list.sort(
        (a, b) =>
          (b.priceCents ?? 0) - (a.priceCents ?? 0) ||
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      )
    case 'name-asc':
      return list.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      )
    default:
      return list
  }
}
