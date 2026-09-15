import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'
import { getCardBySlug, toCardDisplayProps } from '@/lib/cards'
import type { CardRecord } from '@/lib/cards/types'

import type { HandDeckEntry } from './buildHand'
import type { PlayerDeck } from './types'

export function resolveDeckToDisplay(
  deck: PlayerDeck,
  catalog: CardRecord[],
): HandDeckEntry[] {
  const bySlug = new Map(catalog.map((c) => [c.slug, c]))

  return deck.cards
    .map((entry) => {
      const record = bySlug.get(entry.slug) ?? getCardBySlug(entry.slug)
      if (!record) return null
      return {
        card: toCardDisplayProps(record),
        quantity: entry.quantity,
      }
    })
    .filter((e): e is HandDeckEntry => e !== null)
}

export function deckCardCount(deck: PlayerDeck): number {
  return deck.cards.reduce((sum, c) => sum + c.quantity, 0)
}
