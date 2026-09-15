'use client'

import Link from 'next/link'
import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import type { DeckSummary } from '@/lib/decks'
import './DeckSelectModal.css'

interface DeckSelectModalProps {
  isOpen: boolean
  modeLabel: string
  decks: readonly DeckSummary[]
  decksLoading?: boolean
  selectedDeckId: string
  onSelectDeck: (deckId: string) => void
  onCancel: () => void
  onEnterBattle: () => void
  enterBattleError?: string | null
  enteringBattle?: boolean
}

export default function DeckSelectModal({
  isOpen,
  modeLabel,
  decks,
  decksLoading = false,
  selectedDeckId,
  onSelectDeck,
  onCancel,
  onEnterBattle,
  enterBattleError = null,
  enteringBattle = false,
}: DeckSelectModalProps) {
  const copy = appConfig.descriptions.deckModal
  const selectedDeck = decks.find((d) => d.id === selectedDeckId)
  const canEnter = Boolean(selectedDeckId)
  const modeMark = appConfig.landing?.variant === 'wildreach' ? '◈' : '⚔'

  return (
    <div
      className={`deck-modal${isOpen ? ' deck-modal--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-modal-title"
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="deck-modal__backdrop"
        aria-label="Close deck selection"
        onClick={onCancel}
      />

      <div className="deck-modal__panel">
        <h2 id="deck-modal-title" className="deck-modal__title">
          {copy.title}
        </h2>
        <p className="deck-modal__mode">
          <span className="deck-modal__mode-mark" aria-hidden="true">
            {modeMark}
          </span>{' '}
          {modeLabel}
        </p>

        <label className="deck-modal__field">
          <span className="deck-modal__field-label">Deck</span>
          <div className="deck-modal__select-wrap">
            <select
              className="deck-modal__select"
              value={selectedDeckId}
              disabled={decksLoading}
              onChange={(e) => onSelectDeck(e.target.value)}
            >
              <option value="">
                {decksLoading ? 'Loading decks…' : copy.deckPlaceholder}
              </option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
            {selectedDeck && (
              <span
                className={`deck-modal__count${
                  selectedDeck.cards === selectedDeck.maxCards
                    ? ' deck-modal__count--full'
                    : ''
                }`}
              >
                {selectedDeck.cards}/{selectedDeck.maxCards}
              </span>
            )}
          </div>
        </label>

        {enterBattleError && (
          <p className="deck-modal__error" role="alert">
            {enterBattleError}
          </p>
        )}

        <div className="deck-modal__actions">
          <Button
            type="button"
            variant="secondary"
            size="md"
            fantasy
            onClick={onCancel}
            disabled={enteringBattle}
          >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            fantasy
            disabled={!canEnter || enteringBattle}
            onClick={onEnterBattle}
          >
            {enteringBattle ? 'Saving deck…' : copy.enterBattle}
          </Button>
          <Link
            href={appConfig.domain.routes.portalCollection}
            className="deck-modal__manage"
            onClick={(e) => e.stopPropagation()}
          >
            {copy.manageDecks}
          </Link>
        </div>
      </div>
    </div>
  )
}
