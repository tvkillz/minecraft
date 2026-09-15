/** KOMOREBI gameplay timing — ~15% slower than base tuning. */
export const IYASHIKEI_ANIM_SCALE = 1.15

/** Final Whistle strike VFX — ~10% slower than iyashikei ambient strike. */
export const FW_STRIKE_ANIM_SCALE = IYASHIKEI_ANIM_SCALE * 1.1

export function iyMs(ms: number): number {
  return Math.round(ms * IYASHIKEI_ANIM_SCALE)
}

export function iySec(sec: number): number {
  return sec * IYASHIKEI_ANIM_SCALE
}
