import { invokeCommerceAction } from '@/lib/commerce/api'
import type { PlayerMarketListing } from '@/lib/commerce/types'

export const LISTING_COMMISSION_RATE = 0.2
export const LISTING_MIN_PRICE_RATIO = 0.75

export function listingMinPriceCredits(marketPriceCredits: number): number {
  return Math.ceil(marketPriceCredits * LISTING_MIN_PRICE_RATIO)
}

export function listingSellerProceeds(priceCredits: number): number {
  return Math.floor(priceCredits * (1 - LISTING_COMMISSION_RATE))
}

/** @deprecated Use listingMinPriceCredits */
export const minListingPrice = listingMinPriceCredits

/** @deprecated Use listingSellerProceeds */
export const sellerProceeds = listingSellerProceeds

export async function fetchMarketListings(
  scope: 'all' | 'mine' = 'all',
): Promise<PlayerMarketListing[]> {
  const res = await invokeCommerceAction({ type: 'market_listings_list', scope })
  if (res.error || !res.listings) return []
  return res.listings
}

export async function createMarketListing(
  cardId: string,
  priceCredits: number,
): Promise<{
  ok: boolean
  error?: string
  message?: string
  minPriceCredits?: number
  marketPriceCredits?: number
}> {
  const res = await invokeCommerceAction({
    type: 'market_listing_create',
    cardId,
    priceCredits,
  })
  if (res.error) {
    return {
      ok: false,
      error: res.error,
      message: res.message,
      minPriceCredits: res.minPriceCredits,
      marketPriceCredits: res.marketPriceCredits,
    }
  }
  return { ok: true }
}

export async function cancelMarketListing(
  listingId: string,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const res = await invokeCommerceAction({ type: 'market_listing_cancel', listingId })
  if (res.error) return { ok: false, error: res.error, message: res.message }
  return { ok: true }
}

export async function buyMarketListing(
  listingId: string,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const res = await invokeCommerceAction({ type: 'buy_market_listing', listingId })
  if (res.error) return { ok: false, error: res.error, message: res.message }
  return { ok: true }
}
