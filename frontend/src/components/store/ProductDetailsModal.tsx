'use client'

import { useState } from 'react'

import { appConfig } from '@/config'
import { invokeCommerceAction, type StoreProduct } from '@/lib/commerce/api'
import { Button } from '@/components/ui/Button/Button'

type ProductDetailsModalProps = {
  product: StoreProduct | null
  onClose: () => void
  onPurchased?: () => void
}

function formatPrice(cents: number, currency: string) {
  const symbol = currency.toLowerCase() === 'eur' ? '€' : currency.toUpperCase()
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export default function ProductDetailsModal({
  product,
  onClose,
  onPurchased,
}: ProductDetailsModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { legal } = appConfig.domain

  if (!product) return null

  const isCreditPack = product.kind === 'credit_pack'
  const isCard = product.kind === 'card'

  const handleStripeCheckout = async () => {
    setBusy(true)
    setError(null)
    const res = await invokeCommerceAction({
      type: 'checkout_create',
      productId: product.id,
    })
    setBusy(false)
    if (res.error || !res.checkoutUrl) {
      setError(res.message ?? res.error ?? 'Checkout failed')
      return
    }
    window.location.href = res.checkoutUrl
  }

  const handleCreditsPurchase = async () => {
    setBusy(true)
    setError(null)
    const res = await invokeCommerceAction({
      type: 'purchase_with_credits',
      productId: product.id,
    })
    setBusy(false)
    if (res.error) {
      setError(res.message ?? res.error ?? 'Purchase failed')
      return
    }
    onPurchased?.()
    onClose()
  }

  return (
    <div className="product-modal-backdrop" role="dialog" aria-modal="true">
      <div className="product-modal">
        <h2>{product.title}</h2>
        {product.description && <p>{product.description}</p>}
        <p>
          <strong>{formatPrice(product.price_cents, product.currency)}</strong>
        </p>

        <div className="product-modal__actions">
          {(isCreditPack || !isCard) && (
            <Button
              type="button"
              variant="primary"
              fantasy
              disabled={busy}
              onClick={() => void handleStripeCheckout()}
            >
              {busy ? 'Redirecting…' : 'Pay with card'}
            </Button>
          )}
          {isCard && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleCreditsPurchase()}
            >
              Buy with credits
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>

        {error && (
          <p role="alert" style={{ color: '#fca5a5', marginTop: '0.75rem' }}>
            {error}
          </p>
        )}

        <p className="credits-modal__legal" style={{ marginTop: '1rem' }}>
          <a href={legal.termsUrl} target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          {' · '}
          <a href={legal.refundPolicyUrl} target="_blank" rel="noopener noreferrer">
            Cancellation & Refund Policy
          </a>
          {' · '}
          <a href={legal.privacyUrl} target="_blank" rel="noopener noreferrer">
            Privacy Notice
          </a>
        </p>
      </div>
    </div>
  )
}
