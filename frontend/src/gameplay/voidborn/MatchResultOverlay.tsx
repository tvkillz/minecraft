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
    <div className="match-result" role="dialog" aria-modal="true" aria-live="assertive">
      <div className="match-result__panel">
        <h2 className="match-result__title">{won ? 'Victory!' : 'Defeat'}</h2>
        <p className="match-result__text">
          {won
            ? 'The void bows to your triumph. The realms are yours.'
            : 'Your champion falls. The void claims another soul.'}
        </p>
        <div className="match-result__actions">
          <Button type="button" variant="primary" size="md" fantasy onClick={onNewGame}>
            New game
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={onMenu}>
            Menu
          </Button>
        </div>
      </div>
    </div>
  )
}
