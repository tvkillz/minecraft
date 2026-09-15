'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/Button/Button'
import { formatCredits } from '@/config'
import { usePlayerInventory } from '@/hooks/usePlayerInventory'
import { useWallet } from '@/hooks/useWallet'
import { buyCardWithCredits } from '@/lib/inventory/queries'
import type { CardRecord } from '@/lib/cards/types'
import './BuyCardModal.css'

type BuyCardModalProps = {
  card: CardRecord | null
  onClose: () => void
  onPurchased?: () => void
}

export default function BuyCardModal({ card, onClose, onPurchased }: BuyCardModalProps) {
  const titleId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { balanceCredits, loading: walletLoading, refresh: refreshWallet } = useWallet()
  const { refresh: refreshInventory } = usePlayerInventory()

  if (!card) return null

  const creditCost = card.priceCents ?? 0
  const canAfford = !walletLoading && balanceCredits >= creditCost && creditCost > 0

  const handleBuy = async () => {
    if (!canAfford || busy || walletLoading) return
    setBusy(true)
    setError(null)
    const result = await buyCardWithCredits(card.id, {
      slug: card.slug,
      title: card.title,
      creditCost,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.message ?? result.error ?? 'Purchase failed')
      return
    }
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
          Buy {card.title}?
        </h2>
        <p className="buy-card-modal__copy">
          This will charge <strong>{formatCredits(creditCost)} credits</strong> from your wallet.
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

        {!walletLoading && !canAfford && creditCost > 0 ? (
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
            disabled={busy || walletLoading || !canAfford || creditCost <= 0}
            onClick={() => void handleBuy()}
          >
            {busy ? 'Buying…' : 'Buy card'}
          </Button>
        </div>
      </div>
    </div>
  )
}
