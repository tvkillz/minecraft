'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import Card from '@/components/CardPlaceholder/Card'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import { formatCredits } from '@/config'
import { useMarketCurrency } from '@/hooks/useMarketCurrency'
import { domainLabel } from '@/lib/cards/domains'
import { preloadImage } from '@/lib/cards/preload'
import { toCardDisplayProps } from '@/lib/cards'
import { formatRarityLabel } from '@/lib/cards/rarity'
import type { CardRecord } from '@/lib/cards/types'
import { formatMarketMoney } from '@/lib/market/currency'
import { computeCardHoverPreviewPosition, type CardHoverPreviewPosition } from '@/lib/cards/hoverPreview'
import '@/styles/coin-stack-icon.css'
import '@/styles/cart-icon.css'
import './MarketCard.css'

function MarketCardHoverPreview({ card, position }: { card: CardRecord; position: CardHoverPreviewPosition }) {
  return (
    <div
      className="market-card-popover"
      style={
        {
          '--glow-color': card.glowColor,
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        } as CSSProperties
      }
    >
      <CardPreviewPanel card={toCardDisplayProps(card, 0)} />
    </div>
  )
}

type MarketCardProps = {
  card: CardRecord
  index: number
  onBuyCredits?: (card: CardRecord) => void
  onAddToCart?: (card: CardRecord) => void
}

export default function MarketCard({ card, index, onBuyCredits, onAddToCart }: MarketCardProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { currency } = useMarketCurrency()
  const [hovered, setHovered] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)

  const priceCents = card.priceCents ?? 0
  const creditCost = priceCents
  const creditsDisplay = creditCost > 0 ? formatCredits(creditCost) : '—'
  const moneyDisplay = priceCents > 0 ? formatMarketMoney(priceCents, currency) : '—'

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

  return (
    <>
      <article
        className={`market-card${hovered ? ' market-card--hovered' : ''}`}
        aria-label={`${card.title}, ${formatRarityLabel(card.rarity)}`}
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
        </div>

        <div className="market-card__footer">
          <div className="market-card__meta">
            <span className={`market-card__rarity market-card__rarity--${card.rarity}`}>
              {formatRarityLabel(card.rarity)}
            </span>
            <span className="market-card__domain">{domainLabel(card.domain)}</span>
          </div>

          <div className="market-card__actions">
            <button
              type="button"
              className="market-card__price market-card__price--credits"
              disabled={creditCost <= 0}
              onClick={() => onBuyCredits?.(card)}
            >
              <span className="coin-stack-icon" aria-hidden="true" />
              <span>{creditsDisplay} credits</span>
            </button>
            <button
              type="button"
              className="market-card__price market-card__price--money"
              disabled={priceCents <= 0}
              onClick={() => onAddToCart?.(card)}
            >
              <span className="cart-icon cart-icon--money cart-icon--sm" aria-hidden="true" />
              <span>{moneyDisplay}</span>
            </button>
          </div>
        </div>

        {mounted && hovered && previewPos
          ? createPortal(
              <MarketCardHoverPreview card={card} position={previewPos} />,
              document.body,
            )
          : null}
      </article>
    </>
  )
}
