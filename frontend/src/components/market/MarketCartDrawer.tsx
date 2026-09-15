'use client'

import { useEffect, useId } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/Button/Button'
import { appConfig } from '@/config'
import { formatCredits } from '@/config'
import { useMarketCart } from '@/hooks/useMarketCart'
import { useMarketCurrency } from '@/hooks/useMarketCurrency'
import { formatMarketMoney } from '@/lib/market/currency'
import './MarketCartDrawer.css'

export default function MarketCartDrawer() {
  const router = useRouter()
  const titleId = useId()
  const {
    items,
    itemCount,
    drawerOpen,
    closeDrawer,
    removeItem,
    setQuantity,
    clearCart,
    subtotalEurCents,
  } = useMarketCart()
  const { currency } = useMarketCurrency()

  const handleCheckout = () => {
    if (!items.length) return
    const payload = items.map((line) => ({
      cardId: line.cardId,
      quantity: line.quantity,
    }))
    const params = new URLSearchParams()
    params.set('currency', currency)
    params.set('cart', JSON.stringify(payload))
    closeDrawer()
    const checkoutPath = appConfig.domain.routes.checkout ?? '/checkout'
    router.push(`${checkoutPath}?${params.toString()}`)
  }

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawerOpen, closeDrawer])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  return (
    <div
      className={`market-cart${drawerOpen ? ' market-cart--open' : ''}`}
      aria-hidden={!drawerOpen}
    >
      <button
        type="button"
        className="market-cart__backdrop"
        aria-label="Close cart"
        onClick={closeDrawer}
        tabIndex={drawerOpen ? 0 : -1}
      />

      <aside
        className="market-cart__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="market-cart__header">
          <h2 id={titleId} className="market-cart__title">
            Cart
            {itemCount > 0 ? <span className="market-cart__count">{itemCount}</span> : null}
          </h2>
          <button type="button" className="market-cart__close" onClick={closeDrawer} aria-label="Close">
            ×
          </button>
        </header>

        {items.length === 0 ? (
          <p className="market-cart__empty">Your cart is empty. Add cards from the market.</p>
        ) : (
          <ul className="market-cart__list">
            {items.map((line) => (
              <li key={line.cardId} className="market-cart__line">
                <img src={line.thumbUrl} alt="" className="market-cart__thumb" />
                <div className="market-cart__line-body">
                  <span className="market-cart__line-title">{line.title}</span>
                  <span className="market-cart__line-price">
                    {formatMarketMoney(line.priceCents, currency)}
                    <span className="market-cart__line-credits">
                      · {formatCredits(line.priceCents)} credits
                    </span>
                  </span>
                  <div className="market-cart__qty">
                    <button
                      type="button"
                      className="market-cart__qty-btn"
                      onClick={() => setQuantity(line.cardId, line.quantity - 1)}
                      aria-label={`Decrease ${line.title}`}
                    >
                      −
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      type="button"
                      className="market-cart__qty-btn"
                      onClick={() => setQuantity(line.cardId, line.quantity + 1)}
                      aria-label={`Increase ${line.title}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="market-cart__remove"
                  onClick={() => removeItem(line.cardId)}
                  aria-label={`Remove ${line.title}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="market-cart__footer">
          <div className="market-cart__subtotal">
            <span>Subtotal</span>
            <strong>{formatMarketMoney(subtotalEurCents, currency)}</strong>
          </div>
          <p className="market-cart__note">
            Prices shown in {currency}.
          </p>
          <div className="market-cart__actions">
            <Button type="button" variant="ghost" size="sm" onClick={clearCart} disabled={!items.length}>
              Clear
            </Button>
            <Button type="button" variant="primary" size="md" disabled={!items.length} onClick={handleCheckout}>
              Checkout
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
