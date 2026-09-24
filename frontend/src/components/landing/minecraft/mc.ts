import type { MouseEvent } from 'react'

export const SHOP_HASH_EVENT = 'mc-shop-hash'

export function mcHref(domainId: string): string {
  if (domainId === 'ranks') return '#ranks'
  if (domainId === 'coins') return '#coins'
  if (domainId === 'games' || domainId === 'minigames') return '#minigames'
  return '#'
}

export function mcItemHref(item: { slug?: string; id?: string; domain?: string }): string {
  const key = item.slug || item.id
  if (key) return `#${key}`
  return mcHref(item.domain ?? '')
}

export function openShopHash(href: string, event?: MouseEvent<HTMLAnchorElement>) {
  event?.preventDefault()
  const next = href.startsWith('#') ? href : `#${href}`
  if (window.location.hash !== next) {
    history.pushState(null, '', next)
  }
  window.dispatchEvent(new Event(SHOP_HASH_EVENT))
}
