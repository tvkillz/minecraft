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
          <span className="match-result__bracket">[</span>
          RELAY // MATCH REPORT
          <span className="match-result__bracket">]</span>
        </p>
        <span className="match-result__status" aria-hidden="true">
          {won ? 'LINK STABLE' : 'SIGNAL LOST'}
        </span>
        <h2 className="match-result__title">
          {won ? 'Channel Secured' : 'Link Collapsed'}
        </h2>
        <p className="match-result__text">
          {won
            ? 'Your Frames held the Relay Grid. Static is offline — open a new channel when ready.'
            : 'Integrity failed under Static. Recalibrate your deck and re-establish the link.'}
        </p>
        <div className="match-result__actions">
          <Button type="button" variant="primary" size="md" fantasy onClick={onNewGame}>
            Reopen channel
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onMenu}>
            Abort to lobby
          </Button>
        </div>
      </div>
    </div>
  )
}
