import type { ElementCategory } from '@/config/schema'

import gameConfig from '@project/game-config'

/** Domain id from the active project's game/domains.json (e.g. kronos, terra). */
export type CardDomain = string

type DomainEntry = { id: string; label: string }

const domainEntries = (gameConfig.domains ?? []) as DomainEntry[]

export const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
  domainEntries.map((d) => [d.id, d.label]),
)

export function domainLabel(domain: string): string {
  return DOMAIN_LABEL[domain] ?? (gameConfig.domainLabels as Record<string, string>)?.[domain] ?? domain
}

export const DOMAIN_TO_CATEGORY = gameConfig.domainToCategory as Record<string, ElementCategory>

export const DOMAIN_GLOW = gameConfig.domainGlow as Record<string, string>

/** Landing realm id → featured card slug (one per location). */
export const FEATURED_CARD_BY_LOCATION = gameConfig.featuredByLocation as Record<string, string>

export const LOCATION_ORDER = gameConfig.locationOrder as readonly string[]

export const KEYWORDS_GLOSSARY = gameConfig.keywords as Record<string, string>
