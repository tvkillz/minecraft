'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import type { PlayerMarketListing } from '@/lib/commerce/types'
import { fetchMarketListings } from '@/lib/market/listings'

let cacheAll: PlayerMarketListing[] | null = null
let cacheMine: PlayerMarketListing[] | null = null
let cacheMineUserId: string | null = null
let inflightAll: Promise<PlayerMarketListing[]> | null = null
let inflightMine: Promise<PlayerMarketListing[]> | null = null

function cacheForScope(scope: 'all' | 'mine', userId?: string | null) {
  if (scope === 'mine') {
    if (userId && cacheMineUserId !== userId) return null
    return cacheMine
  }
  return cacheAll
}

function setCacheForScope(
  scope: 'all' | 'mine',
  listings: PlayerMarketListing[] | null,
  userId?: string | null,
) {
  if (scope === 'mine') {
    cacheMine = listings
    cacheMineUserId = listings === null ? null : (userId ?? cacheMineUserId)
  } else {
    cacheAll = listings
  }
}

function inflightForScope(scope: 'all' | 'mine') {
  return scope === 'mine' ? inflightMine : inflightAll
}

function setInflightForScope(scope: 'all' | 'mine', promise: Promise<PlayerMarketListing[]> | null) {
  if (scope === 'mine') inflightMine = promise
  else inflightAll = promise
}

function loadMarketListings(scope: 'all' | 'mine', userId?: string | null): Promise<PlayerMarketListing[]> {
  const cached = cacheForScope(scope, userId)
  if (cached) return Promise.resolve(cached)

  const inflight = inflightForScope(scope)
  if (inflight) return inflight

  const promise = fetchMarketListings(scope)
    .then((next) => {
      const listings = next ?? []
      setCacheForScope(scope, listings, userId)
      return listings
    })
    .finally(() => {
      setInflightForScope(scope, null)
    })

  setInflightForScope(scope, promise)
  return promise
}

export function useMarketListings(scope: 'all' | 'mine' = 'all') {
  const { user, session } = useAuth()
  const userId = user?.id ?? session?.user?.id ?? null
  const [listings, setListings] = useState<PlayerMarketListing[]>(
    () => cacheForScope(scope, userId) ?? [],
  )
  const [loading, setLoading] = useState(() => cacheForScope(scope, userId) === null)
  const [trackedScope, setTrackedScope] = useState(scope)
  const [trackedUserId, setTrackedUserId] = useState(userId)

  if (scope !== trackedScope || userId !== trackedUserId) {
    setTrackedScope(scope)
    setTrackedUserId(userId)
    const cached = cacheForScope(scope, userId)
    setListings(cached ?? [])
    setLoading(cached === null)
  }

  const refresh = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) setLoading(true)
      try {
        setCacheForScope(scope, null, userId)
        setInflightForScope(scope, null)
        const next = await fetchMarketListings(scope).then((rows) => rows ?? [])
        setCacheForScope(scope, next, userId)
        setListings(next)
      } finally {
        if (!options?.silent) setLoading(false)
      }
    },
    [scope, userId],
  )

  useEffect(() => {
    const cached = cacheForScope(scope, userId)
    if (cached) {
      setListings(cached)
      setLoading(false)
      return
    }

    setListings([])
    setLoading(true)
    let cancelled = false

    void loadMarketListings(scope, userId).then((next) => {
      if (!cancelled) {
        setListings(next)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [scope, userId])

  return { listings, loading, refresh }
}

export function invalidateMarketListingsCache() {
  cacheAll = null
  cacheMine = null
  cacheMineUserId = null
}

export function prefetchMarketListings(
  scope: 'all' | 'mine' = 'all',
  userId?: string | null,
): Promise<PlayerMarketListing[]> {
  return loadMarketListings(scope, userId)
}
