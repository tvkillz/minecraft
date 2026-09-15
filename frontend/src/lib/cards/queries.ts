import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSiteId } from '@/lib/site'

import { resolveCardArtUrls } from './art'
import { DOMAIN_TO_CATEGORY, DOMAIN_GLOW, LOCATION_ORDER } from './domains'
import type { CardAbility, CardDomain, CardRarity, CardRecord } from './types'

interface DbCardRow {
  id: string
  slug: string
  title: string
  domain: string
  role: string | null
  rarity: CardRarity
  mana: number
  attack: number
  health: number
  keywords: string[]
  ability_name: string
  ability_text: string
  storage_bucket: string
  storage_path: string
  thumb_storage_path: string
  glow_color: string | null
  price_cents: number | null
}

function mapRow(row: DbCardRow): CardRecord {
  const domain = row.domain as CardDomain
  const { thumbUrl, artUrl } = resolveCardArtUrls({
    storage_bucket: row.storage_bucket,
    storage_path: row.storage_path,
    thumb_storage_path: row.thumb_storage_path,
  })

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    domain,
    categoryId: DOMAIN_TO_CATEGORY[domain],
    role: row.role ?? undefined,
    rarity: row.rarity,
    stats: { mana: row.mana, attack: row.attack, health: row.health },
    keywords: row.keywords ?? [],
    ability: { name: row.ability_name, text: row.ability_text },
    glowColor: row.glow_color ?? DOMAIN_GLOW[domain],
    priceCents: row.price_cents,
    thumbUrl,
    artUrl,
  }
}

export async function fetchPublishedCards(): Promise<CardRecord[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const siteId = getSiteId()

  const { data, error } = await supabase
    .from('cards')
    .select(
      'id, slug, title, domain, role, rarity, mana, attack, health, keywords, ability_name, ability_text, storage_bucket, storage_path, thumb_storage_path, glow_color, price_cents',
    )
    .eq('site_id', siteId)
    .eq('published', true)
    .order('domain')
    .order('mana')

  if (error || !data) return []
  return (data as DbCardRow[]).map(mapRow)
}

export async function fetchFeaturedCards(): Promise<CardRecord[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return []

  const siteId = getSiteId()

  const { data, error } = await supabase
    .from('location_featured_cards')
    .select(
      `
      location_id,
      cards (
        id, slug, title, domain, role, rarity, mana, attack, health, keywords,
        ability_name, ability_text, storage_bucket, storage_path, thumb_storage_path, glow_color,
        price_cents
      )
    `,
    )
    .eq('site_id', siteId)

  if (error || !data) return []

  const order = [...LOCATION_ORDER]
  const rows = data as { location_id: string; cards: DbCardRow | null }[]

  return order
    .map((locationId, fanIndex) => {
      const row = rows.find((r) => r.location_id === locationId)
      if (!row?.cards) return null
      return { ...mapRow(row.cards), locationId, fanIndex }
    })
    .filter((c): c is CardRecord => c !== null)
}
