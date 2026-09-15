'use client'

import { useEffect, useState } from 'react'

import Card from '@/components/CardPlaceholder/Card'
import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'
import { isImageCached, preloadImage } from '@/lib/cards/preload'

interface CardHoverPreviewProps {
  card: CardDisplayProps
}

/** Large left preview — always shows the hovered card (thumb until full art is cached). */
export default function CardHoverPreview({ card }: CardHoverPreviewProps) {
  const [artReady, setArtReady] = useState(() => isImageCached(card.artUrl))

  useEffect(() => {
    if (isImageCached(card.artUrl)) {
      setArtReady(true)
      return
    }

    setArtReady(false)
    let cancelled = false
    void preloadImage(card.artUrl).then(() => {
      if (!cancelled) setArtReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [card.id, card.artUrl])

  const displayCard = artReady
    ? card
    : { ...card, artUrl: card.thumbUrl }

  return (
    <div
      className={`game-card-preview-wrap${artReady ? ' game-card-preview-wrap--ready' : ''}`}
    >
      <Card
        {...displayCard}
        artUrl={displayCard.artUrl}
        totalCards={1}
        fanIndex={0}
        layoutMode="preview"
        showAbility
      />
    </div>
  )
}
