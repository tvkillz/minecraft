import type { CardDisplayProps } from '@/components/CardPlaceholder/Card'

export type MatchPhase =
  | 'booting'
  | 'hero_main'
  | 'villain_main'
  | 'combat'
  | 'ended'

export type MatchSide = 'hero' | 'villain'

export interface MatchCardInstance {
  instanceId: string
  slug: string
  mana: number
  attack: number
  health: number
  maxHealth: number
  frozen?: boolean
  /** Loaded for hero hand at deal; villain loads when revealed on board. */
  display?: CardDisplayProps
}

export interface BoardUnit extends MatchCardInstance {
  slotIndex: number
  /** Cannot attack this combat round; may still take damage. */
  frozen?: boolean
}

export interface PlayerBattleState {
  hp: number
  mana: number
  maxMana: number
  hand: MatchCardInstance[]
  board: (BoardUnit | null)[]
  deck: MatchCardInstance[]
  graveyard: MatchCardInstance[]
}

export interface MatchState {
  turn: number
  phase: MatchPhase
  winner: MatchSide | null
  /** Hero strikes already resolved this turn (Battle button). */
  heroCombatDone?: boolean
  hero: PlayerBattleState
  villain: PlayerBattleState
}

export interface VillainPlay {
  instanceId: string
  slotIndex: number
  freeze?: FreezeEvent | null
}

/** Freeze attempt when a unit with Freeze is played. */
export interface FreezeEvent {
  casterSide: MatchSide
  casterSlot: number
  targetSide: MatchSide
  /** -1 when no valid enemy target. */
  targetSlot: number
  success: boolean
}

export interface PlayCardResult {
  state: MatchState
  freeze: FreezeEvent | null
}

export interface CombatStrike {
  attackerSide: MatchSide
  slotIndex: number
  damage: number
  targetSide: MatchSide
  targetSlot: number | null
  killed: boolean
  faceDamage: number
  /** Attacker is removed this round (counterkill or mutual trade). */
  attackerEliminated?: boolean
}

export interface CombatRoundResult {
  strikes: CombatStrike[]
  heroHp: number
  villainHp: number
}
