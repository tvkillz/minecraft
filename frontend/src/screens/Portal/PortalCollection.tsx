'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import gameConfig from '@project/game-config'
import ClearDeckModal from '@/components/collection/ClearDeckModal'
import { useCollectionMode } from '@/components/collection/CollectionModeContext'
import SellCardModal from '@/components/collection/SellCardModal'
import Card from '@/components/CardPlaceholder/Card'
import CardPreviewPanel from '@/components/cards/CardPreviewPanel'
import '@/components/CardPlaceholder/styles.css'
import MarketToast from '@/components/market/MarketToast'
import { Button } from '@/components/ui/Button/Button'
import { usePlayerDecks } from '@/hooks/usePlayerDecks'
import { useCardCatalog } from '@/hooks/useCardCatalog'
import { usePlayerInventory } from '@/hooks/usePlayerInventory'
import { toCardDisplayProps } from '@/lib/cards'
import { formatCardStat } from '@/lib/cards/numerals'
import { preloadImage } from '@/lib/cards/preload'
import { DOMAIN_GLOW, domainLabel } from '@/lib/cards/domains'
import { formatRarityLabel, rarityTierOrder } from '@/lib/cards/rarity'
import type { CardRarity, CardRecord } from '@/lib/cards/types'
import { appConfig } from '@/config'
import {
  canAddToDraftDeck,
  canRemoveFromDraftDeck,
} from '@/lib/inventory/deckLimits'
import { MARKET_SORT_OPTIONS, sortMarketCards, type MarketSort } from '@/lib/market/sort'
import {
  DEFAULT_MAX_DECK_CARDS,
  MAX_COPIES_PER_CARD,
  createPlayerDeck,
  deckCardCount,
  savePlayerDeck,
  type DeckCardEntry,
  type PlayerDeck,
} from '@/lib/decks'
import './PortalCollection.css'
import './PortalMarketGrid.css'
import './MarketCard.css'

const GRID_COLUMNS = 6
const ROWS_PER_PAGE = 4
const PAGE_SIZE = GRID_COLUMNS * ROWS_PER_PAGE
import {
  computeCardHoverPreviewPosition,
  type CardHoverPreviewPosition,
} from '@/lib/cards/hoverPreview'

const RARITIES: CardRarity[] = rarityTierOrder()

