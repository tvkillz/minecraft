'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import gameConfig from '@project/game-config'
import BuyCardModal from '@/components/market/BuyCardModal'
import BuyListingModal from '@/components/market/BuyListingModal'
import MarketToast from '@/components/market/MarketToast'
import { Button } from '@/components/ui/Button/Button'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCardCatalog } from '@/hooks/useCardCatalog'
import { useMarketCart } from '@/hooks/useMarketCart'
import { invalidateMarketListingsCache, useMarketListings } from '@/hooks/useMarketListings'
import { formatRarityLabel, rarityTierOrder } from '@/lib/cards/rarity'
import type { CardRarity, CardRecord } from '@/lib/cards/types'
import type { PlayerMarketListing } from '@/lib/commerce/types'
import { MARKET_SORT_OPTIONS, sortMarketCards, type MarketSort } from '@/lib/market/sort'
import MarketCard from './MarketCard'
import PlayerListingCard from './PlayerListingCard'
import './PortalMarketGrid.css'

const GRID_COLUMNS = 5
const ROWS_PER_PAGE = 4
const PAGE_SIZE = GRID_COLUMNS * ROWS_PER_PAGE

const RARITIES: CardRarity[] = rarityTierOrder()

type MarketScope = 'all' | 'mine'

type CatalogRow = { kind: 'catalog'; card: CardRecord }
type ListingRow = { kind: 'listing'; card: CardRecord; listing: PlayerMarketListing }
type MarketRow = CatalogRow | ListingRow
function cardMatchesFilters(
  card: CardRecord,
  search: string,
  domainFilter: string,
  rarityFilter: CardRarity | 'all',
): boolean {
  if (domainFilter !== 'all' && card.domain !== domainFilter) return false
  if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false
  const query = search.trim().toLowerCase()
  if (query && !card.title.toLowerCase().includes(query)) return false
  return true
}

