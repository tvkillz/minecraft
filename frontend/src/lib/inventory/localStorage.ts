import type { OwnedCardLine } from './queries'

const STORAGE_KEY = 'voidborn.player_inventory'

function readAll(): Record<string, LocalInventoryLine[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, LocalInventoryLine[]>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, LocalInventoryLine[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export type LocalInventoryLine = OwnedCardLine

export function loadLocalInventory(userId: string): LocalInventoryLine[] {
  return readAll()[userId] ?? []
}

export function addLocalInventory(slug: string, cardId: string, quantity: number, userId = 'guest') {
  const all = readAll()
  const lines = [...(all[userId] ?? [])]
  const existing = lines.find((l) => l.slug === slug)
  if (existing) {
    existing.quantity += quantity
  } else {
    lines.push({ cardId, slug, quantity, source: 'purchase' })
  }
  all[userId] = lines
  writeAll(all)
}
