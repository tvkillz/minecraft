export type MatchBootCache = {
  matchId: string
  deckId: string
  mode: string
  userId: string
}

/** In-memory only — survives React remounts (tab switch), not full page reload. */
let cache: MatchBootCache | null = null
let inFlightBootKey: string | null = null

export function bootKeyFor(userId: string, deckId: string, mode: string): string {
  return `${userId}:${deckId}:${mode}`
}

export function tryClaimBoot(key: string): boolean {
  if (inFlightBootKey === key) return false
  inFlightBootKey = key
  return true
}

export function releaseBoot(key: string): void {
  if (inFlightBootKey === key) inFlightBootKey = null
}

export function readMatchBootCache(): MatchBootCache | null {
  return cache
}

export function writeMatchBootCache(entry: MatchBootCache): void {
  cache = entry
}

export function clearMatchBootCache(): void {
  cache = null
}

export function matchBootCacheMatches(
  entry: MatchBootCache,
  userId: string,
  deckId: string,
  mode: string,
): boolean {
  return entry.userId === userId && entry.deckId === deckId && entry.mode === mode
}
