import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { invokeCommerceAction } from '@/lib/commerce/api'

import { addLocalInventory, loadLocalInventory, type LocalInventoryLine } from './localStorage'

export type OwnedCardLine = {
  cardId: string
  slug: string
  quantity: number
  source: string
}

export async function fetchPlayerInventory(userId: string): Promise<OwnedCardLine[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return loadLocalInventory(userId)
  }

  const res = await invokeCommerceAction({ type: 'inventory_list' })
  if (res.error || !res.inventory) {
    const local = loadLocalInventory(userId)
    return local.length > 0 ? local : []
  }

  return res.inventory.map((row) => ({
    cardId: row.card_id,
    slug: row.cards?.slug ?? row.card_id,
    quantity: row.quantity,
    source: row.source,
  }))
}

export async function buyCardWithCredits(
  cardId: string,
  meta?: { slug: string; title: string; creditCost: number },
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    if (!meta) return { ok: false, error: 'offline' }
    addLocalInventory(meta.slug, meta.cardId, 1)
    return { ok: true }
  }

  const res = await invokeCommerceAction({ type: 'buy_card_with_credits', cardId })
  if (res.error) {
    return { ok: false, error: res.error, message: res.message }
  }
  return { ok: true }
}

export function ownedQuantityMap(lines: OwnedCardLine[] | undefined | null): Map<string, number> {
  const map = new Map<string, number>()
  for (const line of lines ?? []) {
    map.set(line.slug, (map.get(line.slug) ?? 0) + line.quantity)
  }
  return map
}
