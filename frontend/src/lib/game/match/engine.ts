import {
  BOARD_SLOT_COUNT,
  INITIAL_HAND_SIZE,
  MANA_PER_TURN,
  STARTING_MANA,
  STARTING_MAX_MANA,
  STARTING_PLAYER_HP,
} from './constants'
import type {
  BoardUnit,
  CombatRoundResult,
  CombatStrike,
  MatchCardInstance,
  MatchSide,
  MatchState,
  PlayCardResult,
  PlayerBattleState,
  VillainPlay,
} from './types'
import { clearAllFrozen, tryApplyFreezeOnPlay } from './freeze'

function emptyBoard(): (BoardUnit | null)[] {
  return Array.from({ length: BOARD_SLOT_COUNT }, () => null)
}

function clonePlayer(player: PlayerBattleState): PlayerBattleState {
  return {
    ...player,
    hand: [...player.hand],
    board: [...player.board],
    deck: [...player.deck],
    graveyard: [...player.graveyard],
  }
}

export function createMatch(
  heroDeckShuffled: MatchCardInstance[],
  villainDeckShuffled: MatchCardInstance[],
): MatchState {
  const heroDraw = [...heroDeckShuffled]
  const villainDraw = [...villainDeckShuffled]

  const heroHand = heroDraw.splice(0, INITIAL_HAND_SIZE)
  const villainHand = villainDraw.splice(0, INITIAL_HAND_SIZE)

  return {
    turn: 1,
    phase: 'hero_main',
    winner: null,
    hero: {
      hp: STARTING_PLAYER_HP,
      mana: STARTING_MANA,
      maxMana: STARTING_MAX_MANA,
      hand: heroHand,
      board: emptyBoard(),
      deck: heroDraw,
      graveyard: [],
    },
    villain: {
      hp: STARTING_PLAYER_HP,
      mana: STARTING_MANA,
      maxMana: STARTING_MAX_MANA,
      hand: villainHand,
      board: emptyBoard(),
      deck: villainDraw,
      graveyard: [],
    },
  }
}

export function deckCount(player: PlayerBattleState): number {
  return player.deck.length
}

export function canAffordCard(player: PlayerBattleState, card: MatchCardInstance): boolean {
  return player.mana >= card.mana
}

export function firstEmptySlot(board: (BoardUnit | null)[]): number | null {
  const idx = board.findIndex((s) => s === null)
  return idx === -1 ? null : idx
}

/** Villain AI: play random affordable cards into random empty slots. */
export function pickVillainPlays(state: MatchState): { instanceId: string; slotIndex: number }[] {
  const plays: { instanceId: string; slotIndex: number }[] = []
  const hand = [...state.villain.hand]
  const board = state.villain.board.map((u) => u)
  let mana = state.villain.mana
  const shuffled = hand.sort(() => Math.random() - 0.5)

  for (const card of shuffled) {
    if (mana < card.mana) continue
    const slot = firstEmptySlot(board)
    if (slot === null) break
    plays.push({ instanceId: card.instanceId, slotIndex: slot })
    mana -= card.mana
    board[slot] = { ...card, slotIndex: slot }
  }
  return plays
}

export function playCardToBoard(
  state: MatchState,
  side: MatchSide,
  instanceId: string,
  slotIndex: number,
): PlayCardResult | null {
  if (slotIndex < 0 || slotIndex >= BOARD_SLOT_COUNT) return null
  const player = side === 'hero' ? state.hero : state.villain
  if (player.board[slotIndex] !== null) return null

  const handIndex = player.hand.findIndex((c) => c.instanceId === instanceId)
  if (handIndex === -1) return null
  const card = player.hand[handIndex]
  if (player.mana < card.mana) return null

  const next = cloneMatch(state)
  const p = side === 'hero' ? next.hero : next.villain
  const [played] = p.hand.splice(handIndex, 1)
  p.mana -= played.mana
  p.board[slotIndex] = { ...played, slotIndex }
  const { state: afterFreeze, freeze } = tryApplyFreezeOnPlay(next, side, slotIndex)
  return { state: afterFreeze, freeze }
}

function cloneMatch(state: MatchState): MatchState {
  return {
    ...state,
    hero: clonePlayer(state.hero),
    villain: clonePlayer(state.villain),
  }
}

function drawCard(player: PlayerBattleState): void {
  if (player.deck.length === 0) return
  const [card] = player.deck.splice(0, 1)
  player.hand.push(card)
}

/**
 * Начало своего хода: maxMana +1, currentMana = maxMana.
 * Во время хода мана только тратится (playCardToBoard), без автопополнения.
 */
export function grantSideTurnStart(player: PlayerBattleState): void {
  player.maxMana += MANA_PER_TURN
  player.mana = player.maxMana
}

/** Начало хода врага (после End Turn героя). */
export function startVillainTurn(state: MatchState): MatchState {
  const next = cloneMatch(state)
  grantSideTurnStart(next.villain)
  return next
}

export function drawAtTurnStart(state: MatchState, side: MatchSide): MatchState {
  const next = cloneMatch(state)
  if (side === 'hero') drawCard(next.hero)
  else drawCard(next.villain)
  return next
}

export type CombatSidesMode = 'both' | 'hero' | 'villain'

