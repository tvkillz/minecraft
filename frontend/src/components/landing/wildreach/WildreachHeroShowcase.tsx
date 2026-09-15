'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { HERO_CARDS } from '@/config'
import { preloadCardImages } from '@/lib/cards/preload'
import Card from '@/components/CardPlaceholder/Card'
import '@/components/CardPlaceholder/styles.css'
import './styles.css'

/**
 * Curated 6-card deck preview — staggered cluster inside the right-half showcase.
 * Positions are relative to `.wr-hero__showcase`, not the full viewport.
 */
const CLUSTER = [
  { col: 1, row: 1, tilt: -11, lift: 18, delay: 0.15, z: 2, scale: 0.92 },
  { col: 2, row: 1, tilt: 7, lift: 0, delay: 0.22, z: 4, scale: 1 },
  { col: 3, row: 1, tilt: -5, lift: 22, delay: 0.3, z: 3, scale: 0.94 },
  { col: 1, row: 2, tilt: 9, lift: 8, delay: 0.38, z: 5, scale: 0.96 },
  { col: 2, row: 2, tilt: -8, lift: -6, delay: 0.46, z: 6, scale: 1.04 },
  { col: 3, row: 2, tilt: 12, lift: 14, delay: 0.54, z: 4, scale: 0.93 },
] as const

export default function WildreachHeroShowcase() {
  const cards = HERO_CARDS.slice(0, 6)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!cards.length) return
    void preloadCardImages(cards, { fullArt: true })
  }, [cards])

  if (!cards.length) return null

  return (
    <div className="wr-hero__showcase" aria-hidden={cards.length === 0}>
      <div className="wr-hero__showcase-glow" aria-hidden="true" />
      <ul className="wr-hero__cluster">
        {cards.map((card, index) => {
          const layout = CLUSTER[index % CLUSTER.length]
          const isLit = hoveredIndex === index
          return (
            <li
              key={card.id}
              className={[
                'wr-hero__cluster-slot',
                `wr-hero__cluster-slot--c${layout.col}`,
                `wr-hero__cluster-slot--r${layout.row}`,
                isLit ? 'wr-hero__cluster-slot--lit' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                {
                  zIndex: isLit ? 14 : layout.z,
                  '--cluster-tilt': `${layout.tilt}deg`,
                  '--cluster-lift': `${layout.lift}px`,
                  '--cluster-scale': layout.scale,
                  '--cluster-delay': `${layout.delay}s`,
                  '--cluster-float-delay': `${index * 0.35}s`,
                  '--glow-color': card.glowColor,
                } as CSSProperties
              }
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="wr-hero__cluster-shadow" aria-hidden="true" />
              <div className="wr-hero__cluster-glow">
                <div className="wr-hero__cluster-frame">
                  <div className="wr-hero__cluster-shine" aria-hidden="true" />
                  <Card
                    {...card}
                    layoutMode="hero"
                    showAbility={false}
                    showKeywords={false}
                    showRarity={false}
                    totalCards={1}
                    fanIndex={0}
                    className="wr-hero__cluster-card"
                  />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
