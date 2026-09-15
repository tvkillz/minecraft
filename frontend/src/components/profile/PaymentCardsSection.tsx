'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { appConfig } from '@/config'
import { Button } from '@/components/ui/Button/Button'
import { invokeCommerceAction } from '@/lib/commerce/api'
import {
  fetchPaymentCards,
  formatCardExpiry,
  formatMaskedPan,
  MAX_PAYMENT_CARDS,
  PAYMENT_CARDS_PER_PAGE,
  type PaymentCard,
} from '@/lib/profile/paymentCards'
import './PaymentCardsSection.css'

const GATEWAY_REDIRECT_MESSAGE =
  'You will be redirected to a secure payment page to complete your purchase.'

type PaymentCardsSectionProps = {
  userId: string | undefined
}

function cardBrandIcon(brand: string): string | null {
  const normalized = brand.toLowerCase()
  const match = appConfig.descriptions.footer.payments.find(
    (icon) => icon.id === normalized || icon.label.toLowerCase() === normalized,
  )
  return match?.icon ?? null
}

export default function PaymentCardsSection({ userId }: PaymentCardsSectionProps) {
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [addingCard, setAddingCard] = useState(false)
  const [addingTestCard, setAddingTestCard] = useState(false)
  const [removingCardId, setRemovingCardId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCards = useCallback(async () => {
    if (!userId) {
      setCards([])
      setLoading(false)
      return
    }

    setLoading(true)
    const rows = await fetchPaymentCards(userId)
    setCards(rows)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void loadCards()
  }, [loadCards])

  const totalPages = Math.max(1, Math.ceil(cards.length / PAYMENT_CARDS_PER_PAGE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageCards = useMemo(() => {
    const start = (page - 1) * PAYMENT_CARDS_PER_PAGE
    return cards.slice(start, start + PAYMENT_CARDS_PER_PAGE)
  }, [cards, page])

  const rangeStart = cards.length === 0 ? 0 : (page - 1) * PAYMENT_CARDS_PER_PAGE + 1
  const rangeEnd = Math.min(page * PAYMENT_CARDS_PER_PAGE, cards.length)

  const handleAddCard = async () => {
    if (addingCard || cards.length >= MAX_PAYMENT_CARDS) return
    setError(null)
    setAddingCard(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setAddingCard(false)
  }

  const handleAddTestCard = async () => {
    if (addingTestCard || cards.length >= MAX_PAYMENT_CARDS) return
    setError(null)
    setAddingTestCard(true)
    try {
      const res = await invokeCommerceAction({ type: 'payment_card_add_demo' })
      if (res.error) {
        setError(res.message ?? res.error)
        return
      }
      await loadCards()
    } catch {
      setError('Could not add test card.')
    } finally {
      setAddingTestCard(false)
    }
  }

  const handleRemoveCard = async (cardId: string) => {
    if (removingCardId) return
    setError(null)
    setRemovingCardId(cardId)
    try {
      const res = await invokeCommerceAction({ type: 'payment_card_remove', cardId })
      if (res.error) {
        setError(res.message ?? res.error)
        return
      }
      await loadCards()
    } catch {
      setError('Could not remove card.')
    } finally {
      setRemovingCardId(null)
    }
  }

  const atCardLimit = cards.length >= MAX_PAYMENT_CARDS
  const cardActionsBusy = addingCard || addingTestCard || Boolean(removingCardId)

  return (
    <section className="portal-profile__card portal-profile__card--compact portal-profile__card--payment payment-cards">
      <div className="portal-profile__card-header payment-cards__header">
        <h2 className="portal-profile__card-title">Payment Cards</h2>
        <div className="payment-cards__header-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fantasy
            disabled={cardActionsBusy || atCardLimit}
            onClick={() => void handleAddCard()}
          >
            {addingCard ? 'Processing…' : 'Add Card'}
          </Button>
          <Button
            type="button"
            variant="trigger-green"
            size="sm"
            disabled={cardActionsBusy || atCardLimit}
            onClick={() => void handleAddTestCard()}
          >
            {addingTestCard ? 'Adding…' : 'Add test card'}
          </Button>
        </div>
      </div>

      <p className="payment-cards__test-note" role="note">
        Test cards are for trying saved-card checkout until the payment gateway is connected.
      </p>

      {addingCard ? (
        <p className="payment-cards__redirect-message" role="status" aria-live="polite">
          {GATEWAY_REDIRECT_MESSAGE}
        </p>
      ) : null}

      {error ? (
        <p className="portal-profile__message portal-profile__message--error" role="alert">
          {error}
        </p>
      ) : null}

      {atCardLimit ? (
        <p className="payment-cards__limit-note" role="status">
          Maximum of {MAX_PAYMENT_CARDS} cards saved.
        </p>
      ) : null}

      <div className="payment-cards__body">
        {loading ? (
          <p className="portal-profile__status">Loading cards…</p>
        ) : cards.length === 0 ? (
          <p className="portal-profile__empty">No cards saved yet.</p>
        ) : (
          <ul className="payment-cards__list" aria-label="Saved payment cards">
            {pageCards.map((card) => {
              const icon = cardBrandIcon(card.brand)
              const isRemoving = removingCardId === card.id
              return (
                <li key={card.id} className="payment-cards__item">
                  {icon ? (
                    <img
                      className="payment-cards__brand"
                      src={icon}
                      alt=""
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="payment-cards__brand payment-cards__brand--fallback" aria-hidden="true">
                      {card.brand.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="payment-cards__details">
                    <span className="payment-cards__pan">{formatMaskedPan(card.first4, card.last4)}</span>
                    <span className="payment-cards__meta">
                      Expires {formatCardExpiry(card.expMonth, card.expYear)}
                      {card.isDemo ? ' · Test' : ''}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="trigger-orange"
                    size="sm"
                    className="payment-cards__remove"
                    disabled={cardActionsBusy}
                    onClick={() => void handleRemoveCard(card.id)}
                  >
                    {isRemoving ? 'Removing…' : 'Remove'}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {cards.length > 0 ? (
        <nav className="payment-cards__pagination" aria-label="Payment card pages">
          <p className="payment-cards__pagination-summary">
            Showing {rangeStart}–{rangeEnd} of {cards.length}
          </p>
          <div className="payment-cards__pagination-actions">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="payment-cards__pagination-page">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </nav>
      ) : null}
    </section>
  )
}
