'use client'

import { useEffect, useState } from 'react'

import { appConfig, formatCredits } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { invalidatePlayerInventoryCache, usePlayerInventory } from '@/hooks/usePlayerInventory'
import { useWallet } from '@/hooks/useWallet'

type SuccessKind = 'credits' | 'cards'

export default function PurchaseSuccess() {
  const { balanceCredits, refresh, loading } = useWallet()
  const { refresh: refreshInventory } = usePlayerInventory()
  const [invoiceWarning, setInvoiceWarning] = useState<string | null>(null)
  const [successKind, setSuccessKind] = useState<SuccessKind>('credits')
  const [cardCopies, setCardCopies] = useState<number | null>(null)

  useEffect(() => {
    invalidatePlayerInventoryCache()
    void refresh({ silent: true })
    void refreshInventory({ silent: true })

    if (typeof window !== 'undefined') {
      const kind = sessionStorage.getItem('checkout_success_kind')
      if (kind === 'cards' || kind === 'credits') {
        setSuccessKind(kind)
        sessionStorage.removeItem('checkout_success_kind')
      }

      const copiesRaw = sessionStorage.getItem('checkout_success_card_copies')
      if (copiesRaw) {
        const copies = Number.parseInt(copiesRaw, 10)
        if (Number.isFinite(copies) && copies > 0) setCardCopies(copies)
        sessionStorage.removeItem('checkout_success_card_copies')
      }

      const warning = sessionStorage.getItem('checkout_invoice_warning')
      if (warning) {
        setInvoiceWarning(warning)
        sessionStorage.removeItem('checkout_invoice_warning')
      }
    }
  }, [refresh, refreshInventory])

  const isCardPurchase = successKind === 'cards'
  const collectionHref = appConfig.domain.routes.portalCollection

  return (
    <div className="checkout-result">
      <h1>Payment received</h1>
      <span className="checkout-result__icon" aria-hidden="true" />
      <p className="checkout-result__lead">
        {isCardPurchase
          ? cardCopies
            ? `${cardCopies} card${cardCopies === 1 ? '' : 's'} added to your collection. An invoice has been sent to your email.`
            : 'Your cards have been added to your collection. An invoice has been sent to your email.'
          : 'An invoice has been sent to your email.'}
      </p>
      {invoiceWarning ? (
        <p className="checkout-result__warning" role="status">
          {invoiceWarning}
        </p>
      ) : null}
      {isCardPurchase ? (
        <Button
          as="link"
          href={collectionHref}
          variant="gold"
          size="md"
          fantasy
          className="checkout-result__refresh"
        >
          View collection
        </Button>
      ) : (
        <>
          {!loading && (
            <p className="checkout-result__balance">
              Current balance: <strong>{formatCredits(balanceCredits)}</strong> credits
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            size="md"
            fantasy
            className="checkout-result__refresh"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh balance
          </Button>
        </>
      )}
    </div>
  )
}
