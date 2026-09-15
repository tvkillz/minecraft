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
        <p className="match-result__eyebrow">Final Whistle</p>
        <span className="match-result__glyph" aria-hidden="true">
          {won ? '⚽' : '🏟️'}
        </span>
        <h2 className="match-result__title">
          {won ? 'Full-time victory' : 'Back to the dugout'}
        </h2>
        <p className="match-result__text">
          {won
            ? "The crowd roars. The pitch belongs to you. Take a bow, then get back out there."
            : "Every legend has a setback. Study the tape, tighten the formation, and return stronger."}
        </p>
        <div className="match-result__actions">
          <Button type="button" variant="primary" size="md" fantasy onClick={onNewGame}>
            Play again
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onMenu}>
            Return to lobby
          </Button>
        </div>
      </div>
    </div>
  )
}
