import type { BoardUnit, MatchCardInstance, MatchState, MatchSide, FreezeEvent } from './types'

export const FREEZE_PROC_CHANCE = 0.5

const FREEZE_SLUGS = new Set(['thalassa_card_01_tidebound_priestess'])

export function unitHasKeyword(unit: MatchCardInstance, keyword: string): boolean {
  const keywords = unit.display?.keywords ?? []
  if (keywords.some((k) => k.toLowerCase() === keyword.toLowerCase())) return true
  if (keyword.toLowerCase() === 'freeze' && FREEZE_SLUGS.has(unit.slug)) return true
  return false
}

function cloneBoardLane(board: (BoardUnit | null)[]): (BoardUnit | null)[] {
  return board.map((u) => (u ? { ...u } : null))
}

function pickFreezeTargetSlot(
  enemyBoard: (BoardUnit | null)[],
  casterSlot: number,
): number {
  if (enemyBoard[casterSlot] != null) return casterSlot
  return enemyBoard.findIndex((u) => u != null)
}

/** Freeze on-play: 50% to freeze an enemy unit (same lane, else first). Target cannot attack but can take damage. */
export function tryApplyFreezeOnPlay(
  state: MatchState,
  side: MatchSide,
  slotIndex: number,
): { state: MatchState; freeze: FreezeEvent | null } {
  const casterBoard = side === 'hero' ? state.hero.board : state.villain.board
  const unit = casterBoard[slotIndex]
  if (!unit || !unitHasKeyword(unit, 'freeze')) {
    return { state, freeze: null }
  }

  const targetSide: MatchSide = side === 'hero' ? 'villain' : 'hero'
  const enemy = targetSide === 'hero' ? state.hero : state.villain
  const targetSlot = pickFreezeTargetSlot(enemy.board, slotIndex)

  const baseEvent: FreezeEvent = {
    casterSide: side,
    casterSlot: slotIndex,
    targetSide,
    targetSlot,
    success: false,
  }

  if (targetSlot === -1) {
    return { state, freeze: baseEvent }
  }

  const proc = Math.random() < FREEZE_PROC_CHANCE
  if (!proc) {
    return { state, freeze: { ...baseEvent, success: false } }
  }

  const target = enemy.board[targetSlot]
  if (!target) {
    return { state, freeze: baseEvent }
  }

  const next = {
    ...state,
    hero: { ...state.hero, board: cloneBoardLane(state.hero.board) },
    villain: { ...state.villain, board: cloneBoardLane(state.villain.board) },
  }
  const lane = targetSide === 'hero' ? next.hero.board : next.villain.board
  lane[targetSlot] = { ...target, frozen: true }

  return {
    state: next,
    freeze: { ...baseEvent, targetSlot, success: true },
  }
}

export function clearAllFrozen(state: MatchState): MatchState {
  const clearLane = (board: (BoardUnit | null)[]) =>
    board.map((u) => (u ? { ...u, frozen: false } : null))

  return {
    ...state,
    hero: { ...state.hero, board: clearLane(state.hero.board) },
    villain: { ...state.villain, board: clearLane(state.villain.board) },
  }
}

export function displayHealth(health: number): number {
  return Math.max(0, Math.floor(health))
}
