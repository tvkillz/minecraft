'use client'

import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { HERO_CARDS } from '@/config'
import { preloadCardImages } from '@/lib/cards/preload'
import Card from '@/components/CardPlaceholder/Card'
import '@/components/CardPlaceholder/styles.css'
import './styles.css'

/** Alternating helix stagger — unique vs iyashikei corners / voidborn fan. */
const RAIL_TILTS = [-11, 8, -7, 10, -9, 6] as const
const RAIL_LIFTS = [18, -6, 14, -10, 12, -4] as const

export default function HelixHeroRail() {
  const cards = HERO_CARDS.slice(0, 6)

  useEffect(() => {
    if (!cards.length) return
    void preloadCardImages(cards, { fullArt: true })
  }, [cards])

  if (!cards.length) return null

  return (
    <div className="helix-hero__rail" aria-hidden={cards.length === 0}>
      <div className="helix-hero__rail-track" aria-hidden="true" />
      <div className="helix-hero__rail-glow" aria-hidden="true" />
      <ul className="helix-hero__rail-list">
        {cards.map((card, index) => (
          <li
            key={card.id}
            className="helix-hero__rail-slot"
            style={
              {
                '--rail-tilt': `${RAIL_TILTS[index % RAIL_TILTS.length]}deg`,
                '--rail-lift': `${RAIL_LIFTS[index % RAIL_LIFTS.length]}px`,
                '--rail-delay': `${index * 0.12}s`,
                zIndex: index % 2 === 0 ? 4 + index : 2 + index,
              } as CSSProperties
            }
          >
            <div className="helix-hero__rail-shine" aria-hidden="true" />
            <Card
              {...card}
              layoutMode="hero"
              showAbility={false}
              showKeywords={false}
              showRarity={false}
              totalCards={1}
              fanIndex={0}
              className="helix-hero__rail-card"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
