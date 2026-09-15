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
        <p className="match-result__eyebrow">Komorebi</p>
        <span className="match-result__glyph" aria-hidden="true">
          {won ? '光' : '風'}
        </span>
        <h2 className="match-result__title">
          {won ? 'A quiet victory' : 'The garden waits'}
        </h2>
        <p className="match-result__text">
          {won
            ? 'The light stays with you. Rest a moment, then wander back in when you feel ready.'
            : 'Every match is a breath. Take your time — the path is still here when you return.'}
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
