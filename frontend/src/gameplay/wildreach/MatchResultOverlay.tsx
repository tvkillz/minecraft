'use client'

import { Button } from '@/components/ui/Button/Button'
import './MatchResultOverlay.css'

interface MatchResultOverlayProps {
  won: boolean
  onNewGame: () => void
  onMenu: () => void
}

export default function MatchResultOverlay({ won, onNewGame, onMenu }: MatchResultOverlayProps) {
  return (
    <div
      className={`match-result match-result--${won ? 'win' : 'loss'}`}
      role="dialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="match-result__panel">
        <p className="match-result__eyebrow">
          <span className="match-result__bracket">◇</span>
          FIELD LOG // HUNT REPORT
          <span className="match-result__bracket">◇</span>
        </p>
        <span className="match-result__status" aria-hidden="true">
          {won ? 'RANGE HELD' : 'RANGE LOST'}
        </span>
        <h2 className="match-result__title">
          {won ? 'Territory Claimed' : 'Forced Retreat'}
        </h2>
        <p className="match-result__text">
          {won
            ? 'Your predators held the line. The range is quiet — open another trail when ready.'
            : 'Rival pressure closed the range. Rebuild your deck and return to the hunt.'}
        </p>
        <div className="match-result__actions">
          <Button type="button" variant="primary" size="md" fantasy onClick={onNewGame}>
            Open new trail
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onMenu}>
            Leave range
          </Button>
        </div>
      </div>
    </div>
  )
}
