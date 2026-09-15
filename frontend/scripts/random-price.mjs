/** Market price in credits (= cards.price_cents). 1000–100000 ≈ $10–$1000 at 100 credits/unit. */
export const CARD_PRICE_MIN_CENTS = 1000
export const CARD_PRICE_MAX_CENTS = 100000

export function randomCardPriceCents(
  min = CARD_PRICE_MIN_CENTS,
  max = CARD_PRICE_MAX_CENTS,
) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