export default function PortalCollection() {
  const deckStatNumerals = appConfig.landing?.variant === 'iyashikei' ? 'kanji' : 'arabic'
  const { cards: catalog } = useCardCatalog()
  const { ownedBySlug, loading: inventoryLoading, refresh: refreshInventory } = usePlayerInventory()
  const { decks, loading: decksLoading, refresh, replaceDeck, userId } = usePlayerDecks()

  const [activeDeckId, setActiveDeckId] = useState<string>('')
  const [draftCards, setDraftCards] = useState<DeckCardEntry[]>([])
  const [savedOnceByDeck, setSavedOnceByDeck] = useState<Record<string, boolean>>({})
  const [savingDeckId, setSavingDeckId] = useState<string | null>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const { mode: collectionMode } = useCollectionMode()
  const isSellMode = collectionMode === 'sell'
  const [sellCard, setSellCard] = useState<CardRecord | null>(null)

  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all')
  const [sort, setSort] = useState<MarketSort>('rarity')
  const [page, setPage] = useState(0)

  const activeDeck = useMemo(
    () => decks.find((d) => d.id === activeDeckId) ?? decks[0],
    [decks, activeDeckId],
  )

  const domains = useMemo(() => {
    const fromConfig = (gameConfig.domains ?? []).map((d: { id: string }) => d.id)
    if (fromConfig.length) return fromConfig
    return [...new Set(catalog.map((c) => c.domain))].sort()
  }, [catalog])

  const domainLabels = useMemo(
    () => (gameConfig.domainLabels as Record<string, string>) ?? {},
    [],
  )

  const ownedCards = useMemo(() => {
    return catalog.filter((card) => (ownedBySlug.get(card.slug) ?? 0) > 0)
  }, [catalog, ownedBySlug])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matched = ownedCards.filter((card) => {
      if (domainFilter !== 'all' && card.domain !== domainFilter) return false
      if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
      if (query && !card.title.toLowerCase().includes(query)) return false
      return true
    })
    return sortMarketCards(matched, sort)
  }, [ownedCards, domainFilter, rarityFilter, search, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)

  const pageCards = useMemo(() => {
    const start = safePage * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const collectionStats = useMemo(() => {
    const sumCopies = (cards: CardRecord[]) =>
      cards.reduce((sum, card) => sum + (ownedBySlug.get(card.slug) ?? 0), 0)

    return {
      uniqueOwned: ownedCards.length,
      totalCopies: sumCopies(ownedCards),
      filteredUnique: filtered.length,
      filteredCopies: sumCopies(filtered),
    }
  }, [ownedCards, filtered, ownedBySlug])

  const draftCount = useMemo(
    () => (activeDeck ? deckCardCount({ ...activeDeck, cards: draftCards }) : 0),
    [activeDeck, draftCards],
  )

  const deckSaving = activeDeck ? savingDeckId === activeDeck.id : false
  const saveLabel =
    activeDeck && savedOnceByDeck[activeDeck.id] ? 'Update Deck' : 'Save Deck'

  useEffect(() => {
    void refreshInventory({ silent: true })
  }, [refreshInventory])

  useEffect(() => {
    if (!activeDeckId && decks.length > 0) {
      setActiveDeckId(decks[0].id)
    }
  }, [decks, activeDeckId])

  useEffect(() => {
    setSavedOnceByDeck((prev) => {
      const next = { ...prev }
      for (const deck of decks) {
        if (deck.cards.length > 0) next[deck.id] = true
      }
      return next
    })
  }, [decks])

  useEffect(() => {
    if (!activeDeck) return
    setDraftCards(activeDeck.cards.map((entry) => ({ ...entry })))
  }, [activeDeck?.id])

  useEffect(() => {
    setPage(0)
  }, [domainFilter, rarityFilter, search, sort])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const persistDeck = useCallback(
    async (deck: PlayerDeck, options?: { trackSaving?: boolean }) => {
      const trackSaving = options?.trackSaving ?? false
      if (trackSaving) setSavingDeckId(deck.id)
      const previous = decks.find((d) => d.id === deck.id)
      replaceDeck(deck)
      try {
        const saved = await savePlayerDeck(userId, deck)
        replaceDeck(saved)
        return saved
      } catch {
        if (previous) replaceDeck(previous)
        return null
      } finally {
        if (trackSaving) setSavingDeckId(null)
      }
    },
    [decks, replaceDeck, userId],
  )

  const addToDraft = (slug: string, cardId: string) => {
    if (!activeDeck) return
    const owned = ownedBySlug.get(slug) ?? 0
    const inDeck = draftCards.find((c) => c.slug === slug)
    const inDeckQty = inDeck?.quantity ?? 0

    if (
      !canAddToDraftDeck(
        owned,
        inDeckQty,
        MAX_COPIES_PER_CARD,
        draftCount,
        activeDeck.maxCards,
      )
    ) {
      return
    }

    const nextCards = inDeck
      ? draftCards.map((c) =>
          c.slug === slug ? { ...c, quantity: c.quantity + 1 } : c,
        )
      : [
          ...draftCards,
          {
            cardId,
            slug,
            quantity: 1,
            sortOrder: draftCards.length,
          },
        ]

    setDraftCards(nextCards)
  }

  const removeFromDraft = (slug: string) => {
    const inDeck = draftCards.find((c) => c.slug === slug)
    if (!inDeck || !canRemoveFromDraftDeck(inDeck.quantity)) return

    const nextCards =
      inDeck.quantity <= 1
        ? draftCards.filter((c) => c.slug !== slug)
        : draftCards.map((c) =>
            c.slug === slug ? { ...c, quantity: c.quantity - 1 } : c,
          )

    setDraftCards(nextCards)
  }

  const handleSaveDeck = async () => {
    if (!activeDeck || deckSaving) return
    const nextDeck: PlayerDeck = {
      ...activeDeck,
      cards: draftCards,
      updatedAt: new Date().toISOString(),
    }
    const saved = await persistDeck(nextDeck, { trackSaving: true })
    if (saved) {
      setSavedOnceByDeck((prev) => ({ ...prev, [activeDeck.id]: true }))
      setToastMessage(`${activeDeck.name} saved`)
    }
  }

  const handleClearDeck = async () => {
    if (!activeDeck || clearing) return
    setClearing(true)
    const nextDeck: PlayerDeck = {
      ...activeDeck,
      cards: [],
      updatedAt: new Date().toISOString(),
    }
    const saved = await persistDeck(nextDeck, { trackSaving: true })
    setClearing(false)
    setClearOpen(false)
    if (saved) {
      setDraftCards([])
      setToastMessage(`${activeDeck.name} has been cleared`)
    }
  }

  const handleCreateDeck = async () => {
    const created = await createPlayerDeck(
      userId,
      `Deck ${decks.length + 1}`,
      DEFAULT_MAX_DECK_CARDS,
    )
    await refresh({ silent: true })
    setActiveDeckId(created.id)
    setDraftCards([])
  }

  const loading = decksLoading || inventoryLoading

  if (loading) {
    return <p className="portal-collection__status">Loading your collection…</p>
  }

  if (!activeDeck) {
    return (
      <p className="portal-collection__status">
        No decks yet. Create one to start building.
      </p>
    )
  }

  const sortedDraft = [...draftCards].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="portal-collection">
      <MarketToast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      <div className={`portal-collection__layout${isSellMode ? ' portal-collection__layout--sell' : ''}`}>
        <header className="portal-collection__header">
          <div className="portal-market__toolbar" role="search">
            <label className="portal-market__search">
              <span className="visually-hidden">Search cards by title</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title…"
                autoComplete="off"
                spellCheck={false}
              />
            </label>

            <label className="portal-market__select-wrap">
              <span className="visually-hidden">Filter by domain</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                aria-label="Domain"
              >
                <option value="all">All domains</option>
                {domains.map((domainId) => (
                  <option key={domainId} value={domainId}>
                    {domainLabels[domainId] ?? domainId}
                  </option>
                ))}
              </select>
            </label>

            <label className="portal-market__select-wrap">
              <span className="visually-hidden">Filter by type</span>
              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value as CardRarity | 'all')}
                aria-label="Card type"
              >
                <option value="all">All types</option>
                {RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {formatRarityLabel(rarity)}
                  </option>
                ))}
              </select>
            </label>

            <label className="portal-market__select-wrap">
              <span className="visually-hidden">Sort cards</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as MarketSort)}
                aria-label="Sort by"
              >
                {MARKET_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!isSellMode ? (
            <div className="portal-collection__deck-tabs" role="tablist" aria-label="Your decks">
              {decks.map((deck) => {
                const isActive = deck.id === activeDeck.id
                return (
                  <button
                    key={deck.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`portal-collection__deck-tab${isActive ? ' portal-collection__deck-tab--active' : ''}`}
                    onClick={() => setActiveDeckId(deck.id)}
                  >
                    {deck.name}
                  </button>
                )
              })}
              <Button type="button" variant="secondary" size="sm" onClick={() => void handleCreateDeck()}>
                + Add deck
              </Button>
            </div>
          ) : null}
        </header>

        {!isSellMode ? (
        <aside className="portal-collection__deck-panel" aria-label="Deck builder">
          <header className="portal-collection__deck-panel-head">
            <span className="portal-collection__deck-count">
              {draftCount}/{activeDeck.maxCards}
            </span>
            <div className="portal-collection__deck-panel-actions">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={deckSaving}
                aria-busy={deckSaving}
                onClick={() => void handleSaveDeck()}
              >
                {deckSaving ? 'Saving…' : saveLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={
                  deckSaving || (draftCount === 0 && activeDeck.cards.length === 0)
                }
                onClick={() => setClearOpen(true)}
              >
                Clear
              </Button>
            </div>
          </header>

          {sortedDraft.length === 0 ? (
            <p className="portal-collection__deck-empty">
              Add cards from your collection using + below each card.
            </p>
          ) : (
            <ul className="portal-collection__deck-list">
              {sortedDraft.map((entry) => {
                const record = catalog.find((c) => c.slug === entry.slug)
                if (!record) return null
                return (
                  <li key={entry.slug} className="portal-collection__deck-row">
                    <span
                      className="portal-collection__mana-pip"
                      aria-label={`Mana ${record.stats.mana}`}
                    >
                      <span className="portal-collection__mana-pip-value">
                        {formatCardStat(record.stats.mana, deckStatNumerals)}
                      </span>
                    </span>
                    <span
                      className="portal-collection__domain-dot"
                      style={{ background: DOMAIN_GLOW[record.domain] ?? '#888' }}
                      title={domainLabel(record.domain)}
                      aria-hidden
                    />
                    <span className="portal-collection__deck-row-title">{record.title}</span>
                    <span className="portal-collection__deck-row-qty">×{entry.quantity}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
        ) : null}

        <div className="portal-collection__main">
          {ownedCards.length > 0 ? (
            <div className="portal-collection__stats" aria-live="polite">
              <p className="portal-collection__stats-summary">
                <span className="portal-collection__stats-item">
                  <strong>{collectionStats.uniqueOwned}</strong> unique card
                  {collectionStats.uniqueOwned === 1 ? '' : 's'}
                </span>
                <span className="portal-collection__stats-sep" aria-hidden="true">
                  ·
                </span>
                <span className="portal-collection__stats-item">
                  <strong>{collectionStats.totalCopies}</strong> total cop
                  {collectionStats.totalCopies === 1 ? 'y' : 'ies'} owned
                </span>
              </p>
              {collectionStats.filteredUnique !== collectionStats.uniqueOwned ||
              collectionStats.filteredCopies !== collectionStats.totalCopies ? (
                <p className="portal-collection__stats-filtered">
                  Showing <strong>{collectionStats.filteredUnique}</strong> card
                  {collectionStats.filteredUnique === 1 ? '' : 's'} ·{' '}
                  <strong>{collectionStats.filteredCopies}</strong> cop
                  {collectionStats.filteredCopies === 1 ? 'y' : 'ies'} in view
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="portal-market__count" aria-live="polite">
            {filtered.length} owned card{filtered.length === 1 ? '' : 's'}
            {filtered.length > PAGE_SIZE
              ? ` · Page ${safePage + 1} of ${pageCount}`
              : ''}
          </p>

          {ownedCards.length === 0 ? (
            <p className="portal-collection__empty">
              You do not own any cards yet. Buy cards with credits in the Market.
            </p>
          ) : filtered.length === 0 ? (
            <p className="portal-collection__empty">No cards match your search or filters.</p>
          ) : (
            <>
              <div className="portal-collection__grid" aria-label="Owned cards">
                {pageCards.map((card, index) => {
                  const ownedQty = ownedBySlug.get(card.slug) ?? 0
                  return (
                    <CollectionOwnedCard
                      key={card.id}
                      card={card}
                      index={index}
                      ownedQty={ownedQty}
                      draftQty={draftCards.find((c) => c.slug === card.slug)?.quantity ?? 0}
                      deckTotal={draftCount}
                      maxDeckCards={activeDeck.maxCards}
                      sellMode={isSellMode}
                      onAdd={() => addToDraft(card.slug, card.id)}
                      onRemove={() => removeFromDraft(card.slug)}
                      onSell={() => setSellCard(card)}
                    />
                  )
                })}
              </div>

              {pageCount > 1 ? (
                <nav className="portal-collection__pagination" aria-label="Collection pages">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safePage <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="portal-collection__pagination-label">
                    Page {safePage + 1} of {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  >
                    Next
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      </div>

      <SellCardModal
        card={sellCard}
        onClose={() => setSellCard(null)}
        onListed={() => {
          if (sellCard) {
            setToastMessage(`${sellCard.title} listed on the market`)
            void Promise.all([
              refreshInventory({ silent: true }),
              refresh({ silent: true }),
            ])
          }
        }}
      />

      <ClearDeckModal
        deckName={clearOpen ? activeDeck.name : null}
        onClose={() => setClearOpen(false)}
        onConfirm={() => void handleClearDeck()}
        busy={clearing}
      />
    </div>
  )
}

type CollectionOwnedCardProps = {
  card: CardRecord
  index: number
  ownedQty: number
  draftQty: number
  deckTotal: number
  maxDeckCards: number
  sellMode: boolean
  onAdd: () => void
  onRemove: () => void
  onSell: () => void
}

function CollectionOwnedCard({
  card,
  index,
  ownedQty,
  draftQty,
  deckTotal,
  maxDeckCards,
  sellMode,
  onAdd,
  onRemove,
  onSell,
}: CollectionOwnedCardProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [previewPos, setPreviewPos] = useState<CardHoverPreviewPosition | null>(null)
  const [mounted, setMounted] = useState(false)

  const canAdd = canAddToDraftDeck(
    ownedQty,
    draftQty,
    MAX_COPIES_PER_CARD,
    deckTotal,
    maxDeckCards,
  )
  const canRemove = canRemoveFromDraftDeck(draftQty)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePreviewPosition = () => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect) return
    setPreviewPos(computeCardHoverPreviewPosition(rect))
  }

  const showPreview = () => {
    updatePreviewPosition()
    setHovered(true)
    void preloadImage(card.artUrl)
  }

  const hidePreview = () => {
    setHovered(false)
    setPreviewPos(null)
  }

  return (
    <article
      className={`collection-owned-card${hovered ? ' collection-owned-card--hovered' : ''}`}
      aria-label={`${card.title}, ${ownedQty} owned`}
      onMouseEnter={showPreview}
      onMouseLeave={hidePreview}
      onFocus={showPreview}
      onBlur={hidePreview}
    >
      <div className="collection-owned-card__frame" ref={frameRef}>
        <span className="collection-owned-card__owned-badge" aria-hidden="true">
          ×{ownedQty}
        </span>
        <Card
          {...toCardDisplayProps(card, index)}
          totalCards={1}
          fanIndex={0}
          layoutMode="market"
          showAbility={false}
          showKeywords={false}
          showRarity={false}
          thumbOnly
        />
      </div>
      {sellMode ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="collection-owned-card__sell-btn"
          disabled={ownedQty < 1 || (card.priceCents ?? 0) <= 0}
          onClick={onSell}
        >
          Sell card
        </Button>
      ) : (
        <div className="collection-owned-card__qty" aria-label={`${draftQty} in deck`}>
          <button
            type="button"
            className="collection-owned-card__qty-btn"
            disabled={!canRemove}
            aria-label={`Remove one ${card.title} from deck`}
            onClick={onRemove}
          >
            −
          </button>
          <span className="collection-owned-card__qty-value">{draftQty}</span>
          <button
            type="button"
            className="collection-owned-card__qty-btn"
            disabled={!canAdd}
            aria-label={`Add one ${card.title} to deck`}
            onClick={onAdd}
          >
            +
          </button>
        </div>
      )}
      {mounted && hovered && previewPos
        ? createPortal(
            <div
              className="market-card-popover"
              style={
                {
                  '--glow-color': card.glowColor,
                  top: previewPos.top,
                  left: previewPos.left,
                  width: previewPos.width,
                  height: previewPos.height,
                } as CSSProperties
              }
            >
              <CardPreviewPanel card={toCardDisplayProps(card, 0)} />
            </div>,
            document.body,
          )
        : null}
    </article>
  )
}
