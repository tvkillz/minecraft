import { resolveCardArtUrls } from './art'
import type { CardRecord } from './types'

import landingData from '@project/landing-cards'
import catalogData from '@project/cards-catalog'

interface CardsJsonFile {
  generatedAt: string
  cards: CompiledCard[]
}

type CompiledCard = CardRecord & {
  storage_bucket?: string
  storage_path?: string
  thumb_storage_path?: string
}

function withStorageUrls(card: CompiledCard): CardRecord {
  // compile-project.mjs already sets thumbUrl/artUrl (local /data/ or CDN after --upload).
  if (card.thumbUrl && card.artUrl) return card
  if (!card.storage_path || !card.thumb_storage_path) return card
  const { thumbUrl, artUrl } = resolveCardArtUrls({
    storage_bucket: card.storage_bucket,
    storage_path: card.storage_path,
    thumb_storage_path: card.thumb_storage_path,
  })
  return { ...card, thumbUrl, artUrl }
}

const landing = landingData as CardsJsonFile
const catalog = catalogData as CardsJsonFile

export const LANDING_CARDS: CardRecord[] = landing.cards.map(withStorageUrls)
export const CARDS_CATALOG: CardRecord[] = catalog.cards.map(withStorageUrls)
export const CARDS_CATALOG_GENERATED_AT = catalog.generatedAt

export function getCardBySlug(slug: string): CardRecord | undefined {
  return CARDS_CATALOG.find((c) => c.slug === slug)
}

export function toCardDisplayProps(card: CardRecord, fanIndex = 0) {
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    domain: card.domain,
    categoryId: card.categoryId,
    rarity: card.rarity,
    stats: card.stats,
    keywords: card.keywords,
    ability: card.ability,
    glowColor: card.glowColor,
    thumbUrl: card.thumbUrl,
    artUrl: card.artUrl,
    fanIndex: card.fanIndex ?? fanIndex,
  }
}
