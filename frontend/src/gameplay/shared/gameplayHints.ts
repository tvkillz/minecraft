export type GameplayHintId = 'play_card' | 'battle' | 'end_turn'

export type GameplayHintCopy = {
  id: GameplayHintId
  label: string
}

export const GAMEPLAY_HINTS: GameplayHintCopy[] = [
  { id: 'play_card', label: 'Double-click a card to play it' },
  { id: 'battle', label: 'Press BATTLE [B] to attack first' },
  { id: 'end_turn', label: 'Press END TURN [E] when you are done' },
]

const STORAGE_PREFIX = 'constructor:gameplay-hints:'

export function loadSeenHints(variant: string): Set<GameplayHintId> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${variant}`)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is GameplayHintId => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function persistSeenHints(variant: string, seen: Set<GameplayHintId>) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${variant}`, JSON.stringify([...seen]))
  } catch {
    /* quota / private mode */
  }
}

export function resolveActiveGameplayHint(
  seen: Set<GameplayHintId>,
  options: {
    canPlayCard: boolean
    showBattle: boolean
    canEndTurn: boolean
  },
): GameplayHintId | null {
  if (!seen.has('play_card') && options.canPlayCard) return 'play_card'
  if (!seen.has('battle') && options.showBattle) return 'battle'
  if (!seen.has('end_turn') && options.canEndTurn) return 'end_turn'
  return null
}
