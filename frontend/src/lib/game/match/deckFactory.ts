import type { HandDeckEntry } from '@/lib/decks/buildHand'
import type { CardRecord } from '@/lib/cards/types'
import { toCardDisplayProps } from '@/lib/cards'

import type { MatchCardInstance } from './types'
import { VILLAIN_DECK_SIZE } from './constants'

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function expandDeckEntries(entries: HandDeckEntry[]): MatchCardInstance[] {
  const instances: MatchCardInstance[] = []
  let n = 0
  for (const { card, quantity } of entries) {
    for (let i = 0; i < quantity; i += 1) {
      instances.push({
        instanceId: `${card.slug}-${n}`,
        slug: card.slug,
        mana: card.stats.mana,
        attack: card.stats.attack,
        health: card.stats.health,
        maxHealth: card.stats.health,
        display: { ...card, id: `${card.slug}-${n}` },
      })
      n += 1
    }
  }
  return instances
}

export function buildRandomVillainDeck(catalog: CardRecord[], size = VILLAIN_DECK_SIZE): MatchCardInstance[] {
  if (catalog.length === 0) return []
  const pool: MatchCardInstance[] = []
  let n = 0
  while (pool.length < size) {
    const record = catalog[Math.floor(Math.random() * catalog.length)]
    pool.push({
      instanceId: `villain-${record.slug}-${n}`,
      slug: record.slug,
      mana: record.stats.mana,
      attack: record.stats.attack,
      health: record.stats.health,
      maxHealth: record.stats.health,
    })
    n += 1
  }
  return pool
}

export function shuffleDeck(deck: MatchCardInstance[]): MatchCardInstance[] {
  return shuffle(deck)
}
