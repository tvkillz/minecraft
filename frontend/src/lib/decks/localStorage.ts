import type { PlayerDeck } from './types'

const STORAGE_KEY = 'voidborn.player_decks'

function readAll(): PlayerDeck[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PlayerDeck[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(decks: PlayerDeck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

export function loadLocalDecks(userId: string): PlayerDeck[] {
  return readAll().filter((d) => d.id.startsWith(`${userId}:`) || d.id.includes(userId))
}

export function saveLocalDeck(userId: string, deck: PlayerDeck): PlayerDeck {
  const scopedId = deck.id.startsWith(`${userId}:`) ? deck.id : `${userId}:${deck.id}`
  const next = { ...deck, id: scopedId }
  const all = readAll().filter((d) => d.id !== scopedId)
  all.push(next)
  writeAll(all)
  return next
}

export function deleteLocalDeck(deckId: string) {
  writeAll(readAll().filter((d) => d.id !== deckId))
}

export function createDefaultLocalDecks(userId: string): PlayerDeck[] {
  const deck: PlayerDeck = {
    id: `${userId}:main`,
    name: 'Main Deck',
    maxCards: 30,
    cards: [],
    updatedAt: new Date().toISOString(),
  }
  saveLocalDeck(userId, deck)
  return [deck]
}
