'use client'

import { useId, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button/Button'
import { formatCredits } from '@/config'
import { usePlayerDecks } from '@/hooks/usePlayerDecks'
import { usePlayerInventory } from '@/hooks/usePlayerInventory'
import { invalidateMarketListingsCache } from '@/hooks/useMarketListings'
import type { CardRecord } from '@/lib/cards/types'
import {
  LISTING_COMMISSION_RATE,
  createMarketListing,
  minListingPrice,
  sellerProceeds,
} from '@/lib/market/listings'
import '@/components/market/BuyCardModal.css'

type SellCardModalProps = {
  card: CardRecord | null
  onClose: () => void
  onListed?: () => void
}

export default function SellCardModal({ card, onClose, onListed }: SellCardModalProps) {
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const { refresh: refreshInventory } = usePlayerInventory()
  const { refresh: refreshDecks } = usePlayerDecks()

  const marketPrice = card?.priceCents ?? 0
  const minPrice = useMemo(() => minListingPrice(marketPrice), [marketPrice])

  useEffect(() => {
    if (!card) return
    setPriceInput(String(minPrice))
    setError(null)
  }, [card?.id, minPrice])

  if (!card) return null

  const parsedPrice = Math.floor(Number(priceInput))
  const priceForPreview =
    Number.isFinite(parsedPrice) && parsedPrice >= minPrice ? parsedPrice : minPrice
  const validPrice = Number.isFinite(parsedPrice) && parsedPrice >= minPrice
  const proceeds = sellerProceeds(priceForPreview)

  const handleList = async () => {
    if (!validPrice || busy) return
    setBusy(true)
    setError(null)
    const result = await createMarketListing(card.id, parsedPrice)
    setBusy(false)
    if (!result.ok) {
      if (result.error === 'price_too_low' && result.minPriceCredits) {
        setError(`Minimum price is ${formatCredits(result.minPriceCredits)} credits.`)
      } else {
        setError(result.message ?? result.error ?? 'Could not list card')
      }
      return
    }
    invalidateMarketListingsCache()
    await Promise.all([refreshInventory({ silent: true }), refreshDecks({ silent: true })])
    onListed?.()
    onClose()
  }

  return (
    <div className="buy-card-modal" role="presentation">
      <button type="button" className="buy-card-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="buy-card-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className="buy-card-modal__title">
          List {card.title} for sale
        </h2>

        <p className="buy-card-modal__copy buy-card-modal__warning" role="note">
          While this copy is listed on the market, it cannot be added to decks or used in play.
          If the card is in a deck, it will be removed automatically when listed.
        </p>

        <p className="buy-card-modal__copy">
          Minimum price: <strong>{formatCredits(minPrice)} credits</strong> (75% of market price)
        </p>

        <label className="buy-card-modal__field">
          <span className="buy-card-modal__field-label">Your price (credits)</span>
          <input
            type="number"
            min={minPrice}
            step={1}
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            className="buy-card-modal__input"
          />
        </label>

        <p className="buy-card-modal__balance">
          You receive <strong>{formatCredits(proceeds)} credits</strong> when sold (
          {Math.round(LISTING_COMMISSION_RATE * 100)}% commission).
        </p>

        {error ? (
          <p className="buy-card-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="buy-card-modal__actions">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            fantasy
            disabled={busy || !validPrice || marketPrice <= 0}
            onClick={() => void handleList()}
          >
            {busy ? 'Listing…' : 'List on market'}
          </Button>
        </div>
      </div>
    </div>
  )
}
