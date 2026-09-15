'use client'

import { gameAnimationsConfig } from '@/config'
import Game from '@/gameplay'
import type { HandDeckEntry } from '@/lib/decks/buildHand'
import './BattleTransition.css'

interface BattleTransitionProps {
  phase: 'loading' | 'arena'
  deckEntries?: HandDeckEntry[]
  deckId: string
  mode?: string
  resumeMatchId?: string | null
  onNewGame?: () => void
  onMenu?: () => void
}

export default function BattleTransition({
  phase,
  deckEntries = [],
  deckId,
  mode,
  resumeMatchId,
  onNewGame,
  onMenu,
}: BattleTransitionProps) {
  const { battleTransition } = gameAnimationsConfig

  if (phase === 'loading') {
    return (
      <div className="battle-enter" aria-live="polite" aria-busy="true">
        <div className="battle-enter__loading">
          <div className="battle-enter__spinner" aria-hidden="true" />
          <p>{battleTransition.loadingLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="battle-arena">
      <Game
        deckEntries={deckEntries}
        deckId={deckId}
        mode={mode}
        resumeMatchId={resumeMatchId}
        onNewGame={onNewGame}
        onMenu={onMenu}
      />
    </div>
  )
}
