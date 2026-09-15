import type { ElementCategory } from '@/config/schema'

import type { CardDomain } from './domains'

export type { CardDomain } from './domains'

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface CardAbility {
  name: string
  text: string
}

export interface CardRecord {
  id: string
  slug: string
  title: string
  domain: CardDomain
  categoryId: ElementCategory
  role?: string
  rarity: CardRarity
  stats: { mana: number; attack: number; health: number }
  keywords: string[]
  ability: CardAbility
  glowColor: string
  /** Shop price in cents (from DB or game/cards.json). */
  priceCents?: number | null
  thumbUrl: string
  artUrl: string
  locationId?: string
  fanIndex?: number
}
