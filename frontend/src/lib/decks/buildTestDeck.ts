export const TEST_DECK_NAME = 'Test Deck'
export const TEST_DECK_SIZE = 10

export function isTestDeck(deck: { name?: string }): boolean {
  return deck.name === TEST_DECK_NAME
}