export function resolveCombatSides(
  state: MatchState,
  sides: CombatSidesMode,
): { state: MatchState; combat: CombatRoundResult } {
  const next = cloneMatch(state)
  const strikes: CombatStrike[] = []
  const heroAttacks = sides === 'both' || sides === 'hero'
  const villainAttacks = sides === 'both' || sides === 'villain'

  for (let slot = 0; slot < BOARD_SLOT_COUNT; slot += 1) {
    const heroUnit = next.hero.board[slot]
    const villainUnit = next.villain.board[slot]

    if (heroUnit && villainUnit) {
      if (heroAttacks) villainUnit.health -= heroUnit.attack
      if (villainAttacks) heroUnit.health -= villainUnit.attack
      if (villainUnit.health > 0) villainUnit.health = Math.max(0, villainUnit.health)
      if (heroUnit.health > 0) heroUnit.health = Math.max(0, heroUnit.health)
      const villainKilled = villainUnit.health <= 0
      const heroKilled = heroUnit.health <= 0

      if (heroAttacks && !heroUnit.frozen) {
        strikes.push({
          attackerSide: 'hero',
          slotIndex: slot,
          damage: heroUnit.attack,
          targetSide: 'villain',
          targetSlot: slot,
          killed: villainKilled,
          faceDamage: 0,
          attackerEliminated: villainAttacks ? heroKilled : false,
        })
      }
      if (villainAttacks && !villainUnit.frozen) {
        strikes.push({
          attackerSide: 'villain',
          slotIndex: slot,
          damage: villainUnit.attack,
          targetSide: 'hero',
          targetSlot: slot,
          killed: heroKilled,
          faceDamage: 0,
          attackerEliminated: heroAttacks ? villainKilled : false,
        })
      }
      if (villainKilled) {
        next.villain.graveyard.push(villainUnit)
        next.villain.board[slot] = null
      }
      if (heroKilled) {
        next.hero.graveyard.push(heroUnit)
        next.hero.board[slot] = null
      }
    } else if (heroUnit && !villainUnit && heroAttacks && !heroUnit.frozen) {
      const dmg = heroUnit.attack
      next.villain.hp = Math.max(0, next.villain.hp - dmg)
      strikes.push({
        attackerSide: 'hero',
        slotIndex: slot,
        damage: dmg,
        targetSide: 'villain',
        targetSlot: null,
        killed: false,
        faceDamage: dmg,
      })
    } else if (villainUnit && !heroUnit && villainAttacks && !villainUnit.frozen) {
      const dmg = villainUnit.attack
      next.hero.hp = Math.max(0, next.hero.hp - dmg)
      strikes.push({
        attackerSide: 'villain',
        slotIndex: slot,
        damage: dmg,
        targetSide: 'hero',
        targetSlot: null,
        killed: false,
        faceDamage: dmg,
      })
    }
  }

  return {
    state: next,
    combat: {
      strikes,
      heroHp: next.hero.hp,
      villainHp: next.villain.hp,
    },
  }
}

export function resolveCombat(state: MatchState): { state: MatchState; combat: CombatRoundResult } {
  return resolveCombatSides(state, 'both')
}

export function checkWinner(state: MatchState): MatchSide | null {
  if (state.hero.hp <= 0) return 'villain'
  if (state.villain.hp <= 0) return 'hero'
  return null
}

export function startNextHeroTurn(state: MatchState): MatchState {
  const next = clearAllFrozen(cloneMatch(state))
  next.turn += 1
  next.phase = 'hero_main'
  next.heroCombatDone = false
  grantSideTurnStart(next.hero)
  drawCard(next.hero)
  return next
}

export interface EndTurnResult {
  afterMana: MatchState
  afterVillain: MatchState
  villainPlays: { instanceId: string; slotIndex: number }[]
  state: MatchState
  combat: CombatRoundResult
  /** Мана врага до grantSideTurnStart (для VFX). */
  villainManaBefore: { mana: number; maxMana: number }
}

/** Full end-turn: mana, villain draw, villain plays, combat. */
export function runEndTurnSequence(state: MatchState): EndTurnResult | null {
  if (state.phase !== 'hero_main' || state.winner) return null

  const villainManaBefore = { mana: state.villain.mana, maxMana: state.villain.maxMana }
  let next = startVillainTurn(state)
  if (next.turn > 1) {
    next = drawAtTurnStart(next, 'villain')
  }

  const afterMana: MatchState = {
    ...cloneMatch(next),
    phase: 'villain_main',
  }

  const villainPlays: VillainPlay[] = []
  let working = cloneMatch(next)
  working.phase = 'villain_main'

  for (const play of pickVillainPlays(working)) {
    const played = playCardToBoard(working, 'villain', play.instanceId, play.slotIndex)
    if (played) {
      villainPlays.push({ ...play, freeze: played.freeze ?? undefined })
      working = played.state
    }
  }

  const afterVillain = cloneMatch(working)
  afterVillain.phase = 'combat'

  const combatSides: CombatSidesMode = state.heroCombatDone ? 'villain' : 'both'
  const { state: afterCombat, combat } = resolveCombatSides(working, combatSides)
  afterCombat.heroCombatDone = false

  return {
    afterMana,
    afterVillain,
    villainPlays,
    state: afterCombat,
    combat,
    villainManaBefore,
  }
}

/** Hero attacks only; player stays in main phase. */
export function runBattleSequence(state: MatchState): { state: MatchState; combat: CombatRoundResult } | null {
  if (state.phase !== 'hero_main' || state.winner || state.heroCombatDone) return null
  const { state: afterCombat, combat } = resolveCombatSides(state, 'hero')
  afterCombat.phase = 'hero_main'
  afterCombat.heroCombatDone = true
  return { state: afterCombat, combat }
}
