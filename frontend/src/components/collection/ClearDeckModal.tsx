'use client'

import { useId } from 'react'

import { Button } from '@/components/ui/Button/Button'
import './ClearDeckModal.css'

type ClearDeckModalProps = {
  deckName: string | null
  onClose: () => void
  onConfirm: () => void
  busy?: boolean
}

export default function ClearDeckModal({ deckName, onClose, onConfirm, busy }: ClearDeckModalProps) {
  const titleId = useId()

  if (!deckName) return null

  return (
    <div className="clear-deck-modal" role="presentation">
      <button type="button" className="clear-deck-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="clear-deck-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="clear-deck-modal__title">
          Clear {deckName}?
        </h2>
        <p className="clear-deck-modal__copy">
          Are you sure you want to clear this deck? All cards will be removed from the list.
        </p>
        <div className="clear-deck-modal__actions">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Clearing…' : 'Clear deck'}
          </Button>
        </div>
      </div>
    </div>
  )
}
