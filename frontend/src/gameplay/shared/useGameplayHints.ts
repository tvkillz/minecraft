'use client'

import { useCallback, useState } from 'react'

import { getGameplayVariant } from '../resolve'
import {
  loadSeenHints,
  persistSeenHints,
  resolveActiveGameplayHint,
  type GameplayHintId,
} from './gameplayHints'

type UseGameplayHintsOptions = {
  enabled: boolean
  canPlayCard: boolean
  showBattle: boolean
  canEndTurn: boolean
}

export function useGameplayHints({
  enabled,
  canPlayCard,
  showBattle,
  canEndTurn,
}: UseGameplayHintsOptions) {
  const variant = getGameplayVariant()
  const [seen, setSeen] = useState<Set<GameplayHintId>>(() => loadSeenHints(variant))

  const markSeen = useCallback(
    (id: GameplayHintId) => {
      setSeen((current) => {
        if (current.has(id)) return current
        const next = new Set(current)
        next.add(id)
        persistSeenHints(variant, next)
        return next
      })
    },
    [variant],
  )

  const activeHint = enabled
    ? resolveActiveGameplayHint(seen, { canPlayCard, showBattle, canEndTurn })
    : null

  return {
    activeHint,
    markSeen,
    isSeen: (id: GameplayHintId) => seen.has(id),
  }
}
