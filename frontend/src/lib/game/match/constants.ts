export const BOARD_SLOT_COUNT = 4
export const INITIAL_HAND_SIZE = 4
export const VILLAIN_DECK_SIZE = 20
export const STARTING_PLAYER_HP = 25
/** Стартовая мана и лимит в начале матча. */
export const STARTING_MANA = 5
export const STARTING_MAX_MANA = 5
/** Прирост максимума маны каждый новый ход (текущая = max после grantTurnMana). */
export const MANA_PER_TURN = 1
/** Пауза между последовательными ударами в бою (VFX). */
export const COMBAT_STRIKE_GAP_MS = 140

/** Villain “thinking” time before playing (randomized per end-turn). */
export const VILLAIN_TURN_DELAY_MIN_MS = 2000
export const VILLAIN_TURN_DELAY_MAX_MS = 5000
/** Gap between consecutive villain plays. */
export const VILLAIN_PLAY_GAP_MS = 700

export function randomVillainTurnDelayMs(): number {
  const span = VILLAIN_TURN_DELAY_MAX_MS - VILLAIN_TURN_DELAY_MIN_MS + 1
  return VILLAIN_TURN_DELAY_MIN_MS + Math.floor(Math.random() * span)
}
