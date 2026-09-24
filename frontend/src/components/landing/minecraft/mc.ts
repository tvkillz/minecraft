import { appConfig } from '@/config'

export function mcHref(domainId: string): string {
  if (domainId === 'ranks') return appConfig.domain.anchors.play
  if (domainId === 'coins') return appConfig.domain.anchors.market
  if (domainId === 'games' || domainId === 'minigames') return appConfig.domain.anchors.leaderboard
  return appConfig.domain.routes.portalStore
}
