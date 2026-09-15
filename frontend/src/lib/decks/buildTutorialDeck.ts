import type { CardRecord } from '@/lib/cards/types'

import type { PlayerDeck } from './types'
import { DEFAULT_MAX_DECK_CARDS, MAX_COPIES_PER_CARD } from './types'

export const TUTORIAL_DECK_ID = 'tutorial'
export const TUTORIAL_DECK_NAME = 'Tutorial Deck'

const TUTORIAL_DECK_SIZE = 20

export function isTutorialDeck(deck: { id: string; name?: string }): boolean {
  return deck.id === TUTORIAL_DECK_ID || deck.name === TUTORIAL_DECK_NAME
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** Random 20-card deck for the tutorial match (no collection required). */
export function buildTutorialDeck(catalog: CardRecord[]): PlayerDeck {
  if (catalog.length === 0) {
    throw new Error('Card catalog is empty.')
  }

  const pool = shuffle(catalog)
  const cards: PlayerDeck['cards'] = []
  const counts = new Map<string, number>()
  let poolIndex = 0
  let sortOrder = 0

  while (
    cards.reduce((sum, entry) => sum + entry.quantity, 0) < TUTORIAL_DECK_SIZE &&
    poolIndex < pool.length * (MAX_COPIES_PER_CARD + 2)
  ) {
    const record = pool[poolIndex % pool.length]
    poolIndex += 1
    const used = counts.get(record.slug) ?? 0
    if (used >= MAX_COPIES_PER_CARD) continue

    const existing = cards.find((entry) => entry.slug === record.slug)
    if (existing) {
      existing.quantity += 1
    } else {
      cards.push({
        cardId: record.id,
        slug: record.slug,
        quantity: 1,
        sortOrder,
      })
      sortOrder += 1
    }
    counts.set(record.slug, used + 1)
  }

  const total = cards.reduce((sum, entry) => sum + entry.quantity, 0)
  if (total < 1) {
    throw new Error('Could not build tutorial deck.')
  }

  return {
    id: TUTORIAL_DECK_ID,
    name: TUTORIAL_DECK_NAME,
    maxCards: DEFAULT_MAX_DECK_CARDS,
    cards,
    updatedAt: new Date().toISOString(),
  }
}
