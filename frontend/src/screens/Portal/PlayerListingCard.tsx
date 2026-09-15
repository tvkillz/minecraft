'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import Card from '@/components/CardPlaceholder/Card'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import { Button } from '@/components/ui/Button/Button'
import { formatCredits } from '@/config'
import { useAuth } from '@/components/providers/AuthProvider'
import { useMarketCurrency } from '@/hooks/useMarketCurrency'
import { usePlayerInventory } from '@/hooks/usePlayerInventory'
import { domainLabel } from '@/lib/cards/domains'
import { preloadImage } from '@/lib/cards/preload'
import { toCardDisplayProps } from '@/lib/cards'
import { formatRarityLabel } from '@/lib/cards/rarity'
import type { CardRecord } from '@/lib/cards/types'
import type { PlayerMarketListing } from '@/lib/commerce/types'
import { formatMarketMoney } from '@/lib/market/currency'
import { cancelMarketListing } from '@/lib/market/listings'
import { invalidateMarketListingsCache } from '@/hooks/useMarketListings'
import '@/styles/coin-stack-icon.css'
import '@/styles/cart-icon.css'
import './MarketCard.css'
import './PlayerListingCard.css'

import { computeCardHoverPreviewPosition, type CardHoverPreviewPosition } from '@/lib/cards/hoverPreview'

type PlayerListingCardProps = {
  card: CardRecord
  listing: PlayerMarketListing
  index: number
  isOwnListing?: boolean
  onBuy?: (card: CardRecord, listing: PlayerMarketListing) => void
  onCancelled?: () => void
}

export default function PlayerListingCard({
  card,
  listing,
  index,
  isOwnListing = false,
  onBuy,
  onCancelled,
}: PlayerListingCardProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { currency } = useMarketCurrency()
  const { user, session } = useAuth()
  const userId = user?.id ?? session?.user?.id
  const { refresh: refreshInventory } = usePlayerInventory()
  const [hovered, setHovered] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const creditCost = listing.price_credits
  const creditsDisplay = creditCost > 0 ? formatCredits(creditCost) : '—'
  const moneyDisplay = creditCost > 0 ? formatMarketMoney(creditCost, currency) : '—'
  const isMine = isOwnListing || listing.seller_id === userId

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePreviewPosition = () => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    setPreviewPos(computeCardHoverPreviewPosition(rect))
  }

  const showPreview = () => {
    updatePreviewPosition()
    setHovered(true)
    void preloadImage(card.artUrl)
  }

  const hidePreview = () => {
    setHovered(false)
    setPreviewPos(null)
  }

  const handleCancel = async () => {
    if (cancelling) return
    setCancelling(true)
    const result = await cancelMarketListing(listing.id)
    setCancelling(false)
    if (result.ok) {
      invalidateMarketListingsCache()
      await refreshInventory({ silent: true })
      onCancelled?.()
    }
  }

  return (
    <>
      <article
        className={`market-card player-listing-card${hovered ? ' market-card--hovered' : ''}`}
        aria-label={`${card.title} player listing`}
        onMouseEnter={showPreview}
        onMouseLeave={hidePreview}
        onFocus={showPreview}
        onBlur={hidePreview}
      >
        <div className="market-card__frame" ref={frameRef}>
          <Card
            {...toCardDisplayProps(card, index)}
            totalCards={1}
            fanIndex={0}
            layoutMode="market"
            showAbility={false}
            showKeywords={false}
            showRarity={false}
            thumbOnly
          />
          <span className="player-listing-card__badge">Player sale</span>
        </div>

        <div className="market-card__footer">
          <div className="market-card__meta">
            <span className={`market-card__rarity market-card__rarity--${card.rarity}`}>
              {formatRarityLabel(card.rarity)}
            </span>
            <span className="market-card__domain">{domainLabel(card.domain)}</span>
          </div>

          <div className="market-card__actions">
            {isMine ? (
              <>
                <div className="market-card__price market-card__price--credits player-listing-card__price-display">
                  <span className="coin-stack-icon" aria-hidden="true" />
                  <span>{creditsDisplay} credits</span>
                </div>
                <div className="market-card__price market-card__price--money player-listing-card__price-display">
                  <span className="cart-icon cart-icon--money cart-icon--sm" aria-hidden="true" />
                  <span>{moneyDisplay}</span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="player-listing-card__cancel-btn"
                  disabled={cancelling}
                  onClick={() => void handleCancel()}
                >
                  {cancelling ? 'Removing…' : 'Remove listing'}
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="market-card__price market-card__price--credits"
                  disabled={creditCost <= 0}
                  onClick={() => onBuy?.(card, listing)}
                >
                  <span className="coin-stack-icon" aria-hidden="true" />
                  <span>{creditsDisplay} credits</span>
                </button>
                <div className="market-card__price market-card__price--money player-listing-card__price-display">
                  <span className="cart-icon cart-icon--money cart-icon--sm" aria-hidden="true" />
                  <span>{moneyDisplay}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {mounted && hovered && previewPos
          ? createPortal(
              <div
                className="market-card-popover"
                style={
                  {
                    '--glow-color': card.glowColor,
                    top: previewPos.top,
                    left: previewPos.left,
                    width: previewPos.width,
                    height: previewPos.height,
                  } as CSSProperties
                }
              >
                <CardPreviewPanel card={toCardDisplayProps(card, 0)} />
              </div>,
              document.body,
            )
          : null}
      </article>
    </>
  )
}
