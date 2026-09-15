'use client'

import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { HERO_CARDS } from '@/config'
import { preloadCardImages } from '@/lib/cards/preload'
import Card from '@/components/CardPlaceholder/Card'
import '@/components/CardPlaceholder/styles.css'
import './styles.css'

const LEFT_SLOTS = [0, 2, 4] as const
const RIGHT_SLOTS = [1, 3, 5] as const

function HeroCornerCard({
  card,
  index,
}: {
  card: (typeof HERO_CARDS)[number]
  index: number
}) {
  return (
    <div
      className="iyashikei-hero__corner"
      style={{ '--corner-delay': `${index * 0.75}s` } as CSSProperties}
    >
      <div className="iyashikei-hero__corner-shine" aria-hidden="true" />
      <Card
        {...card}
        layoutMode="hero"
        showAbility={false}
        showKeywords={false}
        showRarity={false}
        totalCards={1}
        fanIndex={0}
        className="iyashikei-hero__corner-card"
      />
    </div>
  )
}

export default function IyashikeiHeroCorners() {
  const cards = HERO_CARDS.slice(0, 6)

  useEffect(() => {
    if (!cards.length) return
    void preloadCardImages(cards, { fullArt: true })
  }, [cards])

  if (!cards.length) return null

  return (
    <div className="iyashikei-hero__corners" aria-hidden={cards.length === 0}>
      <div className="iyashikei-hero__column iyashikei-hero__column--left">
        {LEFT_SLOTS.map((index) => {
          const card = cards[index]
          if (!card) return null
          return <HeroCornerCard key={card.id} card={card} index={index} />
        })}
      </div>
      <div className="iyashikei-hero__column iyashikei-hero__column--right">
        {RIGHT_SLOTS.map((index) => {
          const card = cards[index]
          if (!card) return null
          return <HeroCornerCard key={card.id} card={card} index={index} />
        })}
      </div>
    </div>
  )
}
