'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/Button/Button'
import { formatCredits } from '@/config'
import { invalidateMarketListingsCache } from '@/hooks/useMarketListings'
import { usePlayerInventory } from '@/hooks/usePlayerInventory'
import { useWallet } from '@/hooks/useWallet'
import type { PlayerMarketListing } from '@/lib/commerce/types'
import { buyMarketListing } from '@/lib/market/listings'
import './BuyCardModal.css'

type BuyListingModalProps = {
  listing: PlayerMarketListing | null
  cardTitle: string
  onClose: () => void
  onPurchased?: () => void
}

export default function BuyListingModal({
  listing,
  cardTitle,
  onClose,
  onPurchased,
}: BuyListingModalProps) {
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { balanceCredits, loading: walletLoading, refresh: refreshWallet } = useWallet()
  const { refresh: refreshInventory } = usePlayerInventory()

  if (!listing) return null

  const creditCost = listing.price_credits
  const canAfford = !walletLoading && balanceCredits >= creditCost

  const handleBuy = async () => {
    if (!canAfford || busy || walletLoading) return
    setBusy(true)
    setError(null)

    const result = await buyMarketListing(listing.id)
    setBusy(false)

    if (!result.ok) {
      setError(result.message ?? result.error ?? 'Purchase failed')
      return
    }

    invalidateMarketListingsCache()
    await Promise.all([refreshWallet({ silent: true }), refreshInventory({ silent: true })])
    onPurchased?.()
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
          Buy {cardTitle}?
        </h2>
        <p className="buy-card-modal__copy">
          This player listing costs <strong>{formatCredits(creditCost)} credits</strong>.
        </p>
        <p className="buy-card-modal__balance">
          Your balance:{' '}
          {walletLoading ? '…' : `${formatCredits(balanceCredits)} credits`}
        </p>

        {error ? (
          <p className="buy-card-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        {!walletLoading && !canAfford ? (
          <p className="buy-card-modal__error" role="status">
            Not enough credits for this purchase.
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
            disabled={busy || walletLoading || !canAfford}
            onClick={() => void handleBuy()}
          >
            {busy ? 'Buying…' : 'Buy listing'}
          </Button>
        </div>
      </div>
    </div>
  )
}
