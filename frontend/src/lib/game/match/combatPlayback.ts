import { BOARD_SLOT_COUNT } from './constants'
import type { CombatStrike } from './types'

/**
 * В одной линии: сначала удар, который убивает; мёртвый не контратакует визуально.
 */
export function orderSlotStrikes(strikes: CombatStrike[]): CombatStrike[] {
  if (strikes.length <= 1) return strikes

  const hero = strikes.find((s) => s.attackerSide === 'hero')
  const villain = strikes.find((s) => s.attackerSide === 'villain')
  if (!hero || !villain) return strikes

  const heroLethal = hero.killed
  const villainLethal = villain.killed

  if (heroLethal && !villainLethal) return [hero]
  if (villainLethal && !heroLethal) return [villain]
  if (heroLethal && villainLethal) return [hero]
  return [hero, villain]
}

/** Удары одной стороны по слотам слева направо. */
function orderSideStrikes(strikes: CombatStrike[], side: CombatStrike['attackerSide']): CombatStrike[] {
  const ordered: CombatStrike[] = []
  for (let slot = 0; slot < BOARD_SLOT_COUNT; slot += 1) {
    const inSlot = strikes.filter((s) => s.slotIndex === slot && s.attackerSide === side)
    ordered.push(...orderSlotStrikes(inSlot))
  }
  return ordered
}

/**
 * Строгая пошаговость: все удары героя по очереди, затем все удары врага.
 * Без одновременных фаз в одном раунде боя.
 */
export function orderCombatStrikes(strikes: CombatStrike[]): CombatStrike[] {
  const hasHero = strikes.some((s) => s.attackerSide === 'hero')
  const hasVillain = strikes.some((s) => s.attackerSide === 'villain')

  if (hasHero && hasVillain) {
    return [...orderSideStrikes(strikes, 'hero'), ...orderSideStrikes(strikes, 'villain')]
  }

  const soleSide = hasHero ? 'hero' : 'villain'
  return orderSideStrikes(strikes, soleSide)
}