export default function PortalMarketGrid() {
  const { cards: catalog, loading: catalogLoading } = useCardCatalog()
  const [marketScope, setMarketScope] = useState<MarketScope>('all')
  const listingsScope = marketScope === 'mine' ? 'mine' : 'all'
  const { listings, loading: listingsLoading, refresh: refreshListings } =
    useMarketListings(listingsScope)
  const { user, session } = useAuth()
  const userId = user?.id ?? session?.user?.id
  const { addItem } = useMarketCart()
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all')
  const [sort, setSort] = useState<MarketSort>('rarity')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [buyCard, setBuyCard] = useState<CardRecord | null>(null)
  const [buyListing, setBuyListing] = useState<{
    card: CardRecord
    listing: PlayerMarketListing
  } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const catalogById = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog])

  const domains = useMemo(() => {
    const fromConfig = (gameConfig.domains ?? []).map((d: { id: string; label: string }) => d.id)
    if (fromConfig.length) return fromConfig
    return [...new Set(catalog.map((c) => c.domain))].sort()
  }, [catalog])

  const domainLabels = useMemo(
    () => (gameConfig.domainLabels as Record<string, string>) ?? {},
    [],
  )

  const filteredCatalog = useMemo(() => {
    if (marketScope === 'mine') return []
    const matched = catalog.filter((card) =>
      cardMatchesFilters(card, search, domainFilter, rarityFilter),
    )
    return sortMarketCards(matched, sort)
  }, [catalog, domainFilter, rarityFilter, search, sort, marketScope])

  const filteredListings = useMemo(() => {
    const source =
      marketScope === 'mine' && userId
        ? (listings ?? []).filter((listing) => listing.seller_id === userId)
        : (listings ?? [])

    const matched = source.filter((listing) => {
      const card = catalogById.get(listing.card_id)
      return card ? cardMatchesFilters(card, search, domainFilter, rarityFilter) : false
    })

    const withCards = matched
      .map((listing) => ({ listing, card: catalogById.get(listing.card_id)! }))
      .filter((row): row is { listing: PlayerMarketListing; card: CardRecord } => Boolean(row.card))

    const sorted = sortMarketCards(
      withCards.map((row) => row.card),
      sort,
    )

    const order = new Map(sorted.map((card, index) => [card.id, index]))
    return withCards.sort((a, b) => (order.get(a.card.id) ?? 0) - (order.get(b.card.id) ?? 0))
  }, [listings, catalogById, search, domainFilter, rarityFilter, sort, marketScope, userId])

  const marketRows = useMemo((): MarketRow[] => {
    if (marketScope === 'mine') {
      return filteredListings.map(({ card, listing }) => ({ kind: 'listing', card, listing }))
    }

    const catalogRows: CatalogRow[] = filteredCatalog.map((card) => ({
      kind: 'catalog',
      card,
    }))
    const listingRows: ListingRow[] = filteredListings.map(({ card, listing }) => ({
      kind: 'listing',
      card,
      listing,
    }))
    return [...catalogRows, ...listingRows]
  }, [marketScope, filteredCatalog, filteredListings])

  const visibleRows = useMemo(
    () => marketRows.slice(0, visibleCount),
    [marketRows, visibleCount],
  )

  const hasMore = visibleCount < marketRows.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [domainFilter, rarityFilter, search, sort, marketScope])

  const handleCreditPurchased = useCallback((card: CardRecord) => {
    setToastMessage(`${card.title} added to your collection`)
  }, [])

  const handleListingPurchased = useCallback(
    (card: CardRecord) => {
      setToastMessage(`${card.title} purchased from player listing`)
      void refreshListings({ silent: true })
    },
    [refreshListings],
  )

  const handleAddToCart = useCallback(
    (card: CardRecord) => {
      addItem(card)
    },
    [addItem],
  )

  const handleCancelled = useCallback(() => {
    setToastMessage('Listing removed')
    invalidateMarketListingsCache()
    void refreshListings({ silent: true })
  }, [refreshListings])

  const gridLoading =
    marketScope === 'all'
      ? catalogLoading && catalog.length === 0
      : listingsLoading && (listings ?? []).length === 0

  if (gridLoading) {
    return (
      <p className="portal-market-grid__loading" role="status" aria-live="polite">
        Loading market…
      </p>
    )
  }

  const countLabel =
    marketScope === 'mine'
      ? `${visibleRows.length} of ${marketRows.length} listing${marketRows.length === 1 ? '' : 's'}`
      : `${visibleRows.length} of ${marketRows.length} (${filteredCatalog.length} store · ${filteredListings.length} player listings)`

  return (
    <div className="portal-market">
      <MarketToast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      <div className="portal-market__toolbar" role="search">
        <div className="portal-market__scope-switch" role="group" aria-label="Market filter">
          <button
            type="button"
            className={`portal-market__scope-btn${marketScope === 'all' ? ' portal-market__scope-btn--active' : ''}`}
            aria-pressed={marketScope === 'all'}
            onClick={() => setMarketScope('all')}
          >
            All cards
          </button>
          <button
            type="button"
            className={`portal-market__scope-btn${marketScope === 'mine' ? ' portal-market__scope-btn--active' : ''}`}
            aria-pressed={marketScope === 'mine'}
            onClick={() => setMarketScope('mine')}
          >
            My cards
          </button>
        </div>

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

      <p className="portal-market__count" aria-live="polite">
        Showing {countLabel}
      </p>

      {marketRows.length === 0 ? (
        <p className="portal-market-grid__loading">
          {marketScope === 'mine'
            ? 'You have no cards on the market. List cards from Collection → Sell.'
            : 'No cards match your search or filters.'}
        </p>
      ) : (
        <>
          <div className="portal-market-grid" aria-label="Card market">
            {visibleRows.map((row, index) => {
              if (row.kind === 'catalog') {
                return (
                  <MarketCard
                    key={`catalog-${row.card.id}`}
                    card={row.card}
                    index={index}
                    onBuyCredits={setBuyCard}
                    onAddToCart={handleAddToCart}
                  />
                )
              }

              return (
                <PlayerListingCard
                  key={`listing-${row.listing.id}`}
                  card={row.card}
                  listing={row.listing}
                  index={index}
                  isOwnListing={marketScope === 'mine' || row.listing.seller_id === userId}
                  onBuy={(c, l) => setBuyListing({ card: c, listing: l })}
                  onCancelled={handleCancelled}
                />
              )
            })}
          </div>

          <BuyCardModal
            card={buyCard}
            onClose={() => setBuyCard(null)}
            onPurchased={() => {
              if (buyCard) handleCreditPurchased(buyCard)
            }}
          />

          <BuyListingModal
            listing={buyListing?.listing ?? null}
            cardTitle={buyListing?.card.title ?? ''}
            onClose={() => setBuyListing(null)}
            onPurchased={() => {
              if (buyListing) handleListingPurchased(buyListing.card)
            }}
          />

          {hasMore ? (
            <div className="portal-market__load-more">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
