'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/components/providers/AuthProvider'
import { fetchPlayerDecks, type DeckSummary, type PlayerDeck } from '@/lib/decks'
import { isSupabaseConfigured } from '@/lib/supabase'

function decksToSummaries(decks: PlayerDeck[]): DeckSummary[] {
  return decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    cards: deck.cards.reduce((sum, c) => sum + c.quantity, 0),
    maxCards: deck.maxCards,
  }))
}

export function usePlayerDecks() {
  const { user, session, loading: authLoading } = useAuth()
  const userId = user?.id ?? session?.user?.id
  const [decks, setDecks] = useState<PlayerDeck[]>([])
  const [summaries, setSummaries] = useState<DeckSummary[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (isSupabaseConfigured() && !userId) {
      setDecks([])
      setSummaries([])
      if (!options?.silent) setLoading(false)
      return
    }

    const effectiveUserId = userId ?? 'guest'
    if (!options?.silent) setLoading(true)
    try {
      const all = await fetchPlayerDecks(effectiveUserId)
      setDecks(all)
      setSummaries(decksToSummaries(all))
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }, [userId])

  const replaceDeck = useCallback((deck: PlayerDeck) => {
    setDecks((prev) => prev.map((d) => (d.id === deck.id ? deck : d)))
    setSummaries((prev) =>
      prev.map((s) =>
        s.id === deck.id
          ? {
              id: deck.id,
              name: deck.name,
              cards: deck.cards.reduce((sum, c) => sum + c.quantity, 0),
              maxCards: deck.maxCards,
            }
          : s,
      ),
    )
  }, [])

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }
    void refresh()
  }, [authLoading, refresh])

  return { decks, summaries, loading, refresh, replaceDeck, userId: userId ?? 'guest' }
}
