import type {
  BoardUnit,
  CombatRoundResult,
  MatchCardInstance,
  MatchState,
  PlayerBattleState,
} from '@/lib/game/match/types'

export interface PersistedCard {
  instanceId: string
  slug: string
  mana: number
  attack: number
  health: number
  maxHealth: number
  slotIndex?: number
  frozen?: boolean
}

function normalizePhase(phase: string): MatchState['phase'] {
  if (phase === 'bot_main') return 'villain_main'
  return phase as MatchState['phase']
}

export interface PersistedPlayer {
  hp: number
  mana: number
  maxMana: number
  hand: PersistedCard[]
  board: (PersistedCard | null)[]
  deck: PersistedCard[]
  graveyard: PersistedCard[]
}

export interface PersistedMatchState {
  turn: number
  phase: MatchState['phase']
  winner: MatchState['winner']
  heroCombatDone?: boolean
  hero: PersistedPlayer
  villain: PersistedPlayer
}

function stripCard(card: MatchCardInstance | BoardUnit): PersistedCard {
  return {
    instanceId: card.instanceId,
    slug: card.slug,
    mana: card.mana,
    attack: card.attack,
    health: Math.max(0, card.health),
    maxHealth: card.maxHealth,
    ...('slotIndex' in card ? { slotIndex: card.slotIndex } : {}),
    ...('frozen' in card && card.frozen ? { frozen: true } : {}),
  }
}

function stripPlayer(player: PlayerBattleState): PersistedPlayer {
  return {
    hp: player.hp,
    mana: player.mana,
    maxMana: player.maxMana,
    hand: player.hand.map(stripCard),
    board: player.board.map((u) => (u ? stripCard(u) : null)),
    deck: player.deck.map(stripCard),
    graveyard: player.graveyard.map(stripCard),
  }
}

export function serializeMatchState(state: MatchState): PersistedMatchState {
  return {
    turn: state.turn,
    phase: state.phase,
    winner: state.winner,
    ...(state.heroCombatDone ? { heroCombatDone: true } : {}),
    hero: stripPlayer(state.hero),
    villain: stripPlayer(state.villain),
  }
}

function hydrateCard(card: PersistedCard): MatchCardInstance {
  return {
    instanceId: card.instanceId,
    slug: card.slug,
    mana: card.mana,
    attack: card.attack,
    health: Math.max(0, card.health),
    maxHealth: card.maxHealth,
    ...(card.frozen ? { frozen: true } : {}),
  }
}

function hydratePlayer(player: PersistedPlayer): PlayerBattleState {
  return {
    hp: player.hp,
    mana: player.mana,
    maxMana: player.maxMana,
    hand: player.hand.map(hydrateCard),
    board: player.board.map((u) =>
      u
        ? {
            ...hydrateCard(u),
            slotIndex: u.slotIndex ?? 0,
            frozen: u.frozen,
          }
        : null,
    ),
    deck: player.deck.map(hydrateCard),
    graveyard: player.graveyard.map(hydrateCard),
  }
}

export function hydrateMatchState(persisted: PersistedMatchState): MatchState {
  return {
    turn: persisted.turn,
    phase: normalizePhase(persisted.phase),
    winner: persisted.winner,
    heroCombatDone: persisted.heroCombatDone ?? false,
    hero: hydratePlayer(persisted.hero),
    villain: hydratePlayer(persisted.villain),
  }
}

export type MatchRow = {
  id: string
  player_deck_id: string | null
  mode: string
  status: string
  turn: number
  phase: string
  winner: string | null
  state: PersistedMatchState
  revision: number
  last_combat: CombatRoundResult | null
  villain_plays: { instanceId: string; slotIndex: number }[] | null
}
