import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'

import { ARENA_HAND_SIZE } from './types'

export interface HandDeckEntry {
  card: CardDisplayProps
  quantity: number
}

/** Expand deck entries into visible hand slots (cycles deck order; does not load full deck art). */
export function buildHandFromDeck(
  entries: HandDeckEntry[],
  handSize: number = ARENA_HAND_SIZE,
): CardDisplayProps[] {
  if (entries.length === 0) return []

  const expanded: CardDisplayProps[] = []
  for (const { card, quantity } of entries) {
    for (let i = 0; i < quantity; i++) {
      expanded.push(card)
    }
  }

  if (expanded.length === 0) return []

  const slots = Math.min(handSize, expanded.length)
  return Array.from({ length: slots }, (_, index) => {
    const base = expanded[index % expanded.length]
    return {
      ...base,
      id: `${base.slug}-hand-${index}`,
      fanIndex: index,
    }
  })
}
