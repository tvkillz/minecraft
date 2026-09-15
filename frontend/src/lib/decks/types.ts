export const DEFAULT_MAX_DECK_CARDS = 30
export const MAX_COPIES_PER_CARD = 4
export const ARENA_HAND_SIZE = 20

export interface DeckCardEntry {
  cardId: string
  slug: string
  quantity: number
  sortOrder: number
}

export interface PlayerDeck {
  id: string
  name: string
  maxCards: number
  cards: DeckCardEntry[]
  updatedAt: string
}

export interface DeckSummary {
  id: string
  name: string
  cards: number
  maxCards: number
}
