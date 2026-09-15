'use client'

import { useEffect, useState } from 'react'

import { CARDS_CATALOG, fetchPublishedCards } from '@/lib/cards'
import type { CardRecord } from '@/lib/cards/types'

let catalogCache: CardRecord[] | null = null
let catalogInflight: Promise<CardRecord[]> | null = null

function loadPublishedCatalog(): Promise<CardRecord[]> {
  if (catalogCache) return Promise.resolve(catalogCache)
  if (catalogInflight) return catalogInflight

  catalogInflight = fetchPublishedCards()
    .then((live) => {
      catalogCache = live.length > 0 ? live : CARDS_CATALOG
      return catalogCache
    })
    .finally(() => {
      catalogInflight = null
    })

  return catalogInflight
}

/** Start catalog fetch early (e.g. portal shell) so market does not flash showcase then live data. */
export function prefetchCardCatalog(): Promise<CardRecord[]> {
  return loadPublishedCatalog()
}

export function useCardCatalog(): { cards: CardRecord[]; loading: boolean } {
  const [cards, setCards] = useState<CardRecord[]>(() => catalogCache ?? [])
  const [loading, setLoading] = useState(() => catalogCache === null)

  useEffect(() => {
    if (catalogCache) {
      setCards(catalogCache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void loadPublishedCatalog().then((result) => {
      if (!cancelled) {
        setCards(result)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { cards, loading }
}
