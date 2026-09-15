import { invokeCommerceAction } from '@/lib/commerce/api'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getSupabaseAccessToken } from '@/lib/supabase/auth-headers'

import {
  createDefaultLocalDecks,
  deleteLocalDeck,
  loadLocalDecks,
  saveLocalDeck,
} from './localStorage'
import { isTutorialDeck } from './buildTutorialDeck'
import type { DeckCardEntry, DeckSummary, PlayerDeck } from './types'
import { DEFAULT_MAX_DECK_CARDS } from './types'

let ensuredTestDeckUserId: string | null = null
let ensureTestDeckInflight: Promise<void> | null = null

/** Idempotent per signed-in user — dedupes parallel callers (auth, deck fetch, etc.). */
export async function ensureTestDeckProvisioned(): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  const accessToken = await getSupabaseAccessToken()
  if (!userId || !accessToken) return

  if (ensuredTestDeckUserId === userId) return
  if (ensureTestDeckInflight) return ensureTestDeckInflight

  ensureTestDeckInflight = (async () => {
    try {
      const res = await invokeCommerceAction({ type: 'ensure_test_deck' })
      if (!res.error) ensuredTestDeckUserId = userId
    } catch {
      /* offline or API unavailable */
    }
  })().finally(() => {
    ensureTestDeckInflight = null
  })

  return ensureTestDeckInflight
}

export function resetTestDeckProvisionCache(): void {
  ensuredTestDeckUserId = null
  ensureTestDeckInflight = null
}

interface DbDeckRow {
  id: string
  name: string
  max_cards: number
  updated_at: string
  player_deck_cards: {
    card_id: string
    quantity: number
    sort_order: number
    cards: { slug: string } | null
  }[]
}

function mapDeck(row: DbDeckRow): PlayerDeck {
  const cards: DeckCardEntry[] = (row.player_deck_cards ?? [])
    .map((entry) => ({
      cardId: entry.card_id,
      slug: entry.cards?.slug ?? entry.card_id,
      quantity: entry.quantity,
      sortOrder: entry.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    id: row.id,
    name: row.name,
    maxCards: row.max_cards,
    cards,
    updatedAt: row.updated_at,
  }
}

function toSummary(deck: PlayerDeck): DeckSummary {
  const cards = deck.cards.reduce((sum, c) => sum + c.quantity, 0)
  return { id: deck.id, name: deck.name, cards, maxCards: deck.maxCards }
}

function filterPlayerDecks(decks: PlayerDeck[]): PlayerDeck[] {
  return decks.filter((deck) => !isTutorialDeck(deck))
}

export async function fetchPlayerDecks(userId: string): Promise<PlayerDeck[]> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    let local = loadLocalDecks(userId)
    if (local.length === 0) {
      local = createDefaultLocalDecks(userId)
    }
    return filterPlayerDecks(local)
  }

  await ensureTestDeckProvisioned()

  const { data, error } = await supabase
    .from('player_decks')
    .select(
      `
      id, name, max_cards, updated_at,
      player_deck_cards (
        card_id, quantity, sort_order,
        cards ( slug )
      )
    `,
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error || !data?.length) {
    const local = loadLocalDecks(userId)
    if (local.length > 0) return filterPlayerDecks(local)
    return filterPlayerDecks(createDefaultLocalDecks(userId))
  }

  return filterPlayerDecks((data as DbDeckRow[]).map(mapDeck))
}

export async function fetchDeckSummaries(userId: string): Promise<DeckSummary[]> {
  const decks = await fetchPlayerDecks(userId)
  return decks.map(toSummary)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function savePlayerDeck(
  userId: string,
  deck: PlayerDeck,
): Promise<PlayerDeck> {
  if (isTutorialDeck(deck)) {
    return deck
  }

  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return saveLocalDeck(userId, deck)
  }

  const updatedAt = new Date().toISOString()
  let deckId = deck.id

  if (UUID_RE.test(deck.id)) {
    const { error } = await supabase.from('player_decks').upsert({
      id: deck.id,
      user_id: userId,
      name: deck.name,
      max_cards: deck.maxCards,
      updated_at: updatedAt,
    })
    if (error) return saveLocalDeck(userId, deck)
  } else {
    const { data, error } = await supabase
      .from('player_decks')
      .insert({
        user_id: userId,
        name: deck.name,
        max_cards: deck.maxCards,
      })
      .select('id')
      .single()
    if (error || !data) return saveLocalDeck(userId, deck)
    deckId = data.id as string
  }

  await supabase.from('player_deck_cards').delete().eq('deck_id', deckId)

  if (deck.cards.length > 0) {
    const { data: cardRows } = await supabase.from('cards').select('id, slug').in(
      'slug',
      deck.cards.map((c) => c.slug),
    )

    const slugToId = new Map((cardRows ?? []).map((r) => [r.slug as string, r.id as string]))

    const rows = deck.cards
      .map((entry, index) => {
        const cardId = slugToId.get(entry.slug) ?? entry.cardId
        if (!cardId) return null
        return {
          deck_id: deckId,
          card_id: cardId,
          quantity: entry.quantity,
          sort_order: entry.sortOrder ?? index,
        }
      })
      .filter(Boolean)

    if (rows.length > 0) {
      await supabase.from('player_deck_cards').insert(rows)
    }
  }

  const refreshed = await fetchPlayerDecks(userId)
  return refreshed.find((d) => d.id === deckId) ?? { ...deck, id: deckId }
}

export async function createPlayerDeck(
  userId: string,
  name: string,
  maxCards: number = DEFAULT_MAX_DECK_CARDS,
): Promise<PlayerDeck> {
  const deck: PlayerDeck = {
    id: crypto.randomUUID(),
    name,
    maxCards,
    cards: [],
    updatedAt: new Date().toISOString(),
  }
  return savePlayerDeck(userId, deck)
}

export async function removePlayerDeck(userId: string, deckId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    deleteLocalDeck(deckId)
    return
  }
  await supabase.from('player_decks').delete().eq('id', deckId).eq('user_id', userId)
}
