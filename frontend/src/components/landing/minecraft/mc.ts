import { appConfig } from '@/config'

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
