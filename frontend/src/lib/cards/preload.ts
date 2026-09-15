const loadedUrls = new Set<string>()
const inflight = new Map<string, Promise<void>>()

export function isImageCached(url: string): boolean {
  if (!url) return true
  return loadedUrls.has(url)
}

export function preloadImage(url: string): Promise<void> {
  if (!url || loadedUrls.has(url)) return Promise.resolve()

  const existing = inflight.get(url)
  if (existing) return existing

  const promise = new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    const finish = () => {
      loadedUrls.add(url)
      resolve()
    }
    img.onload = finish
    img.onerror = finish
    img.src = url
    if (img.complete && img.naturalWidth > 0) finish()
  }).finally(() => {
    inflight.delete(url)
  })

  inflight.set(url, promise)
  return promise
}

/** One entry per slug — hand often repeats the same card in multiple slots. */
export function uniqueCardsBySlug<T extends { slug?: string; id: string }>(
  cards: T[],
): T[] {
  const seen = new Map<string, T>()
  for (const card of cards) {
    const key = card.slug ?? card.id
    if (!seen.has(key)) seen.set(key, card)
  }
  return [...seen.values()]
}

export function preloadCardImages(
  cards: { thumbUrl: string; artUrl: string }[],
  options?: { fullArt?: boolean },
): Promise<void[]> {
  const urls = new Set<string>()
  for (const card of cards) {
    if (card.thumbUrl) urls.add(card.thumbUrl)
    if (options?.fullArt !== false && card.artUrl) urls.add(card.artUrl)
  }
  return Promise.all([...urls].map(preloadImage))
}

/** Preload every distinct card in the visible hand (thumbs + full art). */
export function preloadArenaHand(
  hand: { thumbUrl: string; artUrl: string; slug?: string; id: string }[],
): Promise<void[]> {
  return preloadCardImages(uniqueCardsBySlug(hand))
}

/** Wait for preload and a minimum loading-screen duration. */
export function preloadWithMinDelay(
  hand: Parameters<typeof preloadArenaHand>[0],
  minMs: number,
): Promise<void> {
  return Promise.all([
    preloadArenaHand(hand),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, minMs)
    }),
  ]).then(() => undefined)
}
