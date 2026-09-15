import type { CardDisplayProps } from '../components/CardPlaceholder/Card'
import { LANDING_CARDS, toCardDisplayProps } from '@/lib/cards'
import { appConfig } from './app.config'

export const LOCATIONS = appConfig.theme.locations

export const LOCATION_SLIDES = LOCATIONS.map(({ id, name, image }) => ({
  id,
  name,
  image,
}))

export const HERO_CARDS: CardDisplayProps[] = LANDING_CARDS.map((card) =>
  toCardDisplayProps(card, card.fanIndex ?? 0),
)

export function getLocationImage(id: string): string {
  return LOCATIONS.find((l) => l.id === id)?.image ?? LOCATIONS[0].image
}

export function getArenaBackground(): string {
  return getLocationImage(appConfig.arts.defaultArenaLocationId)
}

export function getLobbyBackground(): string {
  if (appConfig.arts.playLobbyBackground) {
    return appConfig.arts.playLobbyBackground
  }
  return getLocationImage(appConfig.arts.defaultLobbyLocationId)
}

export function resolveNavHref(link: {
  href: string
  route?: keyof typeof appConfig.domain.routes
  anchor?: keyof typeof appConfig.domain.anchors
}): string {
  if (link.route) return appConfig.domain.routes[link.route]
  if (link.anchor) return appConfig.domain.anchors[link.anchor]
  return link.href
}

export function resolveCtaHref(cta: {
  route?: keyof typeof appConfig.domain.routes
  anchor?: keyof typeof appConfig.domain.anchors
}): string {
  if (cta.route) return appConfig.domain.routes[cta.route]
  if (cta.anchor) return appConfig.domain.anchors[cta.anchor]
  return '#'
}

export function resolveAccountMenuHref(
  route: keyof typeof appConfig.domain.routes,
): string {
  return appConfig.domain.routes[route]
}

export function formatCredits(amount: number): string {
  return amount.toLocaleString('en-US')
}

export function formatEurPrice(amount: number, symbol = appConfig.credits.currencySymbol): string {
  return `${symbol}${amount.toFixed(2)}`
}

/** Format euro cents as a currency string (e.g. 299 → €2.99). */
export function formatPriceCents(cents: number, symbol = appConfig.credits.currencySymbol): string {
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export function creditsToEur(credits: number): number {
  return credits / appConfig.credits.creditsPerEur
}
