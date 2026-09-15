'use client'

import { useEffect } from 'react'
import { preloadCardImages } from '@/lib/cards/preload'
import Card, { type CardDisplayProps } from './Card'
import './styles.css'

interface CardPlaceholderProps {
  cards: CardDisplayProps[]
  layoutMode?: 'default' | 'hero'
}

export default function CardPlaceholder({ cards, layoutMode = 'default' }: CardPlaceholderProps) {
  const isHero = layoutMode === 'hero'

  useEffect(() => {
    if (!cards.length) return
    void preloadCardImages(cards, { fullArt: isHero })
  }, [cards, isHero])

  return (
    <div className="card-fan" aria-label="Card previews">
      {cards.map((card) => (
        <Card
          key={card.id}
          {...card}
          layoutMode={isHero ? 'hero' : 'default'}
          showAbility={isHero ? false : undefined}
          showKeywords={isHero ? true : undefined}
          showRarity={isHero ? false : undefined}
          totalCards={cards.length}
        />
      ))}
    </div>
  )
}
