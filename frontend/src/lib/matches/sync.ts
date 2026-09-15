import type { CardRecord } from '@/lib/cards/types'
import { getCardBySlug, toCardDisplayProps } from '@/lib/cards'
import { DOMAIN_GLOW } from '@/lib/cards/domains'
import { STARTING_MAX_MANA } from '@/lib/game/match/constants'
import type { MatchCardInstance } from '@/lib/game/match/types'
import type { CombatRoundResult, MatchState, VillainPlay } from '@/lib/game/match/types'

import { hydrateMatchState, type PersistedMatchState } from './serialize'

export const MATCH_SYNC_INTERVAL_MS = 1000

export type MatchDbRow = {
  id: string
  revision: number
  state: PersistedMatchState
  last_combat: CombatRoundResult | null
  phase?: string
  status?: string
  opponent_name?: string | null
}

function domainFromSlug(slug: string): string {
  const match = /^([a-z0-9]+)_card_/i.exec(slug)
  return match?.[1]?.toLowerCase() ?? 'unknown'
}

function attachDisplay(instance: MatchCardInstance, catalog: CardRecord[]) {
  if (instance.display) return

  const record = catalog.find((c) => c.slug === instance.slug) ?? getCardBySlug(instance.slug)
  if (record) {
    instance.display = {
      ...toCardDisplayProps(record),
      id: instance.instanceId,
      stats: {
        mana: instance.mana,
        attack: instance.attack,
        health: instance.health,
      },
    }
    return
  }

  const domain = domainFromSlug(instance.slug)
  instance.display = {
    id: instance.instanceId,
    slug: instance.slug,
    title: instance.slug.replace(/_/g, ' '),
    thumbUrl: '',
    artUrl: '',
    stats: {
      mana: instance.mana,
      attack: instance.attack,
      health: instance.health,
    },
    domain,
    glowColor: DOMAIN_GLOW[domain] ?? '#6b7280',
    fanIndex: 0,
  }
}

export function attachDisplayToState(state: MatchState, catalog: CardRecord[]) {
  const all = [
    ...state.hero.hand,
    ...state.hero.board.filter(Boolean),
    ...state.hero.deck,
    ...state.hero.graveyard,
    ...state.villain.hand,
    ...state.villain.board.filter(Boolean),
    ...state.villain.deck,
    ...state.villain.graveyard,
  ] as MatchCardInstance[]
  all.forEach((c) => attachDisplay(c, catalog))
}

export function rowToMatchState(row: MatchDbRow, catalog: CardRecord[]): MatchState {
  const hydrated = hydrateMatchState(row.state)
  attachDisplayToState(hydrated, catalog)
  return hydrated
}

export interface EndTurnSnapshots {
  afterMana: MatchState
  afterVillain: MatchState
  villainPlays: VillainPlay[]
  state: MatchState
  combat: CombatRoundResult
  villainManaBefore: { mana: number; maxMana: number }
}

type EndTurnApiPayload = {
  afterMana: PersistedMatchState
  afterVillain?: PersistedMatchState
  afterBot?: PersistedMatchState
  villainPlays?: VillainPlay[]
  botPlays?: VillainPlay[]
  state: PersistedMatchState
  combat: CombatRoundResult
  villainManaBefore?: { mana: number; maxMana: number }
}

export function endTurnFromApi(payload: EndTurnApiPayload, catalog: CardRecord[]): EndTurnSnapshots {
  const afterVillainState = payload.afterVillain ?? payload.afterBot!
  const villainPlays = payload.villainPlays ?? payload.botPlays ?? []
  const afterMana = rowToMatchState({ id: '', revision: 0, state: payload.afterMana, last_combat: null }, catalog)
  const afterVillain = rowToMatchState(
    { id: '', revision: 0, state: afterVillainState, last_combat: null },
    catalog,
  )
  const state = rowToMatchState({ id: '', revision: 0, state: payload.state, last_combat: payload.combat }, catalog)
  const villainManaBefore = payload.villainManaBefore ?? {
    mana: Math.max(0, afterMana.villain.mana - 1),
    maxMana: Math.max(STARTING_MAX_MANA, afterMana.villain.maxMana - 1),
  }

  return {
    afterMana,
    afterVillain,
    villainPlays,
    state,
    combat: payload.combat,
    villainManaBefore,
  }
}
