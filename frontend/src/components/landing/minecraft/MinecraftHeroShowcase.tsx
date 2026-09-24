'use client'

import type { CSSProperties } from 'react'
import { HERO_CARDS, LOCATIONS } from '@/config'
import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'
import { mcItemHref } from './mc'

function artForFeature(card: CardDisplayProps): string {
  if (card.artUrl) return card.artUrl
  if (card.thumbUrl) return card.thumbUrl
  const loc = LOCATIONS.find((item) => item.domainId === card.domain)
  const cityImages = loc?.cities?.map((city) => city.image).filter(Boolean) ?? loc?.images ?? []
  const fromCities = cityImages[(card.fanIndex ?? 0) % Math.max(cityImages.length, 1)]
  return fromCities || loc?.image || loc?.backgroundImage || ''
}

function hrefForFeature(card: CardDisplayProps): string {
  return mcItemHref(card)
}

export default function MinecraftHeroShowcase() {
  const cards = HERO_CARDS
  if (!cards.length) return null

  return (
    <ul className="mc-hero__tiles">
      {cards.map((card) => {
        const image = artForFeature(card)
        return (
          <li key={card.id}>
            <a
              className="mc-hero__tile"
              href={hrefForFeature(card)}
              style={{ '--tile-glow': card.glowColor } as CSSProperties}
            >
              <span className="mc-hero__tile-art" style={{ backgroundImage: image ? `url(${image})` : undefined }} />
              <span className="mc-hero__tile-body">
                <span className="mc-hero__tile-kicker">{card.keywords?.[0] ?? card.domain}</span>
                <strong className="mc-hero__tile-title">{card.title}</strong>
                <span className="mc-hero__tile-text">{card.ability?.text}</span>
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
