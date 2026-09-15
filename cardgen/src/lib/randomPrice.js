/** Random shop price in credits (= price_cents). 1000 = $10 … 100000 = $1000 at 100 credits/unit. */
export function randomPriceCents(min = 1000, max = 100000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
