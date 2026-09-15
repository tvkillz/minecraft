import type { PlayerDeck } from '@/lib/decks'

export function quantityInOtherDecks(
  slug: string,
  decks: PlayerDeck[],
  activeDeckId: string,
): number {
  return decks
    .filter((deck) => deck.id !== activeDeckId)
    .reduce((sum, deck) => {
      const entry = deck.cards.find((c) => c.slug === slug)
      return sum + (entry?.quantity ?? 0)
    }, 0)
}

/** Max copies of `slug` allowed in the active deck given owned pool and per-deck cap. */
export function maxCopiesAllowedInDeck(
  ownedQty: number,
  inOtherDecks: number,
  maxCopiesPerCard: number,
): number {
  return Math.max(0, Math.min(maxCopiesPerCard, ownedQty - inOtherDecks))
}

export function canAddCopyToDeck(
  ownedQty: number,
  inDeckQty: number,
  inOtherDecks: number,
  maxCopiesPerCard: number,
): boolean {
  const cap = maxCopiesAllowedInDeck(ownedQty, inOtherDecks, maxCopiesPerCard)
  return inDeckQty < cap
}

/** Per-deck limits only — same card may appear in multiple decks. */
export function canAddToDraftDeck(
  ownedQty: number,
  inDeckQty: number,
  maxCopiesPerCard: number,
  deckTotal: number,
  maxDeckCards: number,
): boolean {
  if (deckTotal >= maxDeckCards) return false
  if (inDeckQty >= ownedQty) return false
  if (inDeckQty >= maxCopiesPerCard) return false
  return true
}

export function quantityInAllDecks(slug: string, decks: PlayerDeck[]): number {
  return decks.reduce((sum, deck) => {
    const entry = deck.cards.find((c) => c.slug === slug)
    return sum + (entry?.quantity ?? 0)
  }, 0)
}

export function canRemoveFromDraftDeck(inDeckQty: number): boolean {
  return inDeckQty > 0
}
