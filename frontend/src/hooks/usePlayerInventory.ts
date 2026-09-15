'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import {
  fetchPlayerInventory,
  ownedQuantityMap,
  type OwnedCardLine,
} from '@/lib/inventory/queries'

let cachedUserId: string | null = null
let cache: OwnedCardLine[] | null = null
let inflight: Promise<OwnedCardLine[]> | null = null
let inflightUserId: string | null = null

function loadPlayerInventory(userId: string): Promise<OwnedCardLine[]> {
  if (cachedUserId === userId && cache) return Promise.resolve(cache)

  if (inflight && inflightUserId === userId) return inflight

  inflightUserId = userId
  const promise = fetchPlayerInventory(userId)
    .then((next) => {
      const lines = next ?? []
      if (inflightUserId === userId) {
        cachedUserId = userId
        cache = lines
      }
      return lines
    })
    .finally(() => {
      if (inflightUserId === userId) {
        inflight = null
        inflightUserId = null
      }
    })

  inflight = promise
  return promise
}

export function usePlayerInventory() {
  const { user, session } = useAuth()
  const userId = user?.id ?? session?.user?.id ?? 'guest'
  const [lines, setLines] = useState<OwnedCardLine[]>(() =>
    cachedUserId === userId && cache ? cache : [],
  )
  const [loading, setLoading] = useState(() => cachedUserId !== userId || cache === null)
  const [trackedUserId, setTrackedUserId] = useState(userId)

  if (userId !== trackedUserId) {
    setTrackedUserId(userId)
    if (cachedUserId === userId && cache) {
      setLines(cache)
      setLoading(false)
    } else {
      setLines([])
      setLoading(true)
    }
  }

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true)
      try {
        if (cachedUserId === userId) {
          cache = null
        }
        if (inflightUserId === userId) {
          inflight = null
          inflightUserId = null
        }
        const next = await fetchPlayerInventory(userId).then((rows) => rows ?? [])
        cachedUserId = userId
        cache = next
        setLines(next)
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [userId],
  )

  useEffect(() => {
    if (cachedUserId === userId && cache) {
      setLines(cache)
      setLoading(false)
      return
    }

    setLines([])
    setLoading(true)
    let cancelled = false

    void loadPlayerInventory(userId).then((next) => {
      if (!cancelled && cachedUserId === userId) {
        setLines(next)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const ownedBySlug = ownedQuantityMap(lines)

  const getOwned = useCallback((slug: string) => ownedBySlug.get(slug) ?? 0, [ownedBySlug])

  return { lines, ownedBySlug, getOwned, loading, refresh }
}

export function prefetchPlayerInventory(userId: string): Promise<OwnedCardLine[]> {
  return loadPlayerInventory(userId)
}

export function invalidatePlayerInventoryCache() {
  cachedUserId = null
  cache = null
  inflight = null
  inflightUserId = null
}
